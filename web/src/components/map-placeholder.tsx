"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { COMMUNITY_COLORS, REACTION_LABELS } from "@/lib/constants";
import type { Community, CommunityType, Post, ReactionType } from "@shared/types";
import type { CommunitySentiment } from "@shared/map-sentiment";

interface PopupData {
  lngLat: [number, number];
}

function MapPopup({
  lngLat,
  map,
  onClose,
}: {
  lngLat: [number, number];
  map: mapboxgl.Map;
  onClose: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [pixel, setPixel] = useState<{ x: number; y: number }>(() => {
    const p = map.project(lngLat);
    return { x: p.x, y: p.y };
  });
  const popupRef = useRef<HTMLDivElement>(null);

  // Update position on every map move so popup follows viewport
  useEffect(() => {
    const update = () => {
      const p = map.project(lngLat);
      setPixel({ x: p.x, y: p.y });
    };
    map.on("move", update);
    return () => { map.off("move", update); };
  }, [map, lngLat]);

  // Flip popup if it would go off-screen
  const containerRect = map.getContainer().getBoundingClientRect();
  const flipUp = pixel.y > containerRect.height * 0.65;
  const flipLeft = pixel.x > containerRect.width * 0.7;

  const springTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 32 };

  return (
    <div
      className="absolute inset-0 z-30 pointer-events-none"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the popup itself
        if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
      style={{ pointerEvents: "auto" }}
    >
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, y: flipUp ? -12 : 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: flipUp ? -8 : 8, scale: 0.97 }}
        transition={springTransition}
        className="absolute pointer-events-auto"
        style={{
          left: pixel.x,
          top: pixel.y,
          transform: `translate(${flipLeft ? "-100%" : "-50%"}, ${flipUp ? "calc(-100% - 12px)" : "12px"})`,
        }}
      >
        <div className="bg-[#181B20] border border-[rgba(212,149,107,0.3)] rounded-xl shadow-2xl backdrop-blur-sm p-3.5 min-w-[200px] max-w-[240px]">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-2 right-2 text-[#5C6370] hover:text-[#EDEDEF] transition-colors p-0.5"
            aria-label="Close popup"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="text-[13px] text-[#EDEDEF] font-[family-name:var(--font-body)] mb-1.5 pr-4">
            No perspectives here yet.
          </p>
          <p className="text-[11px] text-[#9CA3AF] font-[family-name:var(--font-body)] mb-2.5">
            Be the first to share what your community is experiencing.
          </p>
          <a
            href="/create"
            className="inline-block text-[11px] text-[#D4956B] font-medium font-[family-name:var(--font-body)] hover:text-[#E8B898] transition-colors"
          >
            Share a perspective &rarr;
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export interface HeatPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  community_count: number;
  community_types: string[];
  topic_count: number;
}

/** Sentiment-based pin colors by dominant reaction */
const SENTIMENT_COLORS: Record<ReactionType, string> = {
  i_see_this: "#4ADE80",
  i_didnt_know_this: "#F59E0B",
  i_agree: "#3B82F6",
};

interface MapPlaceholderProps {
  communities?: Community[];
  highlightedCommunityIds?: string[];
  ghostMode?: boolean;
  showPersonalPin?: boolean;
  showPersonalPinCommunity?: Community | null;
  userPosts?: Post[];
  heatPoints?: HeatPoint[];
  onHeatTap?: (point: HeatPoint) => void;
  isAuthenticated?: boolean;
  hideOverlays?: boolean;
  /** Sentiment data for topic-filtered mode */
  sentimentData?: CommunitySentiment[];
  /** Whether geographic lens (heat overlay) is active */
  geoLensActive?: boolean;
  /** Active topic name for tooltip display */
  activeTopicName?: string;
  /** Enable slow auto-pan drift (homepage only) */
  enableAutoPan?: boolean;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

// PRISM custom map style — uses a hand-crafted StyleSpecification instead of a hosted
// Mapbox style URL (e.g. "mapbox://styles/mapbox/dark-v11") because our public token
// (pk.*) only has "styles:tiles" scope, NOT "styles:read". Hosted styles require a
// TileJSON metadata fetch that 403s without "styles:read". By inlining the style and
// pointing sources directly at the vector tile endpoint, we avoid that fetch entirely.
// To use Mapbox Standard or any hosted style, the token would need "styles:read" scope
// — which would expose a secret-scoped token in client JS. The custom style also lets
// us match PRISM's exact palette (warm dark land, deep water, no labels).
const PRISM_MAP_STYLE: mapboxgl.StyleSpecification = {
  version: 8,
  name: "PRISM Night",
  sources: {
    "mapbox-streets": {
      type: "vector",
      tiles: [
        `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.vector.pbf?access_token=${MAPBOX_TOKEN}`,
      ],
      minzoom: 0,
      maxzoom: 14,
    },
  },
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  sprite: "mapbox://sprites/mapbox/dark-v11",
  layers: [
    // ── Land — warm dark brown, earthy night tone ─────────────────────
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#1A1208" },
    },
    // ── Landcover — forests, scrub, grass → deep emerald ──────────────
    {
      id: "landcover",
      type: "fill",
      source: "mapbox-streets",
      "source-layer": "landcover",
      paint: {
        "fill-color": ["match", ["get", "class"],
          "wood", "rgba(20, 83, 45, 0.40)",
          "scrub", "rgba(20, 83, 45, 0.25)",
          "grass", "rgba(22, 78, 42, 0.20)",
          "crop", "rgba(30, 70, 35, 0.15)",
          "rgba(20, 83, 45, 0.15)"
        ],
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0.5, 8, 0.85],
      },
    },
    // ── Parks / landuse — emerald tint ─────────────────────────────────
    {
      id: "landuse-park",
      type: "fill",
      source: "mapbox-streets",
      "source-layer": "landuse",
      filter: ["in", ["get", "class"], ["literal", ["park", "cemetery", "glacier", "pitch", "sand"]]],
      paint: {
        "fill-color": ["match", ["get", "class"],
          "park", "rgba(20, 83, 45, 0.30)",
          "pitch", "rgba(20, 83, 45, 0.20)",
          "sand", "rgba(50, 40, 20, 0.25)",
          "glacier", "rgba(30, 50, 70, 0.20)",
          "rgba(26, 22, 18, 0.5)"
        ],
        "fill-opacity": 0.8,
      },
    },
    // ── Water — deep navy ─────────────────────────────────────────────
    {
      id: "water",
      type: "fill",
      source: "mapbox-streets",
      "source-layer": "water",
      paint: { "fill-color": "#0A1628" },
    },
    // ── Waterway lines — navy ─────────────────────────────────────────
    {
      id: "waterway",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "waterway",
      paint: {
        "line-color": "#0D1D35",
        "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.5, 12, 2],
        "line-opacity": 0.7,
      },
    },
    // ── Coastline — subtle amber glow ─────────────────────────────────
    {
      id: "coastline",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "water",
      paint: {
        "line-color": "rgba(212, 149, 107, 0.18)",
        "line-width": 1,
        "line-opacity": 0.6,
      },
    },
    // ── Buildings — warm brown at high zoom ────────────────────────────
    {
      id: "building",
      type: "fill",
      source: "mapbox-streets",
      "source-layer": "building",
      minzoom: 12,
      paint: {
        "fill-color": "#1E1710",
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0, 14, 0.5],
      },
    },
    // ── Roads — warm brown hierarchy ──────────────────────────────────
    {
      id: "tunnel-street",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["==", ["get", "structure"], "tunnel"], ["in", ["get", "class"], ["literal", ["street", "street_limited", "primary_link", "secondary_link", "tertiary_link"]]]],
      paint: {
        "line-color": "#1E1710",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 18, 6],
        "line-dasharray": [3, 3],
        "line-opacity": 0.3,
      },
    },
    {
      id: "road-minor",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["!=", ["get", "structure"], "tunnel"], ["in", ["get", "class"], ["literal", ["service", "track"]]]],
      paint: {
        "line-color": "#2A2218",
        "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.5, 18, 3],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0, 15, 0.4],
      },
    },
    {
      id: "road-street",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["!=", ["get", "structure"], "tunnel"], ["in", ["get", "class"], ["literal", ["street", "street_limited"]]]],
      paint: {
        "line-color": "#30271C",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 14, 2, 18, 8],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0, 12, 0.5],
      },
    },
    {
      id: "road-tertiary",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["!=", ["get", "structure"], "tunnel"], ["==", ["get", "class"], "tertiary"]],
      paint: {
        "line-color": "#332A1E",
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 14, 3, 18, 10],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0, 10, 0.4],
      },
    },
    {
      id: "road-secondary",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["!=", ["get", "structure"], "tunnel"], ["==", ["get", "class"], "secondary"]],
      paint: {
        "line-color": "#382E22",
        "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.5, 12, 2, 18, 12],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0, 8, 0.5],
      },
    },
    {
      id: "road-primary",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["!=", ["get", "structure"], "tunnel"], ["==", ["get", "class"], "primary"]],
      paint: {
        "line-color": "#3D3226",
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 10, 2, 18, 14],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 7, 0.5],
      },
    },
    {
      id: "road-motorway",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["!=", ["get", "structure"], "tunnel"], ["in", ["get", "class"], ["literal", ["motorway", "trunk"]]]],
      paint: {
        "line-color": "#44382A",
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 8, 1.5, 14, 5, 18, 16],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0, 5, 0.6],
      },
    },
    {
      id: "bridge-major",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["==", ["get", "structure"], "bridge"], ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary"]]]],
      paint: {
        "line-color": "#4A3D2E",
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1, 14, 4, 18, 14],
        "line-opacity": 0.6,
      },
    },
    // ── Country borders — warm gold, prominent ────────────────────────
    {
      id: "admin-0-boundary",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "admin",
      filter: ["all", ["==", ["get", "admin_level"], 0], ["!=", ["get", "maritime"], 1]],
      paint: {
        "line-color": "rgba(232, 184, 152, 0.55)",
        "line-width": ["interpolate", ["linear"], ["zoom"], 2, 1.2, 6, 1.8],
        "line-opacity": 0.8,
      },
    },
    // ── State borders — PRISM amber, dashed, distinct from country ────
    {
      id: "admin-1-boundary",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "admin",
      filter: ["all", ["==", ["get", "admin_level"], 1], ["!=", ["get", "maritime"], 1]],
      paint: {
        "line-color": "rgba(212, 149, 107, 0.35)",
        "line-width": 0.8,
        "line-opacity": 0.6,
        "line-dasharray": [3, 2],
      },
    },
    // ── Country labels — warm gold, highly visible, large ─────────────
    {
      id: "place-country",
      type: "symbol",
      source: "mapbox-streets",
      "source-layer": "place_label",
      filter: ["==", ["get", "class"], "country"],
      layout: {
        "text-field": ["get", "name_en"],
        "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 1, 11, 4, 16, 6, 18],
        "text-transform": "uppercase",
        "text-letter-spacing": 0.2,
        "text-max-width": 8,
      },
      paint: {
        "text-color": "rgba(232, 184, 152, 0.80)",
        "text-halo-color": "rgba(10, 14, 20, 0.9)",
        "text-halo-width": 2,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 1, 0.7, 6, 0.9, 9, 0],
      },
    },
    // ── State abbreviations — amber, visible at overview zoom ─────────
    {
      id: "place-state",
      type: "symbol",
      source: "mapbox-streets",
      "source-layer": "place_label",
      filter: ["==", ["get", "class"], "state"],
      layout: {
        "text-field": ["coalesce", ["get", "abbr"], ["get", "name_en"]],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 3, 9, 5, 11, 7, 13],
        "text-transform": "uppercase",
        "text-letter-spacing": 0.15,
        "text-max-width": 7,
      },
      paint: {
        "text-color": "rgba(212, 149, 107, 0.55)",
        "text-halo-color": "rgba(26, 18, 8, 0.85)",
        "text-halo-width": 1.5,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0, 4, 0.6, 7, 0.8, 10, 0],
      },
    },
    // ── City labels — warm amber, context layer ───────────────────────
    {
      id: "place-city",
      type: "symbol",
      source: "mapbox-streets",
      "source-layer": "place_label",
      filter: ["in", ["get", "class"], ["literal", ["city", "town"]]],
      layout: {
        "text-field": ["get", "name_en"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 4, 8, 10, 14, 14, 16],
        "text-max-width": 8,
      },
      paint: {
        "text-color": "rgba(232, 184, 152, 0.45)",
        "text-halo-color": "rgba(26, 18, 8, 0.85)",
        "text-halo-width": 1.5,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0, 6, 0.6, 14, 0.85],
      },
    },
    // ── Neighborhood labels — high zoom only ──────────────────────────
    {
      id: "place-neighborhood",
      type: "symbol",
      source: "mapbox-streets",
      "source-layer": "place_label",
      filter: ["in", ["get", "class"], ["literal", ["neighbourhood", "suburb"]]],
      minzoom: 10,
      layout: {
        "text-field": ["get", "name_en"],
        "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 10, 9, 14, 12],
        "text-max-width": 7,
      },
      paint: {
        "text-color": "rgba(212, 149, 107, 0.35)",
        "text-halo-color": "rgba(26, 18, 8, 0.75)",
        "text-halo-width": 1,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0, 12, 0.6],
      },
    },
  ],
};

/**
 * Activity levels map to pulse speeds:
 *   high → 1.8s (fast pulse)
 *   medium → 3s (normal pulse)
 *   low → 5s (slow, ambient pulse)
 */
function pulseSpeedForActivity(level: string | undefined): string {
  switch (level) {
    case "high": return "1.8s";
    case "medium": return "3s";
    default: return "5s";
  }
}

function createPulseElement(
  color: string,
  size: number,
  activityLevel?: string,
): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.position = "relative";
  el.style.transition = "opacity 0.4s ease, transform 0.4s ease";

  const speed = pulseSpeedForActivity(activityLevel);
  const isActive = activityLevel === "high" || activityLevel === "medium";

  // Core dot
  const core = document.createElement("div");
  core.style.width = `${size}px`;
  core.style.height = `${size}px`;
  core.style.borderRadius = "50%";
  core.style.backgroundColor = color;
  core.style.boxShadow = `0 0 ${size * 1.5}px ${color}80, 0 0 ${size * 3}px ${color}40`;
  core.style.position = "absolute";
  core.style.top = "0";
  core.style.left = "0";
  core.style.zIndex = "3";
  el.appendChild(core);

  if (isActive) {
    // Pulse ring 1
    const ring1 = document.createElement("div");
    ring1.style.width = `${size * 2.5}px`;
    ring1.style.height = `${size * 2.5}px`;
    ring1.style.borderRadius = "50%";
    ring1.style.backgroundColor = `${color}18`;
    ring1.style.position = "absolute";
    ring1.style.top = `${-(size * 0.75)}px`;
    ring1.style.left = `${-(size * 0.75)}px`;
    ring1.style.animation = `prism-pulse ${speed} ease-in-out infinite`;
    ring1.style.zIndex = "1";
    el.appendChild(ring1);

    // Pulse ring 2
    const ring2 = document.createElement("div");
    ring2.style.width = `${size * 3.5}px`;
    ring2.style.height = `${size * 3.5}px`;
    ring2.style.borderRadius = "50%";
    ring2.style.backgroundColor = `${color}0A`;
    ring2.style.position = "absolute";
    ring2.style.top = `${-(size * 1.25)}px`;
    ring2.style.left = `${-(size * 1.25)}px`;
    ring2.style.animation = `prism-pulse ${speed} ease-in-out infinite 0.5s`;
    ring2.style.zIndex = "1";
    el.appendChild(ring2);
  }

  return el;
}

/**
 * Create a cluster element showing count of communities grouped at low zoom.
 */
function createClusterElement(
  count: number,
  dominantColor: string,
): HTMLDivElement {
  const size = Math.min(44, 24 + count * 4);
  const el = document.createElement("div");
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = "50%";
  el.style.backgroundColor = `${dominantColor}30`;
  el.style.border = `2px solid ${dominantColor}60`;
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.cursor = "pointer";
  el.style.transition = "transform 0.3s ease";
  el.style.boxShadow = `0 0 ${size}px ${dominantColor}25`;

  const label = document.createElement("span");
  label.textContent = String(count);
  label.style.fontSize = "11px";
  label.style.fontWeight = "700";
  label.style.color = "#EDEDEF";
  label.style.fontFamily = "'JetBrains Mono', monospace";
  el.appendChild(label);

  el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.15)"; });
  el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });

  return el;
}

function createHeatElement(
  intensity: number,
  communityCount: number
): HTMLDivElement {
  const el = document.createElement("div");
  const size = 40 + intensity * 80;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.cursor = "pointer";
  el.style.position = "relative";

  const opacity = 0.15 + intensity * 0.25;

  // Outer glow
  const outer = document.createElement("div");
  outer.style.width = `${size * 1.5}px`;
  outer.style.height = `${size * 1.5}px`;
  outer.style.borderRadius = "50%";
  outer.style.background = `radial-gradient(circle, rgba(255,107,138,${opacity * 0.3}) 0%, rgba(245,158,11,${opacity * 0.15}) 50%, transparent 70%)`;
  outer.style.position = "absolute";
  outer.style.top = "50%";
  outer.style.left = "50%";
  outer.style.transform = "translate(-50%, -50%)";
  outer.style.animation = "prism-pulse 4s ease-in-out infinite";
  el.appendChild(outer);

  // Inner core
  const inner = document.createElement("div");
  inner.style.width = `${size}px`;
  inner.style.height = `${size}px`;
  inner.style.borderRadius = "50%";
  inner.style.background = `radial-gradient(circle, rgba(255,107,138,${opacity}) 0%, rgba(245,158,11,${opacity * 0.5}) 40%, transparent 70%)`;
  inner.style.position = "absolute";
  inner.style.top = "50%";
  inner.style.left = "50%";
  inner.style.transform = "translate(-50%, -50%)";
  el.appendChild(inner);

  // Count label
  const label = document.createElement("div");
  label.style.position = "absolute";
  label.style.top = "50%";
  label.style.left = "50%";
  label.style.transform = "translate(-50%, -50%)";
  label.style.fontSize = "10px";
  label.style.fontWeight = "700";
  label.style.color = "#EDEDEF";
  label.style.textShadow = "0 1px 4px rgba(0,0,0,0.8)";
  label.style.zIndex = "5";
  label.textContent = `${communityCount}`;
  el.appendChild(label);

  return el;
}

export function MapPlaceholder({
  communities: communitiesProp = [],
  highlightedCommunityIds,
  ghostMode = false,
  showPersonalPin = true,
  showPersonalPinCommunity = null,
  userPosts = [],
  heatPoints = [],
  onHeatTap,
  isAuthenticated = false,
  hideOverlays = false,
  sentimentData = [],
  geoLensActive = false,
  activeTopicName,
  enableAutoPan = false,
}: MapPlaceholderProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [popupData, setPopupData] = useState<PopupData | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoomGeneration, setZoomGeneration] = useState(0);

  // Inject pulse animation CSS
  useEffect(() => {
    if (document.getElementById("prism-map-pulse-css")) return;
    const style = document.createElement("style");
    style.id = "prism-map-pulse-css";
    style.textContent = `
      @keyframes prism-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const isMobileViewport = window.innerWidth < 768;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: PRISM_MAP_STYLE,
      center: isMobileViewport ? [-96, 38] : [-98, 38],
      zoom: isMobileViewport ? 2.8 : 3.5,
      minZoom: 2,
      maxZoom: 12,
      attributionControl: false,
      logoPosition: "bottom-right",
      fadeDuration: 300,
      antialias: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    map.on("load", () => {
      setMapLoaded(true);
      map.resize();
      requestAnimationFrame(() => map.resize());
      setTimeout(() => map.resize(), 100);
      setTimeout(() => map.resize(), 500);

      // ── City Lights Layer (only for authenticated map, not landing page) ──
      if (isAuthenticated) fetch("/data/cities.geojson")
        .then((res) => res.json())
        .then((geojson) => {
          if (!map.getSource("city-lights-source")) {
            map.addSource("city-lights-source", { type: "geojson", data: geojson });

            // Outer halo — soft amber glow
            map.addLayer({
              id: "city-lights-outer",
              type: "circle",
              source: "city-lights-source",
              paint: {
                "circle-color": "#E8B898",
                "circle-radius": [
                  "step", ["get", "population"],
                  6,       // under 100K
                  100000, 10.5,  // 100K-500K
                  500000, 18,    // 500K-1M
                  1000000, 27,   // over 1M
                ],
                "circle-blur": 1.0,
                "circle-opacity": 0.15,
              },
            });

            // Inner glow — brighter amber core
            map.addLayer({
              id: "city-lights-inner",
              type: "circle",
              source: "city-lights-source",
              paint: {
                "circle-color": "#D4956B",
                "circle-radius": [
                  "step", ["get", "population"],
                  4,       // under 100K
                  100000, 7,     // 100K-500K
                  500000, 12,    // 500K-1M
                  1000000, 18,   // over 1M
                ],
                "circle-blur": 0.8,
                "circle-opacity": 0.4,
              },
            });
          }

          // Breathing animation — subtle opacity pulse on inner layer
          const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (!prefersReducedMotion) {
            let lastFrame = 0;
            const FRAME_INTERVAL = 1000 / 30; // 30fps cap
            const breathe = (timestamp: number) => {
              if (!mapRef.current) return;
              if (timestamp - lastFrame >= FRAME_INTERVAL) {
                lastFrame = timestamp;
                // Sine wave: oscillate opacity between 0.35 and 0.45 over 3000ms
                const t = (timestamp % 3000) / 3000;
                const opacity = 0.4 + 0.05 * Math.sin(t * Math.PI * 2);
                try {
                  map.setPaintProperty("city-lights-inner", "circle-opacity", opacity);
                } catch { /* map may be removed */ }
              }
              requestAnimationFrame(breathe);
            };
            requestAnimationFrame(breathe);
          }
        })
        .catch(() => { /* cities.geojson not found — skip */ });
    });

    // Re-render markers when crossing cluster zoom threshold
    let lastClusterState = map.getZoom() < 6;
    map.on("zoomend", () => {
      const nowClustered = map.getZoom() < 6;
      if (nowClustered !== lastClusterState) {
        lastClusterState = nowClustered;
        setZoomGeneration((g) => g + 1);
      }
    });

    // Click on empty area → show "no perspectives here yet" React overlay
    // Suppress clicks on water/ocean using bounding box + water layer query
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;

      // Bounding box check: continental US only
      if (lng < -130 || lng > -65 || lat < 24 || lat > 50) {
        setPopupData(null);
        return;
      }

      // Check if click is on water by querying the water layer
      const waterFeatures = map.queryRenderedFeatures(e.point, { layers: ["water"] });
      if (waterFeatures.length > 0) {
        setPopupData(null);
        return;
      }

      setPopupData({ lngLat: [lng, lat] });
    });

    // ── Slow Pan Animation (homepage only) ──────────────────────────
    if (enableAutoPan) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!prefersReducedMotion) {
        const isMobile = window.innerWidth < 768;
        const scale = isMobile ? 0.5 : 1;
        const waypoints: [number, number][] = [
          [-96, 38], [-90, 40], [-100, 36], [-94, 42],
        ];
        let waypointIndex = 0;
        let panTimeout: ReturnType<typeof setTimeout> | null = null;
        let userInteracted = false;
        let restartTimeout: ReturnType<typeof setTimeout> | null = null;

        const startPan = () => {
          if (!mapRef.current || userInteracted) return;
          const next = waypoints[waypointIndex % waypoints.length];
          const current = map.getCenter();
          // Scale the pan distance on mobile
          const targetLng = current.lng + (next[0] - current.lng) * scale;
          const targetLat = current.lat + (next[1] - current.lat) * scale;

          map.easeTo({
            center: [targetLng, targetLat],
            duration: 8000,
            easing: (t: number) => t, // linear
            essential: true,
          });
          waypointIndex++;
          panTimeout = setTimeout(startPan, 8200);
        };

        // Start panning after a brief delay
        map.once("idle", () => {
          panTimeout = setTimeout(startPan, 1000);
        });

        // Stop on user interaction, restart after 5s inactivity
        const stopPan = () => {
          userInteracted = true;
          if (panTimeout) clearTimeout(panTimeout);
          map.stop();
          if (restartTimeout) clearTimeout(restartTimeout);
          restartTimeout = setTimeout(() => {
            userInteracted = false;
            startPan();
          }, 5000);
        };

        map.on("mousedown", stopPan);
        map.on("touchstart", stopPan);
        map.on("wheel", stopPan);
      }
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear and re-add markers whenever data changes
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    clearMarkers();

    const communities = communitiesProp.filter(
      (c) => c.latitude != null && c.longitude != null
    );

    // Build sentiment lookup for this render pass
    const sentimentLookup = new Map<string, CommunitySentiment>();
    for (const s of sentimentData) {
      sentimentLookup.set(s.community_id, s);
    }

    function addCommunityMarker(c: Community, el: HTMLDivElement) {
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([c.longitude as number, c.latitude as number])
        .addTo(mapRef.current!);

      // Build tooltip content — enhanced when sentiment data available
      const sent = sentimentLookup.get(c.id);
      let tooltipHtml: string;
      if (sent && activeTopicName) {
        const reactionLabel = REACTION_LABELS[sent.dominant_reaction];
        tooltipHtml = `<div style="background:#0F1114;border:1px solid #262A31;border-radius:8px;padding:8px 10px;font-family:'DM Sans',sans-serif;min-width:160px;">
          <div style="font-size:11px;color:#EDEDEF;font-weight:600;margin-bottom:4px;">${c.name}</div>
          <div style="font-size:10px;color:#9CA3AF;margin-bottom:6px;">${c.region}</div>
          <div style="font-size:10px;color:#5C6370;margin-bottom:2px;">${sent.perspective_count} perspective${sent.perspective_count !== 1 ? "s" : ""} on this topic</div>
          <div style="display:flex;align-items:center;gap:4px;margin-top:4px;">
            <span style="font-size:11px;">${reactionLabel.emoji}</span>
            <span style="font-size:10px;color:${SENTIMENT_COLORS[sent.dominant_reaction]};font-weight:500;">${reactionLabel.label}</span>
          </div>
        </div>`;
      } else {
        tooltipHtml = `<div style="background:#0F1114;border:1px solid #262A31;border-radius:6px;padding:4px 8px;font-size:10px;color:#EDEDEF;font-family:'DM Sans',sans-serif;">${c.name}</div>`;
      }

      const popup = new mapboxgl.Popup({
        closeButton: false, closeOnClick: false, offset: 12, className: "prism-popup",
      }).setHTML(tooltipHtml);

      el.style.cursor = "pointer";
      el.addEventListener("mouseenter", () => { marker.setPopup(popup); popup.addTo(mapRef.current!); });
      el.addEventListener("mouseleave", () => { popup.remove(); });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setPopupData(null);
        window.location.href = `/community/${c.id}`;
      });

      markersRef.current.push(marker);
    }

    // ── Cluster communities at low zoom, expand at high zoom ───────────
    const currentZoom = mapRef.current!.getZoom();
    const CLUSTER_ZOOM_THRESHOLD = 6;

    if (currentZoom < CLUSTER_ZOOM_THRESHOLD && communities.length > 3) {
      // Group nearby communities into clusters using rounded lat/lng
      const clusters: Record<string, Community[]> = {};
      for (const c of communities) {
        const key = `${Math.round((c.latitude as number) / 3) * 3}_${Math.round((c.longitude as number) / 5) * 5}`;
        if (!clusters[key]) clusters[key] = [];
        clusters[key].push(c);
      }

      for (const group of Object.values(clusters)) {
        if (group.length === 1) {
          // Single community — render as normal pin
          const c = group[0];
          const isHighlighted = !highlightedCommunityIds || highlightedCommunityIds.includes(c.id);
          const sent = sentimentData.find((s) => s.community_id === c.id);
          const color = sent ? SENTIMENT_COLORS[sent.dominant_reaction] : COMMUNITY_COLORS[c.community_type as CommunityType];
          const el = createPulseElement(color, isHighlighted ? 10 : 6, sent ? "high" : (c as unknown as Record<string, unknown>).activity_level as string | undefined);
          if (!isHighlighted) el.style.opacity = "0.2";
          addCommunityMarker(c, el);
        } else {
          // Cluster — show count badge
          const avgLat = group.reduce((s, c) => s + (c.latitude as number), 0) / group.length;
          const avgLng = group.reduce((s, c) => s + (c.longitude as number), 0) / group.length;
          const dominantType = group.reduce<Record<string, number>>((acc, c) => {
            acc[c.community_type] = (acc[c.community_type] || 0) + 1;
            return acc;
          }, {});
          const topType = Object.entries(dominantType).sort((a, b) => b[1] - a[1])[0][0] as CommunityType;
          const color = COMMUNITY_COLORS[topType];

          const el = createClusterElement(group.length, color);
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            mapRef.current?.flyTo({ center: [avgLng, avgLat], zoom: CLUSTER_ZOOM_THRESHOLD + 1, duration: 800 });
          });

          const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([avgLng, avgLat])
            .addTo(mapRef.current!);
          markersRef.current.push(marker);
        }
      }
    } else {
      // Expanded view — individual pins with activity-based pulse
      communities.forEach((c) => {
        const isHighlighted = !highlightedCommunityIds || highlightedCommunityIds.includes(c.id);
        const pinSize = isHighlighted ? 10 : 6;
        // Use sentiment color when available, otherwise community type color
        const sent = sentimentData.find((s) => s.community_id === c.id);
        const color = sent ? SENTIMENT_COLORS[sent.dominant_reaction] : COMMUNITY_COLORS[c.community_type as CommunityType];
        const activityLevel = sent ? "high" : (c as unknown as Record<string, unknown>).activity_level as string | undefined;
        const el = createPulseElement(color, pinSize, activityLevel);
        if (!isHighlighted) el.style.opacity = "0.2";
        addCommunityMarker(c, el);
      });
    }

    // Geographic Lens heat overlay — show perspective density when active
    if (geoLensActive && sentimentData.length > 0) {
      // Group sentiments by rounded geographic region for density display
      const densityClusters: Record<string, { lat: number; lng: number; count: number }> = {};
      for (const s of sentimentData) {
        const key = `${Math.round(s.latitude / 2) * 2}_${Math.round(s.longitude / 3) * 3}`;
        if (!densityClusters[key]) {
          densityClusters[key] = { lat: s.latitude, lng: s.longitude, count: 0 };
        }
        densityClusters[key].count += s.perspective_count;
      }

      for (const cluster of Object.values(densityClusters)) {
        const intensity = Math.min(cluster.count / 10, 1);
        const size = 60 + intensity * 120;
        const opacity = 0.08 + intensity * 0.18;

        const el = document.createElement("div");
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = "50%";
        el.style.background = `radial-gradient(circle, rgba(212,149,107,${opacity}) 0%, rgba(212,149,107,${opacity * 0.3}) 50%, transparent 70%)`;
        el.style.position = "relative";
        el.style.pointerEvents = "none";
        el.style.animation = "prism-pulse 5s ease-in-out infinite";

        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([cluster.lng, cluster.lat])
          .addTo(mapRef.current!);
        markersRef.current.push(marker);
      }
    }

    // Heat points
    heatPoints.forEach((hp) => {
      const el = createHeatElement(hp.intensity, hp.community_count);
      el.addEventListener("click", () => onHeatTap?.(hp));

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([hp.longitude, hp.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // User post pins — clickable with popup showing content and author link
    const homeCommunity = showPersonalPinCommunity ?? null;
    userPosts.forEach((post) => {
      const lat = post.latitude ?? homeCommunity?.latitude;
      const lng = post.longitude ?? homeCommunity?.longitude;
      if (lat == null || lng == null) return;

      const el = document.createElement("div");
      el.style.width = "8px";
      el.style.height = "8px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#3B82F6";
      el.style.boxShadow = "0 1px 6px rgba(74,158,255,0.6)";
      el.style.cursor = "pointer";

      if (post.post_type === "story") {
        el.style.border = "2px solid transparent";
        el.style.backgroundImage =
          "linear-gradient(#3B82F6, #3B82F6), linear-gradient(135deg, #D4956B, #E8B898)";
        el.style.backgroundOrigin = "border-box";
        el.style.backgroundClip = "padding-box, border-box";
      }

      const authorName = post.user?.display_name ?? post.user?.username ?? "Anonymous";
      const contentPreview = post.content?.slice(0, 120) ?? "";
      const communityName = post.community?.name ?? "";

      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 12,
        className: "prism-popup",
        maxWidth: "260px",
      }).setHTML(
        `<div style="background:#181B20;border:1px solid #262A31;border-radius:10px;padding:12px;font-family:'DM Sans',sans-serif;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <div style="width:24px;height:24px;border-radius:50%;background:#262A31;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#EDEDEF;">${authorName.charAt(0).toUpperCase()}</div>
            <div>
              <a href="/profile/${post.user_id}" style="font-size:12px;color:#EDEDEF;text-decoration:none;font-weight:500;">${authorName}</a>
              ${communityName ? `<span style="font-size:10px;color:#5C6370;display:block;">${communityName}</span>` : ""}
            </div>
          </div>
          <p style="font-size:12px;color:#9CA3AF;margin:0 0 8px;line-height:1.4;">${contentPreview}${post.content && post.content.length > 120 ? "..." : ""}</p>
          <a href="/profile/${post.user_id}" style="font-size:11px;color:#D4956B;text-decoration:none;font-weight:500;">View profile →</a>
        </div>`
      );

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setPopupData(null);
        popup.setLngLat([lng, lat]).addTo(mapRef.current!);
      });

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([lng, lat])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // Personal pin (hidden in ghost mode)
    if (
      showPersonalPin &&
      !ghostMode &&
      homeCommunity?.latitude != null &&
      homeCommunity?.longitude != null
    ) {
      const el = document.createElement("div");
      el.style.width = "6px";
      el.style.height = "6px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#3B82F6";
      el.style.boxShadow = "0 1px 4px rgba(74,158,255,0.5)";

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 10,
        className: "prism-popup",
      }).setHTML(
        `<div style="background:#0F1114;border:1px solid #262A31;border-radius:6px;padding:4px 8px;font-size:10px;color:#EDEDEF;font-family:'DM Sans',sans-serif;">You (${homeCommunity.region})</div>`
      );

      el.addEventListener("mouseenter", () => {
        popup.addTo(mapRef.current!);
        personalMarker.setPopup(popup);
      });
      el.addEventListener("mouseleave", () => popup.remove());

      const personalMarker = new mapboxgl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([homeCommunity.longitude, homeCommunity.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(personalMarker);
    }
  }, [
    mapLoaded,
    zoomGeneration,
    communitiesProp,
    highlightedCommunityIds,
    ghostMode,
    showPersonalPin,
    showPersonalPinCommunity,
    userPosts,
    heatPoints,
    onHeatTap,
    clearMarkers,
    sentimentData,
    geoLensActive,
    activeTopicName,
  ]);

  // Fallback if no Mapbox token
  if (!MAPBOX_TOKEN) {
    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-prism-bg-base border border-prism-border shadow-inner flex items-center justify-center">
        <p className="text-sm text-prism-text-dim">
          Add NEXT_PUBLIC_MAPBOX_TOKEN for live map
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-prism-border shadow-inner">
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* React-managed popup overlay with AnimatePresence for exit animation */}
      <AnimatePresence>
        {popupData && mapRef.current && (
          <MapPopup
            key="map-popup"
            lngLat={popupData.lngLat}
            map={mapRef.current}
            onClose={() => setPopupData(null)}
          />
        )}
      </AnimatePresence>

      {/* Map status */}

      {/* Privacy status — only show for authenticated users */}
      {isAuthenticated && (
        <div className="absolute top-11 right-3 bg-prism-bg-base/80 backdrop-blur-sm px-2.5 py-1 rounded-full z-10 border border-prism-border/60">
          <span
            className={`text-[10px] font-medium ${
              ghostMode ? "text-prism-accent-primary" : "text-prism-text-secondary"
            }`}
          >
            {ghostMode ? "Ghost mode on" : "Visible mode"}
          </span>
        </div>
      )}

      {/* Community count — show count when > 0, or exploration prompt when empty */}
      {!hideOverlays && (
        <div className="absolute top-3 left-3 bg-prism-bg-base/80 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
          <span className="text-[10px] font-mono text-prism-text-secondary">
            {communitiesProp.filter((c) => c.latitude != null).length > 0
              ? `${communitiesProp.filter((c) => c.latitude != null).length} communities active`
              : "Tap anywhere to explore"}
          </span>
        </div>
      )}

      {/* Sentiment legend — shown when topic sentiment data is active */}
      {sentimentData.length > 0 && !hideOverlays && (
        <div className="absolute bottom-16 left-3 bg-prism-bg-base/90 backdrop-blur-sm px-3 py-2.5 rounded-lg z-10 border border-prism-border/60">
          <p className="text-[9px] font-semibold text-prism-text-dim uppercase tracking-wider mb-2">
            Community Sentiment
          </p>
          <div className="space-y-1.5">
            {(Object.entries(SENTIMENT_COLORS) as [ReactionType, string][]).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} />
                <span className="text-[10px] text-prism-text-secondary">{REACTION_LABELS[key].label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-prism-bg-base flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-full max-w-[200px] h-2 bg-prism-bg-elevated rounded-full overflow-hidden">
              <div className="h-full bg-prism-accent-primary/30 rounded-full animate-shimmer" style={{ width: "60%" }} />
            </div>
            <span className="text-[10px] text-prism-text-dim">Loading map</span>
          </div>
        </div>
      )}
    </div>
  );
}
