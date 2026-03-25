"use client";

import { useEffect, useRef, useState } from "react";
import type { Community } from "@shared/types";
import { COMMUNITY_COLORS } from "@/lib/constants";

interface PrismMapProps {
  communities: Community[];
}

export function PrismMap({ communities }: PrismMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || token.length < 10) {
      setMapError("Mapbox token not configured — set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local");
      return;
    }

    let map: mapboxgl.Map;

    async function initMap() {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;

        mapboxgl.accessToken = token!;

        map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: {
            version: 8,
            sources: {
              "carto-dark": {
                type: "raster",
                tiles: [
                  "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
                  "https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
                ],
                tileSize: 256,
              },
            },
            layers: [
              {
                id: "background",
                type: "background",
                paint: { "background-color": "#0A0908" },
              },
              {
                id: "carto-tiles",
                type: "raster",
                source: "carto-dark",
                paint: { "raster-opacity": 0.6, "raster-saturation": -0.8 },
              },
            ],
          },
          center: [-95.7, 39.8],
          zoom: 3.5,
          attributionControl: false,
        });

        map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

        map.on("load", () => {
          mapRef.current = map;
          setMapLoaded(true);

          for (const community of communities) {
            if (community.latitude == null || community.longitude == null) continue;
            const color = COMMUNITY_COLORS[community.community_type] ?? "#666";

            // Glowing dot — 10px, no border, per spec
            const el = document.createElement("div");
            el.style.width = "10px";
            el.style.height = "10px";
            el.style.borderRadius = "50%";
            el.style.backgroundColor = color;
            el.style.boxShadow = `0 0 12px ${color}80, 0 0 24px ${color}40`;
            el.style.cursor = "pointer";
            el.style.position = "relative";

            // Pulse ring 1 (outer)
            const pulseOuter = document.createElement("div");
            pulseOuter.style.position = "absolute";
            pulseOuter.style.inset = "-10px";
            pulseOuter.style.borderRadius = "50%";
            pulseOuter.style.border = `1.5px solid ${color}`;
            pulseOuter.style.opacity = "0.3";
            pulseOuter.style.animation = "prism-pulse1 2s cubic-bezier(0, 0, 0.2, 1) infinite";
            el.appendChild(pulseOuter);

            // Pulse ring 2 (inner)
            const pulseInner = document.createElement("div");
            pulseInner.style.position = "absolute";
            pulseInner.style.inset = "-6px";
            pulseInner.style.borderRadius = "50%";
            pulseInner.style.border = `1px solid ${color}`;
            pulseInner.style.opacity = "0.2";
            pulseInner.style.animation = "prism-pulse2 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.4s";
            el.appendChild(pulseInner);

            const popup = new mapboxgl.Popup({ offset: 15, closeButton: false })
              .setHTML(
                `<div style="padding:6px 10px;font-size:12px;color:#F2EDE5;background:#15120E;border-radius:8px;border:1px solid #2A251E;">
                  <strong>${community.name}</strong><br/>
                  <span style="opacity:0.6;color:#B8A88E">${community.region}</span>
                </div>`
              );

            new mapboxgl.Marker({ element: el })
              .setLngLat([community.longitude, community.latitude])
              .setPopup(popup)
              .addTo(map);
          }
        });

        map.on("error", (e) => {
          const errObj = e.error as unknown as Record<string, unknown> | undefined;
          if (errObj?.status === 401 || errObj?.status === 403) {
            setMapError("Invalid Mapbox token — check NEXT_PUBLIC_MAPBOX_TOKEN");
          }
        });
      } catch (err) {
        setMapError(`Map initialization failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    initMap();

    return () => {
      map?.remove();
      mapRef.current = null;
    };
  }, [communities]);

  if (mapError) {
    return (
      <div className="absolute inset-0 bg-prism-bg-primary flex items-center justify-center rounded-xl">
        <div className="text-center max-w-md px-4">
          <div className="w-12 h-12 rounded-full bg-prism-accent-active/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-prism-accent-active text-xl">!</span>
          </div>
          <p className="text-sm text-prism-text-secondary">{mapError}</p>
          <p className="text-xs text-prism-text-dim mt-2">
            The map placeholder will show community pins without Mapbox.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @keyframes prism-pulse1 {
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes prism-pulse2 {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0 rounded-xl overflow-hidden" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-prism-bg-primary rounded-xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-full max-w-[200px] h-2 bg-prism-bg-elevated rounded-full overflow-hidden">
              <div className="h-full bg-prism-accent-active/30 rounded-full animate-shimmer" style={{ width: "60%" }} />
            </div>
            <span className="text-xs text-prism-text-dim">Loading map</span>
          </div>
        </div>
      )}
    </>
  );
}
