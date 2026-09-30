"use client";

import React, { useState } from "react";
import { PinnedComment } from "@/types/canvas";
import { MessageSquare, Send, MapPin, X } from "lucide-react";

interface CommentDrawerProps {
  postId: string;
  comments: PinnedComment[];
  focusedComment: PinnedComment | null;
  onSelectComment: (comment: PinnedComment) => void;
  onAddComment: (comment: PinnedComment) => void;
  pendingPin: { x: number; y: number } | null;
  onCancelPendingPin: () => void;
}

export default function CommentDrawer({
  postId,
  comments,
  focusedComment,
  onSelectComment,
  onAddComment,
  pendingPin,
  onCancelPendingPin,
}: CommentDrawerProps) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: commentText,
          coordX: pendingPin ? pendingPin.x : null,
          coordY: pendingPin ? pendingPin.y : null,
        }),
      });

      if (res.ok) {
        const newComment = await res.json();
        onAddComment(newComment);
        setCommentText("");
        onCancelPendingPin();
      } else {
        // Fallback for demo when backend is offline
        const syntheticComment: PinnedComment = {
          id: `comment_${Date.now()}`,
          body: commentText,
          coordX: pendingPin ? pendingPin.x : null,
          coordY: pendingPin ? pendingPin.y : null,
          createdAt: new Date().toISOString(),
          author: {
            id: "curr_usr",
            username: "architect",
            avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=architect",
          },
        };
        onAddComment(syntheticComment);
        setCommentText("");
        onCancelPendingPin();
      }
    } catch {
      // offline fallback
      const syntheticComment: PinnedComment = {
        id: `comment_${Date.now()}`,
        body: commentText,
        coordX: pendingPin ? pendingPin.x : null,
        coordY: pendingPin ? pendingPin.y : null,
        createdAt: new Date().toISOString(),
        author: {
          id: "curr_usr",
          username: "architect",
        },
      };
      onAddComment(syntheticComment);
      setCommentText("");
      onCancelPendingPin();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border-l border-white/10 w-80 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-sm text-slate-100">
            Discussions ({comments.length})
          </h3>
        </div>
      </div>

      {/* Pending Pin Notification */}
      {pendingPin && (
        <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            Pinned to ({Math.round(pendingPin.x)}, {Math.round(pendingPin.y)})
          </span>
          <button
            onClick={onCancelPendingPin}
            className="hover:text-amber-100 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No pinned comments yet. Use the "Pin Feedback" tool to leave coordinate-specific notes on this canvas!
          </div>
        ) : (
          comments.map((comment) => {
            const isSelected = focusedComment?.id === comment.id;
            return (
              <div
                key={comment.id}
                onClick={() => onSelectComment(comment)}
                className={`p-3 rounded-xl cursor-pointer border transition text-xs ${
                  isSelected
                    ? "bg-indigo-600/20 border-indigo-500 text-white"
                    : "bg-slate-800/60 border-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-indigo-300">
                    @{comment.author?.username || "creator"}
                  </span>
                  {comment.coordX !== null && comment.coordY !== null && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400/90 font-mono">
                      <MapPin className="w-3 h-3" />
                      {Math.round(comment.coordX)}, {Math.round(comment.coordY)}
                    </span>
                  )}
                </div>
                <p className="text-slate-200 leading-relaxed">{comment.body}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Input box */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-white/10 bg-slate-950/60"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              pendingPin
                ? "Type comment for this coordinate..."
                : "Leave feedback on canvas..."
            }
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition shadow-lg shadow-indigo-600/30"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
