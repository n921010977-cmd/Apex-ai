"use client";

import { CSSProperties } from "react";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: CSSProperties;
  className?: string;
}

/**
 * Shimmer placeholder that matches the Apex dark surface.
 * Use while data is loading instead of a centered spinner to avoid layout jumps.
 */
export function Skeleton({ width = "100%", height = 16, radius = 8, style, className }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width, height, borderRadius: radius,
        background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
        backgroundSize: "200% 100%",
        animation: "apex-shimmer 1.4s ease-in-out infinite",
        ...style,
      }}
    >
      <style>{`
        @keyframes apex-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (prefers-reduced-motion: reduce) { div[class] { animation: none !important; } }
      `}</style>
    </div>
  );
}

/** A card-shaped skeleton for KPI tiles / list items. */
export function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <div style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", height }}>
      <Skeleton width={40} height={40} radius={10} style={{ marginBottom: 14 }} />
      <Skeleton width="60%" height={20} style={{ marginBottom: 8 }} />
      <Skeleton width="40%" height={12} />
    </div>
  );
}
