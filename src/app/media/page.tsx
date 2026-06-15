"use client";

import { useEffect, useState } from "react";
import type { Media, Person } from "@/lib/types";

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState("");
  const [dateTaken, setDateTaken] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchMedia = async (q = "") => {
    const url = q ? `/api/media?search=${encodeURIComponent(q)}` : "/api/media";
    const res = await fetch(url);
    const data = await res.json();
    setMedia(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchMedia();
    fetch("/api/people").then((r) => r.json()).then((d) => setPeople(Array.isArray(d) ? d : []));
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (location) formData.append("location", location);
    if (dateTaken) formData.append("dateTaken", dateTaken);
    if (selectedPeople.length > 0) {
      formData.append("personIds", JSON.stringify(selectedPeople));
    }
    await fetch("/api/media", { method: "POST", body: formData });
    setFile(null);
    setLocation("");
    setDateTaken("");
    setSelectedPeople([]);
    setUploading(false);
    fetchMedia();
  };

  const getSrc = (m: Media) => {
    const filename = m.path.split("/").pop();
    return `/api/uploads/${filename}`;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media</h1>
          <p className="text-gray-500 text-sm mt-1">
            {media.length} item{media.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-5">Upload Photo or Video</h2>
        <form onSubmit={handleUpload} className="space-y-5">
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
              file
                ? "border-primary-300 bg-primary-50"
                : "border-gray-200 hover:border-gray-300 bg-gray-50"
            }`}
          >
            <input
              required
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              {file ? (
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Click to select a file</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, MP4, MOV</p>
                </div>
              )}
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Central Park, NYC"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Taken</label>
              <input
                type="date"
                value={dateTaken}
                onChange={(e) => setDateTaken(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
              />
            </div>
          </div>

          {people.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2.5">People in this media</label>
              <div className="flex flex-wrap gap-2">
                {people.map((p) => (
                  <label
                    key={p.id}
                    className={`text-sm px-3.5 py-1.5 rounded-full cursor-pointer border transition-all ${
                      selectedPeople.includes(p.id)
                        ? "bg-primary-50 border-primary-300 text-primary-700"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedPeople.includes(p.id)}
                      onChange={() => {
                        setSelectedPeople((prev) =>
                          prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                        );
                      }}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all"
          >
            {uploading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by filename or location..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); fetchMedia(e.target.value); }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
          />
        </div>
      </div>

      {media.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No media yet</p>
          <p className="text-gray-400 text-sm mt-1">Upload your first photo or video.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((m) => (
            <div key={m.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
              <div className="aspect-square bg-gray-100 overflow-hidden">
                {m.mimeType.startsWith("video") ? (
                  <video src={getSrc(m)} controls className="w-full h-full object-cover" />
                ) : (
                  <img
                    src={getSrc(m)}
                    alt={m.originalName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-gray-700 truncate">{m.originalName}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-400 uppercase">{m.mimeType.split("/")[1]}</span>
                </div>
                {(m.location || m.dateTaken) && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-gray-50">
                    {m.location && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {m.location}
                      </span>
                    )}
                    {m.dateTaken && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {m.dateTaken}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}