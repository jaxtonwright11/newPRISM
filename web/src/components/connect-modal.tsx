"use client";

import { useState } from "react";
import type { CommunityType } from "@shared/types";
import { COMMUNITY_COLORS } from "@/lib/constants";

interface ConnectModalProps {
  community: {
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
  };
  topicTitle: string;
  onClose: () => void;
}

const MOCK_CONTRIBUTORS = [
  { id: "u1", display: "M.R.", region: "El Paso, TX", joinedYear: 2024, communityYears: 12 },
  { id: "u2", display: "A.G.", region: "El Paso, TX", joinedYear: 2025, communityYears: 8 },
  { id: "u3", display: "C.L.", region: "El Paso, TX", joinedYear: 2024, communityYears: 15 },
];

type Step = "browse" | "compose" | "sent";

export function ConnectModal({ community, topicTitle, onClose }: ConnectModalProps) {
  const [step, setStep] = useState<Step>("browse");
  const [selectedContributor, setSelectedContributor] = useState<(typeof MOCK_CONTRIBUTORS)[0] | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const color = community.color_hex;
  const communityColor = COMMUNITY_COLORS[community.community_type];

  const defaultMessage = `Hi — I'm from [my city/region]. I read your community's perspective on "${topicTitle}" and wanted to connect.`;

  const handleSelectContributor = (contributor: (typeof MOCK_CONTRIBUTORS)[0]) => {
    setSelectedContributor(contributor);
    setMessage(defaultMessage);
    setStep("compose");
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 900));
    setSending(false);
    setStep("sent");
  };

  if (step === "sent") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative bg-prism-bg-secondary border border-prism-border rounded-2xl max-w-sm w-full p-8 text-center animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: color + "20" }}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </div>
          <p className="font-display text-lg font-bold text-prism-text-primary mb-2">Connection request sent</p>
          <p className="text-sm text-prism-text-secondary mb-1">
            Your intro has been sent to <span className="font-medium text-prism-text-primary">{selectedContributor?.display}</span> from {community.name}.
          </p>
          <p className="text-xs text-prism-text-dim mb-6">
            They can accept or decline. Declining is always easy and judgment-free.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary hover:bg-prism-bg-elevated/80 transition-colors"
          >
            Back to perspectives
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative bg-prism-bg-secondary border border-prism-border rounded-t-2xl sm:rounded-2xl w-full max-w-md animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-prism-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-prism-border">
          <div className="flex items-center gap-3">
            {step === "compose" && (
              <button
                onClick={() => setStep("browse")}
                className="p-1.5 rounded-lg text-prism-text-dim hover:text-prism-text-primary transition-colors"
                aria-label="Back"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
            )}
            <div>
              <h2 className="font-display text-base font-bold text-prism-text-primary">
                {step === "browse" ? "Connect with this community" : "Send intro"}
              </h2>
              <p className="text-xs text-prism-text-dim flex items-center gap-1">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: communityColor }}
                />
                {community.name} · {community.region}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-prism-bg-elevated text-prism-text-dim hover:text-prism-text-primary transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {step === "browse" && (
            <>
              <p className="text-xs text-prism-text-dim mb-4">
                These community members have opted in to cross-community connections. Your intro will be topic-anchored.
              </p>
              <div className="space-y-2">
                {MOCK_CONTRIBUTORS.map((contributor) => (
                  <button
                    key={contributor.id}
                    onClick={() => handleSelectContributor(contributor)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-prism-bg-elevated border border-prism-border hover:border-prism-accent-active/40 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: color + "20", color }}
                      >
                        {contributor.display}
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-prism-text-primary font-medium">
                          Anonymous contributor
                        </p>
                        <p className="text-xs text-prism-text-dim">
                          {contributor.region} · {contributor.communityYears}yr community member
                        </p>
                      </div>
                    </div>
                    <svg
                      className="w-4 h-4 text-prism-text-dim group-hover:text-prism-accent-active transition-colors shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-prism-text-dim/70 mt-4 text-center">
                Cross-community connections only. Same-community connections aren&apos;t available here.
              </p>
            </>
          )}

          {step === "compose" && selectedContributor && (
            <>
              <div className="bg-prism-bg-elevated border border-prism-border rounded-lg p-3 mb-4">
                <p className="text-xs text-prism-text-dim mb-1">Connecting about</p>
                <p className="text-sm text-prism-text-primary font-medium">&ldquo;{topicTitle}&rdquo;</p>
              </div>

              <div className="mb-1">
                <label className="text-xs font-medium text-prism-text-secondary block mb-2">
                  Your intro message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                  rows={5}
                  className="w-full px-3 py-3 rounded-lg bg-prism-bg-elevated border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-1 focus:ring-prism-accent-active resize-none"
                />
                <p className="text-[10px] text-prism-text-dim mt-1">
                  {500 - message.length} chars remaining
                </p>
              </div>
              <p className="text-xs text-prism-text-dim mb-5">
                They can accept or decline. Declining is judgment-free. Once accepted, you&apos;ll be able to message freely.
              </p>
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="w-full py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: color, color: "#fff" }}
              >
                {sending ? "Sending..." : "Send Connection Request"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
