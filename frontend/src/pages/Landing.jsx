import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Reveal, HoverButton } from "../components/Motion";
import { BentoActionStrip, BentoGrid, BentoMetric, EvidenceStack, SpatialTile } from "../components/Bento";
import { DoodleWall, EvidenceTape, GraffitiTag, ScoutMascot, StreetSticker } from "../components/StreetArt";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { l: "Platform", to: "/" },
    { l: "Solutions", to: "/solutions" },
    { l: "Developers", to: "/developers" },
    { l: "Pricing", to: "/pricing" },
  ];

  return (
    <m.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "glass border-b border-[var(--border-default)]" : "bg-transparent"}`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link className="flex items-center gap-2 font-headline text-xl font-black text-[var(--text-primary)]" to="/">
            <span className="material-symbols-outlined text-accent-cyan">fingerprint</span>
            FraudSentinel
          </Link>
          <div className="hidden gap-6 md:flex">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.l}
                  to={item.to}
                  className={`case-label transition-colors ${active ? "text-accent-cyan" : "hover:text-accent-cyan"}`}
                >
                  {item.l}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-md border border-[var(--border-default)] px-4 py-2 text-sm font-bold text-[var(--text-primary)] hover:border-accent-cyan/40">
            Sign in
          </Link>
          <Link to="/register" className="rounded-md bg-[var(--text-primary)] px-4 py-2 text-sm font-bold text-[var(--surface-0)]">
            Open a case
          </Link>
        </div>
      </div>
    </m.nav>
  );
}

function EvidencePreview() {
  return (
    <div className="relative z-10 scan-line overflow-hidden">
      <DoodleWall tag="SCAM SPOTTED" />
      <div className="mb-5 flex items-center justify-between border-b border-[var(--border-default)] pb-4">
        <div>
          <p className="case-label">Case FS-0427</p>
          <h3 className="mt-1 font-headline text-lg font-black text-[var(--text-primary)]">Scam Intercept</h3>
        </div>
        <span className="verdict-stamp text-[var(--risk-high)]">High Risk</span>
      </div>
      <div className="space-y-5">
        <div className="rounded-md border border-[var(--border-default)] bg-[var(--surface-1)] p-4 text-sm leading-7 text-[var(--text-primary)]">
          Your account is <span className="annotation-mark px-1 font-bold">temporarily locked</span>. Send the <span className="annotation-mark px-1 font-bold">OTP</span> immediately to restore access.
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Credential request", "Strong evidence"],
            ["Urgency", "Pressure tactic"],
            ["Fear language", "Account lock claim"],
          ].map(([title, desc]) => (
            <StreetSticker key={title} className="!p-3">
              <p className="text-sm font-black text-[var(--text-primary)]">{title}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{desc}</p>
            </StreetSticker>
          ))}
        </div>
        <div className="rounded-md border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
          <p className="case-label">Recommended action</p>
          <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">Do not reply. Verify through official bank channels.</p>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 md:py-24">
      <BentoGrid>
        <SpatialTile span="hero" spotlight className="p-7 md:p-8">
          <DoodleWall tag="FOLLOW THE EVIDENCE" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-8">
            <div>
              <GraffitiTag tone="yellow">Street Case Lab</GraffitiTag>
              <h1 className="mt-6 max-w-3xl font-headline text-4xl font-black leading-tight text-[var(--text-primary)] md:text-6xl">
                Catch scams before they catch you.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--text-secondary)]">
                Paste a suspicious message and FraudSentinel turns it into a case file: verdict, evidence, confidence, and the safest next move.
              </p>
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="rounded-md bg-[var(--text-primary)] px-6 py-3 font-bold text-[var(--surface-0)]">
                  Open your first case
                </Link>
                <Link to="/login" className="rounded-md border border-[var(--border-default)] px-6 py-3 font-bold text-[var(--text-primary)] hover:border-accent-cyan/40">
                  Sign in
                </Link>
              </div>
              <BentoActionStrip>
                <EvidenceTape>VERIFY FIRST</EvidenceTape>
                <EvidenceTape>DON'T SHARE OTP</EvidenceTape>
              </BentoActionStrip>
            </div>
          </div>
        </SpatialTile>

        <SpatialTile span="feature" spotlight className="p-5 md:p-6">
          <EvidencePreview />
        </SpatialTile>

        <SpatialTile span="compact" className="p-4">
          <div className="flex h-full items-center gap-4">
            <ScoutMascot mood="ready" className="h-20 w-20 shrink-0" />
            <div>
              <p className="case-label text-accent-cyan">Scout says</p>
              <p className="mt-1 text-sm font-black leading-5 text-[var(--text-primary)]">Pause. Screenshot. Verify outside the message.</p>
            </div>
          </div>
        </SpatialTile>

        <SpatialTile span="compact" className="p-4 stamp-in">
          <BentoMetric icon="gavel" label="Sample verdict" value="High" note="Credential request found" tone="danger" />
        </SpatialTile>

        <SpatialTile span="compact" className="p-4">
          <EvidenceStack className="min-h-full">
            <p className="case-label text-[var(--risk-safe)]">Privacy posture</p>
            <p className="mt-2 text-sm font-black text-[var(--text-primary)]">Your case archive stays tied to your account, not public feeds.</p>
          </EvidenceStack>
        </SpatialTile>
      </BentoGrid>
    </section>
  );
}

function PrinciplesSection() {
  const items = [
    {
      icon: "find_in_page",
      title: "Evidence first",
      text: "Every risk call is tied to phrases, links, or behavior signals the user can inspect.",
    },
    {
      icon: "gavel",
      title: "Decision ready",
      text: "Results explain what happened, why it matters, and what not to do next.",
    },
    {
      icon: "fingerprint",
      title: "Personal case archive",
      text: "Review past analyses as case files instead of noisy analytics dashboards.",
    },
  ];

  return (
    <section className="border-y border-[var(--border-default)] bg-[var(--surface-1)]/55 px-6 py-16">
      <BentoGrid className="mx-auto max-w-7xl">
        {items.map((item) => (
          <SpatialTile key={item.title} span={item.title === "Evidence first" ? "wide" : "feature"} className="p-6">
            <div className="flex h-full flex-col justify-between">
              <div>
              <span className="material-symbols-outlined text-3xl text-accent-cyan">{item.icon}</span>
              <h3 className="mt-5 font-headline text-xl font-black text-[var(--text-primary)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{item.text}</p>
              </div>
              <span className="bento-seam" aria-hidden="true" />
            </div>
          </SpatialTile>
        ))}
      </BentoGrid>
    </section>
  );
}

function WorkflowSection() {
  const steps = [
    ["01", "Submit evidence", "Paste the message, email, SMS, or conversation."],
    ["02", "Read the verdict", "See risk, confidence, classification, and primary reason."],
    ["03", "Inspect annotations", "Click highlighted evidence to see why it matters."],
    ["04", "Act safely", "Follow official-channel actions and avoid risky steps."],
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-20">
      <Reveal>
        <div className="max-w-2xl">
          <GraffitiTag>Follow The Evidence</GraffitiTag>
          <h2 className="mt-3 font-headline text-3xl font-black text-[var(--text-primary)] md:text-4xl">A calm investigation flow for everyday people.</h2>
        </div>
      </Reveal>
      <div className="mt-10 grid gap-4 lg:grid-cols-4">
        {steps.map(([number, title, text]) => (
          <div key={number} className="case-folder p-5 pt-7">
            <span className="verdict-stamp text-accent-cyan">{number}</span>
            <h3 className="mt-5 font-headline text-lg font-black text-[var(--text-primary)]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="px-6 pb-20">
      <Reveal>
        <div className="case-sheet mx-auto max-w-5xl p-8 text-center md:p-12">
          <GraffitiTag tone="coral">No Trace Left Behind</GraffitiTag>
          <h2 className="mx-auto mt-3 max-w-2xl font-headline text-3xl font-black text-[var(--text-primary)] md:text-4xl">
            Before you reply, build the case.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
            FraudSentinel turns suspicious messages into clear evidence, safer choices, and shareable reports without making the experience feel like enterprise homework.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/register">
              <HoverButton className="rounded-md bg-[var(--text-primary)] px-7 py-3 font-bold text-[var(--surface-0)]">
                Start analyzing
              </HoverButton>
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="glass w-full border-t border-[var(--border-default)] px-6 py-10 text-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
        <div className="font-headline text-lg font-black text-[var(--text-primary)]">FraudSentinel</div>
        <div className="flex flex-wrap justify-center gap-6">
          {["Privacy", "Terms", "Security", "Status", "Contact"].map((item) => (
            <a key={item} className="text-[var(--text-tertiary)] hover:text-accent-cyan" href="#">
              {item}
            </a>
          ))}
        </div>
          <div className="text-[var(--text-tertiary)]">(c) {new Date().getFullYear()} FraudSentinel. Street-smart fraud intelligence.</div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="aurora-bg flex min-h-screen flex-col bg-[var(--surface-0)] font-body text-[var(--text-primary)]">
        <Navbar />
        <main className="flex-grow">
          <HeroSection />
          <PrinciplesSection />
          <WorkflowSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </LazyMotion>
  );
}
