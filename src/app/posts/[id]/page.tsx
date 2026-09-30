"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CanvasEditor from "@/components/CanvasEditor";
import CommentDrawer from "@/components/CommentDrawer";
import { PostItem, PinnedComment } from "@/types/canvas";
import {
  GitFork,
  Heart,
  Share2,
  ArrowLeft,
  Calendar,
  Eye,
  Check,
  Sparkles,
  BookOpen
} from "lucide-react";
import confetti from "canvas-confetti";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [post, setPost] = useState<PostItem | null>(null);
  const [comments, setComments] = useState<PinnedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [forking, setForking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  // Coordinate comments interaction state
  const [focusedComment, setFocusedComment] = useState<PinnedComment | null>(null);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data);
          setComments(data.comments || []);
        } else {
          // Fallback demo board
          setPost({
            id,
            title: "Distributed Outbox & Event Streaming Topology",
            content:
              "### Design Context\nTo guarantee exactly-once delivery across decoupled bounded contexts, this canvas details the CDC (Change Data Capture) outbox pipeline powering our asynchronous event bus.\n\n- Read models updated asynchronously\n- Postgres transactional write consistency\n- Debezium / Kafka event replay stream",
            thumbnailUrl:
              "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
            author: { id: "usr_1", username: "alex_architect" },
            forkedFrom: null,
            likesCount: 54,
            viewsCount: 680,
            createdAt: new Date().toISOString(),
            sketchData: {
              elements: [
                {
                  id: "1",
                  type: "rectangle",
                  x: 120,
                  y: 120,
                  width: 170,
                  height: 90,
                  strokeColor: "#38bdf8",
                  fillColor: "rgba(56, 189, 248, 0.12)",
                  strokeWidth: 2,
                },
                {
                  id: "2",
                  type: "text",
                  x: 140,
                  y: 165,
                  strokeColor: "#38bdf8",
                  strokeWidth: 2,
                  text: "Order Service",
                },
                {
                  id: "3",
                  type: "arrow",
                  x: 290,
                  y: 165,
                  endX: 430,
                  endY: 165,
                  strokeColor: "#818cf8",
                  strokeWidth: 2,
                },
                {
                  id: "4",
                  type: "rectangle",
                  x: 430,
                  y: 120,
                  width: 180,
                  height: 90,
                  strokeColor: "#818cf8",
                  fillColor: "rgba(129, 140, 248, 0.12)",
                  strokeWidth: 2,
                },
                {
                  id: "5",
                  type: "text",
                  x: 450,
                  y: 165,
                  strokeColor: "#818cf8",
                  strokeWidth: 2,
                  text: "Kafka Cluster",
                },
              ],
              zoom: 1,
              panX: 0,
              panY: 0,
            },
          });
          setComments([
            {
              id: "comm_1",
              coordX: 200,
              coordY: 160,
              body: "Should we add a dead-letter queue between the Order Service and broker?",
              createdAt: new Date().toISOString(),
              author: { id: "usr_2", username: "cloud_lead" },
            },
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleFork = async () => {
    setForking(true);
    try {
      const res = await fetch(`/api/posts/${id}/fork`, { method: "POST" });
      if (res.ok) {
        const forked = await res.json();
        confetti({ particleCount: 80, spread: 60 });
        router.push(`/studio?remix=${forked.id}`);
      } else {
        // Direct remix studio redirect fallback
        router.push(`/studio?remix=${id}`);
      }
    } catch {
      router.push(`/studio?remix=${id}`);
    } finally {
      setForking(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || !post) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-14 border-b border-white/10 glass-panel px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <h1 className="text-sm md:text-base font-bold text-white leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>by @{post.author?.username || "architect"}</span>
              {post.forkedFrom && (
                <span className="flex items-center gap-1 text-[11px] text-fuchsia-300">
                  <GitFork className="w-3 h-3" /> Remixed from @
                  {post.forkedFrom.author?.username}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              liked
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                : "border-white/10 text-slate-300 hover:bg-white/5"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
            {post.likesCount + (liked ? 1 : 0)}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300 hover:bg-white/5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Share"}
          </button>

          <button
            onClick={handleFork}
            disabled={forking}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            <GitFork className="w-3.5 h-3.5" />
            {forking ? "Forking..." : "Remix Board"}
          </button>
        </div>
      </div>

      {/* Main Board View: Narrative Left, Canvas Center, Comments Drawer Right */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Narrative Section */}
        <div className="w-80 border-r border-white/10 bg-slate-900/60 backdrop-blur-xl p-5 overflow-y-auto space-y-4 hidden md:block">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5 text-xs font-semibold text-slate-300">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Narrative & Context
          </div>
          <div className="prose prose-invert prose-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>

          <div className="pt-4 border-t border-white/5 space-y-2 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center justify-between">
              <span>Views</span>
              <span>{post.viewsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Remixes</span>
              <span>{post._count?.remixes || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Published</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Vector Canvas Engine */}
        <div className="flex-1 h-full relative">
          <CanvasEditor
            initialElements={post.sketchData?.elements || []}
            comments={comments}
            readOnly={false}
            focusedComment={focusedComment}
            onSelectComment={(comm) => setFocusedComment(comm)}
            onPinComment={(coords) => setPendingPin(coords)}
          />
        </div>

        {/* Pinned Comments Drawer */}
        <CommentDrawer
          postId={id}
          comments={comments}
          focusedComment={focusedComment}
          onSelectComment={(comm) => setFocusedComment(comm)}
          onAddComment={(newComm) => setComments((prev) => [newComm, ...prev])}
          pendingPin={pendingPin}
          onCancelPendingPin={() => setPendingPin(null)}
        />
      </div>
    </div>
  );
}
