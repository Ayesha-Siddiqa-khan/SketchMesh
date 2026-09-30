"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { PostItem } from "@/types/canvas";
import {
  Flame,
  Clock,
  GitFork,
  Eye,
  Heart,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  Plus
} from "lucide-react";

export default function FeedPage() {
  const [filter, setFilter] = useState<"trending" | "recent" | "remixed">("trending");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchFeed = async (currentFilter: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?filter=${currentFilter}&limit=16`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed(filter);
  }, [filter]);

  const handleFilterChange = (newFilter: "trending" | "recent" | "remixed") => {
    startTransition(() => {
      setFilter(newFilter);
    });
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 glass-panel border border-white/10 shadow-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-cyan-950/30">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Social Vector Canvas & Ideation
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Connect Ideas. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-teal-300">
              Map Thoughts. Build Together.
            </span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Express complex architecture, cloud microservices, and creative thoughts through dual-pane narrative writing paired with interactive 60fps vector sketches. Discover, pin feedback, and remix any board with automatic lineage attribution.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 hover:opacity-95 transition"
            >
              <Plus className="w-4 h-4" />
              Launch Studio Canvas
            </Link>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -top-20 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Discovery Filters Navigation */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => handleFilterChange("trending")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              filter === "trending"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            Trending
          </button>
          <button
            onClick={() => handleFilterChange("recent")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              filter === "recent"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            Most Recent
          </button>
          <button
            onClick={() => handleFilterChange("remixed")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              filter === "remixed"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <GitFork className="w-4 h-4 text-fuchsia-400" />
            Most Remixed
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          {posts.length} {posts.length === 1 ? "sketch" : "sketches"} mapped
        </span>
      </div>

      {/* Masonry Feed Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-slate-900/50 border border-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24 glass-panel rounded-3xl border border-white/10 space-y-4">
          <p className="text-slate-400 text-sm">No sketch boards found.</p>
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Create the First Canvas
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="group relative flex flex-col rounded-2xl glass-panel border border-white/10 overflow-hidden hover:border-indigo-500/50 transition duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 transform hover:-translate-y-1"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                <img
                  src={post.thumbnailUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                {/* Upstream Lineage Badge */}
                {post.forkedFrom && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 text-[11px] text-fuchsia-300 font-medium">
                    <GitFork className="w-3 h-3 text-fuchsia-400" />
                    Remixed from @{post.forkedFrom.author?.username || "creator"}
                  </div>
                )}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-mono bg-slate-950/75 backdrop-blur-md px-2 py-0.5 rounded-md text-slate-300">
                    <Eye className="w-3 h-3" /> {post.viewsCount}
                  </span>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                        {post.author?.username?.[0] || "U"}
                      </div>
                      <span className="text-xs font-medium text-slate-300">
                        @{post.author?.username || "architect"}
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                  </div>

                  <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition line-clamp-1">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Card Footer Metrics */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 hover:text-rose-400 transition">
                      <Heart className="w-3.5 h-3.5 text-rose-500/80" />
                      {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1 hover:text-cyan-400 transition">
                      <GitFork className="w-3.5 h-3.5 text-cyan-500/80" />
                      {post._count?.remixes || 0}
                    </span>
                    <span className="flex items-center gap-1 hover:text-indigo-400 transition">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400/80" />
                      {post._count?.comments || 0}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
