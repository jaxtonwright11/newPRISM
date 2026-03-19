"use client";

import { COMMUNITY_COLORS } from "@/lib/constants";
import type { CommunityType } from "@shared/types";

const MOCK_PINS: {
  x: number;
  y: number;
  type: CommunityType;
  size: "lg" | "md" | "sm";
}[] = [
  { x: 25, y: 40, type: "rural", size: "lg" },
  { x: 18, y: 35, type: "civic", size: "md" },
  { x: 30, y: 55, type: "diaspora", size: "lg" },
  { x: 70, y: 30, type: "academic", size: "sm" },
  { x: 55, y: 45, type: "cultural", size: "md" },
  { x: 80, y: 50, type: "policy", size: "sm" },
  { x: 42, y: 28, type: "civic", size: "lg" },
  { x: 65, y: 60, type: "diaspora", size: "md" },
];

const SIZE_MAP = { lg: 14, md: 10, sm: 6 };

export function MapPlaceholder() {
  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-prism-map-ocean border border-prism-border">
      <div className="absolute inset-0 bg-prism-map-land/30" />

      {/* SVG continent outlines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 100 70"
        preserveAspectRatio="none"
      >
        <path
          d="M15 20 Q20 15 25 18 L30 25 Q28 35 22 40 L18 45 Q12 50 15 55 L20 60 Q25 58 28 55"
          fill="#161B22"
          stroke="#2A3441"
          strokeWidth="0.3"
        />
        <path
          d="M55 15 Q65 10 75 18 L80 25 Q78 35 70 40 L65 38 Q60 32 58 25"
          fill="#161B22"
          stroke="#2A3441"
          strokeWidth="0.3"
        />
      </svg>

      {/* LIVE indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-prism-bg-primary/80 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
        <span className="w-2 h-2 rounded-full bg-prism-accent-live animate-pulse-slow" />
        <span className="text-[10px] font-semibold tracking-widest text-prism-accent-live uppercase">
          Live
        </span>
      </div>

      {/* Map pins */}
      {MOCK_PINS.map((pin, i) => {
        const size = SIZE_MAP[pin.size];
        const color = COMMUNITY_COLORS[pin.type];
        return (
          <div
            key={i}
            className="absolute animate-pulse-glow"
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {pin.size !== "sm" && (
              <>
                <div
                  className="absolute rounded-full"
                  style={{
                    width: size * 3,
                    height: size * 3,
                    backgroundColor: color,
                    opacity: 0.15,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    width: size * 2,
                    height: size * 2,
                    backgroundColor: color,
                    opacity: 0.3,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </>
            )}
            <div
              className="relative rounded-full"
              style={{
                width: size,
                height: size,
                backgroundColor: color,
                boxShadow: `0 0 ${size}px ${color}60`,
              }}
            />
          </div>
        );
      })}

      {/* Mapbox token prompt */}
      <div className="absolute bottom-3 left-3 bg-prism-bg-primary/80 backdrop-blur-sm px-3 py-2 rounded-lg">
        <p className="text-[11px] text-prism-text-dim">
          {process.env.NEXT_PUBLIC_MAPBOX_TOKEN
            ? "Mapbox connected"
            : "Add NEXT_PUBLIC_MAPBOX_TOKEN for live map"}
        </p>
      </div>
    </div>
  );
}
