"use client";

import { COMMUNITY_COLORS } from "@/lib/constants";
import { SEED_COMMUNITIES } from "@/lib/seed-data";
import type { CommunityType } from "@shared/types";

function latLngToXY(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 130) / 60) * 100;
  const y = ((50 - lat) / 30) * 100;
  return {
    x: Math.max(5, Math.min(95, x)),
    y: Math.max(5, Math.min(95, y)),
  };
}

const ACTIVITY_SIZE: Record<string, number> = {
  high: 12,
  medium: 9,
  low: 6,
};

export function MapPlaceholder() {
  const pins = SEED_COMMUNITIES.filter(
    (c) => c.latitude !== null && c.longitude !== null
  ).map((c, i) => {
    const pos = latLngToXY(c.latitude as number, c.longitude as number);
    const activity = (["high", "medium", "low"] as const)[i % 3];
    return {
      ...pos,
      type: c.community_type,
      size: activity,
      name: c.name,
    };
  });

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-prism-map-ocean border border-prism-border shadow-inner">
      {/* Background land mass */}
      <div className="absolute inset-0 bg-prism-map-land/20" />

      {/* US outline SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.15]"
        viewBox="0 0 100 70"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d="M8 20 Q12 14 20 16 L28 15 Q35 14 42 16 L50 18 Q55 17 60 15 L68 14 Q75 15 80 18 L85 22 Q87 28 85 35 L82 40 Q78 42 75 38 L70 35 Q65 38 60 42 L55 45 Q48 48 40 46 L35 43 Q28 40 22 38 L18 35 Q12 32 10 28 L8 24 Z"
          fill="#161B22"
          stroke="#2A3441"
          strokeWidth="0.5"
        />
        <path
          d="M25 45 Q28 42 32 44 L38 48 Q35 55 30 58 L25 56 Q22 52 25 45"
          fill="#161B22"
          stroke="#2A3441"
          strokeWidth="0.3"
        />
      </svg>

      {/* Grid lines for subtle depth */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 100 70">
        {Array.from({ length: 10 }, (_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={i * 7}
            x2="100"
            y2={i * 7}
            stroke="#4A9EFF"
            strokeWidth="0.2"
          />
        ))}
        {Array.from({ length: 14 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 7.14}
            y1="0"
            x2={i * 7.14}
            y2="70"
            stroke="#4A9EFF"
            strokeWidth="0.2"
          />
        ))}
      </svg>

      {/* LIVE indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-prism-bg-primary/80 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
        <span className="w-2 h-2 rounded-full bg-prism-accent-live animate-pulse-slow" />
        <span className="text-[10px] font-semibold tracking-widest text-prism-accent-live uppercase">
          Live
        </span>
      </div>

      {/* Community count */}
      <div className="absolute top-3 left-3 bg-prism-bg-primary/80 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
        <span className="text-[10px] font-mono text-prism-text-secondary">
          {pins.length} communities active
        </span>
      </div>

      {/* Community pins */}
      {pins.map((pin, i) => {
        const size = ACTIVITY_SIZE[pin.size];
        const color = COMMUNITY_COLORS[pin.type as CommunityType];
        return (
          <div
            key={i}
            className="absolute group/pin"
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Outer glow ring */}
            {pin.size !== "low" && (
              <>
                <div
                  className="absolute rounded-full animate-pulse-glow"
                  style={{
                    width: size * 3.5,
                    height: size * 3.5,
                    backgroundColor: color,
                    opacity: 0.1,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    width: size * 2.2,
                    height: size * 2.2,
                    backgroundColor: color,
                    opacity: 0.25,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </>
            )}
            {/* Core dot */}
            <div
              className="relative rounded-full"
              style={{
                width: size,
                height: size,
                backgroundColor: color,
                boxShadow: `0 0 ${size}px ${color}80`,
              }}
            />
            {/* Hover tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none z-20">
              <div className="bg-prism-bg-primary/95 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-prism-text-primary whitespace-nowrap border border-prism-border">
                {pin.name}
              </div>
            </div>
          </div>
        );
      })}

      {/* Mapbox token prompt */}
      <div className="absolute bottom-3 left-3 bg-prism-bg-primary/80 backdrop-blur-sm px-3 py-2 rounded-lg z-10">
        <p className="text-[11px] text-prism-text-dim">
          {process.env.NEXT_PUBLIC_MAPBOX_TOKEN
            ? "Mapbox connected"
            : "Add NEXT_PUBLIC_MAPBOX_TOKEN for live map"}
        </p>
      </div>
    </div>
  );
}
