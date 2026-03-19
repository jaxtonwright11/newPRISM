"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Topic, TopicStatus } from "../../../shared/types";

const STATUS_COLORS: Record<TopicStatus, string> = {
  hot: "bg-red-500/20 text-red-400 border-red-500/30",
  trending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cooling: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  archived: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

interface TopicSidebarProps {
  topics: Topic[];
}

export function TopicSidebar({ topics }: TopicSidebarProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(topics[0]?.id ?? null);

  const filtered = topics.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-72 border-r border-border flex flex-col bg-card">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">
          PRISM
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Community perspectives, one map
        </p>
      </div>

      <div className="p-3">
        <Input
          placeholder="Search topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 text-sm bg-background"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Live Now
          </h3>
        </div>
        {filtered.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setSelectedId(topic.id)}
            className={`w-full text-left px-4 py-3 border-l-2 transition-colors ${
              selectedId === topic.id
                ? "border-l-primary bg-accent/50"
                : "border-l-transparent hover:bg-accent/30"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium leading-tight text-foreground">
                {topic.title}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] shrink-0 ${STATUS_COLORS[topic.status]}`}
              >
                {topic.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {topic.summary}
            </p>
            <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
              <span>{topic.perspective_count} perspectives</span>
              <span>{topic.community_count} communities</span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
