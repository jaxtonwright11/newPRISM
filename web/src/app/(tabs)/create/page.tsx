"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

const MAX_VISIBLE_CHARS = 500;
const MAX_CHARS = 2000;

export default function CreatePage() {
  const [text, setText] = useState("");
  const [location, setLocation] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { session, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${pos.coords.longitude},${pos.coords.latitude}.json?types=place&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
            );
            const data = await res.json();
            const place = data.features?.[0]?.place_name;
            if (place) setLocation(place);
          } catch {
            setLocation(`${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
          }
        },
        () => setLocation(null)
      );
    }
  }, []);

  async function handleSubmit() {
    if (!text.trim() || !session?.access_token) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: text,
          post_type: "perspective",
        }),
      });
      if (res.ok) {
        router.push("/feed");
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
    }
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">
          Share your perspective
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Sign in to share what your community is experiencing.
        </p>
        <Link
          href="/login"
          className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-body font-medium text-sm"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--bg-elevated)]">
        <button
          onClick={() => router.back()}
          className="text-sm text-[var(--text-secondary)] font-body"
        >
          Cancel
        </button>
        <h1 className="font-display font-bold text-base text-[var(--text-primary)]">
          New Perspective
        </h1>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          className="px-4 py-1.5 rounded-full bg-[var(--accent-primary)] text-white text-sm font-body font-medium disabled:opacity-40 transition-opacity"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </header>

      {/* Compose area */}
      <div className="flex-1 p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          placeholder="What's your community experiencing right now?"
          className="w-full h-48 resize-none bg-transparent text-[var(--text-primary)] font-body text-base leading-relaxed placeholder:text-[var(--text-dim)] focus:outline-none"
          autoFocus
        />

        {/* Location */}
        {location && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--text-dim)]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            {location}
          </div>
        )}

        {/* Character count */}
        <div className="flex justify-end mt-2">
          <span className={`text-xs font-mono ${
            text.length > MAX_VISIBLE_CHARS
              ? "text-[var(--accent-primary)]"
              : "text-[var(--text-dim)]"
          }`}>
            {text.length}/{MAX_CHARS}
          </span>
        </div>
      </div>
    </div>
  );
}
