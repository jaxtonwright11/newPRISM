"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { COMMUNITY_COLORS } from "@/lib/constants";
import { CommentThread } from "@/components/comment-thread";
import { ShareButton } from "@/components/share-button";
import { ReportButton } from "@/components/report-button";
import type { CommunityType } from "@shared/types";

interface PostData {
  id: string;
  content: string;
  post_type: string;
  radius_miles: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  expires_at: string | null;
  user_id: string;
  user: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    ghost_mode: boolean;
  } | null;
  community: {
    id: string;
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
  } | null;
}

export default function PostPage() {
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeDelta, setLikeDelta] = useState(0);
  const { session } = useAuth();

  // Load existing like state for authenticated users
  useEffect(() => {
    if (!session?.access_token) return;
    fetch(`/api/posts/${id}/like`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((json) => { if (json.data) setLiked(true); })
      .catch(() => {});
  }, [id, session?.access_token]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const json = await res.json();
        setPost(json.data ?? null);
        if (!json.data) setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleLike = async () => {
    if (!session?.access_token) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeDelta((d) => d + (wasLiked ? -1 : 1));
    try {
      const res = await fetch(`/api/posts/${id}/like`, {
        method: wasLiked ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error();
    } catch {
      setLiked(wasLiked);
      setLikeDelta((d) => d + (wasLiked ? 1 : -1));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-prism-bg-base p-6">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-prism-bg-elevated animate-shimmer" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-prism-bg-elevated rounded-full w-1/3 animate-shimmer" />
              <div className="h-3 bg-prism-bg-elevated rounded-full w-1/4 animate-shimmer" />
            </div>
          </div>
          <div className="h-24 bg-prism-bg-elevated rounded-xl animate-shimmer" />
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-prism-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-prism-text-dim text-sm">Post not found</p>
          <Link href="/" className="text-prism-accent-primary text-sm hover:underline mt-2 block">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const displayName = post.user?.display_name ?? post.user?.username ?? "Anonymous";
  const communityColor = post.community
    ? (post.community.color_hex || COMMUNITY_COLORS[post.community.community_type])
    : "#3B82F6";
  const isStory = post.post_type === "story";

  return (
    <div className="min-h-screen bg-prism-bg-base">
      <header className="border-b border-prism-border bg-prism-bg-surface/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-prism-text-dim hover:text-prism-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-base font-semibold text-prism-text-primary">
            {isStory ? "Story" : "Post"}
          </h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-prism-bg-surface rounded-2xl border border-prism-border p-5">
          {/* Author header */}
          <div className="flex items-center gap-3 mb-4">
            <Link
              href={`/profile/${post.user_id}`}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: communityColor + "20", color: communityColor }}
            >
              {displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/profile/${post.user_id}`}
                  className="text-sm font-medium text-prism-text-primary hover:text-prism-accent-primary transition-colors"
                >
                  {displayName}
                </Link>
                {post.community && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-0.5"
                    style={{ backgroundColor: communityColor + "12", color: communityColor }}
                  >
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: communityColor }} />
                    {post.community.name.split(" ")[0]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {post.community && (
                  <span className="text-[11px] text-prism-text-dim">{post.community.region}</span>
                )}
                <span className="text-prism-text-dim">·</span>
                <span className="text-[11px] text-prism-text-dim">
                  {getRelativeTime(post.created_at)}
                </span>
                {isStory && (
                  <>
                    <span className="text-prism-text-dim">·</span>
                    <span className="text-[10px] text-prism-text-dim font-mono">Story</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <p className="text-base text-prism-text-primary leading-relaxed mb-4">
            {post.content}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] text-prism-text-dim font-mono px-1.5 py-0.5 rounded bg-prism-bg-elevated">
              {post.radius_miles} mi
            </span>
            {isStory && post.expires_at && (
              <span className="text-[10px] text-prism-text-dim font-mono px-1.5 py-0.5 rounded bg-prism-bg-elevated">
                {getExpiryText(post.expires_at)}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-prism-border/50">
            <div className="flex items-center gap-1">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-all ${
                  liked
                    ? "bg-prism-accent-primary/15 text-prism-accent-primary"
                    : "text-prism-text-dim hover:text-prism-text-secondary hover:bg-prism-bg-elevated"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                <span className="font-mono text-[11px]">{post.like_count + likeDelta}</span>
              </button>
              <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-prism-text-dim">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                </svg>
                <span className="font-mono text-[11px]">{post.comment_count}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShareButton perspectiveId={post.id} quote={post.content.slice(0, 100)} />
              <ReportButton contentType="post" contentId={post.id} />
            </div>
          </div>

          {/* Comments */}
          <CommentThread postId={post.id} />
        </div>

        {/* Signup CTA for unauthenticated users */}
        {!session && (
          <div className="mt-4 p-4 rounded-xl bg-prism-bg-surface border border-prism-border text-center">
            <p className="text-sm text-prism-text-secondary mb-3">
              See how communities across the world experience the same events differently.
            </p>
            <Link
              href="/signup"
              className="inline-block px-6 py-2.5 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:bg-prism-accent-glow transition-colors"
            >
              Join PRISM
            </Link>
          </div>
        )}
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
