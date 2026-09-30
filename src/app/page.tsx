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
  const [, startTransition] = useTransition();

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
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-10 space-y-10">
      {/* Hero Showcase with Obsidian & Champagne Gold Palette */}
      <div className="relative overflow-hidden rounded-[32px] p-8 md:p-14 gold-panel">
        {/* Subtle warm amber/champagne atmospheric ambient glows */}
        <div className="absolute -right-10 -top-20 w-[420px] h-[420px] bg-gradient-to-br from-[#d4af37]/15 to-[#aa8022]/5 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute right-60 -bottom-20 w-[360px] h-[360px] bg-gradient-to-tr from-[#8a7350]/15 to-transparent rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/25 text-[#f5deb3] text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            Social Vector Canvas & Narrative Studio
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-[#faf7f2] tracking-tight leading-[1.12]">
            Connect Ideas. <br />
            <span className="gold-gradient-text font-serif italic">
              Map Thoughts. Build Together.
            </span>
          </h1>

          <p className="text-[#a19f99] text-sm md:text-base leading-relaxed font-normal">
            Express complex cloud microservices, software systems, and architectural reasoning through dual-pane narrative writing paired with interactive 60fps vector sketches. Discover, pin coordinate feedback, and remix any board with lineage attribution.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#e5c07b] to-[#aa8022] hover:opacity-95 text-[#0c0b0a] font-bold text-sm shadow-xl shadow-[#d4af37]/20 hover:shadow-[#d4af37]/35 transition duration-300 transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 text-[#0c0b0a]" />
              Launch Studio Canvas
            </Link>
          </div>
        </div>
      </div>

      {/* Discovery Filters Navigation */}
      <div className="flex items-center justify-between border-b border-[#d4af37]/15 pb-4">
        <div className="flex items-center gap-2 bg-[#0c0b0a]/90 p-1.5 rounded-2xl border border-[#d4af37]/15 backdrop-blur-md">
          <button
            onClick={() => handleFilterChange("trending")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              filter === "trending"
                ? "bg-[#d4af37] text-[#0c0b0a] shadow-lg shadow-[#d4af37]/20 font-bold"
                : "text-[#a19f99] hover:text-[#faf7f2]"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Trending
          </button>
          <button
            onClick={() => handleFilterChange("recent")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              filter === "recent"
                ? "bg-[#d4af37] text-[#0c0b0a] shadow-lg shadow-[#d4af37]/20 font-bold"
                : "text-[#a19f99] hover:text-[#faf7f2]"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Most Recent
          </button>
          <button
            onClick={() => handleFilterChange("remixed")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              filter === "remixed"
                ? "bg-[#d4af37] text-[#0c0b0a] shadow-lg shadow-[#d4af37]/20 font-bold"
                : "text-[#a19f99] hover:text-[#faf7f2]"
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-amber-600" />
            Most Remixed
          </button>
        </div>

        <span className="text-xs text-[#a19f99] font-mono hidden sm:inline">
          {posts.length} {posts.length === 1 ? "sketch" : "sketches"} mapped
        </span>
      </div>

      {/* Masonry Feed Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 rounded-[24px] bg-[#121215]/60 border border-[#d4af37]/10 animate-pulse"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24 gold-panel rounded-3xl border border-[#d4af37]/20 space-y-4">
          <p className="text-[#a19f99] text-sm">No sketch boards found.</p>
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d4af37] text-[#0c0b0a] text-xs font-bold"
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
              className="group relative flex flex-col rounded-[24px] gold-panel overflow-hidden transition-all duration-300 transform hover:-translate-y-1.5"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#060607]">
                <img
                  src={post.thumbnailUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100"
                />
                {/* Upstream Lineage Badge */}
                {post.forkedFrom && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0c0b0a]/90 backdrop-blur-md border border-[#d4af37]/35 text-[11px] text-[#f5deb3] font-semibold shadow-lg">
                    <GitFork className="w-3 h-3 text-[#d4af37]" />
                    Remixed from @{post.forkedFrom.author?.username || "creator"}
                  </div>
                )}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-mono bg-[#0c0b0a]/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-[#f5deb3] border border-[#d4af37]/20">
                    <Eye className="w-3 h-3 text-[#d4af37]" /> {post.viewsCount}
                  </span>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#d4af37] via-[#f5deb3] to-[#8a7350] flex items-center justify-center text-[10px] font-bold text-[#0c0b0a] uppercase shadow-md">
                        {post.author?.username?.[0] || "U"}
                      </div>
                      <span className="text-xs font-semibold text-[#faf7f2]">
                        @{post.author?.username || "architect"}
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#8a7350] group-hover:text-[#d4af37] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                  </div>

                  <h3 className="font-bold text-base text-[#faf7f2] group-hover:text-[#f5deb3] transition line-clamp-1">
                    {post.title}
                  </h3>
                  <p className="text-xs text-[#a19f99] line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Card Footer Metrics */}
                <div className="pt-3 border-t border-[#d4af37]/15 flex items-center justify-between text-xs text-[#a19f99]">
                  <div className="flex items-center gap-3 font-medium">
                    <span className="flex items-center gap-1 hover:text-amber-300 transition">
                      <Heart className="w-3.5 h-3.5 text-[#d4af37]/90" />
                      {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1 hover:text-amber-300 transition">
                      <GitFork className="w-3.5 h-3.5 text-[#d4af37]/90" />
                      {post._count?.remixes || 0}
                    </span>
                    <span className="flex items-center gap-1 hover:text-amber-300 transition">
                      <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]/90" />
                      {post._count?.comments || 0}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8a7350] font-mono">
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
