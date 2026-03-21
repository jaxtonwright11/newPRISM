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
        // CSS imported via link tag below instead of dynamic import

        mapboxgl.accessToken = token!;

        map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/dark-v11",
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

            const el = document.createElement("div");
            el.style.width = "16px";
            el.style.height = "16px";
            el.style.borderRadius = "50%";
            el.style.backgroundColor = color;
            el.style.boxShadow = `0 0 20px ${color}80, 0 0 40px ${color}40`;
            el.style.cursor = "pointer";
            el.style.border = `2px solid ${color}`;

            const pulseOuter = document.createElement("div");
            pulseOuter.style.position = "absolute";
            pulseOuter.style.inset = "-8px";
            pulseOuter.style.borderRadius = "50%";
            pulseOuter.style.backgroundColor = color;
            pulseOuter.style.opacity = "0.2";
            pulseOuter.style.animation = "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite";
            el.appendChild(pulseOuter);

            const popup = new mapboxgl.Popup({ offset: 15, closeButton: false })
              .setHTML(
                `<div style="padding:4px 8px;font-size:12px;color:#fff;background:#1a1a2e;border-radius:6px;">
                  <strong>${community.name}</strong><br/>
                  <span style="opacity:0.7">${community.region}</span>
                </div>`
              );

            new mapboxgl.Marker({ element: el })
              .setLngLat([community.longitude, community.latitude])
              .setPopup(popup)
              .addTo(map);
          }
        });

        map.on("error", (e) => {
          console.error("Mapbox error:", e);
          const errObj = e.error as unknown as Record<string, unknown> | undefined;
          if (errObj?.status === 401 || errObj?.status === 403) {
            setMapError("Invalid Mapbox token — check NEXT_PUBLIC_MAPBOX_TOKEN");
          }
        });
      } catch (err) {
        console.error("Failed to initialize Mapbox:", err);
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
      <div className="absolute inset-0 bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-amber-400 text-xl">!</span>
          </div>
          <p className="text-sm text-muted-foreground">{mapError}</p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            The map placeholder will show community pins without Mapbox.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @keyframes ping {
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-[#0a0a1a] flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            Loading map...
          </div>
        </div>
      )}
    </>
  );
}
