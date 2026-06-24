import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sidebar, TopNavbar, ToastNotification } from "./Dashboard";
import { Reveal, HoverButton } from "../components/Motion";
import { motion, AnimatePresence } from "framer-motion";
import { analysisApi, feedbackApi } from "../services/api";

// ─── Helpers ────────────────────────────────────────────────────────

function riskBucket(level) {
  const u = (level || "").toUpperCase();
  if (u.includes("HIGH")) return "HIGH";
  if (u.includes("MEDIUM") || u.includes("MODERATE")) return "MEDIUM";
  return "SAFE";
}

function featuresToBarData(features) {
  if (!features || typeof features !== "object") return [];
  const keys = [
    ["credential_intent", "Credential Intent", "from-fuchsia-500 to-pink-500", "#d946ef"],
    ["urgency", "Urgency", "from-blue-500 to-indigo-500", "#3b82f6"],
    ["fear", "Fear", "from-rose-500 to-red-500", "#f43f5e"],
    ["authority", "Authority", "from-violet-500 to-indigo-500", "#6366f1"],
    ["link_risk", "Link Risk", "from-emerald-500 to-cyan-500", "#10b981"],
  ];
  return keys.map(([k, name, gradient, fill]) => ({
    name,
    score: Math.round((Number(features[k]) || 0) * 100),
    gradient,
    fill,
  }));
}

function buildTimelineFromResult(result) {
  const ma = result?.messages_analysis;
  if (Array.isArray(ma) && ma.length > 0) {
    return ma.map((m, i) => ({
      index: `Msg ${i + 1}`,
      risk: m.fraud_probability ?? 0,
    }));
  }
  const p = result?.fraud_probability ?? 0;
  return [{ index: "Msg 1", risk: p }];
}

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from "recharts";

// ─── Loading Animation ──────────────────────────────────────────────

function ChatAnalysisLoading() {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 glass-card w-fit">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-accent-violet animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 rounded-full bg-accent-pink animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 rounded-full bg-accent-cyan animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="font-semibold text-sm text-[var(--text-secondary)]">Analyzing...</span>
    </div>
  );
}

// ─── AI Response Bubble ─────────────────────────────────────────────

function AIResponseBubble({ setInsightsOpen, setFeedbackOpen, result }) {
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const prob = result?.fraud_probability ?? 0;
  const levelLabel = result?.behavior_level ?? "";
  const bucket = riskBucket(levelLabel);
  const explanation =
    result?.explanation ||
    result?.llm_explanation ||
    "Analysis complete. Open insights for signal breakdown.";
  const levelStyles = {
    HIGH: { gradient: "from-red-500 to-pink-500", badge: "from-red-500/10 to-pink-500/10 text-red-500 border-red-500/20", icon: "warning" },
    MEDIUM: { gradient: "from-amber-500 to-orange-500", badge: "from-amber-500/10 to-orange-500/10 text-amber-500 border-amber-500/20", icon: "info" },
    SAFE: { gradient: "from-emerald-500 to-cyan-500", badge: "from-emerald-500/10 to-cyan-500/10 text-emerald-500 border-emerald-500/20", icon: "check_circle" },
  };
  const style = levelStyles[bucket];
  return (
    <Reveal>
      <div className="flex flex-col gap-3">
        <div className="glass-card p-6 max-w-2xl">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.gradient} text-white flex items-center justify-center shrink-0 shadow-lg`}>
              <span className="material-symbols-outlined">{style.icon}</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="font-headline font-bold text-[var(--text-primary)]">Analysis Complete</h3>
                <span className={`bg-gradient-to-r ${style.badge} border px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider max-w-[220px] truncate`} title={levelLabel}>
                  {levelLabel || `${bucket} risk`}
                </span>
                <span className="text-xs font-bold text-[var(--text-tertiary)]">Fraud {(prob * 100).toFixed(0)}%</span>
                {result?.behavior_score != null && (
                  <span className="text-xs font-bold text-[var(--text-tertiary)]">
                    Behavior {(Number(result.behavior_score) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">{explanation}</p>
              <HoverButton onClick={() => setInsightsOpen(true)} className="bg-[var(--surface-2)] text-accent-violet border border-[var(--border-default)] px-4 py-2 rounded-xl text-sm font-semibold hover:border-accent-violet/30 transition-all">
                <span className="material-symbols-outlined text-[16px] mr-1.5 align-middle">insights</span>
                View Detailed Insights
              </HoverButton>
            </div>
          </div>
        </div>
        {/* Feedback strip */}
        <div className="glass-card !rounded-xl p-3 flex items-center justify-between w-full max-w-2xl text-sm">
          <span className="text-[var(--text-secondary)] font-medium">Was this analysis correct?</span>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setFeedbackGiven("positive");
                if (result?.conversation_id) {
                  try {
                    await import("../services/api").then((m) => m.feedbackApi.submit({
                      conversation_id: result.conversation_id,
                      is_correct: true,
                      reason: "correct",
                    }));
                  } catch {
                    setFeedbackGiven(null);
                  }
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                feedbackGiven === "positive"
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] border-[var(--border-default)]"
              } border`}
            >
              <span className="material-symbols-outlined text-[16px]">thumb_up</span> Correct
            </button>
            <button
              onClick={() => { setFeedbackGiven("negative"); setFeedbackOpen(true); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                feedbackGiven === "negative"
                  ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] border-[var(--border-default)]"
              } border`}
            >
              <span className="material-symbols-outlined text-[16px]">thumb_down</span> Incorrect
            </button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

// ─── Feedback Modal ─────────────────────────────────────────────────

function FeedbackDetailModal({ isOpen, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const handleSubmit = () => {
    onSubmit(reason);
    setReason("");
    setDetails("");
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative glass-strong rounded-2xl p-6 shadow-2xl max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-headline font-bold text-[var(--text-primary)]">What went wrong?</h3>
              <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { id: "false_positive", label: "False positive", desc: "Flagged a safe message as fraud." },
                { id: "missed_fraud", label: "Missed fraud", desc: "Did not detect an actual scam." },
                { id: "wrong_explanation", label: "Wrong explanation", desc: "The reasoning was incorrect." },
                { id: "other", label: "Other", desc: "Something else." },
              ].map((opt) => (
                <label key={opt.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${reason === opt.id ? "border-accent-violet/30 bg-accent-violet/5" : "border-[var(--border-default)] hover:bg-[var(--surface-2)]"}`}>
                  <input type="radio" name="feedback_reason" value={opt.id} checked={reason === opt.id} onChange={(e) => setReason(e.target.value)} className="mt-1 accent-[var(--accent-violet)]" />
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">{opt.label}</h4>
                    <p className="text-xs text-[var(--text-secondary)]">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="mb-6">
              <textarea
                className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-accent-violet/20 outline-none resize-none h-20 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                placeholder="Add details (optional)..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
            <HoverButton onClick={handleSubmit} disabled={!reason} className={`w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-pink-500 shadow-glow-violet transition-all ${!reason ? "opacity-40 cursor-not-allowed shadow-none" : ""}`}>
              Submit Feedback
            </HoverButton>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Insights Panel ─────────────────────────────────────────────────

function InsightsPanel({ onClose, result, previewText }) {
  const prob = result?.fraud_probability ?? 0;
  const levelLabel = result?.behavior_level ?? "";
  const bucket = riskBucket(levelLabel);
  const ringGradient =
    bucket === "HIGH" ? ["#ef4444", "#ec4899"] : bucket === "MEDIUM" ? ["#f59e0b", "#f97316"] : ["#22c55e", "#06b6d4"];
  const badgeStyle =
    bucket === "HIGH" ? "from-red-500/10 to-pink-500/10 text-red-500" : bucket === "MEDIUM" ? "from-amber-500/10 to-orange-500/10 text-amber-500" : "from-emerald-500/10 to-cyan-500/10 text-emerald-500";
  const featSource =
    Array.isArray(result?.messages_analysis) && result.messages_analysis.length > 0
      ? result.messages_analysis[result.messages_analysis.length - 1]?.features
      : result?.features;
  const behaviorData = featuresToBarData(featSource);
  const timelineData = buildTimelineFromResult(result);
  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 w-full md:w-[450px] lg:w-[550px] h-full glass-strong border-l border-[var(--border-default)] shadow-2xl flex flex-col z-30"
    >
      <div className="p-6 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-2)]/50">
        <h2 className="font-headline font-bold text-[var(--text-primary)] text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-violet">insights</span> Detailed Breakdown
        </h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-3)] text-[var(--text-tertiary)] transition-colors">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {/* Risk Ring */}
        <section className="flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center mb-4">
            <svg className="transform -rotate-90 w-32 h-32">
              <defs>
                <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={ringGradient[0]} />
                  <stop offset="100%" stopColor={ringGradient[1]} />
                </linearGradient>
              </defs>
              <circle cx="64" cy="64" r="50" stroke="var(--surface-3)" strokeWidth="10" fill="transparent" />
              <circle cx="64" cy="64" r="50" stroke="url(#riskGrad)" strokeWidth="10" fill="transparent" strokeDasharray="314" strokeDashoffset={314 - (prob * 314)} strokeLinecap="round" className="transition-all duration-[1500ms]" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-[var(--text-primary)]">{(prob * 100).toFixed(0)}<span className="text-lg text-[var(--text-tertiary)] font-bold">%</span></span>
            </div>
          </div>
          <div className={`bg-gradient-to-r ${badgeStyle} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider max-w-full truncate`}>{levelLabel || "Risk profile"}</div>
        </section>

        {/* Signals */}
        <section>
          <h3 className="text-sm font-headline font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Detected Signals</h3>
          {behaviorData.length > 0 ? (
            <div className="space-y-3">
              {behaviorData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[var(--text-secondary)] w-[110px] shrink-0 truncate">{item.name}</span>
                  <div className="flex-grow h-4 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className={`h-full bg-gradient-to-r ${item.gradient} rounded-full`}
                    />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-tertiary)] w-8 text-right">{item.score}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">No feature breakdown available.</p>
          )}
        </section>

        {/* Input Preview */}
        <section>
          <h3 className="text-sm font-headline font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Input Preview</h3>
          <div className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl p-4 text-sm leading-relaxed text-[var(--text-secondary)] font-medium whitespace-pre-wrap break-words">
            {previewText || "—"}
          </div>
        </section>

        {/* Risk Escalation */}
        <section>
          <h3 className="text-sm font-headline font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Risk Escalation</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
                <XAxis dataKey="index" axisLine={false} tickLine={false} tick={{ fill: "var(--text-tertiary)", fontSize: 10, dy: 5 }} />
                <YAxis domain={[0, 1]} tickFormatter={(val) => `${val * 100}%`} axisLine={false} tickLine={false} tick={{ fill: "var(--text-tertiary)", fontSize: 10 }} />
                <Line type="stepAfter" dataKey="risk" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: "#ef4444" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

// ─── Main Analyze Page ──────────────────────────────────────────────

export default function Analyze() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stage, setStage] = useState("default");
  const [activeTab, setActiveTab] = useState("text");
  const [conversationMode, setConversationMode] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [submittedMessages, setSubmittedMessages] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [lastPreviewText, setLastPreviewText] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [isInsightsOpen, setInsightsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastConfig, setToastConfig] = useState({ title: "", subtext: "" });
  const [inputError, setInputError] = useState("");
  const scrollRef = useRef(null);

  const triggerToast = (title, subtext) => {
    setToastConfig({ title, subtext });
    setShowToast(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let lines;
    let preview;
    if (activeTab === "text") {
      if (!inputMessage.trim()) { setInputError("Please enter a message to analyze."); return; }
      if (conversationMode) {
        lines = inputMessage.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        if (lines.length === 0) { setInputError("Enter at least one non-empty line."); return; }
        preview = lines.join("\n");
      } else {
        lines = [inputMessage.trim()];
        preview = lines[0];
      }
    } else if (activeTab === "url") {
      if (!inputUrl.trim() || !inputUrl.includes(".")) { setInputError("Please enter a valid URL."); return; }
      lines = ["Scanning URL: " + inputUrl];
      preview = lines[0];
    } else {
      setInputError("File upload is not wired to the API yet.");
      return;
    }
    setInputError("");
    setErrorDetail("");
    setSubmittedMessages(lines);
    setLastPreviewText(preview);
    setInputMessage("");
    setInputUrl("");
    setStage("loading");
    setInsightsOpen(false);
    setAnalysisResult(null);
    try {
      const result =
        activeTab === "text" && conversationMode
          ? await analysisApi.analyzeConversation(lines)
          : await analysisApi.analyzeMessage(lines[0]);
      if (result.error) {
        setStage("error");
        const msg = result._network ? "Server not reachable" : result.error || "Unable to analyze. Try again.";
        setErrorDetail(msg);
        triggerToast("Analysis failed", msg);
        return;
      }
      setAnalysisResult(result);
      setStage("success");
    } catch {
      setStage("error");
      setErrorDetail("Unable to analyze. Try again.");
      triggerToast("Analysis failed", "Unable to analyze. Try again.");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stage]);

  return (
    <div className="app-shell min-h-screen flex font-body overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-grow flex flex-col min-w-0 relative z-10">
        <TopNavbar title="Chat Analysis" />

        {/* Chat Area */}
        <div className="flex-grow flex flex-col items-center justify-between p-4 md:p-8 overflow-y-auto relative" ref={scrollRef}>
          <div className="w-full max-w-4xl flex flex-col gap-6 pt-4 pb-24">
            {/* Empty State */}
            {stage === "default" && (
              <div className="flex flex-col items-center justify-center text-center mt-20">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-accent-violet text-[40px]">security</span>
                </div>
                <h2 className="text-2xl font-headline font-bold text-[var(--text-primary)] mb-2">FraudSentinel Intelligence</h2>
                <p className="text-[var(--text-secondary)] max-w-sm">Paste a suspicious message, email, or conversation snippet to run it through the behavioral engine.</p>
              </div>
            )}

            {/* Error State */}
            {stage === "error" && (
              <div className="flex flex-col items-center justify-center text-center mt-20">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-red-500 text-[40px]">error_outline</span>
                </div>
                <h2 className="text-xl font-headline font-bold text-[var(--text-primary)] mb-2">Analysis failed</h2>
                <p className="text-[var(--text-secondary)] max-w-sm mb-6">{errorDetail || "Unable to analyze. Try again."}</p>
                <HoverButton onClick={() => { setStage("default"); setErrorDetail(""); }} className="bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border-default)] px-6 py-2 rounded-xl font-bold hover:bg-[var(--surface-3)] transition-colors">
                  Dismiss
                </HoverButton>
              </div>
            )}

            {/* User Bubbles */}
            {(stage === "loading" || stage === "success") && submittedMessages.length > 0 && (
              <Reveal>
                <div className="flex flex-col items-end gap-2 mb-6">
                  {submittedMessages.map((msg, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm text-sm max-w-md shadow-glow-violet whitespace-pre-wrap break-words">
                      {msg}
                    </div>
                  ))}
                </div>
              </Reveal>
            )}

            {/* Loading */}
            {stage === "loading" && (
              <Reveal delay={0.2}>
                <div className="flex justify-start">
                  <ChatAnalysisLoading />
                </div>
              </Reveal>
            )}

            {/* Success */}
            {stage === "success" && (
              <div className="flex justify-start relative">
                <AIResponseBubble setInsightsOpen={setInsightsOpen} setFeedbackOpen={setIsFeedbackOpen} result={analysisResult} />
                {analysisResult?.conversation_id && (
                  <div className="absolute top-2 -right-16 md:-right-24 flex flex-col gap-2">
                    <Link
                      to={`/visualization?id=${analysisResult.conversation_id}`}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm border glass-card !p-0 text-[var(--text-tertiary)] hover:text-accent-violet hover:border-accent-violet/30"
                      title="View intelligence report"
                    >
                      <span className="material-symbols-outlined text-[20px]">article</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[var(--surface-0)] via-[var(--surface-0)] to-transparent pt-10 pb-6 px-4 md:px-8 flex flex-col items-center z-20">
          <div className="w-full max-w-4xl flex flex-wrap items-center gap-2 mb-2">
            {[
              { id: "text", icon: "notes", label: "Text" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setInputError(""); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl font-bold text-sm transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "border-accent-violet text-accent-violet glass-card !rounded-b-none !shadow-none"
                    : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span> {tab.label}
              </button>
            ))}
            {activeTab === "text" && (
              <div className="flex items-center gap-1 ml-auto text-xs font-semibold text-[var(--text-tertiary)]">
                <span className="hidden sm:inline">Mode:</span>
                <button
                  type="button"
                  onClick={() => { setConversationMode(false); setInputError(""); }}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${!conversationMode ? "border-accent-violet/30 bg-accent-violet/10 text-accent-violet" : "border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-secondary)]"}`}
                >
                  One message
                </button>
                <button
                  type="button"
                  onClick={() => { setConversationMode(true); setInputError(""); }}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${conversationMode ? "border-accent-violet/30 bg-accent-violet/10 text-accent-violet" : "border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-secondary)]"}`}
                >
                  Conversation
                </button>
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="w-full max-w-4xl relative">
            <div className="relative glass-card !rounded-b-2xl !rounded-tr-2xl flex flex-col justify-end min-h-[100px]">
              {activeTab === "text" && (
                <textarea
                  className={`w-full bg-transparent p-4 pr-16 text-sm focus:outline-none resize-none overflow-y-auto text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ${inputError ? "border-red-500 focus:ring-1 focus:ring-red-500" : ""}`}
                  placeholder={conversationMode ? "One message per line (e.g. Hello, then Send OTP now)..." : "Paste a message, email, or conversation snippet to analyze..."}
                  value={inputMessage}
                  onChange={(e) => { setInputMessage(e.target.value); if (inputError) setInputError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                  disabled={stage === "loading"}
                  rows={conversationMode ? 5 : 2}
                />
              )}
              {activeTab === "url" && (
                <div className="flex items-center w-full p-2 h-full">
                  <div className="bg-[var(--surface-2)] p-3 rounded-xl flex items-center justify-center text-[var(--text-tertiary)] mr-2">
                    <span className="material-symbols-outlined">public</span>
                  </div>
                  <input
                    type="url"
                    className={`flex-grow bg-transparent text-sm focus:outline-none pr-14 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ${inputError ? "text-red-500" : ""}`}
                    placeholder="Enter URL to analyze for phishing..."
                    value={inputUrl}
                    onChange={(e) => { setInputUrl(e.target.value); if (inputError) setInputError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(e); } }}
                    disabled={stage === "loading"}
                  />
                </div>
              )}
              {activeTab !== "file" && (
                <button
                  type="submit"
                  disabled={(activeTab === "text" && !inputMessage.trim()) || (activeTab === "url" && !inputUrl.trim()) || stage === "loading"}
                  className="absolute right-3 bottom-3 w-10 h-10 bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-full flex items-center justify-center disabled:opacity-30 disabled:bg-[var(--surface-3)] disabled:from-transparent disabled:to-transparent disabled:text-[var(--text-tertiary)] transition-all shadow-glow-violet disabled:shadow-none"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                </button>
              )}
            </div>
            {inputError && <p className="text-red-500 text-xs font-bold mt-2 absolute -bottom-6 left-2">{inputError}</p>}
            <p className="text-center text-xs text-[var(--text-tertiary)] mt-6">
              Signed-in analyses are stored for History. The core model runs in your local API.
            </p>
          </form>
        </div>

        {/* Insights Overlay */}
        <AnimatePresence>
          {isInsightsOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setInsightsOpen(false)}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm z-20"
              />
              <InsightsPanel onClose={() => setInsightsOpen(false)} result={analysisResult} previewText={lastPreviewText} />
            </>
          )}
        </AnimatePresence>

        <FeedbackDetailModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          onSubmit={async (reason) => {
            setIsFeedbackOpen(false);
            if (analysisResult?.conversation_id) {
              await feedbackApi.submit({
                conversation_id: analysisResult.conversation_id,
                is_correct: false,
                reason: reason,
              });
            }
            triggerToast("Feedback Submitted", "Thank you! Your feedback helps improve the system.");
          }}
        />
        <ToastNotification show={showToast} onClose={() => setShowToast(false)} message={toastConfig.title} subtext={toastConfig.subtext} />
      </div>
    </div>
  );
}
