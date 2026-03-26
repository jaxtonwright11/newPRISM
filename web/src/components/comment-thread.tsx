"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CommentThreadProps {
  postId?: string;
  perspectiveId?: string;
}

export function CommentThread({ postId, perspectiveId }: CommentThreadProps) {
  const apiPath = postId
    ? `/api/posts/${postId}/comments`
    : `/api/perspectives/${perspectiveId}/comments`;
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiPath);
        if (res.ok) {
          const { data } = await res.json();
          setComments(data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [apiPath]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.access_token) return;

    setSubmitting(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const { data } = await res.json();
        setComments((prev) => [...prev, data]);
        setNewComment("");
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }, [newComment, apiPath, session?.access_token]);

  return (
    <div className="mt-3 pt-3 border-t border-prism-border/50">
      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <div className="w-4 h-4 rounded-full bg-prism-bg-elevated animate-shimmer" />
          <div className="h-3 bg-prism-bg-elevated rounded-full w-24 animate-shimmer" />
        </div>
      ) : (
        <>
          {comments.length > 0 && (
            <div className="space-y-2.5 mb-3">
              {comments.map((comment) => {
                const name = comment.user?.display_name ?? comment.user?.username ?? "Anonymous";
                return (
                  <div key={comment.id} className="flex items-start gap-2">
                    <Link
                      href={`/profile/${comment.user_id}`}
                      className="shrink-0 w-6 h-6 rounded-full bg-prism-bg-elevated flex items-center justify-center text-[8px] font-bold text-prism-text-secondary hover:ring-1 hover:ring-prism-accent-primary/30 transition-all"
                    >
                      {name.charAt(0).toUpperCase()}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <Link
                          href={`/profile/${comment.user_id}`}
                          className="text-xs font-medium text-prism-text-primary hover:text-prism-accent-primary transition-colors"
                        >
                          {name}
                        </Link>
                        <span className="text-[10px] text-prism-text-dim">
                          {getRelativeTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-prism-text-secondary leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {comments.length === 0 && (
            <p className="text-[11px] text-prism-text-dim mb-3">
              No comments yet. Be the first to reply.
            </p>
          )}

          {session ? (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                maxLength={500}
                className="flex-1 px-3 py-1.5 rounded-lg bg-prism-bg-elevated border border-prism-border/50 text-xs text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:border-prism-accent-primary/50 transition-colors"
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-3 py-1.5 rounded-lg bg-prism-accent-primary text-white text-xs font-medium disabled:opacity-30 hover:bg-prism-accent-primary/90 transition-colors"
              >
                {submitting ? "..." : "Post"}
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="text-xs text-prism-accent-primary hover:underline"
            >
              Sign in to comment
            </Link>
          )}
        </>
      )}
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
