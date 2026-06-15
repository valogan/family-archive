"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Person } from "@/lib/types";

export default function PeoplePage() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);

  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    deathDate: "",
    bio: "",
  });

  const [search, setSearch] = useState("");

  const fetchPeople = async (q = "") => {
    const url = q ? `/api/people?search=${encodeURIComponent(q)}` : "/api/people";
    const res = await fetch(url);
    const data = await res.json();
    setPeople(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const resetForm = () => {
    setForm({ name: "", birthDate: "", deathDate: "", bio: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = { name: form.name };
    if (form.birthDate) body.birthDate = form.birthDate;
    if (form.deathDate) body.deathDate = form.deathDate;
    if (form.bio) body.bio = form.bio;

    if (editing) {
      await fetch(`/api/people/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    resetForm();
    fetchPeople();
  };

  const handleEdit = (p: Person) => {
    setEditing(p);
    setForm({
      name: p.name,
      birthDate: p.birthDate || "",
      deathDate: p.deathDate || "",
      bio: p.bio || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this person?")) return;
    await fetch(`/api/people/${id}`, { method: "DELETE" });
    fetchPeople();
  };

  const getInitials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const getColor = (name: string) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-purple-100 text-purple-700",
      "bg-green-100 text-green-700",
      "bg-amber-100 text-amber-700",
      "bg-rose-100 text-rose-700",
      "bg-cyan-100 text-cyan-700",
      "bg-indigo-100 text-indigo-700",
      "bg-teal-100 text-teal-700",
    ];
    return colors[name.length % colors.length];
  };

  const getAge = (birthDate?: string, deathDate?: string) => {
    if (!birthDate) return null;
    const end = deathDate ? new Date(deathDate) : new Date();
    const start = new Date(birthDate);
    if (isNaN(start.getTime())) return null;
    let age = end.getFullYear() - start.getFullYear();
    const m = end.getMonth() - start.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < start.getDate())) age--;
    return age;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">People</h1>
          <p className="text-gray-500 text-sm mt-1">
            {people.length} family member{people.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showForm ? "Cancel" : "Add Person"}
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              fetchPeople(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
          />
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-5">{editing ? "Edit Person" : "Add a Person"}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Jane Smith"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Birth Date</label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Death Date</label>
                <input
                  type="date"
                  value={form.deathDate}
                  onChange={(e) => setForm({ ...form, deathDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="A short note about this person..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all"
              >
                {editing ? "Save Changes" : "Create Person"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-600 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {people.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No family members yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first person to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/people/${p.id}`)}
              className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${getColor(p.name)} flex items-center justify-center text-sm font-bold shrink-0`}>
                  {getInitials(p.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                    {p.name}
                  </h3>
                  <div className="flex flex-wrap gap-y-1 gap-x-2 mt-1">
                    {p.birthDate && (
                      <span className="text-xs text-gray-500">
                        Born {new Date(p.birthDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  {p.birthDate && (
                    <span className="inline-block mt-1.5 text-xs font-medium text-gray-400 bg-gray-50 rounded-full px-2.5 py-0.5">
                      {getAge(p.birthDate, p.deathDate)} years{p.deathDate ? " (deceased)" : " old"}
                    </span>
                  )}
                  {p.bio && (
                    <p className="text-sm text-gray-500 mt-2.5 line-clamp-2">{p.bio}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(p);
                  }}
                  className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                  className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}