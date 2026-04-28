"use client";

import { useEffect, useState } from "react";
import { AppMood } from "@/lib/types";

const moodConfig = {
  calm: {
    gradient: "radial-gradient(ellipse at 20% 50%, rgba(100,80,200,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(232,197,71,0.05) 0%, transparent 60%)",
    grid: "rgba(232,197,71,0.025)",
    pulse: false,
  },
  success: {
    gradient: "radial-gradient(ellipse at 30% 40%, rgba(46,213,115,0.10) 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, rgba(46,213,115,0.05) 0%, transparent 50%)",
    grid: "rgba(46,213,115,0.03)",
    pulse: false,
  },
  warning: {
    gradient: "radial-gradient(ellipse at 15% 60%, rgba(255,165,2,0.10) 0%, transparent 55%), radial-gradient(ellipse at 85% 30%, rgba(232,197,71,0.08) 0%, transparent 55%)",
    grid: "rgba(255,165,2,0.03)",
    pulse: false,
  },
  critical: {
    gradient: "radial-gradient(ellipse at 50% 30%, rgba(255,71,87,0.12) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(255,71,87,0.06) 0%, transparent 50%)",
    grid: "rgba(255,71,87,0.03)",
    pulse: true,
  },
};

export default function DynamicBackground({ mood }: { mood: AppMood }) {
  const [displayed, setDisplayed] = useState<AppMood>(mood);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (mood === displayed) return;
    setFading(true);
    const t = setTimeout(() => {
      setDisplayed(mood);
      setFading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [mood]);

  const cfg = moodConfig[displayed];

  return (
    <>
      {/* Base — always solid obsidian */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundColor: "#0a0a0f",
        pointerEvents: "none",
      }} />

      {/* Mood gradient layer */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1,
        background: cfg.gradient,
        opacity: fading ? 0 : 1,
        transition: "opacity 0.8s ease, background 0.8s ease",
        pointerEvents: "none",
      }} />

      {/* Grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 2,
        backgroundImage: `linear-gradient(${cfg.grid} 1px, transparent 1px), linear-gradient(90deg, ${cfg.grid} 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.8s ease",
        pointerEvents: "none",
      }} />

      {/* Critical top pulse bar */}
      {displayed === "critical" && !fading && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 3,
          background: "linear-gradient(90deg, transparent 0%, rgba(255,71,87,0.8) 50%, transparent 100%)",
          animation: "shimmer 2s infinite",
          pointerEvents: "none",
        }} />
      )}

      {/* Noise grain */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 3,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`,
        pointerEvents: "none",
        opacity: 0.5,
      }} />
    </>
  );
}
