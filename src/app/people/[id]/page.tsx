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
  const [editForm, setEditForm] = useState({ name: "", birthDate: "", deathDate: "", isLiving: true, facts: "", bio: "" });
  const [showLocForm, setShowLocForm] = useState(false);
  const [locName, setLocName] = useState("");
  const [locDate, setLocDate] = useState("");
  const [locMoveIn, setLocMoveIn] = useState("");
  const [locMoveOut, setLocMoveOut] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventLabel, setEventLabel] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [newFact, setNewFact] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const fetchPerson = async () => {
    const res = await fetch(`/api/people/${params.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setPerson(data);
    setEditForm({
      name: data.name,
      birthDate: data.birthDate || "",
      deathDate: data.deathDate || "",
      isLiving: data.isLiving !== false,
      facts: (data.facts || []).join("\n"),
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

  const addLocation = async () => {
    if (!locName || (!locDate && !locMoveIn && !locMoveOut)) return;
    await fetch(`/api/people/${params.id}/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: locName,
        date: locDate || undefined,
        moveIn: locMoveIn || undefined,
        moveOut: locMoveOut || undefined,
      }),
    });
    setShowLocForm(false);
    setLocName("");
    setLocDate("");
    setLocMoveIn("");
    setLocMoveOut("");
    fetchPerson();
  };

  const removeLocation = async (livedAtId: string) => {
    await fetch(`/api/people/${params.id}/locations`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ livedAtId }),
    });
    fetchPerson();
  };

  const addEvent = async () => {
    if (!eventLabel.trim()) return;
    await fetch(`/api/people/${params.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: eventLabel.trim(), date: eventDate || undefined }),
    });
    setShowEventForm(false);
    setEventLabel("");
    setEventDate("");
    fetchPerson();
  };

  const removeEvent = async (eventId: string) => {
    await fetch(`/api/people/${params.id}/events`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    fetchPerson();
  };

  const saveEdit = async () => {
    const body: any = {
      name: editForm.name,
      birthDate: editForm.birthDate || null,
      deathDate: editForm.deathDate || null,
      isLiving: editForm.isLiving,
      facts: editForm.facts.split("\n").map((s) => s.trim()).filter(Boolean),
      bio: editForm.bio,
    };

    await fetch(`/api/people/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditing(false);
    fetchPerson();
  };

  const addFact = async () => {
    const fact = newFact.trim();
    if (!fact) return;
    const facts = [...(person?.facts || []), fact];
    await fetch(`/api/people/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facts }),
    });
    setNewFact("");
    fetchPerson();
  };

  const removeFact = async (fact: string) => {
    const facts = (person?.facts || []).filter((f) => f !== fact);
    await fetch(`/api/people/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facts }),
    });
    fetchPerson();
  };

  const generateSummary = async () => {
    setSummarizing(true);
    setSummaryError(null);
    try {
      const res = await fetch(`/api/people/${params.id}/summary`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate summary");
      await fetchPerson();
    } catch (e: any) {
      setSummaryError(e.message);
    } finally {
      setSummarizing(false);
    }
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
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editForm.isLiving}
                    onChange={(e) => setEditForm({ ...editForm, isLiving: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-primary-500/20"
                  />
                  Living
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Facts (one per line)</label>
                  <textarea
                    value={editForm.facts}
                    onChange={(e) => setEditForm({ ...editForm, facts: e.target.value })}
                    placeholder={"Any fact about this person\nOne per line"}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                    rows={3}
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
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold text-gray-900">{person.name}</h1>
                      {person.isLiving === false ? (
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">Deceased</span>
                      ) : (
                        <span className="text-xs font-medium text-green-700 bg-green-50 rounded-full px-2.5 py-1">Living</span>
                      )}
                    </div>
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-900">AI Summary</h2>
          <button
            onClick={generateSummary}
            disabled={summarizing}
            className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            {summarizing ? "Generating..." : person.summary ? "Regenerate" : "Generate"}
          </button>
        </div>
        {summarizing ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Writing a summary from the archive...
          </div>
        ) : summaryError ? (
          <p className="text-sm text-red-500">{summaryError}</p>
        ) : person.summary ? (
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{person.summary}</p>
        ) : (
          <p className="text-sm text-gray-400">
            Generated automatically from everything the archive knows about this person — their facts, relationships, places they lived, and photos. It updates whenever their information changes.
          </p>
        )}
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

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center px-6 py-5 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Lived At</h2>
            <button
              onClick={() => setShowLocForm(!showLocForm)}
              className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
            >
              {showLocForm ? "Cancel" : "Add"}
            </button>
          </div>

          {showLocForm && (
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 space-y-3">
              <input
                type="text"
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
                placeholder="Where they lived (e.g. Lexington, KY)"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">There on</label>
                  <input
                    type="date"
                    value={locDate}
                    onChange={(e) => setLocDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Moved in</label>
                  <input
                    type="date"
                    value={locMoveIn}
                    onChange={(e) => setLocMoveIn(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Moved out</label>
                  <input
                    type="date"
                    value={locMoveOut}
                    onChange={(e) => setLocMoveOut(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">Fill any of the three — at least one. &quot;There on&quot; is a date you know they were living there, not a move-in date.</p>
              <button
                onClick={addLocation}
                className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all"
              >
                Add Location
              </button>
            </div>
          )}

          <div className="px-6 py-4">
            {person.locations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No locations yet</p>
                <p className="text-xs text-gray-300 mt-1">Dates when you know they lived somewhere</p>
              </div>
            ) : (
              <div className="space-y-1">
                {person.locations.map((l) => (
                  <div key={l.id} className="flex justify-between items-center py-2.5 group">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{l.location}</p>
                      <p className="text-xs text-gray-400">
                        {[
                          l.date && `there ${new Date(l.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
                          l.moveIn && `moved in ${new Date(l.moveIn).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
                          l.moveOut && `moved out ${new Date(l.moveOut).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <button
                      onClick={() => removeLocation(l.id)}
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
          <div className="flex justify-between items-center px-6 py-5 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Life Events</h2>
            <button
              onClick={() => setShowEventForm(!showEventForm)}
              className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
            >
              {showEventForm ? "Cancel" : "Add"}
            </button>
          </div>

          {showEventForm && (
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 space-y-3">
              <input
                type="text"
                value={eventLabel}
                onChange={(e) => setEventLabel(e.target.value)}
                placeholder="Event (e.g. Joined the Navy)"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="When (e.g. 2005 or 10/7/2005 — optional)"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <button
                onClick={addEvent}
                className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all"
              >
                Add Event
              </button>
            </div>
          )}

          <div className="px-6 py-4">
            {person.events.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No life events yet</p>
                <p className="text-xs text-gray-300 mt-1">Milestones like joining the Navy or retiring</p>
              </div>
            ) : (
              <div className="space-y-1">
                {person.events.map((e) => (
                  <div key={e.id} className="flex justify-between items-center py-2.5 group">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{e.label}</p>
                      {e.date && <p className="text-xs text-gray-400">{e.date}</p>}
                    </div>
                    <button
                      onClick={() => removeEvent(e.id)}
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
            <h2 className="font-semibold text-gray-900">Facts</h2>
          </div>
          <div className="px-6 py-4">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFact()}
                placeholder="Add a fact..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <button
                onClick={addFact}
                className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all"
              >
                Add
              </button>
            </div>
            {person.facts && person.facts.length > 0 ? (
              <div className="space-y-1">
                {person.facts.map((f, i) => (
                  <div key={i} className="flex justify-between items-center py-2 group">
                    <p className="text-sm text-gray-600">{f}</p>
                    <button
                      onClick={() => removeFact(f)}
                      className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-300">No facts yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}