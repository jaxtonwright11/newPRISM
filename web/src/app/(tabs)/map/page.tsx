"use client";

import { useState, useEffect } from "react";
import { MapPlaceholder } from "@/components/map-placeholder";
import type { Community } from "@shared/types";

export default function MapPage() {
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    fetch("/api/communities")
      .then((res) => res.json())
      .then((data) => setCommunities(data.communities ?? data ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] md:h-screen relative">
      <MapPlaceholder communities={communities} />
    </div>
  );
}
