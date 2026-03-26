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
    <div className="h-full w-full relative">
      <MapPlaceholder communities={communities} />
    </div>
  );
}
