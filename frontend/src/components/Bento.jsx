import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

const spanClasses = {
  hero: "md:col-span-6 lg:col-span-7 lg:row-span-3",
  wide: "md:col-span-6 lg:col-span-6 lg:row-span-2",
  tall: "md:col-span-3 lg:col-span-4 lg:row-span-3",
  compact: "md:col-span-3 lg:col-span-3 lg:row-span-1",
  feature: "md:col-span-3 lg:col-span-5 lg:row-span-2",
  half: "md:col-span-3 lg:col-span-6 lg:row-span-2",
  full: "md:col-span-6 lg:col-span-12",
};

export function BentoGrid({ children, className = "", dense = true }) {
  return (
    <div className={`bento-grid ${dense ? "bento-grid-dense" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function PointerSpotlight({ active }) {
  if (!active) return null;
  return <span className="pointer-spotlight" aria-hidden="true" />;
}

export function BentoTile({
  children,
  span = "compact",
  className = "",
  spotlight = false,
  interactive = false,
  as: Tag = "section",
  ...props
}) {
  const [style, setStyle] = useState(undefined);
  const reduceMotion = useReducedMotion();
  const canTrack = spotlight && !reduceMotion;

  const handlePointerMove = (event) => {
    if (!canTrack || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setStyle({
      "--spotlight-x": `${event.clientX - rect.left}px`,
      "--spotlight-y": `${event.clientY - rect.top}px`,
    });
  };

  const handlePointerLeave = () => {
    if (style) setStyle(undefined);
  };

  return (
    <Tag
      className={`bento-tile ${spanClasses[span] || ""} ${interactive ? "spatial-tile" : ""} ${spotlight ? "spotlight-tile" : ""} ${className}`}
      data-span={span}
      style={style}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <PointerSpotlight active={spotlight} />
      {children}
    </Tag>
  );
}

export function SpatialTile({ children, className = "", span = "compact", spotlight = false, ...props }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -48px 0px" }}
      whileHover={reduceMotion ? undefined : { y: -3, rotateX: 1.2, rotateY: -1.2 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className={`${spanClasses[span] || ""}`}
    >
      <BentoTile span={span} className={className} spotlight={spotlight} interactive {...props}>
        {children}
      </BentoTile>
    </motion.div>
  );
}

export function BentoHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="case-label text-accent-cyan">{eyebrow}</p>}
        <h2 className="mt-1 font-headline text-xl font-black leading-tight text-[var(--text-primary)] md:text-2xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function BentoMetric({ icon, label, value, note, tone = "cyan" }) {
  const compactValue = typeof value === "string" && value.length > 12;
  const toneClass = {
    cyan: "text-accent-cyan",
    safe: "text-[var(--risk-safe)]",
    warn: "text-[var(--risk-medium)]",
    danger: "text-[var(--risk-high)]",
  }[tone] || "text-accent-cyan";

  return (
    <div className="relative z-10 flex h-full flex-col justify-between gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] ${toneClass}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="case-label">{label}</p>
        <p className={`mt-1 break-words font-headline font-black leading-tight text-[var(--text-primary)] ${compactValue ? "text-xl" : "text-3xl"}`}>{value}</p>
        {note && <p className="mt-1 text-xs font-semibold text-[var(--text-tertiary)]">{note}</p>}
      </div>
    </div>
  );
}

export function BentoActionStrip({ children, className = "" }) {
  return (
    <div className={`bento-action-strip ${className}`}>
      {children}
    </div>
  );
}

export function EvidenceStack({ children, className = "" }) {
  return (
    <div className={`evidence-stack ${className}`}>
      <div className="paper-layer paper-layer-back" aria-hidden="true" />
      <div className="paper-layer paper-layer-mid" aria-hidden="true" />
      <div className="paper-layer paper-layer-front">
        {children}
      </div>
    </div>
  );
}
