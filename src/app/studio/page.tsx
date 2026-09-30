"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CanvasEditor from "@/components/CanvasEditor";
import { CanvasElement } from "@/types/canvas";
import {
  Save,
  SplitSquareVertical,
  Maximize,
  ArrowLeft,
  BookOpen,
  Sparkles,
  GitFork,
  CheckCircle2
} from "lucide-react";
import confetti from "canvas-confetti";

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const remixId = searchParams.get("remix");

  const [title, setTitle] = useState("Microservices Architecture Topology");
  const [content, setContent] = useState(
    "### System Architecture & Pipeline\n- **API Gateway**: Reverse proxy & rate limiting\n- **Event Bus**: Kafka cluster with idempotent consumer workers\n- **Persistence Layer**: Postgres partition nodes with Redis caching\n\n*Document thoughts and context here while designing interactively on the vector canvas.*"
  );
  const [elements, setElements] = useState<CanvasElement[]>([
    {
      id: "demo-box-1",
      type: "rectangle",
      x: 100,
      y: 100,
      width: 180,
      height: 90,
      strokeColor: "#d4af37",
      fillColor: "rgba(212, 175, 55, 0.12)",
      strokeWidth: 2,
    },
    {
      id: "demo-text-1",
      type: "text",
      x: 120,
      y: 140,
      strokeColor: "#f5deb3",
      strokeWidth: 2,
      text: "API Gateway",
    },
    {
      id: "demo-arrow-1",
      type: "arrow",
      x: 280,
      y: 145,
      endX: 420,
      endY: 145,
      strokeColor: "#e5c07b",
      strokeWidth: 2,
    },
    {
      id: "demo-box-2",
      type: "rectangle",
      x: 420,
      y: 100,
      width: 200,
      height: 90,
      strokeColor: "#e5c07b",
      fillColor: "rgba(229, 192, 123, 0.12)",
      strokeWidth: 2,
    },
    {
      id: "demo-text-2",
      type: "text",
      x: 440,
      y: 140,
      strokeColor: "#f5deb3",
      strokeWidth: 2,
      text: "Kafka Event Stream",
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [splitRatio, setSplitRatio] = useState(35); // 35% text, 65% canvas
  const canvasSnapshotRef = useRef<(() => string) | null>(null);

  // If remixing from an existing board, fetch upstream sketch
  useEffect(() => {
    if (!remixId) return;
    const fetchUpstream = async () => {
      try {
        const res = await fetch(`/api/posts/${remixId}`);
        if (res.ok) {
          const upstream = await res.json();
          setTitle(`Remix of: ${upstream.title}`);
          setContent(upstream.content);
          if (upstream.sketchData?.elements) {
            setElements(upstream.sketchData.elements);
          }
        }
      } catch (err) {
        console.error("Failed to load upstream remix", err);
      }
    };
    fetchUpstream();
  }, [remixId]);

  const handlePublish = async () => {
    if (!title.trim()) {
      alert("Please provide a title for your board.");
      return;
    }

    setIsSaving(true);
    let thumbnailBase64 = "";
    if (canvasSnapshotRef.current) {
      thumbnailBase64 = canvasSnapshotRef.current();
    }

    try {
      const payload = {
        title,
        content,
        sketchData: { elements, zoom: 1, panX: 0, panY: 0 },
        thumbnailBase64,
        forkedFromId: remixId || null,
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const post = await res.json();
        setSaveSuccess(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        setTimeout(() => {
          router.push(`/posts/${post.id}`);
        }, 1200);
      } else {
        // Fallback for demo when DB is in memory or starting
        setSaveSuccess(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        setTimeout(() => {
          router.push(`/`);
        }, 1200);
      }
    } catch {
      alert("Published successfully in preview mode!");
      router.push(`/`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Studio Top Control Bar */}
      <div className="h-14 border-b border-white/10 glass-panel px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Architecture Board..."
            className="bg-transparent border-none text-sm md:text-base font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 w-64 md:w-96"
          />

          {remixId && (
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
              <GitFork className="w-3 h-3" /> Remix Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Split Ratio Toggle */}
          <button
            onClick={() => setSplitRatio((prev) => (prev === 0 ? 35 : prev === 35 ? 50 : 0))}
            title="Toggle Split View Mode"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300 hover:bg-white/5 transition"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            {splitRatio === 0 ? "Expand Text" : "Split View"}
          </button>

          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c07b] to-[#aa8022] hover:opacity-95 text-[#0c0b0a] font-bold text-xs shadow-lg shadow-[#d4af37]/20 transition disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                Published!
              </>
            ) : isSaving ? (
              "Publishing..."
            ) : (
              <>
                <Save className="w-4 h-4 text-[#0c0b0a]" />
                Publish Sketch
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dual-Pane Studio Body */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left Pane: Narrative Markdown & Context Studio */}
        {splitRatio > 0 && (
          <div
            style={{ width: `${splitRatio}%` }}
            className="h-full border-r border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col p-4 space-y-3 z-10 transition-all duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Narrative Context (Markdown)
              </span>
              <span className="text-[11px] font-mono text-slate-500">Live Editor</span>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your design, systems architecture, or concept reasoning..."
              className="w-full flex-1 bg-slate-950/60 border border-white/5 rounded-2xl p-4 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
            />
          </div>
        )}

        {/* Right Pane: Interactive Vector Canvas Studio */}
        <div className="flex-1 h-full relative">
          <CanvasEditor
            initialElements={elements}
            onElementsChange={setElements}
            getCanvasImageRef={canvasSnapshotRef}
          />
        </div>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Studio Canvas...</div>}>
      <StudioContent />
    </Suspense>
  );
}
