import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar, TopNavbar, ToastNotification } from "./Dashboard";
import { Reveal, StaggerContainer, StaggerItem } from "../components/Motion";
import { analysisApi } from "../services/api";

const SIGNALS = {
  credential_intent: {
    title: "Credential Request",
    finding: "OTP or password request",
    icon: "password",
    color: "fuchsia",
    reason: "The sender is asking for sensitive authentication information.",
    terms: ["send otp", "share otp", "enter otp", "otp", "password", "cvv", "pin", "passcode", "login credentials"],
  },
  urgency: {
    title: "Urgency",
    finding: "Urgency language",
    icon: "timer",
    color: "blue",
    reason: "The message pressures the user to act quickly.",
    terms: ["immediately", "urgent", "now", "right now", "asap", "hurry", "act fast", "within minutes"],
  },
  fear: {
    title: "Threat Language",
    finding: "Threat or consequence",
    icon: "warning",
    color: "rose",
    reason: "The sender uses fear of loss, suspension, or punishment.",
    terms: ["blocked", "suspended", "locked", "frozen", "legal action", "penalty", "warning", "unauthorized"],
  },
  authority: {
    title: "Authority Impersonation",
    finding: "Authority claim",
    icon: "local_police",
    color: "indigo",
    reason: "The sender claims institutional authority or official status.",
    terms: ["bank", "security team", "support team", "official", "rbi", "government", "fraud department", "customer care"],
  },
  link_risk: {
    title: "Suspicious Link",
    finding: "Suspicious link",
    icon: "link",
    color: "emerald",
    reason: "The message contains a link or link instruction associated with phishing.",
    terms: ["http://", "https://", "www.", "click here", "tap here", "open this", "verify"],
  },
};

const COLOR_CLASSES = {
  fuchsia: {
    bg: "bg-fuchsia-500/5",
    text: "text-fuchsia-500",
    border: "border-fuchsia-500/20",
    chip: "bg-fuchsia-500/10 text-fuchsia-500",
    mark: "bg-fuchsia-500/10 text-fuchsia-400 ring-fuchsia-500/30",
  },
  blue: {
    bg: "bg-blue-500/5",
    text: "text-blue-500",
    border: "border-blue-500/20",
    chip: "bg-blue-500/10 text-blue-500",
    mark: "bg-blue-500/10 text-blue-400 ring-blue-500/30",
  },
  rose: {
    bg: "bg-rose-500/5",
    text: "text-rose-500",
    border: "border-rose-500/20",
    chip: "bg-rose-500/10 text-rose-500",
    mark: "bg-rose-500/10 text-rose-400 ring-rose-500/30",
  },
  indigo: {
    bg: "bg-indigo-500/5",
    text: "text-indigo-500",
    border: "border-indigo-500/20",
    chip: "bg-indigo-500/10 text-indigo-500",
    mark: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/30",
  },
  emerald: {
    bg: "bg-emerald-500/5",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
    chip: "bg-emerald-500/10 text-emerald-500",
    mark: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
  },
};

function percent(value) {
  return Math.round((Number(value) || 0) * 100);
}

function riskBucket(level, score) {
  const label = (level || "").toUpperCase();
  if (label.includes("HIGH") || score >= 0.7) return "HIGH";
  if (label.includes("MEDIUM") || label.includes("MODERATE") || score >= 0.4) return "MEDIUM";
  return "SAFE";
}

function findEvidence(text, terms) {
  const haystack = String(text || "");
  const lower = haystack.toLowerCase();
  const term = terms.find((t) => lower.includes(t));
  if (!term) return "";
  const idx = lower.indexOf(term);
  return haystack.slice(idx, idx + term.length);
}

function getMessageText(input, result) {
  const messages = input?.messages;
  if (Array.isArray(messages) && messages.length > 0) {
    return messages.map((m) => m?.text || "").filter(Boolean).join("\n");
  }
  if (input?.text) return input.text;
  const analysis = result?.messages_analysis;
  if (Array.isArray(analysis) && analysis.length > 0) {
    return analysis.map((m) => m?.text || "").filter(Boolean).join("\n");
  }
  return "";
}

function getMessages(input, result) {
  const inputMessages = input?.messages;
  if (Array.isArray(inputMessages) && inputMessages.length > 0) {
    return inputMessages.map((m, index) => ({
      text: m?.text || "",
      analysis: result?.messages_analysis?.[index] || {},
    }));
  }
  const analysis = result?.messages_analysis;
  if (Array.isArray(analysis) && analysis.length > 0) {
    return analysis.map((m) => ({ text: m?.text || "", analysis: m || {} }));
  }
  return [{ text: input?.text || "", analysis: result || {} }].filter((m) => m.text);
}

function buildSignals(text, result) {
  const messages = Array.isArray(result?.messages_analysis) ? result.messages_analysis : [result || {}];
  const maxFeatures = {};
  messages.forEach((message) => {
    const features = message?.features || {};
    Object.keys(SIGNALS).forEach((key) => {
      maxFeatures[key] = Math.max(maxFeatures[key] || 0, Number(features[key]) || 0);
    });
  });

  return Object.entries(SIGNALS)
    .map(([key, meta]) => {
      const score = maxFeatures[key] || 0;
      const evidence = findEvidence(text, meta.terms);
      return {
        key,
        ...meta,
        score,
        confidence: Math.max(percent(score), evidence ? 72 : 0),
        evidence,
      };
    })
    .filter((signal) => signal.score >= 0.25 || signal.evidence);
}

function classifyScam(text, signals) {
  const lower = text.toLowerCase();
  const hasCredential = signals.some((s) => s.key === "credential_intent");
  const hasAuthority = signals.some((s) => s.key === "authority");
  const hasLink = signals.some((s) => s.key === "link_risk");

  if ((lower.includes("bank") || lower.includes("account")) && hasCredential) {
    return { primary: "Bank Impersonation Scam", secondary: "Credential Theft", industry: "Financial Fraud" };
  }
  if (lower.includes("crypto") || lower.includes("bitcoin") || lower.includes("investment")) {
    return { primary: "Investment Fraud", secondary: "Financial Manipulation", industry: "Financial Fraud" };
  }
  if (lower.includes("job") || lower.includes("interview") || lower.includes("salary")) {
    return { primary: "Job Scam", secondary: "Identity or Payment Fraud", industry: "Recruitment Fraud" };
  }
  if ((lower.includes("support") || lower.includes("technician")) && (hasLink || hasAuthority)) {
    return { primary: "Tech Support Scam", secondary: "Account Takeover", industry: "Consumer Fraud" };
  }
  if (hasCredential) return { primary: "Credential Theft Attempt", secondary: "Account Takeover", industry: "Identity Fraud" };
  if (hasLink) return { primary: "Phishing Attempt", secondary: "Suspicious Link", industry: "Cyber Fraud" };
  return { primary: "Unclassified Suspicious Message", secondary: "Behavioral Risk", industry: "General Fraud" };
}

function buildReport(record) {
  const result = record?.result || {};
  const input = record?.input || {};
  const text = getMessageText(input, result);
  const score = Number(result.fraud_probability ?? result.final_score ?? 0);
  const level = riskBucket(result.behavior_level || result.final_risk_level || result.risk_level, score);
  const messages = getMessages(input, result);
  const signals = buildSignals(text, result);
  const classification = classifyScam(text, signals);
  const confidence = Math.min(98, Math.max(35, Math.round(percent(score) * 0.65 + Math.min(signals.length, 5) * 7)));
  const reasoningQuality = signals.length >= 3 ? "Strong Evidence" : signals.length >= 2 ? "Moderate Evidence" : "Limited Evidence";
  const actions =
    level === "HIGH"
      ? ["Do not reply", "Do not share OTP, PIN, passwords, or card details", "Block the sender", "Contact the institution using official channels", "Report the suspicious message"]
      : level === "MEDIUM"
        ? ["Verify through an official channel", "Do not click links until verified", "Do not share sensitive information", "Keep the message for reference"]
        : ["No immediate threat detected", "Stay cautious with links and credential requests", "Verify unexpected financial messages"];

  return {
    id: record?.id,
    timestamp: record?.timestamp,
    text,
    score,
    scorePercent: percent(score),
    level,
    confidence,
    reasoningQuality,
    classification,
    signals,
    messages,
    actions,
    explanation:
      result.explanation ||
      result.llm_explanation ||
      `This message was classified as ${level.toLowerCase()} based on the detected fraud signals.`,
  };
}

function riskStyles(level) {
  if (level === "HIGH") return "bg-red-500/10 text-red-500 border-red-500/20";
  if (level === "MEDIUM") return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
}

function Card({ children, className = "" }) {
  return <section className={`glass-card ${className}`}>{children}</section>;
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="font-headline font-bold text-[var(--text-primary)] flex items-center gap-2">
        <span className="material-symbols-outlined text-accent-violet text-[20px]">{icon}</span>
        {title}
      </h2>
      {subtitle && <p className="text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>}
    </div>
  );
}

function ThreatAssessment({ report }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">Threat Assessment</p>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`px-4 py-2 rounded-xl border text-2xl font-black ${riskStyles(report.level)}`}>
              {report.level} RISK
            </span>
            <span className="px-4 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-primary)] font-black text-2xl">
              {report.confidence}% Confidence
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight">{report.classification.primary}</h1>
          <p className="text-[var(--text-secondary)] mt-2 max-w-3xl">
            {report.explanation}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-1 gap-3 xl:w-64 shrink-0">
          <div className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl p-4">
            <p className="text-xs text-[var(--text-tertiary)] font-bold uppercase">Risk Score</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">{report.scorePercent}/100</p>
          </div>
          <div className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl p-4">
            <p className="text-xs text-[var(--text-tertiary)] font-bold uppercase">Evidence</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">{report.reasoningQuality}</p>
          </div>
          <div className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl p-4">
            <p className="text-xs text-[var(--text-tertiary)] font-bold uppercase">Signals</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">{report.signals.length}</p>
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border-default)] p-4">
          <p className="text-sm font-bold text-[var(--text-primary)] mb-3">Detected Signals</p>
          <div className="flex flex-wrap gap-2">
            {report.signals.length > 0 ? report.signals.map((signal) => (
              <span key={signal.key} className={`px-3 py-1.5 rounded-full text-xs font-bold ${COLOR_CLASSES[signal.color].chip}`}>
                {signal.title}
              </span>
            )) : <span className="text-sm text-[var(--text-tertiary)]">No strong fraud signals found.</span>}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] p-4">
          <p className="text-sm font-bold text-[var(--text-primary)] mb-3">Recommended Action</p>
          <p className="text-sm text-[var(--text-secondary)]">{report.actions.slice(0, 3).join(". ")}.</p>
        </div>
      </div>
    </Card>
  );
}

function PlainEnglishSummary({ report }) {
  return (
    <Card className="p-6">
      <SectionTitle icon="summarize" title="Plain English Summary" />
      <p className="text-[var(--text-secondary)] leading-relaxed">
        This message appears to be a <strong>{report.classification.primary.toLowerCase()}</strong>.
        {report.signals.length > 0
          ? ` The strongest evidence is ${report.signals.slice(0, 3).map((s) => s.title.toLowerCase()).join(", ")}.`
          : " The system did not find strong fraud evidence, but the message should still be verified if it is unexpected."}
        {" "}The safest response is to avoid replying or sharing sensitive information until you verify the sender through an official channel.
      </p>
    </Card>
  );
}

function EvidencePanel({ report }) {
  return (
    <Card className="p-6">
      <SectionTitle icon="fact_check" title="Evidence Found" subtitle="Findings are tied to phrases from the analyzed message." />
      <div className="space-y-3">
        {report.signals.length > 0 ? report.signals.map((signal) => {
          const colors = COLOR_CLASSES[signal.color];
          return (
            <div key={signal.key} className={`border rounded-xl p-4 ${colors.border} ${colors.bg}`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-white border ${colors.border} ${colors.text} flex items-center justify-center shrink-0`}>
                    <span className="material-symbols-outlined text-[20px]">{signal.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)]">{signal.finding}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{signal.reason}</p>
                    <p className="text-sm text-[var(--text-primary)] mt-2">
                      Evidence: <span className="font-bold">{signal.evidence ? `"${signal.evidence}"` : "Pattern detected in model features"}</span>
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black text-[var(--text-primary)]">{signal.confidence}% Confidence</span>
              </div>
            </div>
          );
        }) : (
          <p className="text-sm text-[var(--text-tertiary)]">No high-confidence findings were detected for this analysis.</p>
        )}
      </div>
    </Card>
  );
}

function annotateText(text, signals) {
  const matches = signals
    .filter((signal) => signal.evidence)
    .map((signal) => {
      const idx = text.toLowerCase().indexOf(signal.evidence.toLowerCase());
      return idx >= 0 ? { ...signal, start: idx, end: idx + signal.evidence.length } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);

  const chunks = [];
  let cursor = 0;
  matches.forEach((match) => {
    if (match.start < cursor) return;
    if (match.start > cursor) chunks.push({ text: text.slice(cursor, match.start) });
    chunks.push({ text: text.slice(match.start, match.end), signal: match });
    cursor = match.end;
  });
  if (cursor < text.length) chunks.push({ text: text.slice(cursor) });
  return chunks;
}

function AnnotatedMessage({ report }) {
  const chunks = annotateText(report.text, report.signals);
  return (
    <Card className="p-6">
      <SectionTitle icon="find_in_page" title="Analyzed Message" subtitle="Highlighted phrases explain why the message was flagged." />
      <div className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl p-5 md:p-6 min-h-[180px]">
        <p className="text-lg md:text-xl leading-10 text-[var(--text-primary)] whitespace-pre-wrap">
          {chunks.length > 0 ? chunks.map((chunk, index) => {
            if (!chunk.signal) return <span key={index}>{chunk.text}</span>;
            const colors = COLOR_CLASSES[chunk.signal.color];
            return (
              <span key={index} className={`relative group inline-block px-2 py-0.5 mx-0.5 rounded-lg font-bold ring-1 ${colors.mark} cursor-help`}>
                {chunk.text}
                <span className="absolute left-1/2 bottom-full z-20 mb-3 w-64 -translate-x-1/2 rounded-xl bg-slate-950 p-3 text-left text-xs leading-relaxed text-white opacity-0 shadow-xl transition group-hover:opacity-100">
                  <span className="block font-black mb-1">{chunk.signal.title}</span>
                  <span className="block text-slate-300">{chunk.signal.reason}</span>
                  <span className="block mt-2 text-slate-200">Risk contribution: +{Math.max(10, Math.round(chunk.signal.score * 40))}%</span>
                </span>
              </span>
            );
          }) : <span className="text-[var(--text-tertiary)]">No message text available.</span>}
        </p>
      </div>
    </Card>
  );
}

function RiskTimeline({ report }) {
  return (
    <Card className="p-6">
      <SectionTitle icon="timeline" title="Risk Progression Timeline" subtitle="Each step explains what caused risk to rise." />
      <div className="space-y-4">
        {report.messages.map((message, index) => {
          const score = Number(message.analysis?.fraud_probability ?? message.analysis?.final_score ?? report.score);
          const features = message.analysis?.features || {};
          const reasonSignal = Object.entries(SIGNALS)
            .map(([key, meta]) => ({ key, ...meta, score: Number(features[key]) || 0, evidence: findEvidence(message.text, meta.terms) }))
            .sort((a, b) => b.score - a.score)[0];
          const reason = reasonSignal && (reasonSignal.score > 0.2 || reasonSignal.evidence)
            ? `${reasonSignal.title}${reasonSignal.evidence ? ` detected: "${reasonSignal.evidence}"` : " detected"}`
            : "No strong fraud trigger detected";
          return (
            <div key={`${message.text}-${index}`} className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3 border border-[var(--border-default)] rounded-xl p-4">
              <div>
                <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase">Message {index + 1}</p>
                <p className={`text-2xl font-black ${score >= 0.7 ? "text-red-600" : score >= 0.4 ? "text-amber-600" : "text-emerald-600"}`}>
                  {percent(score)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">"{message.text}"</p>
                <p className="text-sm text-[var(--text-secondary)] mt-2">Reason: <span className="font-bold">{reason}</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ClassificationAndConfidence({ report }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <SectionTitle icon="category" title="Scam Classification" />
        <div className="space-y-3 text-sm">
          <p><span className="font-bold text-[var(--text-tertiary)]">Primary:</span> <span className="font-bold text-[var(--text-primary)]">{report.classification.primary}</span></p>
          <p><span className="font-bold text-[var(--text-tertiary)]">Secondary:</span> {report.classification.secondary}</p>
          <p><span className="font-bold text-[var(--text-tertiary)]">Industry:</span> {report.classification.industry}</p>
        </div>
      </Card>
      <Card className="p-6">
        <SectionTitle icon="verified" title="AI Confidence" />
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-full border-8 border-primary/20 flex items-center justify-center text-2xl font-black text-primary shrink-0">
            {report.confidence}%
          </div>
          <div>
            <p className="font-bold text-[var(--text-primary)]">{report.reasoningQuality}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Detected {report.signals.length} independent fraud indicator{report.signals.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function RecommendedActions({ report }) {
  return (
    <Card className="p-6">
      <SectionTitle icon="task_alt" title="Recommended Actions" subtitle="What to do next based on this report." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {report.actions.map((action) => (
          <div key={action} className="flex items-start gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-3">
            <span className="material-symbols-outlined text-emerald-600 text-[20px] mt-0.5">check_circle</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">{action}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MetadataAndExport({ report, onToast }) {
  const summary = `${report.level} RISK (${report.confidence}% confidence): ${report.classification.primary}. Recommended action: ${report.actions.slice(0, 3).join("; ")}.`;
  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      onToast("Summary copied", "The report summary is ready to paste.");
    } catch {
      onToast("Copy unavailable", summary);
    }
  };
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fraud-report-${report.id || "analysis"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const shareReport = async () => {
    const shareData = { title: "Fraud Intelligence Report", text: summary, url: window.location.href };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      onToast("Report link copied", "Share the copied link when you need to report or document the analysis.");
    }
  };

  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div>
          <SectionTitle icon="info" title="Analysis Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <p><span className="font-bold text-[var(--text-tertiary)]">Date:</span> {report.timestamp ? new Date(report.timestamp).toLocaleString() : "Current session"}</p>
            <p><span className="font-bold text-[var(--text-tertiary)]">Risk Score:</span> {report.scorePercent}/100</p>
            <p><span className="font-bold text-[var(--text-tertiary)]">Model Version:</span> FraudSentinel v2.4</p>
            <p><span className="font-bold text-[var(--text-tertiary)]">Analysis ID:</span> {report.id || "Unsaved analysis"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> Download PDF
          </button>
          <button onClick={copySummary} className="px-4 py-2 rounded-lg bg-white border border-[var(--border-default)] text-[var(--text-secondary)] text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">content_copy</span> Copy Summary
          </button>
          <button onClick={shareReport} className="px-4 py-2 rounded-lg bg-white border border-[var(--border-default)] text-[var(--text-secondary)] text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">ios_share</span> Share
          </button>
          <button onClick={downloadJson} className="px-4 py-2 rounded-lg bg-white border border-[var(--border-default)] text-[var(--text-secondary)] text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">data_object</span> JSON
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function IntelligenceReport() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, title: "", subtext: "" });
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    async function loadReport() {
      setLoading(true);
      setError("");
      try {
        const data = id ? await analysisApi.getConversation(id) : await analysisApi.getHistory();
        if (cancelled) return;
        if (data?.error) {
          setError(data.error);
          setRecord(null);
        } else if (Array.isArray(data)) {
          setRecord(data[0] || null);
        } else {
          setRecord(data);
        }
      } catch {
        if (!cancelled) setError("Unable to load intelligence report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReport();
    return () => { cancelled = true; };
  }, [location.search]);

  const report = useMemo(() => (record ? buildReport(record) : null), [record]);
  const triggerToast = (title, subtext) => setToast({ show: true, title, subtext });

  return (
    <div className="app-shell min-h-screen flex font-body overflow-x-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-grow flex flex-col min-w-0 relative z-10">
        <TopNavbar title="Fraud Intelligence Report" />
        <main className="flex-grow p-4 md:p-8 max-w-[1280px] mx-auto w-full pb-20">
          {loading && (
            <div className="min-h-[400px] flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-[40px] text-accent-violet">progress_activity</span>
            </div>
          )}

          {!loading && (!report || error) && (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--surface-1)] text-[var(--text-tertiary)] flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">description</span>
              </div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">No analysis report available</h1>
              <p className="text-sm text-[var(--text-tertiary)] mt-2">{error || "Run an analysis first, then open the report from History."}</p>
              <Link to="/analyze" className="inline-flex mt-5 px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold">Analyze Message</Link>
            </Card>
          )}

          {!loading && report && (
            <Reveal>
              <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-accent-violet uppercase tracking-wide">FraudSentinel Report</p>
                  <h1 className="text-3xl font-headline font-bold text-[var(--text-primary)] tracking-tight">Threat Analysis Report</h1>
                  <p className="text-[var(--text-secondary)] mt-1">Decision-ready explanation, evidence, confidence, and next steps.</p>
                </div>
                <Link to="/history" className="text-sm font-bold text-[var(--text-secondary)] hover:text-accent-violet flex items-center gap-1 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to History
                </Link>
              </div>

              <StaggerContainer className="space-y-6">
                <StaggerItem><ThreatAssessment report={report} /></StaggerItem>
                <StaggerItem><PlainEnglishSummary report={report} /></StaggerItem>
                <StaggerItem><EvidencePanel report={report} /></StaggerItem>
                <StaggerItem><AnnotatedMessage report={report} /></StaggerItem>
                <StaggerItem><RiskTimeline report={report} /></StaggerItem>
                <StaggerItem><ClassificationAndConfidence report={report} /></StaggerItem>
                <StaggerItem><RecommendedActions report={report} /></StaggerItem>
                <StaggerItem><MetadataAndExport report={report} onToast={triggerToast} /></StaggerItem>
              </StaggerContainer>
            </Reveal>
          )}
        </main>
      </div>
      <ToastNotification
        show={toast.show}
        message={toast.title}
        subtext={toast.subtext}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
