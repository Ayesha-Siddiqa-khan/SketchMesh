import Link from "next/link";
import { Sparkles, Plus, Compass } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full gold-navbar transition-all">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3.5 group">
          {/* Obsidian & Brushed Gold Monogram Icon */}
          <div className="relative w-10 h-10 rounded-2xl p-[1px] bg-gradient-to-tr from-[#d4af37] via-[#f5deb3] to-[#8a7350] shadow-lg shadow-[#d4af37]/15 group-hover:shadow-[#d4af37]/30 transition duration-300">
            <div className="w-full h-full bg-[#0c0b0a] rounded-[15px] flex items-center justify-center">
              <span className="font-serif font-black gold-gradient-text text-lg tracking-wider">
                SM
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-[#faf7f2] group-hover:text-[#f5deb3] transition">
                SketchMesh
              </span>
              <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-[#d4af37]/10 text-[#e5c07b] border border-[#d4af37]/25 font-semibold">
                v1.0
              </span>
            </div>
            <span className="text-[11px] text-[#a19f99] font-medium tracking-tight">
              Connect Ideas. Map Thoughts. Build Together.
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#a19f99] hover:text-[#faf7f2] hover:bg-white/5 transition border border-transparent hover:border-[#d4af37]/20"
          >
            <Compass className="w-3.5 h-3.5 text-[#e5c07b]" />
            Discover Feed
          </Link>
          <Link
            href="/studio"
            className="relative group p-[1px] rounded-xl overflow-hidden shadow-lg shadow-[#d4af37]/15 hover:shadow-[#d4af37]/30 transition"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] via-[#f5deb3] to-[#aa8022] group-hover:scale-105 transition duration-300" />
            <div className="relative px-4 py-2 bg-[#0c0b0a] rounded-[11px] flex items-center gap-2 text-xs font-semibold text-[#faf7f2] group-hover:bg-[#141210] transition">
              <Plus className="w-3.5 h-3.5 text-[#e5c07b]" />
              New Studio Canvas
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
