"use client";

import React, { useRef, useState, useEffect } from "react";
import { CanvasElement, ToolType, PinnedComment } from "@/types/canvas";
import {
  MousePointer,
  Pencil,
  Square,
  Circle,
  ArrowRight,
  StickyNote,
  Type,
  MessageSquarePlus,
  Undo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react";

interface CanvasEditorProps {
  initialElements?: CanvasElement[];
  comments?: PinnedComment[];
  readOnly?: boolean;
  onElementsChange?: (elements: CanvasElement[]) => void;
  onPinComment?: (coords: { x: number; y: number }) => void;
  onSelectComment?: (comment: PinnedComment) => void;
  focusedComment?: PinnedComment | null;
  getCanvasImageRef?: React.MutableRefObject<(() => string) | null>;
}

const COLORS = [
  "#faf7f2", // Warm Alabaster
  "#f5deb3", // Champagne Cream
  "#e5c07b", // Mellow Gold
  "#d4af37", // Polished Gold
  "#8a7350", // Antique Bronze
  "#e06c75", // Terracotta Coral
  "#98c379", // Sage Olive
  "#61afef", // Celestial Cobalt
];

export default function CanvasEditor({
  initialElements = [],
  comments = [],
  readOnly = false,
  onElementsChange,
  onPinComment,
  onSelectComment,
  focusedComment,
  getCanvasImageRef,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [elements, setElements] = useState<CanvasElement[]>(initialElements);
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [strokeColor, setStrokeColor] = useState<string>("#d4af37");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);

  // Viewport / Camera transforms
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Current drawing state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentElement, setCurrentElement] = useState<CanvasElement | null>(null);

  // Expose snapshot export to parent
  useEffect(() => {
    if (getCanvasImageRef) {
      getCanvasImageRef.current = () => {
        if (!canvasRef.current) return "";
        return canvasRef.current.toDataURL("image/png");
      };
    }
  }, [getCanvasImageRef]);

  // Center viewport on selected comment pin if triggered
  useEffect(() => {
    if (focusedComment && focusedComment.coordX !== null && focusedComment.coordY !== null) {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setPan({
          x: clientWidth / 2 - focusedComment.coordX * zoom,
          y: clientHeight / 2 - focusedComment.coordY * zoom,
        });
      }
    }
  }, [focusedComment, zoom]);

  // Sync state upward
  const updateElements = (newElements: CanvasElement[]) => {
    setElements(newElements);
    if (onElementsChange) onElementsChange(newElements);
  };

  // Convert screen coordinates to world canvas coordinates
  const screenToWorld = (screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  };

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw all completed elements
    elements.forEach((el) => drawElement(ctx, el));

    // Draw current active element
    if (currentElement) {
      drawElement(ctx, currentElement);
    }

    ctx.restore();
  }, [elements, currentElement, zoom, pan]);

  const drawElement = (ctx: CanvasRenderingContext2D, el: CanvasElement) => {
    ctx.strokeStyle = el.strokeColor;
    ctx.fillStyle = el.fillColor || "transparent";
    ctx.lineWidth = el.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (el.type) {
      case "pen":
        if (el.points && el.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case "rectangle":
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width || 0, el.height || 0, 8);
        if (el.fillColor) ctx.fill();
        ctx.stroke();
        break;

      case "ellipse":
        ctx.beginPath();
        const rx = Math.abs((el.width || 0) / 2);
        const ry = Math.abs((el.height || 0) / 2);
        ctx.ellipse(el.x + rx, el.y + ry, rx, ry, 0, 0, 2 * Math.PI);
        if (el.fillColor) ctx.fill();
        ctx.stroke();
        break;

      case "arrow":
        if (el.endX !== undefined && el.endY !== undefined) {
          ctx.beginPath();
          ctx.moveTo(el.x, el.y);
          ctx.lineTo(el.endX, el.endY);
          ctx.stroke();

          // Arrowhead
          const angle = Math.atan2(el.endY - el.y, el.endX - el.x);
          const headlen = 14;
          ctx.beginPath();
          ctx.moveTo(el.endX, el.endY);
          ctx.lineTo(
            el.endX - headlen * Math.cos(angle - Math.PI / 6),
            el.endY - headlen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(el.endX, el.endY);
          ctx.lineTo(
            el.endX - headlen * Math.cos(angle + Math.PI / 6),
            el.endY - headlen * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
        break;

      case "sticky":
        // Sticky Note
        ctx.fillStyle = el.fillColor || "rgba(254, 240, 138, 0.15)";
        ctx.strokeStyle = el.strokeColor || "#eab308";
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width || 140, el.height || 100, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "14px sans-serif";
        ctx.fillText(el.text || "Sticky Note", el.x + 12, el.y + 24, (el.width || 140) - 24);
        break;

      case "text":
        ctx.fillStyle = el.strokeColor;
        ctx.font = "bold 16px sans-serif";
        ctx.fillText(el.text || "Concept Block", el.x, el.y + 16);
        break;
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Pan with middle mouse or space / select tool drag
    if (e.button === 1 || activeTool === "select") {
      setIsPanning(true);
      setLastMousePos({ x: clientX, y: clientY });
      return;
    }

    if (readOnly && activeTool !== "commentPin") return;

    const world = screenToWorld(clientX, clientY);

    if (activeTool === "commentPin") {
      if (onPinComment) {
        onPinComment(world);
      }
      setActiveTool("select");
      return;
    }

    setIsDrawing(true);
    const id = `el_${Date.now()}`;

    if (activeTool === "pen") {
      setCurrentElement({
        id,
        type: "pen",
        x: world.x,
        y: world.y,
        strokeColor,
        strokeWidth,
        points: [{ x: world.x, y: world.y }],
      });
    } else if (activeTool === "rectangle") {
      setCurrentElement({
        id,
        type: "rectangle",
        x: world.x,
        y: world.y,
        width: 0,
        height: 0,
        strokeColor,
        fillColor: "rgba(56, 189, 248, 0.08)",
        strokeWidth,
      });
    } else if (activeTool === "ellipse") {
      setCurrentElement({
        id,
        type: "ellipse",
        x: world.x,
        y: world.y,
        width: 0,
        height: 0,
        strokeColor,
        fillColor: "rgba(168, 85, 247, 0.08)",
        strokeWidth,
      });
    } else if (activeTool === "arrow") {
      setCurrentElement({
        id,
        type: "arrow",
        x: world.x,
        y: world.y,
        endX: world.x,
        endY: world.y,
        strokeColor,
        strokeWidth,
      });
    } else if (activeTool === "sticky") {
      const noteText = prompt("Enter note text:", "Idea...") || "Note";
      const newEl: CanvasElement = {
        id,
        type: "sticky",
        x: world.x,
        y: world.y,
        width: 150,
        height: 100,
        strokeColor: "#eab308",
        fillColor: "rgba(234, 179, 8, 0.15)",
        strokeWidth: 2,
        text: noteText,
      };
      updateElements([...elements, newEl]);
      setIsDrawing(false);
    } else if (activeTool === "text") {
      const labelText = prompt("Enter text:", "Architecture Component") || "Component";
      const newEl: CanvasElement = {
        id,
        type: "text",
        x: world.x,
        y: world.y,
        strokeColor,
        strokeWidth: 2,
        text: labelText,
      };
      updateElements([...elements, newEl]);
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (isPanning) {
      const dx = clientX - lastMousePos.x;
      const dy = clientY - lastMousePos.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: clientX, y: clientY });
      return;
    }

    if (!isDrawing || !currentElement) return;

    const world = screenToWorld(clientX, clientY);

    if (currentElement.type === "pen") {
      setCurrentElement({
        ...currentElement,
        points: [...(currentElement.points || []), world],
      });
    } else if (
      currentElement.type === "rectangle" ||
      currentElement.type === "ellipse"
    ) {
      setCurrentElement({
        ...currentElement,
        width: world.x - currentElement.x,
        height: world.y - currentElement.y,
      });
    } else if (currentElement.type === "arrow") {
      setCurrentElement({
        ...currentElement,
        endX: world.x,
        endY: world.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && currentElement) {
      updateElements([...elements, currentElement]);
      setCurrentElement(null);
      setIsDrawing(false);
    }
  };

  const handleUndo = () => {
    if (elements.length === 0) return;
    const newEls = elements.slice(0, elements.length - 1);
    updateElements(newEls);
  };

  const handleClear = () => {
    if (confirm("Clear all canvas nodes?")) {
      updateElements([]);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none"
    >
      {/* Canvas Tooling Floating Header */}
      {!readOnly && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-2 rounded-2xl glass-panel shadow-2xl">
          <button
            onClick={() => setActiveTool("select")}
            title="Pan / Select"
            className={`p-2 rounded-xl transition ${
              activeTool === "select"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            <MousePointer className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("pen")}
            title="Freehand Pen"
            className={`p-2 rounded-xl transition ${
              activeTool === "pen"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("rectangle")}
            title="Rectangle"
            className={`p-2 rounded-xl transition ${
              activeTool === "rectangle"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("ellipse")}
            title="Ellipse"
            className={`p-2 rounded-xl transition ${
              activeTool === "ellipse"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("arrow")}
            title="Connector / Arrow"
            className={`p-2 rounded-xl transition ${
              activeTool === "arrow"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("sticky")}
            title="Sticky Note"
            className={`p-2 rounded-xl transition ${
              activeTool === "sticky"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            <StickyNote className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool("text")}
            title="Text Label"
            className={`p-2 rounded-xl transition ${
              activeTool === "text"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            <Type className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-white/20 mx-1" />

          {/* Color palette selector */}
          <div className="flex items-center gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setStrokeColor(c)}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full transition-transform ${
                  strokeColor === c ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900" : "opacity-80 hover:opacity-100"
                }`}
              />
            ))}
          </div>

          <div className="w-[1px] h-6 bg-white/20 mx-1" />

          <button
            onClick={handleUndo}
            title="Undo"
            className="p-2 rounded-xl text-slate-300 hover:bg-white/10 transition"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            title="Clear Canvas"
            className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Canvas Controls (Bottom-Right) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 p-2 rounded-2xl glass-panel shadow-2xl">
        <button
          onClick={() => setActiveTool("commentPin")}
          title="Pin Canvas Feedback"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs transition ${
            activeTool === "commentPin"
              ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30"
              : "text-slate-300 hover:bg-white/10"
          }`}
        >
          <MessageSquarePlus className="w-4 h-4" />
          Pin Feedback
        </button>

        <div className="w-[1px] h-5 bg-white/20" />

        <button
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}
          title="Zoom Out"
          className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-slate-400 w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.15))}
          title="Zoom In"
          className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          title="Reset View"
          className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Vector Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-crosshair canvas-grid"
      />

      {/* Render Interactive Coordinate Pins for Comments */}
      {comments.map((comment) => {
        if (comment.coordX === null || comment.coordY === null) return null;
        const screenX = comment.coordX * zoom + pan.x;
        const screenY = comment.coordY * zoom + pan.y;

        const isFocused = focusedComment?.id === comment.id;

        return (
          <div
            key={comment.id}
            onClick={() => onSelectComment && onSelectComment(comment)}
            style={{
              transform: `translate(${screenX}px, ${screenY}px)`,
            }}
            className="absolute top-0 left-0 -ml-3 -mt-6 z-30 cursor-pointer group transition-transform hover:scale-125"
          >
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full shadow-lg border-2 ${
                isFocused
                  ? "bg-amber-500 border-white text-slate-950 scale-125 animate-bounce"
                  : "bg-indigo-600 border-indigo-300 text-white"
              }`}
            >
              <span className="text-xs font-bold">💬</span>
            </div>
            {/* Tooltip on hover */}
            <div className="hidden group-hover:block absolute left-8 top-0 w-48 p-2 rounded-lg bg-slate-900/95 border border-white/20 text-xs shadow-2xl text-slate-200 z-50 pointer-events-none">
              <span className="font-semibold text-indigo-400">
                @{comment.author.username}:
              </span>{" "}
              {comment.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
