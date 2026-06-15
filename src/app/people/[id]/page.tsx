"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Person, PersonWithRelations } from "@/lib/types";

const RELATIONSHIP_TYPES = [
  "MOTHER", "FATHER", "SISTER", "BROTHER", "DAUGHTER", "SON",
  "SPOUSE", "GRANDMOTHER", "GRANDFATHER", "AUNT", "UNCLE", "COUSIN",
];

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [person, setPerson] = useState<PersonWithRelations | null>(null);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [showRelForm, setShowRelForm] = useState(false);
  const [relTarget, setRelTarget] = useState("");
  const [relType, setRelType] = useState(RELATIONSHIP_TYPES[0]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", birthDate: "", deathDate: "", bio: "" });

  const fetchPerson = async () => {
    const res = await fetch(`/api/people/${params.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setPerson(data);
    setEditForm({
      name: data.name,
      birthDate: data.birthDate || "",
      deathDate: data.deathDate || "",
      bio: data.bio || "",
    });
  };

  useEffect(() => {
    fetchPerson();
    fetch("/api/people").then((r) => r.json()).then((d) => setAllPeople(Array.isArray(d) ? d : []));
  }, [params.id]);

  const addRelationship = async () => {
    if (!relTarget) return;
    await fetch("/api/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromId: params.id, toId: relTarget, type: relType }),
    });
    setShowRelForm(false);
    setRelTarget("");
    fetchPerson();
  };

  const removeRelationship = async (toId: string, type: string) => {
    await fetch("/api/relationships", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromId: params.id, toId, type }),
    });
    fetchPerson();
  };

  const saveEdit = async () => {
    const body: any = { name: editForm.name };
    if (editForm.birthDate) body.birthDate = editForm.birthDate;
    if (editForm.deathDate) body.deathDate = editForm.deathDate;
    if (editForm.bio) body.bio = editForm.bio;

    await fetch(`/api/people/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditing(false);
    fetchPerson();
  };

  if (!person) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full" />
      </div>
    );
  }

  const getColor = (name: string) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-purple-100 text-purple-700",
      "bg-green-100 text-green-700",
      "bg-amber-100 text-amber-700",
      "bg-rose-100 text-rose-700",
    ];
    return colors[name.length % colors.length];
  };

  const getInitials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div>
      <button
        onClick={() => router.push("/people")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to People
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
        <div className="flex items-start gap-6">
          <div className={`w-20 h-20 rounded-2xl ${getColor(person.name)} flex items-center justify-center text-2xl font-bold shrink-0`}>
            {getInitials(person.name)}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-4">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full text-2xl font-bold border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={editForm.birthDate}
                    onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  <input
                    type="date"
                    value={editForm.deathDate}
                    onChange={(e) => setEditForm({ ...editForm, deathDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="A short note about this person..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800">
                    Save
                  </button>
                  <button onClick={() => setEditing(false)} className="text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{person.name}</h1>
                    <div className="flex gap-3 mt-2 text-sm text-gray-500">
                      {person.birthDate && (
                        <span>Born {new Date(person.birthDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                      )}
                      {person.deathDate && (
                        <span className="text-red-400">
                          &middot; Died {new Date(person.deathDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm font-medium text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Edit
                  </button>
                </div>
                {person.bio && (
                  <p className="text-gray-600 mt-4 leading-relaxed">{person.bio}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center px-6 py-5 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Relationships</h2>
            <button
              onClick={() => setShowRelForm(!showRelForm)}
              className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
            >
              {showRelForm ? "Cancel" : "Add"}
            </button>
          </div>

          {showRelForm && (
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 space-y-3">
              <select
                value={relTarget}
                onChange={(e) => setRelTarget(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Select person...</option>
                {allPeople.filter((p) => p.id !== params.id).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={relType}
                onChange={(e) => setRelType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                {RELATIONSHIP_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                ))}
              </select>
              <button
                onClick={addRelationship}
                className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all"
              >
                Add Relationship
              </button>
            </div>
          )}

          <div className="px-6 py-4">
            {person.relationships.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No relationships yet</p>
                <p className="text-xs text-gray-300 mt-1">Link family members to build the tree</p>
              </div>
            ) : (
              <div className="space-y-1">
                {person.relationships.map((r, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 group">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {r.type.charAt(0) + r.type.slice(1).toLowerCase()}
                      </span>
                      <button
                        onClick={() => router.push(`/people/${r.person.id}`)}
                        className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                      >
                        {r.person.name}
                      </button>
                    </div>
                    <button
                      onClick={() => removeRelationship(r.person.id, r.type)}
                      className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Media</h2>
          </div>
          <div className="px-6 py-4">
            {person.media.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No media linked</p>
                <p className="text-xs text-gray-300 mt-1">Upload photos and tag this person</p>
              </div>
            ) : (
              <div className="space-y-3">
                {person.media.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      {m.mimeType.startsWith("video") ? (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{m.originalName}</p>
                      <div className="flex gap-2 mt-0.5">
                        {m.location && <span className="text-xs text-gray-400">{m.location}</span>}
                        {m.dateTaken && <span className="text-xs text-gray-400">&middot; {m.dateTaken}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}