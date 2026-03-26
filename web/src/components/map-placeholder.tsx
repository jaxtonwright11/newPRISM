"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { COMMUNITY_COLORS } from "@/lib/constants";
import type { Community, CommunityType, Post } from "@shared/types";

export interface HeatPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  community_count: number;
  community_types: string[];
  topic_count: number;
}

interface MapPlaceholderProps {
  communities?: Community[];
  highlightedCommunityIds?: string[];
  ghostMode?: boolean;
  showPersonalPin?: boolean;
  showPersonalPinCommunity?: Community | null;
  userPosts?: Post[];
  heatPoints?: HeatPoint[];
  onHeatTap?: (point: HeatPoint) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

// PRISM dark map style
const PRISM_MAP_STYLE: mapboxgl.StyleSpecification = {
  version: 8,
  name: "PRISM Dark",
  sources: {
    "mapbox-streets": {
      type: "vector",
      url: "mapbox://mapbox.mapbox-streets-v8",
    },
    "mapbox-terrain": {
      type: "vector",
      url: "mapbox://mapbox.mapbox-terrain-v2",
    },
  },
  layers: [
    // Ocean background
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#0A0908" },
    },
    // Land fill — using terrain source which has the landcover layer
    {
      id: "land",
      type: "fill",
      source: "mapbox-terrain",
      "source-layer": "landcover",
      paint: { "fill-color": "#131110" },
    },
    // Water
    {
      id: "water",
      type: "fill",
      source: "mapbox-streets",
      "source-layer": "water",
      paint: { "fill-color": "#0A0908" },
    },
    // Admin boundaries — barely visible
    {
      id: "admin-borders",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "admin",
      filter: ["==", ["get", "admin_level"], 0],
      paint: {
        "line-color": "#2A251E",
        "line-width": 0.5,
        "line-opacity": 0.4,
      },
    },
    // State/province boundaries — even more subtle
    {
      id: "admin-state",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "admin",
      filter: ["==", ["get", "admin_level"], 1],
      paint: {
        "line-color": "#15120E",
        "line-width": 0.3,
        "line-opacity": 0.25,
      },
    },
  ],
  // No text labels anywhere on the map — per CLAUDE.md
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  sprite: "mapbox://sprites/mapbox/dark-v11",
};

function createPulseElement(
  color: string,
  size: number,
  isHighActivity: boolean
): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.position = "relative";

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

  if (isHighActivity) {
    // Pulse ring 1
    const ring1 = document.createElement("div");
    ring1.style.width = `${size * 2.5}px`;
    ring1.style.height = `${size * 2.5}px`;
    ring1.style.borderRadius = "50%";
    ring1.style.backgroundColor = `${color}18`;
    ring1.style.position = "absolute";
    ring1.style.top = `${-(size * 0.75)}px`;
    ring1.style.left = `${-(size * 0.75)}px`;
    ring1.style.animation = "prism-pulse 3s ease-in-out infinite";
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
    ring2.style.animation = "prism-pulse 3s ease-in-out infinite 0.5s";
    ring2.style.zIndex = "1";
    el.appendChild(ring2);
  }

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
  label.style.color = "#F2EDE5";
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
}: MapPlaceholderProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

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

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: PRISM_MAP_STYLE,
      center: [-98, 38], // Center US
      zoom: 3.5,
      minZoom: 2,
      maxZoom: 12,
      attributionControl: false,
      logoPosition: "bottom-right",
      fadeDuration: 300,
      antialias: true,
    });

    // Disable labels
    map.on("load", () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
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

    // Community pins
    communities.forEach((c, i) => {
      const isHighlighted =
        !highlightedCommunityIds ||
        highlightedCommunityIds.includes(c.id);
      const isHighActivity = isHighlighted && i % 2 === 0;
      const pinSize = isHighlighted ? 10 : 6;
      const color = COMMUNITY_COLORS[c.community_type as CommunityType];

      const el = createPulseElement(color, pinSize, isHighActivity);
      if (!isHighlighted) {
        el.style.opacity = "0.2";
      }

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([c.longitude as number, c.latitude as number])
        .addTo(mapRef.current!);

      // Popup on hover
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12,
        className: "prism-popup",
      }).setHTML(
        `<div style="background:#0D0B08;border:1px solid #2A251E;border-radius:6px;padding:4px 8px;font-size:10px;color:#F2EDE5;font-family:'DM Sans',sans-serif;">${c.name}</div>`
      );

      el.addEventListener("mouseenter", () => {
        marker.setPopup(popup);
        popup.addTo(mapRef.current!);
      });
      el.addEventListener("mouseleave", () => {
        popup.remove();
      });

      markersRef.current.push(marker);
    });

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

    // User post pins
    const homeCommunity = showPersonalPinCommunity ?? null;
    userPosts.forEach((post) => {
      const lat = post.latitude ?? homeCommunity?.latitude;
      const lng = post.longitude ?? homeCommunity?.longitude;
      if (lat == null || lng == null) return;

      const el = document.createElement("div");
      el.style.width = "6px";
      el.style.height = "6px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#4A9EFF";
      el.style.boxShadow = "0 1px 4px rgba(74,158,255,0.5)";

      if (post.post_type === "story") {
        el.style.border = "2px solid transparent";
        el.style.backgroundImage =
          "linear-gradient(#4A9EFF, #4A9EFF), linear-gradient(135deg, #C17F4E, #D4955E)";
        el.style.backgroundOrigin = "border-box";
        el.style.backgroundClip = "padding-box, border-box";
      }

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
      el.style.backgroundColor = "#4A9EFF";
      el.style.boxShadow = "0 1px 4px rgba(74,158,255,0.5)";

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 10,
        className: "prism-popup",
      }).setHTML(
        `<div style="background:#0D0B08;border:1px solid #2A251E;border-radius:6px;padding:4px 8px;font-size:10px;color:#F2EDE5;font-family:'DM Sans',sans-serif;">You (${homeCommunity.region})</div>`
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
    communitiesProp,
    highlightedCommunityIds,
    ghostMode,
    showPersonalPin,
    showPersonalPinCommunity,
    userPosts,
    heatPoints,
    onHeatTap,
    clearMarkers,
  ]);

  // Fallback if no Mapbox token
  if (!MAPBOX_TOKEN) {
    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-prism-map-ocean border border-prism-border shadow-inner flex items-center justify-center">
        <p className="text-sm text-prism-text-dim">
          Add NEXT_PUBLIC_MAPBOX_TOKEN for live map
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-prism-border shadow-inner">
      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Map status */}

      {/* Privacy status */}
      <div className="absolute top-11 right-3 bg-prism-bg-primary/80 backdrop-blur-sm px-2.5 py-1 rounded-full z-10 border border-prism-border/60">
        <span
          className={`text-[10px] font-medium ${
            ghostMode ? "text-prism-accent-active" : "text-prism-text-secondary"
          }`}
        >
          {ghostMode ? "Ghost mode on" : "Visible mode"}
        </span>
      </div>

      {/* Community count */}
      <div className="absolute top-3 left-3 bg-prism-bg-primary/80 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
        <span className="text-[10px] font-mono text-prism-text-secondary">
          {communitiesProp.filter((c) => c.latitude != null).length} communities
          active
        </span>
      </div>

      {/* Loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-prism-map-ocean flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-full max-w-[200px] h-2 bg-prism-bg-elevated rounded-full overflow-hidden">
              <div className="h-full bg-prism-accent-active/30 rounded-full animate-shimmer" style={{ width: "60%" }} />
            </div>
            <span className="text-[10px] text-prism-text-dim">Loading map</span>
          </div>
        </div>
      )}
    </div>
  );
}
