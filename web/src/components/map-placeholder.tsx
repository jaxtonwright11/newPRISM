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
  isAuthenticated?: boolean;
  hideOverlays?: boolean;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

// PRISM dark map style — custom dark with visible geography
const PRISM_MAP_STYLE: mapboxgl.StyleSpecification = {
  version: 8,
  name: "PRISM Dark",
  sources: {
    "mapbox-streets": {
      type: "vector",
      url: "mapbox://mapbox.mapbox-streets-v8",
    },
  },
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  sprite: "mapbox://sprites/mapbox/dark-v11",
  layers: [
    // Background = land color
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#1E2128" },
    },
    // Landuse — parks, forests, etc. Subtle but adds geographic character
    {
      id: "landuse-park",
      type: "fill",
      source: "mapbox-streets",
      "source-layer": "landuse",
      filter: ["in", ["get", "class"], ["literal", ["park", "cemetery", "glacier", "pitch", "sand"]]],
      paint: {
        "fill-color": "#1A1F25",
        "fill-opacity": 0.6,
      },
    },
    // Water — clearly darker than land
    {
      id: "water",
      type: "fill",
      source: "mapbox-streets",
      "source-layer": "water",
      paint: { "fill-color": "#0A0D11" },
    },
    // Waterway lines (rivers, streams)
    {
      id: "waterway",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "waterway",
      paint: {
        "line-color": "#0A0D11",
        "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.5, 12, 2],
        "line-opacity": 0.6,
      },
    },
    // Coastline
    {
      id: "coastline",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "water",
      paint: {
        "line-color": "#333842",
        "line-width": 0.8,
        "line-opacity": 0.5,
      },
    },
    // Buildings — visible at higher zoom levels
    {
      id: "building",
      type: "fill",
      source: "mapbox-streets",
      "source-layer": "building",
      minzoom: 12,
      paint: {
        "fill-color": "#1A1D22",
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0, 14, 0.5],
      },
    },
    // Roads — tunnel casing
    {
      id: "tunnel-street",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["==", ["get", "structure"], "tunnel"], ["in", ["get", "class"], ["literal", ["street", "street_limited", "primary_link", "secondary_link", "tertiary_link"]]]],
      paint: {
        "line-color": "#1A1D22",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 18, 6],
        "line-dasharray": [3, 3],
        "line-opacity": 0.3,
      },
    },
    // Roads — minor (service, track)
    {
      id: "road-minor",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["!=", ["get", "structure"], "tunnel"], ["in", ["get", "class"], ["literal", ["service", "track"]]]],
      paint: {
        "line-color": "#252930",
        "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.5, 18, 3],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0, 15, 0.4],
      },
    },
    // Roads — street level
    {
      id: "road-street",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["!=", ["get", "structure"], "tunnel"], ["in", ["get", "class"], ["literal", ["street", "street_limited"]]]],
      paint: {
        "line-color": "#282D34",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 14, 2, 18, 8],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0, 12, 0.5],
      },
    },
    // Roads — tertiary
    {
      id: "road-tertiary",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["!=", ["get", "structure"], "tunnel"], ["==", ["get", "class"], "tertiary"]],
      paint: {
        "line-color": "#2A2F37",
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 14, 3, 18, 10],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0, 10, 0.4],
      },
    },
    // Roads — secondary
    {
      id: "road-secondary",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["!=", ["get", "structure"], "tunnel"], ["==", ["get", "class"], "secondary"]],
      paint: {
        "line-color": "#2D323A",
        "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.5, 12, 2, 18, 12],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0, 8, 0.5],
      },
    },
    // Roads — primary
    {
      id: "road-primary",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["!=", ["get", "structure"], "tunnel"], ["==", ["get", "class"], "primary"]],
      paint: {
        "line-color": "#313740",
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 10, 2, 18, 14],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 7, 0.5],
      },
    },
    // Roads — motorway/trunk
    {
      id: "road-motorway",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["!=", ["get", "structure"], "tunnel"], ["in", ["get", "class"], ["literal", ["motorway", "trunk"]]]],
      paint: {
        "line-color": "#363C46",
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 8, 1.5, 14, 5, 18, 16],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0, 5, 0.6],
      },
    },
    // Bridges — slight glow effect on major roads
    {
      id: "bridge-major",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "road",
      filter: ["all", ["==", ["get", "structure"], "bridge"], ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary"]]]],
      paint: {
        "line-color": "#3A4050",
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1, 14, 4, 18, 14],
        "line-opacity": 0.6,
      },
    },
    // Admin boundaries — country borders
    {
      id: "admin-0-boundary",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "admin",
      filter: ["==", ["get", "admin_level"], 0],
      paint: {
        "line-color": "#3D4350",
        "line-width": 1.2,
        "line-opacity": 0.7,
      },
    },
    // Admin boundaries — state/province
    {
      id: "admin-1-boundary",
      type: "line",
      source: "mapbox-streets",
      "source-layer": "admin",
      filter: ["==", ["get", "admin_level"], 1],
      paint: {
        "line-color": "#2D3340",
        "line-width": 0.6,
        "line-opacity": 0.4,
        "line-dasharray": [3, 2],
      },
    },
    // Place labels — country names (large)
    {
      id: "place-country",
      type: "symbol",
      source: "mapbox-streets",
      "source-layer": "place_label",
      filter: ["==", ["get", "class"], "country"],
      layout: {
        "text-field": ["get", "name_en"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 1, 10, 6, 14],
        "text-transform": "uppercase",
        "text-letter-spacing": 0.15,
        "text-max-width": 8,
      },
      paint: {
        "text-color": "#4A5060",
        "text-halo-color": "#0F1114",
        "text-halo-width": 1.5,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 1, 0.6, 8, 0],
      },
    },
    // Place labels — state/province names
    {
      id: "place-state",
      type: "symbol",
      source: "mapbox-streets",
      "source-layer": "place_label",
      filter: ["==", ["get", "class"], "state"],
      layout: {
        "text-field": ["get", "name_en"],
        "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 3, 9, 7, 12],
        "text-transform": "uppercase",
        "text-letter-spacing": 0.12,
        "text-max-width": 7,
      },
      paint: {
        "text-color": "#3D4350",
        "text-halo-color": "#0F1114",
        "text-halo-width": 1,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0, 4, 0.5, 8, 0],
      },
    },
    // Place labels — city names
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
        "text-color": "#5C6370",
        "text-halo-color": "#0F1114",
        "text-halo-width": 1.5,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0, 6, 0.7, 14, 0.9],
      },
    },
    // Place labels — neighborhoods/suburbs (high zoom)
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
        "text-color": "#444B58",
        "text-halo-color": "#0F1114",
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
}: MapPlaceholderProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const emptyPopupRef = useRef<mapboxgl.Popup | null>(null);
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

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    map.on("load", () => {
      setMapLoaded(true);
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

    // Click on empty area → show "no perspectives here yet" prompt
    map.on("click", (e) => {
      // Remove any existing empty-area popup
      if (emptyPopupRef.current) {
        emptyPopupRef.current.remove();
        emptyPopupRef.current = null;
      }

      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 0,
        className: "prism-popup",
        maxWidth: "240px",
      }).setLngLat(e.lngLat).setHTML(
        `<div style="background:#181B20;border:1px solid #262A31;border-radius:10px;padding:12px 14px;font-family:'DM Sans',sans-serif;">
          <p style="font-size:13px;color:#EDEDEF;margin:0 0 6px;">No perspectives here yet.</p>
          <p style="font-size:11px;color:#9CA3AF;margin:0 0 8px;">Be the first to share what your community is experiencing.</p>
          <a href="/create" style="display:inline-block;font-size:11px;color:#D4956B;text-decoration:none;font-weight:500;">Share a perspective →</a>
        </div>`
      ).addTo(map);

      emptyPopupRef.current = popup;
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
          const color = COMMUNITY_COLORS[c.community_type as CommunityType];
          const el = createPulseElement(color, isHighlighted ? 10 : 6, (c as unknown as Record<string, unknown>).activity_level as string | undefined);
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
        const color = COMMUNITY_COLORS[c.community_type as CommunityType];
        const el = createPulseElement(color, pinSize, (c as unknown as Record<string, unknown>).activity_level as string | undefined);
        if (!isHighlighted) el.style.opacity = "0.2";
        addCommunityMarker(c, el);
      });
    }

    function addCommunityMarker(c: Community, el: HTMLDivElement) {
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([c.longitude as number, c.latitude as number])
        .addTo(mapRef.current!);

      const popup = new mapboxgl.Popup({
        closeButton: false, closeOnClick: false, offset: 12, className: "prism-popup",
      }).setHTML(
        `<div style="background:#0F1114;border:1px solid #262A31;border-radius:6px;padding:4px 8px;font-size:10px;color:#EDEDEF;font-family:'DM Sans',sans-serif;">${c.name}</div>`
      );

      el.style.cursor = "pointer";
      el.addEventListener("mouseenter", () => { marker.setPopup(popup); popup.addTo(mapRef.current!); });
      el.addEventListener("mouseleave", () => { popup.remove(); });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (emptyPopupRef.current) { emptyPopupRef.current.remove(); emptyPopupRef.current = null; }
        window.location.href = `/community/${c.id}`;
      });

      markersRef.current.push(marker);
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
        // Remove the empty-area popup if visible
        if (emptyPopupRef.current) {
          emptyPopupRef.current.remove();
          emptyPopupRef.current = null;
        }
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
      <div ref={mapContainer} className="absolute inset-0" />

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
