/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { BentoActionStrip, BentoGrid, BentoMetric, SpatialTile } from "./Bento";
import { EvidenceTape, GraffitiTag, ScoutMascot, StreetSticker } from "./StreetArt";

const SIGNALS = {
  credential_request: {
    label: "Credential Request",
    reason: "The sender asks for sensitive authentication information.",
    impact: "Sharing credentials can let an attacker take over accounts or approve transactions.",
    terms: ["send otp", "share otp", "enter otp", "otp", "password", "cvv", "pin", "passcode", "login credentials"],
    feature: "credential_intent",
  },
  urgency: {
    label: "Urgency",
    reason: "The message pressures the user to act quickly.",
    impact: "Urgency is often used to make people act before verifying the request.",
    terms: ["immediately", "urgent", "now", "right now", "asap", "hurry", "act fast", "within minutes"],
    feature: "urgency",
  },
  fear: {
    label: "Threat Language",
    reason: "The sender uses fear of loss, suspension, or punishment.",
    impact: "Threat language can pressure the user into following unsafe instructions.",
    terms: ["blocked", "suspended", "locked", "frozen", "legal action", "penalty", "warning", "unauthorized"],
    feature: "fear",
  },
  authority: {
    label: "Authority Impersonation",
    reason: "The sender claims institutional authority or official status.",
    impact: "Authority claims can make a fake request look like it came from a trusted institution.",
    terms: ["bank", "security team", "support team", "official", "rbi", "government", "fraud department", "customer care"],
    feature: "authority",
  },
  suspicious_link: {
    label: "Suspicious Link",
    reason: "The message contains a link or instruction commonly associated with phishing.",
    impact: "Suspicious links can lead to phishing pages, malware, or credential capture.",
    terms: ["http://", "https://", "www.", "click here", "tap here", "open this", "verify"],
    feature: "link_risk",
  },
};

const TONE = {
  HIGH: {
    icon: "warning",
    badge: "bg-red-500/10 text-red-500 border-red-500/25",
    text: "text-red-500",
    soft: "bg-red-500/5 border-red-500/20",
    ring: "ring-red-500/20",
    gradient: "from-red-500 to-red-600",
  },
  MEDIUM: {
    icon: "info",
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/25",
    text: "text-amber-500",
    soft: "bg-amber-500/5 border-amber-500/20",
    ring: "ring-amber-500/20",
    gradient: "from-amber-500 to-amber-600",
  },
  SAFE: {
    icon: "check_circle",
    badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
    text: "text-emerald-500",
    soft: "bg-emerald-500/5 border-emerald-500/20",
    ring: "ring-emerald-500/20",
    gradient: "from-emerald-600 to-emerald-700",
  },
  UNKNOWN: {
    icon: "help",
    badge: "bg-slate-500/10 text-slate-400 border-slate-500/25",
    text: "text-slate-400",
    soft: "bg-slate-500/5 border-slate-500/20",
    ring: "ring-slate-500/20",
    gradient: "from-slate-500 to-zinc-500",
  },
};

function percent(value) {
  return Math.round((Number(value) || 0) * 100);
}

function normalizeRisk(level, score = 0) {
  const value = String(level || "").toUpperCase();
  if (value.includes("UNKNOWN")) return "UNKNOWN";
  if (score >= 0.65) return "HIGH";
  if (value.includes("MEDIUM") || value.includes("MODERATE") || score >= 0.3) return "MEDIUM";
  return "SAFE";
}

function getTextFromInput(input, result) {
  if (input?.text) return String(input.text);
  if (Array.isArray(input?.messages)) return input.messages.map((message) => message?.text || "").filter(Boolean).join("\n");
  if (Array.isArray(result?.messages_analysis)) return result.messages_analysis.map((message) => message?.text || "").filter(Boolean).join("\n");
  return result?.text || "";
}

function getMessages(input, result) {
  if (Array.isArray(input?.messages) && input.messages.length) {
    return input.messages.map((message, index) => ({ text: message?.text || "", analysis: result?.messages_analysis?.[index] || {} }));
  }
  if (Array.isArray(result?.messages_analysis) && result.messages_analysis.length) {
    return result.messages_analysis.map((message) => ({ text: message?.text || "", analysis: message }));
  }
  return [{ text: input?.text || result?.text || "", analysis: result || {} }].filter((message) => message.text);
}

function findEvidenceText(text, terms) {
  const lower = String(text || "").toLowerCase();
  const term = terms.find((candidate) => lower.includes(candidate));
  if (!term) return "";
  const index = lower.indexOf(term);
  return String(text).slice(index, index + term.length);
}

function enrichEvidence(item) {
  const signal = SIGNALS[item.type] || {};
  return {
    ...item,
    label: item.label || signal.label || "Detected Signal",
    reason: item.reason || signal.reason || "This signal influenced the risk decision.",
    impact: item.impact || signal.impact || "This signal increases the likelihood that the message is unsafe.",
    confidence: Number(item.confidence ?? 0),
    risk_contribution: Number(item.risk_contribution ?? 0),
    severity: item.severity || "weak",
  };
}

function hasStrongRiskEvidence(evidence) {
  return evidence.some((item) => item.severity === "strong" && ["credential_request", "suspicious_link", "urgency", "fear"].includes(item.type));
}

function legacyEvidence(text, result) {
  const messages = Array.isArray(result?.messages_analysis) ? result.messages_analysis : [result || {}];
  const maxFeatures = {};
  messages.forEach((message) => {
    const features = message?.features || {};
    Object.values(SIGNALS).forEach((signal) => {
      maxFeatures[signal.feature] = Math.max(maxFeatures[signal.feature] || 0, Number(features[signal.feature]) || 0);
    });
  });
  return Object.entries(SIGNALS)
    .map(([type, signal]) => {
      const score = Number(maxFeatures[signal.feature]) || 0;
      const evidenceText = findEvidenceText(text, signal.terms);
      if (score < 0.25 && !evidenceText) return null;
      const severity = score >= 0.7 ? "strong" : "weak";
      return enrichEvidence({
        type,
        label: signal.label,
        confidence: Math.max(score, evidenceText ? 0.72 : 0),
        evidence_text: evidenceText,
        reason: signal.reason,
        impact: signal.impact,
        risk_contribution: Math.max(0.08, score * 0.35),
        severity,
      });
    })
    .filter(Boolean)
    .sort((a, b) => (a.severity !== "strong") - (b.severity !== "strong") || b.confidence - a.confidence);
}

function legacyClassification(text, evidence, riskLevel) {
  const lower = String(text || "").toLowerCase();
  const types = new Set(evidence.map((item) => item.type));
  if (riskLevel === "SAFE" && evidence.length === 0) return { primary: "Safe Message", secondary: "No fraud indicators", industry: "General" };
  if ((lower.includes("bank") || lower.includes("account") || lower.includes("card")) && types.has("credential_request")) return { primary: "Bank Impersonation Scam", secondary: "Credential Theft", industry: "Financial Fraud" };
  if (lower.includes("crypto") || lower.includes("investment")) return { primary: "Investment Fraud", secondary: "Financial Manipulation", industry: "Financial Fraud" };
  if (lower.includes("job") || lower.includes("interview") || lower.includes("salary")) return { primary: "Job Scam", secondary: "Identity or Payment Fraud", industry: "Recruitment Fraud" };
  if (types.has("credential_request")) return { primary: "Credential Theft Attempt", secondary: "Account Takeover", industry: "Identity Fraud" };
  if (types.has("suspicious_link")) return { primary: "Phishing Attempt", secondary: "Suspicious Link", industry: "Cyber Fraud" };
  return { primary: "Suspicious Message", secondary: "Behavioral Risk", industry: "General Fraud" };
}

function makeVerdict(intelligence) {
  if (intelligence.verdict) return intelligence.verdict;
  const risk = normalizeRisk(intelligence.risk_level, intelligence.risk_score);
  const primary = intelligence.classification?.primary || "message";
  if (risk === "SAFE" && (intelligence.evidence || []).length === 0) return "No fraud indicators found";
  if (risk === "UNKNOWN") return "Analysis inconclusive";
  if (risk === "HIGH") return `Likely ${primary.toLowerCase()}`;
  if (risk === "MEDIUM") return `Suspicious: possible ${primary.toLowerCase()}`;
  return "Low-risk message with minor caution";
}

function makeDecision(intelligence) {
  if (intelligence.decision) return intelligence.decision;
  const risk = normalizeRisk(intelligence.risk_level, intelligence.risk_score);
  const evidence = intelligence.evidence || [];
  const top = evidence[0];
  if (risk === "SAFE" && evidence.length === 0) {
    return {
      title: "No fraud evidence detected",
      subtitle: "The message does not contain known scam triggers.",
      severity_label: "Safe",
      primary_reason: "No credential request, suspicious link, threat, or impersonation signal was found.",
    };
  }
  if (risk === "UNKNOWN") {
    return {
      title: "Unable to make a reliable call",
      subtitle: "Treat this as uncertainty, not confirmed fraud.",
      severity_label: "Unknown",
      primary_reason: "The available model output was not strong enough for a confident decision.",
    };
  }
  return {
    title: `${risk === "HIGH" ? "High-risk" : "Suspicious"} ${intelligence.classification?.primary || "message"}`,
    subtitle: `Risk score ${percent(intelligence.risk_score)}/100 with ${percent(intelligence.confidence)}% confidence.`,
    severity_label: risk === "HIGH" ? "High Risk" : "Needs Verification",
    primary_reason: top?.reason || intelligence.summary || "The message contains fraud-like behavior.",
  };
}

function makeWhyItMatters(intelligence) {
  if (intelligence.why_it_matters) return intelligence.why_it_matters;
  const evidenceTypes = new Set((intelligence.evidence || []).map((item) => item.type));
  if (normalizeRisk(intelligence.risk_level, intelligence.risk_score) === "SAFE" && evidenceTypes.size === 0) {
    return "Nothing in this message suggests credential theft, impersonation, phishing, or financial pressure.";
  }
  if (evidenceTypes.has("credential_request")) return SIGNALS.credential_request.impact;
  if (evidenceTypes.has("suspicious_link")) return SIGNALS.suspicious_link.impact;
  if (evidenceTypes.has("urgency") || evidenceTypes.has("fear")) return "Pressure and threats are common social engineering tactics designed to bypass careful verification.";
  return `This matters because the message shows behavior associated with ${(intelligence.classification?.primary || "fraud").toLowerCase()}.`;
}

function makeAttackPlaybook(intelligence) {
  if (Array.isArray(intelligence.attack_playbook)) return intelligence.attack_playbook;
  const risk = normalizeRisk(intelligence.risk_level, intelligence.risk_score);
  const evidence = intelligence.evidence || [];
  if (risk === "SAFE" && evidence.length === 0) return [];
  return evidence.slice(0, 5).map((item, index) => ({
    step: index + 1,
    label: item.label,
    evidence_text: item.evidence_text,
    explanation: item.impact || item.reason,
    severity: item.severity,
  }));
}

function makeSafeAlternative(intelligence) {
  if (Array.isArray(intelligence.safe_alternative)) return intelligence.safe_alternative;
  const risk = normalizeRisk(intelligence.risk_level, intelligence.risk_score);
  const evidenceTypes = new Set((intelligence.evidence || []).map((item) => item.type));
  if (risk === "SAFE" && evidenceTypes.size === 0) return ["No action is required unless the message was unexpected.", "Continue to avoid sharing credentials in chat or SMS."];
  const actions = ["Verify the request using an official app, website, or phone number you already trust."];
  if (evidenceTypes.has("suspicious_link")) actions.push("Type the official website address manually instead of using the message link.");
  if (evidenceTypes.has("authority") || evidenceTypes.has("credential_request")) actions.push("Contact the institution directly and ask whether the request is genuine.");
  if (risk !== "SAFE") actions.push("Keep a screenshot or copy of the message for reporting.");
  return actions;
}

function makeDontDo(intelligence) {
  if (Array.isArray(intelligence.dont_do)) return intelligence.dont_do;
  const risk = normalizeRisk(intelligence.risk_level, intelligence.risk_score);
  const evidenceTypes = new Set((intelligence.evidence || []).map((item) => item.type));
  if (risk === "SAFE" && evidenceTypes.size === 0) return [];
  const items = [];
  if (evidenceTypes.has("credential_request")) items.push("Do not share OTPs, passwords, PINs, CVV, or login codes.");
  if (evidenceTypes.has("suspicious_link")) items.push("Do not open the link or enter information on linked pages.");
  if (evidenceTypes.has("urgency") || evidenceTypes.has("fear")) items.push("Do not act only because the message says it is urgent.");
  if (evidenceTypes.has("authority")) items.push("Do not trust the sender identity without independent verification.");
  return items.length ? items : ["Do not share sensitive information until the request is verified."];
}

function makeShareableSummary(intelligence) {
  if (intelligence.shareable_summary) return intelligence.shareable_summary;
  const evidenceLabels = (intelligence.evidence || []).length ? intelligence.evidence.slice(0, 4).map((item) => item.label).join(", ") : "No concrete fraud evidence";
  return `FraudSentinel result: ${intelligence.risk_level} risk (${percent(intelligence.risk_score)}/100), ${percent(intelligence.confidence)}% confidence. Classification: ${intelligence.classification?.primary || "Unknown"}. Summary: ${intelligence.summary} Evidence: ${evidenceLabels}. Recommended action: ${intelligence.recommended_actions?.[0] || "Verify through official channels"}.`;
}

function enrichIntelligence(raw = {}) {
  const evidence = (raw.evidence || []).map(enrichEvidence);
  const riskLevel = normalizeRisk(raw.risk_level, raw.risk_score);
  const base = {
    ...raw,
    risk_level: riskLevel,
    risk_score: Number(raw.risk_score ?? 0),
    confidence: Number(raw.confidence ?? 0),
    evidence,
    classification: raw.classification || { primary: "Analysis", secondary: "Unknown", industry: "General" },
    summary: raw.summary || "The message was analyzed for fraud indicators.",
    guardrails: raw.guardrails || [],
    timeline: raw.timeline || [],
    recommended_actions: raw.recommended_actions || [],
  };
  base.verdict = makeVerdict(base);
  base.decision = makeDecision(base);
  base.why_it_matters = makeWhyItMatters(base);
  base.attack_playbook = makeAttackPlaybook(base);
  base.safe_alternative = makeSafeAlternative(base);
  base.dont_do = makeDontDo(base);
  base.shareable_summary = makeShareableSummary(base);
  return base;
}

export function buildLegacyIntelligenceFallback(result = {}, input = {}) {
  if (result?.intelligence) return enrichIntelligence(result.intelligence);
  const text = getTextFromInput(input, result);
  const score = Number(result?.fraud_probability ?? result?.final_score ?? 0);
  const evidence = legacyEvidence(text, result);
  const strongEvidence = hasStrongRiskEvidence(evidence);
  const riskLevel = normalizeRisk(result?.behavior_level || result?.final_risk_level || result?.risk_level, strongEvidence ? score : Math.min(score, 0.64));
  const classification = legacyClassification(text, evidence, riskLevel);
  const confidence = evidence.length ? Math.min(0.92, 0.45 + evidence.length * 0.1 + (strongEvidence ? 0.18 : 0)) : riskLevel === "SAFE" ? 0.22 : 0.38;
  const guardrails = (result?.guardrails || []).map((name) => ({
    name,
    effect: name === "benign_short_message" ? "Capped risk because the text is short and has no fraud evidence." : "Adjusted the score to avoid overstating the risk.",
  }));
  const messages = getMessages(input, result);
  return enrichIntelligence({
    risk_level: riskLevel,
    risk_score: score,
    confidence,
    reasoning_quality: evidence.some((item) => item.severity === "strong") ? "Moderate Evidence" : evidence.length ? "Limited Evidence" : "No Evidence",
    classification,
    summary: evidence.length
      ? `This appears to be a ${classification.primary.toLowerCase()} because it shows ${evidence.slice(0, 3).map((item) => item.label.toLowerCase()).join(", ")}.`
      : "No concrete fraud indicators were found in this message. It appears safe based on the available evidence.",
    evidence,
    timeline: messages.map((message, index) => {
      const messageScore = Number(message.analysis?.fraud_probability ?? message.analysis?.final_score ?? score);
      const messageEvidence = legacyEvidence(message.text, message.analysis || {});
      return {
        message_index: index + 1,
        text: message.text,
        risk_score: messageScore,
        risk_level: normalizeRisk(message.analysis?.behavior_level, messageScore),
        reason: messageEvidence[0] ? `${messageEvidence[0].label} detected${messageEvidence[0].evidence_text ? `: "${messageEvidence[0].evidence_text}"` : ""}` : "No strong fraud trigger detected.",
        triggered_evidence: messageEvidence.map((item) => item.type),
      };
    }),
    guardrails,
    recommended_actions: riskLevel === "HIGH"
      ? ["Do not reply", "Do not share OTP, PIN, passwords, or card details", "Block the sender", "Contact the institution using official channels"]
      : riskLevel === "MEDIUM"
        ? ["Verify through official channels", "Do not click links until verified", "Do not share sensitive information"]
        : ["No immediate threat detected", "Stay cautious with links and credential requests"],
  });
}

export function riskTone(level) {
  return TONE[normalizeRisk(level)] || TONE.UNKNOWN;
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="mb-4">
      <h3 className="font-headline font-black text-[var(--text-primary)] flex items-center gap-2">
        <span className="material-symbols-outlined text-accent-cyan text-[20px]">{icon}</span>
        {title}
      </h3>
      {subtitle && <p className="text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>}
    </div>
  );
}

function InfoList({ items = [], icon = "check_circle", toneClass = "text-emerald-500" }) {
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-3">
          <span className={`material-symbols-outlined text-[20px] mt-0.5 ${toneClass}`}>{icon}</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">{item}</span>
        </div>
      ))}
    </div>
  );
}

export function DecisionHeader({ intelligence }) {
  const tone = riskTone(intelligence?.risk_level);
  return (
    <section className={`case-sheet p-6 border ${tone.soft} scan-line overflow-hidden`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div className="flex items-start gap-4 min-w-0">
          <div className={`w-12 h-12 rounded-md bg-[var(--surface-2)] border border-[var(--border-default)] ${tone.text} flex items-center justify-center shrink-0`}>
            <span className="material-symbols-outlined">{tone.icon}</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`verdict-stamp ${tone.text}`}>
                {intelligence.decision?.severity_label || `${intelligence.risk_level} Risk`}
              </span>
              <span className="case-stamp text-[var(--text-primary)]">
                {percent(intelligence.risk_score)}/100 risk
              </span>
              <span className="case-stamp text-[var(--text-primary)]">
                {percent(intelligence.confidence)}% confidence
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{intelligence.classification?.primary}</p>
            <h2 className="mt-1 text-2xl md:text-3xl font-black text-[var(--text-primary)] leading-tight">{intelligence.verdict}</h2>
            <p className="mt-3 text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">{intelligence.decision?.primary_reason || intelligence.summary}</p>
          </div>
        </div>
        <div className="lg:w-60 rounded-md border border-[var(--border-default)] bg-[var(--surface-2)] p-4 relative z-10">
          <EvidenceTape className="mb-3">CASE TYPE</EvidenceTape>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Classification</p>
          <p className="mt-2 font-black text-[var(--text-primary)]">{intelligence.classification?.primary}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{intelligence.classification?.secondary}</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{intelligence.classification?.industry}</p>
        </div>
      </div>
    </section>
  );
}

export function ThreatAssessmentCard({ intelligence, compact = false }) {
  return <DecisionHeader intelligence={intelligence} compact={compact} />;
}

export function FinalVerdict({ intelligence }) {
  return (
    <section className="street-sticker p-5">
      <SectionHeader icon="gavel" title="Final Verdict" subtitle="Plain-English conclusion from the evidence." />
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
        <p className="font-black text-[var(--text-primary)]">{intelligence.decision?.title || intelligence.verdict}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">{intelligence.summary}</p>
      </div>
    </section>
  );
}

export function EvidenceList({ intelligence }) {
  const evidence = intelligence?.evidence || [];
  return (
    <section className="glass-card p-5">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <SectionHeader icon="fact_check" title="Evidence Found" subtitle="Every finding is tied to the message or model features." />
        <GraffitiTag tone={evidence.length ? "coral" : "safe"}>{evidence.length ? "SCAM SPOTTED" : "CLEAR"}</GraffitiTag>
      </div>
      {evidence.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-[var(--text-secondary)]">
          No high-confidence fraud evidence was detected.
        </div>
      ) : (
        <div className="space-y-3">
          {evidence.map((item) => (
            <StreetSticker key={`${item.type}-${item.evidence_text || item.label}`} className={`!p-4 ${item.severity === "strong" ? "!border-red-500/25" : "!border-amber-500/25"}`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h4 className="font-bold text-[var(--text-primary)]">{item.label}</h4>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{item.reason}</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-2">{item.impact}</p>
                  <p className="text-sm text-[var(--text-primary)] mt-2">
                    Evidence: <span className="font-bold">{item.evidence_text ? `"${item.evidence_text}"` : "Model feature pattern"}</span>
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-sm font-black text-[var(--text-primary)]">{percent(item.confidence)}%</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{item.severity}</p>
                </div>
              </div>
            </StreetSticker>
          ))}
        </div>
      )}
    </section>
  );
}

export function AnnotatedMessage({ text, intelligence }) {
  const evidence = (intelligence?.evidence || []).filter((item) => item.evidence_text);
  const source = String(text || intelligence?.timeline?.map((item) => item.text).join("\n") || "");
  const [selected, setSelected] = useState(evidence[0] || null);
  if (!source) return null;
  const matches = evidence
    .map((item) => {
      const index = source.toLowerCase().indexOf(String(item.evidence_text).toLowerCase());
      return index >= 0 ? { ...item, start: index, end: index + item.evidence_text.length } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);
  const chunks = [];
  let cursor = 0;
  matches.forEach((match) => {
    if (match.start < cursor) return;
    if (match.start > cursor) chunks.push({ text: source.slice(cursor, match.start) });
    chunks.push({ text: source.slice(match.start, match.end), evidence: match });
    cursor = match.end;
  });
  if (cursor < source.length) chunks.push({ text: source.slice(cursor) });
  return (
    <section className="case-sheet p-5">
      <SectionHeader icon="find_in_page" title="Annotated Message" subtitle="Click highlighted phrases to inspect their role in the decision." />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
          <p className="whitespace-pre-wrap break-words text-base md:text-lg leading-9 text-[var(--text-primary)]">
            {chunks.map((chunk, index) => chunk.evidence ? (
              <button
                key={index}
                type="button"
                onClick={() => setSelected(chunk.evidence)}
                className="annotation-mark inline mx-0.5 px-2 py-0.5 font-bold transition-all hover:bg-accent-cyan/20 focus:outline-none focus:ring-2 focus:ring-accent-cyan/40"
              >
                {chunk.text}
              </button>
            ) : <span key={index}>{chunk.text}</span>)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4 min-h-[160px]">
          {selected ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Selected Evidence</p>
              <h4 className="font-black text-[var(--text-primary)] mt-2">{selected.label}</h4>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{selected.reason}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{selected.impact}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-[var(--border-default)] p-2">
                  <p className="text-[var(--text-tertiary)] font-bold uppercase">Confidence</p>
                  <p className="text-[var(--text-primary)] font-black">{percent(selected.confidence)}%</p>
                </div>
                <div className="rounded-lg border border-[var(--border-default)] p-2">
                  <p className="text-[var(--text-tertiary)] font-bold uppercase">Impact</p>
                  <p className="text-[var(--text-primary)] font-black">+{percent(selected.risk_contribution)}%</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">No phrase-level evidence was found for this message.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function AttackPlaybook({ intelligence }) {
  const steps = intelligence?.attack_playbook || [];
  return (
    <section className="glass-card p-5">
      <SectionHeader icon="account_tree" title="Attack Playbook" subtitle="How the suspicious message appears to work." />
      {steps.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-[var(--text-secondary)]">
          No scam sequence was detected.
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={`${step.step}-${step.label}`} className="grid grid-cols-[42px_1fr] gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
              <div className="w-9 h-9 rounded-md bg-[var(--surface-1)] border border-[var(--border-default)] text-accent-cyan flex items-center justify-center font-black">{step.step}</div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-[var(--text-primary)]">{step.label}</h4>
                  <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${step.severity === "strong" ? "border-red-500/20 text-red-500 bg-red-500/5" : "border-amber-500/20 text-amber-500 bg-amber-500/5"}`}>
                    {step.severity}
                  </span>
                </div>
                {step.evidence_text && <p className="text-sm text-[var(--text-primary)] mt-1">"{step.evidence_text}"</p>}
                <p className="text-sm text-[var(--text-secondary)] mt-2">{step.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function WhyItMatters({ intelligence }) {
  return (
    <section className="glass-card p-5">
      <SectionHeader icon="psychology_alt" title="Why It Matters" />
      <p className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        {intelligence.why_it_matters}
      </p>
    </section>
  );
}

export function RiskProgressionTimeline({ intelligence }) {
  const timeline = intelligence?.timeline || [];
  return (
    <section className="glass-card p-5">
      <SectionHeader icon="timeline" title="Risk Progression" subtitle="Each step shows what caused risk to change." />
      <div className="space-y-3">
        {timeline.map((item) => {
          const tone = riskTone(item.risk_level);
          return (
            <div key={item.message_index} className="grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Msg {item.message_index}</p>
                <p className={`text-2xl font-black ${tone.text}`}>{percent(item.risk_score)}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed break-words">"{item.text}"</p>
                <p className="text-sm text-[var(--text-secondary)] mt-2">Reason: <span className="font-bold">{item.reason}</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ConfidenceExplanation({ intelligence }) {
  return (
    <section className="glass-card p-5">
      <SectionHeader icon="verified" title="Confidence Analysis" />
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-24 h-24 rounded-[18px_12px_20px_12px] border-8 border-accent-cyan/20 flex items-center justify-center text-2xl font-black text-accent-cyan shrink-0 rotate-[-2deg]">
          {percent(intelligence.confidence)}%
        </div>
        <div>
          <p className="font-bold text-[var(--text-primary)]">{intelligence.reasoning_quality}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Found {(intelligence.evidence || []).length} evidence item{(intelligence.evidence || []).length === 1 ? "" : "s"}.
            {(intelligence.guardrails || []).length > 0 ? " Guardrails adjusted the score to avoid overstatement." : ""}
          </p>
          {(intelligence.guardrails || []).length > 0 && (
            <div className="mt-3 space-y-2">
              {intelligence.guardrails.map((guardrail) => (
                <p key={guardrail.name} className="text-xs rounded-lg bg-[var(--surface-2)] border border-[var(--border-default)] px-3 py-2 text-[var(--text-secondary)]">
                  <span className="font-bold text-[var(--text-primary)]">{guardrail.name}:</span> {guardrail.effect}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function SafeAlternative({ intelligence }) {
  return (
    <section className="glass-card p-5">
      <SectionHeader icon="alt_route" title="Safe Alternative" subtitle="How to handle the request without taking unnecessary risk." />
      <InfoList items={intelligence?.safe_alternative || []} icon="verified_user" toneClass="text-cyan-500" />
    </section>
  );
}

export function RecommendedActions({ intelligence }) {
  return (
    <section className="glass-card p-5">
      <SectionHeader icon="task_alt" title="Recommended Actions" />
      <InfoList items={intelligence?.recommended_actions || []} />
    </section>
  );
}

export function DontDoPanel({ intelligence }) {
  const items = intelligence?.dont_do || [];
  if (!items.length) return null;
  return (
    <section className="glass-card p-5">
      <SectionHeader icon="block" title="What Not To Do" />
      <InfoList items={items} icon="do_not_disturb_on" toneClass="text-red-500" />
    </section>
  );
}

export function ShareableSummary({ intelligence }) {
  const [copied, setCopied] = useState(false);
  const summary = intelligence?.shareable_summary || "";
  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section className="glass-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <SectionHeader icon="ios_share" title="Shareable Summary" />
        <button
          type="button"
          onClick={copySummary}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-sm font-bold text-[var(--text-primary)] hover:border-accent-cyan/40 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">{copied ? "check" : "content_copy"}</span>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        {summary}
      </p>
    </section>
  );
}

export function IntelligenceDetails({ intelligence, text = "", compact = false }) {
  const normalized = enrichIntelligence(intelligence);
  const tone = riskTone(normalized.risk_level);
  const primaryAction = normalized.recommended_actions?.[0] || "Review the evidence before acting.";
  const hasDontDo = (normalized.dont_do || []).length > 0;
  return (
    <div className={compact ? "" : "space-y-5"}>
      <BentoGrid dense={!compact} className={compact ? "bento-grid-compact" : ""}>
        {!compact && (
          <SpatialTile span="full" className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <GraffitiTag tone="yellow">FOLLOW THE EVIDENCE</GraffitiTag>
          <div className="flex items-center gap-3">
            <ScoutMascot mood={normalized.risk_level === "HIGH" ? "danger" : normalized.risk_level === "SAFE" ? "safe" : "ready"} className="hidden sm:block w-16 h-16" />
            <EvidenceTape>{normalized.risk_level === "HIGH" ? "VERIFY FIRST" : "CASE NOTES"}</EvidenceTape>
          </div>
            </div>
          </SpatialTile>
        )}

        <SpatialTile span="hero" spotlight className={`p-6 ${tone.soft}`}>
          <DecisionHeader intelligence={normalized} />
        </SpatialTile>

        <SpatialTile span="compact" className="p-4">
          <BentoMetric
            icon="verified"
            label="Confidence"
            value={`${percent(normalized.confidence)}%`}
            note={normalized.reasoning_quality}
            tone={normalized.risk_level === "HIGH" ? "danger" : normalized.risk_level === "SAFE" ? "safe" : "warn"}
          />
        </SpatialTile>

        <SpatialTile span="compact" className="p-4">
          <BentoMetric
            icon="category"
            label="Classification"
            value={normalized.classification?.primary || "Analysis"}
            note={normalized.classification?.industry}
            tone="cyan"
          />
        </SpatialTile>

        <SpatialTile span="wide" className="p-5">
          <BentoActionStrip className="h-full items-start">
            <span className={`material-symbols-outlined mt-0.5 ${tone.text}`}>{tone.icon}</span>
            <div>
              <p className="case-label">Primary next action</p>
              <p className="mt-1 text-base font-black text-[var(--text-primary)]">{primaryAction}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{normalized.decision?.subtitle || normalized.summary}</p>
            </div>
          </BentoActionStrip>
        </SpatialTile>

        <SpatialTile span="wide" className="p-5">
          <FinalVerdict intelligence={normalized} />
        </SpatialTile>

        <SpatialTile span="tall" className="p-5">
          <EvidenceList intelligence={normalized} />
        </SpatialTile>

        <SpatialTile span="hero" spotlight className="p-5">
          <AnnotatedMessage text={text} intelligence={normalized} />
        </SpatialTile>

        <SpatialTile span="wide" className="p-5">
          <AttackPlaybook intelligence={normalized} />
        </SpatialTile>

        <SpatialTile span="feature" className="p-5">
          <WhyItMatters intelligence={normalized} />
        </SpatialTile>

        <SpatialTile span="feature" className="p-5">
          <SafeAlternative intelligence={normalized} />
        </SpatialTile>

        <SpatialTile span="wide" className="p-5">
          <RiskProgressionTimeline intelligence={normalized} />
        </SpatialTile>

        <SpatialTile span="feature" className="p-5">
          <ConfidenceExplanation intelligence={normalized} />
        </SpatialTile>

        <SpatialTile span="feature" className="p-5">
          <RecommendedActions intelligence={normalized} />
        </SpatialTile>

        {hasDontDo && (
          <SpatialTile span="feature" className="p-5">
            <DontDoPanel intelligence={normalized} />
          </SpatialTile>
        )}

        <SpatialTile span="wide" className="p-5">
          <ShareableSummary intelligence={normalized} />
        </SpatialTile>
      </BentoGrid>
    </div>
  );
}
