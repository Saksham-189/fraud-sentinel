import { useId } from "react";

export function GraffitiTag({ children, tone = "blue", className = "" }) {
  return (
    <span className={`street-tag ${className}`} data-tone={tone}>
      <span className="evidence-pin" aria-hidden="true" />
      {children}
    </span>
  );
}

export function EvidenceTape({ children = "FOLLOW THE EVIDENCE", className = "" }) {
  return (
    <span className={`evidence-tape ${className}`}>
      <span aria-hidden="true">FS</span>
      {children}
    </span>
  );
}

export function StreetSticker({ children, className = "" }) {
  return <div className={`street-sticker p-4 ${className}`}>{children}</div>;
}

export function DoodleWall({ tag = "TRACE", className = "" }) {
  return <div className={`doodle-wall ${className}`} data-tag={tag} aria-hidden="true" />;
}

export function ScoutMascot({ mood = "ready", className = "" }) {
  const id = useId().replace(/:/g, "");
  const bodyId = `scoutBody${id}`;
  const accentId = `scoutAccent${id}`;
  const accent = mood === "danger" ? "var(--accent-coral)" : mood === "safe" ? "var(--risk-safe)" : "var(--accent-cyan)";
  return (
    <svg
      viewBox="0 0 220 220"
      role="img"
      aria-label="FraudSentinel Scout"
      className={`scout-mascot ${className}`}
    >
      <defs>
        <linearGradient id={bodyId} x1="40" y1="28" x2="180" y2="198" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--surface-2)" />
          <stop offset="1" stopColor="var(--surface-1)" />
        </linearGradient>
        <linearGradient id={accentId} x1="60" y1="40" x2="170" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor={accent} />
          <stop offset="1" stopColor="var(--accent-yellow)" />
        </linearGradient>
      </defs>
      <path
        d="M43 112c0-44 29-78 70-78 42 0 70 34 70 78 0 47-30 82-70 82-41 0-70-35-70-82Z"
        fill={`url(#${bodyId})`}
        stroke="var(--border-strong)"
        strokeWidth="4"
      />
      <path
        d="M62 71c19-25 83-27 103 2-9-1-20 2-31 6-20 8-43 7-72-8Z"
        fill="var(--text-primary)"
        opacity="0.92"
      />
      <path
        d="M53 107c18-10 40-12 60-2 18-10 41-8 59 2-10 17-28 24-59 9-29 15-50 8-60-9Z"
        fill={`url(#${accentId})`}
        opacity="0.24"
      />
      <path
        d="M74 106c15-11 32-11 48 0M101 106c14-11 31-11 46 0"
        fill="none"
        stroke="var(--text-primary)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="92" cy="113" r="8" fill="var(--text-primary)" />
      <circle cx="134" cy="113" r="8" fill="var(--text-primary)" />
      <circle cx="95" cy="110" r="3" fill="var(--surface-1)" />
      <circle cx="137" cy="110" r="3" fill="var(--surface-1)" />
      <path
        d="M91 150c13 10 32 10 45 0"
        fill="none"
        stroke="var(--text-primary)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M36 146c18-5 33-4 45 4M184 146c-18-5-33-4-45 4"
        fill="none"
        stroke={`url(#${accentId})`}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M72 181c17 14 65 14 82 0"
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M162 46l21-12 6 19-23 7-4-14Z"
        fill={`url(#${accentId})`}
        stroke="var(--border-strong)"
        strokeWidth="3"
      />
      <path
        d="M178 41l8 23"
        stroke="var(--text-primary)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
