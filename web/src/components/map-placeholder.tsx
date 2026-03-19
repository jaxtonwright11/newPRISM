"use client";

import type { Community } from "../../../shared/types";

const COMMUNITY_TYPE_COLORS: Record<string, string> = {
  civic: "#4A9EFF",
  diaspora: "#F59E0B",
  rural: "#22C55E",
  policy: "#A855F7",
  academic: "#EC4899",
  cultural: "#F97316",
};

interface MapPlaceholderProps {
  communities: Community[];
}

export function MapPlaceholder({ communities }: MapPlaceholderProps) {
  return (
    <div className="absolute inset-0 bg-[#0a0a1a] overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {communities.map((community, i) => {
        const positions = [
          { left: "35%", top: "40%" },
          { left: "55%", top: "55%" },
          { left: "45%", top: "30%" },
        ];
        const pos = positions[i % positions.length];
        const color = COMMUNITY_TYPE_COLORS[community.community_type] ?? "#666";

        return (
          <div
            key={community.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: pos.left, top: pos.top }}
          >
            <div
              className="absolute -inset-4 rounded-full animate-ping opacity-20"
              style={{ backgroundColor: color }}
            />
            <div
              className="absolute -inset-2 rounded-full opacity-30"
              style={{ backgroundColor: color }}
            />
            <div
              className="w-4 h-4 rounded-full relative z-10 shadow-lg"
              style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}80` }}
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-medium text-white bg-black/70 px-2 py-1 rounded">
                {community.name}
              </span>
            </div>
          </div>
        );
      })}

      <div className="absolute bottom-4 left-4 text-xs text-zinc-600">
        Map placeholder — Mapbox GL JS will render here with a valid token
      </div>
    </div>
  );
}
