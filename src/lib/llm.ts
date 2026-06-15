import OpenAI from "openai";
import { LLMConfig, SearchResult } from "./types";
import { fullSearch, advancedSearch } from "./queries";

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