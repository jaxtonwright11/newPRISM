"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { CommunityType } from "@shared/types";

const COMMUNITY_TYPES: { value: CommunityType; label: string; desc: string }[] = [
  { value: "civic", label: "Civic", desc: "City neighborhoods, local organizations, civic groups" },
  { value: "diaspora", label: "Diaspora", desc: "Immigrant, expatriate, or displaced communities" },
  { value: "rural", label: "Rural", desc: "Small towns, farming communities, rural regions" },
  { value: "policy", label: "Policy", desc: "Think tanks, advocacy groups, policy organizations" },
  { value: "academic", label: "Academic", desc: "Universities, research groups, student bodies" },
  { value: "cultural", label: "Cultural", desc: "Ethnic, religious, or cultural identity groups" },
];

type FormState = "idle" | "submitting" | "success" | "error";

export default function ApplyPage() {
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [communityType, setCommunityType] = useState<CommunityType | "">("");
  const [description, setDescription] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const canSubmit =
    name.trim().length >= 2 &&
    region.trim().length >= 2 &&
    communityType !== "" &&
    description.trim().length >= 20 &&
    formState !== "submitting";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !session?.access_token) return;

    setFormState("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/communities/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          region: region.trim(),
          community_type: communityType,
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "Something went wrong");
        setFormState("error");
        return;
      }

      setFormState("success");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setFormState("error");
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-prism-bg-base flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display font-bold text-xl text-prism-text-primary mb-2">
          Register your community
        </h1>
        <p className="text-sm text-prism-text-secondary mb-6 max-w-sm">
          Sign in to apply to represent your community on PRISM.
        </p>
        <Link
          href="/login?redirect=/apply"
          className="px-6 py-2.5 rounded-xl bg-prism-accent-primary text-white font-body font-medium text-sm transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/"
          className="mt-3 text-sm text-prism-text-dim hover:text-prism-text-secondary transition-colors"
        >
          Back to PRISM
        </Link>
      </div>
    );
  }

  if (formState === "success") {
    return (
      <div className="min-h-screen bg-prism-bg-base flex flex-col items-center justify-center px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-prism-accent-live/15 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-prism-accent-live" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="font-display font-bold text-xl text-prism-text-primary mb-2">
          Application submitted
        </h1>
        <p className="text-sm text-prism-text-secondary max-w-sm mb-6">
          We&apos;ll review your community and notify you when it&apos;s live on PRISM. This usually takes 1-2 days.
        </p>
        <Link
          href="/feed"
          className="px-6 py-2.5 rounded-xl bg-prism-accent-primary text-white font-body font-medium text-sm transition-opacity hover:opacity-90"
        >
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-prism-bg-base">
      <header className="border-b border-prism-border bg-prism-bg-surface/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-prism-text-dim hover:text-prism-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-base font-semibold text-prism-text-primary">Register a community</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-prism-text-secondary mb-6">
          PRISM shows how different communities experience the same events.
          Register yours so your perspective has a home.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Community name */}
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-prism-text-secondary mb-1.5">
              Community name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. South Side Chicago, Somali-Canadian Toronto"
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-xl bg-prism-bg-surface border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50 transition-colors"
            />
          </div>

          {/* Region */}
          <div>
            <label htmlFor="region" className="block text-xs font-medium text-prism-text-secondary mb-1.5">
              Region / Location
            </label>
            <input
              id="region"
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. Chicago, IL or Toronto, ON"
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-xl bg-prism-bg-surface border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50 transition-colors"
            />
          </div>

          {/* Community type */}
          <div>
            <label className="block text-xs font-medium text-prism-text-secondary mb-1.5">
              Community type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COMMUNITY_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => setCommunityType(ct.value)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    communityType === ct.value
                      ? "border-prism-accent-primary/50 bg-prism-accent-primary/10 text-prism-text-primary"
                      : "border-prism-border bg-prism-bg-surface text-prism-text-secondary hover:border-prism-border hover:bg-prism-bg-elevated"
                  }`}
                >
                  <span className="font-medium">{ct.label}</span>
                  <span className="block text-[10px] text-prism-text-dim mt-0.5 leading-snug">{ct.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-medium text-prism-text-secondary mb-1.5">
              Why should this community be on PRISM?
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What perspective does this community bring that others don't see? What do people get wrong about your community?"
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2.5 rounded-xl bg-prism-bg-surface border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50 transition-colors resize-none"
            />
            <span className="block text-right text-[10px] font-mono text-prism-text-dim mt-1">
              {description.length}/500
            </span>
          </div>

          {/* Error */}
          {formState === "error" && errorMessage && (
            <div className="px-3 py-2 rounded-lg bg-prism-accent-destructive/10 border border-prism-accent-destructive/20 text-sm text-prism-accent-destructive">
              {errorMessage}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3 rounded-xl font-body font-medium text-sm transition-all ${
              canSubmit
                ? "bg-prism-accent-primary text-white hover:opacity-90"
                : "bg-prism-bg-elevated text-prism-text-dim cursor-not-allowed"
            }`}
          >
            {formState === "submitting" ? "Submitting..." : "Submit application"}
          </button>
        </form>
      </div>
    </div>
  );
}
