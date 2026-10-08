"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const askLLM = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setReply("");
    try {
      const res = await fetch("/api/llm-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setReply(data.reply || data.error || "No response");
    } catch {
      setReply("Error connecting to LLM. Ensure it is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-16 pt-8">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium tracking-wide uppercase">
          Family Knowledge Graph
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          Your Family Archive
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Preserve generations of memories. Connect people, photos, and stories
          through an interactive graph database you can search conversationally.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
        <Link href="/people" className="group bg-white rounded-2xl border border-gray-100 p-8 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-50 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5 group-hover:bg-primary-100 transition-colors">
            <UsersIcon />
          </div>
          <h2 className="text-lg font-semibold mb-2 text-gray-900">People</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Add family members, build relationships, and map out your entire family tree.
          </p>
        </Link>

        <Link href="/media" className="group bg-white rounded-2xl border border-gray-100 p-8 hover:border-accent-200 hover:shadow-lg hover:shadow-accent-50 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center mb-5 group-hover:bg-accent-100 transition-colors">
            <MediaIcon />
          </div>
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Media</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Upload photos and videos with location and date metadata, then tag who appears in them.
          </p>
        </Link>

        <Link href="/search" className="group bg-white rounded-2xl border border-gray-100 p-8 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-50 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:bg-amber-100 transition-colors">
            <SearchIcon />
          </div>
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Search</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Filter by name, location, or date. Ask natural language questions with AI-powered search.
          </p>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <SparklesIcon />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Ask the Archive</h2>
            <p className="text-xs text-gray-400">conversational search</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askLLM()}
            placeholder="e.g. Show me photos from Central Park with John Smith"
            className="flex-1 border border-gray-200 rounded-xl px-5 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
          />
          <button
            onClick={askLLM}
            disabled={loading}
            className="bg-gradient-to-r from-primary-600 to-accent-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:from-primary-700 hover:to-accent-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <SpinnerIcon /> Thinking...
              </span>
            ) : (
              "Ask"
            )}
          </button>
        </div>
        {reply && (
          <div className="mt-5 p-5 bg-gray-50 rounded-xl text-sm leading-relaxed text-gray-700 border border-gray-100">
            {reply}
          </div>
        )}
      </div>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MediaIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}