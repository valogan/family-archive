"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const safeNext = () => {
    const next = searchParams.get("next") || "/";
    // Only relative in-app paths; block "//host" style open redirects.
    return next.startsWith("/") && !next.startsWith("//") ? next : "/";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      window.location.href = safeNext();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm"
    >
      <h1 className="text-2xl font-bold text-gray-900">Family Archive</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Enter the archive password to continue.
      </p>
      <input
        required
        autoFocus
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
      />
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full mt-4 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all"
      >
        {submitting ? "Checking..." : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center py-24">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
