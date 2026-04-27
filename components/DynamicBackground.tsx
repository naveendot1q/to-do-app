"use client";

import { useEffect, useState } from "react";
import { AppMood } from "@/lib/types";

interface Props {
  mood: AppMood;
}

const moodConfig = {
  calm: {
    // All done or no tasks — deep peaceful obsidian
    gradient: "radial-gradient(ellipse at 20% 50%, rgba(100,80,200,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(232,197,71,0.04) 0%, transparent 60%)",
    gridColor: "rgba(232,197,71,0.02)",
    label: null,
  },
  success: {
    // Everything completed — soft green glow
    gradient: "radial-gradient(ellipse at 30% 40%, rgba(46,213,115,0.07) 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, rgba(46,213,115,0.04) 0%, transparent 50%)",
    gridColor: "rgba(46,213,115,0.025)",
    label: null,
  },
  warning: {
    // Some tasks pending/active — warm amber
    gradient: "radial-gradient(ellipse at 15% 60%, rgba(255,165,2,0.08) 0%, transparent 55%), radial-gradient(ellipse at 85% 30%, rgba(232,197,71,0.06) 0%, transparent 55%)",
    gridColor: "rgba(255,165,2,0.025)",
    label: null,
  },
  critical: {
    // Overdue tasks — urgent red pulse
    gradient: "radial-gradient(ellipse at 50% 30%, rgba(255,71,87,0.09) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(255,71,87,0.05) 0%, transparent 50%)",
    gridColor: "rgba(255,71,87,0.025)",
    label: null,
  },
};

export default function DynamicBackground({ mood }: Props) {
  const [prev, setPrev] = useState<AppMood>(mood);
  const [current, setCurrent] = useState<AppMood>(mood);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (mood === current) return;
    // Crossfade transition
    setOpacity(0);
    const t = setTimeout(() => {
      setPrev(current);
      setCurrent(mood);
      setOpacity(1);
    }, 400);
    return () => clearTimeout(t);
  }, [mood]);

  const cfg = moodConfig[current];

  return (
    <>
      {/* Base background */}
      <div style={{ position: "fixed", inset: 0, background: "#0a0a0f", zIndex: 0 }} />

      {/* Mood gradient — transitions smoothly */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1,
        background: cfg.gradient,
        opacity,
        transition: "opacity 0.8s ease",
        pointerEvents: "none",
      }} />

      {/* Grid overlay */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 2,
        backgroundImage: `linear-gradient(${cfg.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${cfg.gridColor} 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
        pointerEvents: "none",
        opacity,
        transition: "opacity 0.8s ease",
      }} />

      {/* Critical pulse ring — only for overdue */}
      {current === "critical" && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 3,
          background: "linear-gradient(90deg, transparent, rgba(255,71,87,0.6), rgba(255,71,87,0.9), rgba(255,71,87,0.6), transparent)",
          animation: "shimmer 2s infinite",
        }} />
      )}

      {/* Noise texture */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 3,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
        pointerEvents: "none",
        opacity: 0.4,
      }} />
    </>
  );
}
