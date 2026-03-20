"use client";

import { useState } from "react";
import type { Post } from "@shared/types";
import { COMMUNITY_COLORS } from "@/lib/constants";

interface PersonalPostCardProps {
  post: Post;
  animationDelay?: number;
}

export function PersonalPostCard({
  post,
  animationDelay = 0,
}: PersonalPostCardProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const communityColor = post.community
    ? COMMUNITY_COLORS[post.community.community_type]
    : "#4A9EFF";

  const displayName =
    post.user?.display_name ?? post.user?.username ?? "Anonymous";
  const communityName = post.community?.name ?? "Unknown Community";
  const region = post.community?.region ?? "";

  const timeAgo = getRelativeTime(post.created_at);

  const isStory = post.post_type === "story";

  return (
    <div
      className="rounded-[10px] border border-prism-border bg-prism-bg-secondary p-4 opacity-0 animate-fade-in transition-colors duration-200 hover:bg-prism-bg-elevated/50"
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: "forwards",
      }}
    >
      {/* User header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="relative">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isStory ? "ring-2 ring-offset-1 ring-offset-prism-bg-secondary" : ""
            }`}
            style={{
              backgroundColor: communityColor + "20",
              color: communityColor,
              ...(isStory ? { ringColor: communityColor } : {}),
            }}
          >
            {displayName
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          {isStory && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-prism-bg-secondary flex items-center justify-center">
              <svg
                className="w-2.5 h-2.5 text-prism-text-dim"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-prism-text-primary truncate">
              {displayName}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-0.5"
              style={{
                backgroundColor: communityColor + "12",
                color: communityColor,
              }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: communityColor }}
              />
              {communityName.split(" ")[0]}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-prism-text-dim">{region}</span>
            <span className="text-prism-text-dim">·</span>
            <span className="text-[11px] text-prism-text-dim">{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* Post content */}
      <p className="text-sm text-prism-text-primary leading-relaxed mb-3">
        {post.content}
      </p>

      {/* Radius indicator */}
      <div className="mb-3">
        <span className="text-[10px] text-prism-text-dim font-mono px-1.5 py-0.5 rounded bg-prism-bg-elevated">
          {post.radius_miles} mi
        </span>
        {isStory && post.expires_at && (
          <span className="text-[10px] text-prism-text-dim font-mono px-1.5 py-0.5 rounded bg-prism-bg-elevated ml-1.5">
            ⏱ {getExpiryText(post.expires_at)}
          </span>
        )}
      </div>

      {/* Footer: like + comment + share + bookmark */}
      <div className="flex items-center justify-between pt-2 border-t border-prism-border/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-150 ${
              liked
                ? "bg-prism-accent-like/15 text-prism-accent-like"
                : "text-prism-text-dim hover:text-prism-text-secondary hover:bg-prism-bg-elevated"
            }`}
            aria-label={liked ? "Unlike" : "Like"}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 20 20"
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            <span className="font-mono text-[10px]">
              {post.like_count + (liked ? 1 : 0)}
            </span>
          </button>

          <button
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-prism-text-dim hover:text-prism-text-secondary hover:bg-prism-bg-elevated transition-all duration-150"
            aria-label="Comments"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
              />
            </svg>
            <span className="font-mono text-[10px]">{post.comment_count}</span>
          </button>

          <button
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-prism-text-dim hover:text-prism-text-secondary hover:bg-prism-bg-elevated transition-all duration-150"
            aria-label="Share"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
              />
            </svg>
          </button>
        </div>

        <button
          onClick={() => setBookmarked(!bookmarked)}
          className={`p-1 rounded transition-all duration-150 ${
            bookmarked
              ? "text-prism-accent-active"
              : "text-prism-text-dim hover:text-prism-text-secondary"
          }`}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 20 20"
            fill={bookmarked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "now";
}

function getExpiryText(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours}h left`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}m left`;
}
