import OpenAI from "openai";
import { LLMConfig, SearchResult, PersonWithRelations } from "./types";
import { fullSearch, advancedSearch, getPerson, setPersonSummary } from "./queries";

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_family_archive",
      description: "Search the family archive for people by name or bio, and media by filename or location",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search term for people names/bios and media filenames/locations",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "advanced_family_search",
      description: "Advanced search with filters for location, date range, and specific people",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "General search term" },
          location: { type: "string", description: "Location filter" },
          dateFrom: { type: "string", description: "Start date (YYYY-MM-DD)" },
          dateTo: { type: "string", description: "End date (YYYY-MM-DD)" },
          personIds: {
            type: "array",
            items: { type: "string" },
            description: "Filter by specific person IDs",
          },
        },
      },
    },
  },
];

function getLLMConfig(): LLMConfig {
  return {
    baseUrl: process.env.LLM_BASE_URL || "http://localhost:11434/v1",
    apiKey: process.env.LLM_API_KEY || "ollama",
    model: process.env.LLM_MODEL || "llama3",
  };
}

export async function conversationalSearch(
  userMessage: string
): Promise<{ reply: string; results: SearchResult[] }> {
  const config = getLLMConfig();
  const client = new OpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
  });

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a helpful family archive assistant. You help users search through their family photos, videos, and family members. Use the available functions to answer questions about the family. Respond conversationally and summarize findings. Always use the search tools to find information - never make up data.",
    },
    { role: "user", content: userMessage },
  ];

  const results: SearchResult[] = [];

  let resp = await client.chat.completions.create({
    model: config.model,
    messages,
    tools: TOOLS,
    tool_choice: "auto",
  });

  let msg = resp.choices[0].message;

  while (msg.tool_calls && msg.tool_calls.length > 0) {
    messages.push(msg);

    for (const tc of msg.tool_calls) {
      const args = JSON.parse(tc.function.arguments);

      if (tc.function.name === "search_family_archive") {
        const result = await fullSearch(args.query as string);
        results.push(result);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      } else if (tc.function.name === "advanced_family_search") {
        const result = await advancedSearch(args as any);
        results.push(result);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    }

    resp = await client.chat.completions.create({
      model: config.model,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    });
    msg = resp.choices[0].message;
  }

  return {
    reply: msg.content || "I couldn't find anything matching your request.",
    results,
  };
}

export async function generatePersonSummary(
  person: PersonWithRelations
): Promise<string> {
  const config = getLLMConfig();
  const client = new OpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
  });

  const data = {
    name: person.name,
    isLiving: person.isLiving,
    birthDate: person.birthDate,
    deathDate: person.deathDate,
    bio: person.bio,
    facts: person.facts || [],
    relationships: person.relationships.map(
      (r) => `${r.type.toLowerCase()}: ${r.person.name}`
    ),
    locationsLived: person.locations.map((l) => ({
      location: l.location,
      thereOn: l.date,
      movedIn: l.moveIn,
      movedOut: l.moveOut,
    })),
    media: person.media.map((m) => ({
      name: m.originalName,
      location: m.location,
      date: m.dateTaken,
    })),
  };

  const resp = await client.chat.completions.create({
    model: config.model,
    messages: [
      {
        role: "system",
        content:
          "You are a family archive assistant. Write a short biographical summary (one or two paragraphs) of this person using ONLY the information provided in the archive data. Do not invent facts. Write in plain prose with no markdown formatting. If little is known, keep the summary brief and note that the archive has limited information about them.",
      },
      {
        role: "user",
        content: `Write a summary of this family member based on this archive data:\n\n${JSON.stringify(data, null, 2)}`,
      },
    ],
  });

  return resp.choices[0].message.content || "";
}

// Summaries are regenerated in the background after any change to a
// person's data (edits, relationships, locations, media associations).
// Runs are serialized per person so rapid edits can't race; each run
// re-reads the person, so the last stored summary reflects the latest
// data.
const summaryQueues = new Map<string, Promise<void>>();

async function regeneratePersonSummary(personId: string): Promise<string> {
  const person = await getPerson(personId);
  if (!person) throw new Error("Person not found");
  const summary = await generatePersonSummary(person);
  await setPersonSummary(personId, summary);
  return summary;
}

export function queuePersonSummary(personId: string): void {
  const prev = summaryQueues.get(personId) ?? Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(() => regeneratePersonSummary(personId))
    .then(() => undefined)
    .catch((err) =>
      console.error(`Background summary generation failed for ${personId}:`, err)
    );
  summaryQueues.set(personId, next);
  next.finally(() => {
    if (summaryQueues.get(personId) === next) summaryQueues.delete(personId);
  });
}

export async function forcePersonSummary(personId: string): Promise<string> {
  const prev = summaryQueues.get(personId) ?? Promise.resolve();
  await prev.catch(() => {});
  return regeneratePersonSummary(personId);
}