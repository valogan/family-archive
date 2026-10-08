"use client";

import { useEffect, useState } from "react";
import type { SearchResult, PersonWithRelations } from "@/lib/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [llmMessage, setLlmMessage] = useState("");
  const [llmReply, setLlmReply] = useState("");
  const [llmLoading, setLlmLoading] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [personDetails, setPersonDetails] = useState<Record<string, PersonWithRelations>>({});

  const doSearch = async () => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (location) params.set("location", location);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    setSearched(true);
    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();
    setResults(data.error ? { people: [], media: [] } : data);
  };

  const askLLM = async () => {
    if (!llmMessage.trim()) return;
    setLlmLoading(true);
    setLlmReply("");
    try {
      const res = await fetch("/api/llm-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: llmMessage }),
      });
      const data = await res.json();
      setLlmReply(data.reply || data.error || "No response");
    } catch {
      setLlmReply("Error connecting to LLM.");
    } finally {
      setLlmLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setLocation("");
    setDateFrom("");
    setDateTo("");
    setResults(null);
    setSearched(false);
  };

  const togglePerson = async (id: string) => {
    if (expandedPerson === id) {
      setExpandedPerson(null);
      return;
    }
    setExpandedPerson(id);
    if (!personDetails[id]) {
      const res = await fetch(`/api/people/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPersonDetails((prev) => ({ ...prev, [id]: data }));
      }
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Search</h1>
        <p className="text-gray-500 text-sm mt-1">Filter by name, location, or date — or conversationally search</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Filters</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Keywords</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="Name, location, anything..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. NYC"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Date Range</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all mb-2"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
                  placeholder="To"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={doSearch}
                className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all"
              >
                Search
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Conversational Search</h2>
              <p className="text-xs text-gray-400">Ask naturally — the graph is queried using natural language</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={llmMessage}
              onChange={(e) => setLlmMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askLLM()}
              placeholder="e.g. Who is in photos taken in Chicago?"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-300 transition-all"
            />
            <button
              onClick={askLLM}
              disabled={llmLoading}
              className="bg-gradient-to-r from-primary-600 to-accent-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-primary-700 hover:to-accent-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {llmLoading ? "..." : "Ask"}
            </button>
          </div>
          {llmReply && (
            <div className="mt-5 p-5 bg-gray-50 rounded-xl text-sm leading-relaxed text-gray-700 border border-gray-100">
              {llmReply}
            </div>
          )}
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-5 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">
                People
                <span className="text-gray-400 font-normal ml-2 text-sm">
                  {results.people.length} found
                </span>
              </h2>
            </div>
            <div className="px-6 py-4">
              {results.people.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No people found</p>
              ) : (
                <div className="space-y-1">
                  {results.people.map((p) => {
                    const isExpanded = expandedPerson === p.id;
                    const detail = personDetails[p.id];
                    return (
                      <div key={p.id}>
                        <button
                          onClick={() => togglePerson(p.id)}
                          className="w-full flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-700">{p.name}</p>
                            <div className="flex gap-2 mt-0.5">
                              {p.birthDate && <span className="text-xs text-gray-400">Born {p.birthDate}</span>}
                              {p.bio && <span className="text-xs text-gray-400 line-clamp-1">{p.bio}</span>}
                            </div>
                          </div>
                          <svg className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        {isExpanded && detail && (
                          <div className="ml-6 mb-3 pl-4 border-l-2 border-gray-100">
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {detail.media.length === 0 ? (
                                <p className="text-xs text-gray-400 py-2">No linked media</p>
                              ) : (
                                detail.media.map((m) => (
                                  <img
                                    key={m.id}
                                    src={`/api/uploads/${m.filename}`}
                                    alt={m.originalName}
                                    className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                                    loading="lazy"
                                  />
                                ))
                              )}
                            </div>
                            <a
                              href={`/people/${p.id}`}
                              className="inline-block mt-2 text-xs text-primary-600 hover:underline"
                            >
                              View full profile &rarr;
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-5 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">
                Media
                <span className="text-gray-400 font-normal ml-2 text-sm">
                  {results.media.length} found
                </span>
              </h2>
            </div>
            <div className="px-6 py-4">
              {results.media.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No media found</p>
              ) : (
                <div className="space-y-1">
                  {results.media.map((m) => (
                    <div key={m.id} className="py-3 px-3 -mx-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <img
                          src={`/api/uploads/${m.filename}`}
                          alt={m.originalName}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 bg-gray-100"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{m.originalName}</p>
                          <div className="flex gap-2 mt-0.5">
                            {m.location && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {m.location}
                              </span>
                            )}
                            {m.dateTaken && <span className="text-xs text-gray-400">&middot; {m.dateTaken}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!results && searched && (
        <div className="text-center py-16">
          <p className="text-gray-400">No results to show. Adjust your filters and try again.</p>
        </div>
      )}
    </div>
  );
}