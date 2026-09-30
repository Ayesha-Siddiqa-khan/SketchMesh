import Link from "next/link";
import { Sparkles, Plus, Compass } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full glass-nav transition-all">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          {/* Curated luxury iridescent logo badge */}
          <div className="relative w-10 h-10 rounded-2xl p-[1px] bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400 shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition duration-300">
            <div className="w-full h-full bg-[#0a0d18] rounded-[15px] flex items-center justify-center">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-tr from-violet-400 via-pink-300 to-cyan-300 text-lg">
                SM
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-violet-200 transition">
                SketchMesh
              </span>
              <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 font-semibold">
                v1.0
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium tracking-tight">
              Connect Ideas. Map Thoughts. Build Together.
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition border border-transparent hover:border-white/10"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            Discover Feed
          </Link>
          <Link
            href="/studio"
            className="relative group p-[1px] rounded-xl overflow-hidden shadow-lg shadow-violet-600/20 hover:shadow-violet-600/35 transition"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 group-hover:scale-105 transition" />
            <div className="relative px-4 py-2 bg-slate-950/80 rounded-[11px] flex items-center gap-2 text-xs font-semibold text-white group-hover:bg-slate-950/50 transition">
              <Plus className="w-3.5 h-3.5 text-violet-300" />
              Launch Studio Canvas
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
