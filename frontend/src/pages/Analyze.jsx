import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar, TopNavbar, ToastNotification } from "./Dashboard";
import { Reveal, HoverButton } from "../components/Motion";
import { analysisApi, feedbackApi } from "../services/api";
import { buildLegacyIntelligenceFallback, IntelligenceDetails, riskTone } from "../components/Intelligence";

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

function AIResponseBubble({ setInsightsOpen, setFeedbackOpen, result }) {
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const intelligence = buildLegacyIntelligenceFallback(result);
  const tone = riskTone(intelligence.risk_level);
  const primaryAction = intelligence.recommended_actions?.[0] || "Review the analysis details.";

  return (
    <Reveal>
      <div className="flex flex-col gap-3">
        <div className="glass-card p-6 max-w-2xl">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tone.gradient} text-white flex items-center justify-center shrink-0 shadow-lg`}>
              <span className="material-symbols-outlined">{tone.icon}</span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="font-headline font-bold text-[var(--text-primary)]">{intelligence.verdict || "Analysis Complete"}</h3>
                <span className={`${tone.badge} border px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                  {intelligence.risk_level} risk
                </span>
                <span className="text-xs font-bold text-[var(--text-tertiary)]">Score {(Number(intelligence.risk_score) * 100).toFixed(0)}/100</span>
                <span className="text-xs font-bold text-[var(--text-tertiary)]">Confidence {(Number(intelligence.confidence) * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)] mb-1">{intelligence.classification?.primary}</p>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-2">{intelligence.decision?.primary_reason || intelligence.summary}</p>
              <p className="text-[var(--text-tertiary)] text-xs leading-relaxed mb-3">{intelligence.summary}</p>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] mb-4">
                <span className="font-bold">Recommended:</span> {primaryAction}
              </div>
              <HoverButton onClick={() => setInsightsOpen(true)} className="bg-[var(--surface-2)] text-accent-violet border border-[var(--border-default)] px-4 py-2 rounded-xl text-sm font-semibold hover:border-accent-violet/30 transition-all">
                <span className="material-symbols-outlined text-[16px] mr-1.5 align-middle">fact_check</span>
                View Evidence
              </HoverButton>
            </div>
          </div>
        </div>

        <div className="glass-card !rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full max-w-2xl text-sm">
          <span className="text-[var(--text-secondary)] font-medium">Was this analysis correct?</span>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setFeedbackGiven("positive");
                if (result?.conversation_id) {
                  try {
                    await feedbackApi.submit({ conversation_id: result.conversation_id, is_correct: true, reason: "correct" });
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

function FeedbackDetailModal({ isOpen, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const handleSubmit = () => {
    onSubmit(reason, details);
    setReason("");
    setDetails("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
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
            <textarea
              className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-accent-violet/20 outline-none resize-none h-20 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] mb-6"
              placeholder="Add details (optional)..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
            <HoverButton onClick={handleSubmit} disabled={!reason} className={`w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-pink-500 shadow-glow-violet transition-all ${!reason ? "opacity-40 cursor-not-allowed shadow-none" : ""}`}>
              Submit Feedback
            </HoverButton>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function InsightsPanel({ onClose, result, previewText }) {
  const intelligence = buildLegacyIntelligenceFallback(result, { text: previewText });
  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 w-full md:w-[520px] lg:w-[620px] h-full glass-strong border-l border-[var(--border-default)] shadow-2xl flex flex-col z-30"
    >
      <div className="p-6 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-2)]/50">
        <h2 className="font-headline font-bold text-[var(--text-primary)] text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-violet">insights</span> Analysis Explanation
        </h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-3)] text-[var(--text-tertiary)] transition-colors">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-6 scrollbar-hide">
        <IntelligenceDetails intelligence={intelligence} text={previewText} compact />
      </div>
    </motion.div>
  );
}

export default function Analyze() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stage, setStage] = useState("default");
  const [conversationMode, setConversationMode] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!inputMessage.trim()) {
      setInputError("Please enter a message to analyze.");
      return;
    }

    const lines = conversationMode
      ? inputMessage.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
      : [inputMessage.trim()];
    if (lines.length === 0) {
      setInputError("Enter at least one non-empty line.");
      return;
    }

    const preview = lines.join("\n");
    setInputError("");
    setErrorDetail("");
    setSubmittedMessages(lines);
    setLastPreviewText(preview);
    setInputMessage("");
    setStage("loading");
    setInsightsOpen(false);
    setAnalysisResult(null);

    try {
      const result = conversationMode
        ? await analysisApi.analyzeConversation(lines)
        : await analysisApi.analyzeMessage(lines[0]);
      if (result.error) {
        const message = result._network ? "Server not reachable" : result.error || "Unable to analyze. Try again.";
        setStage("error");
        setErrorDetail(message);
        triggerToast("Analysis failed", message);
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

        <div className="flex-grow flex flex-col items-center justify-between p-4 md:p-8 overflow-y-auto relative" ref={scrollRef}>
          <div className="w-full max-w-4xl flex flex-col gap-6 pt-4 pb-24">
            {stage === "default" && (
              <div className="flex flex-col items-center justify-center text-center mt-20">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-accent-violet text-[40px]">security</span>
                </div>
                <h2 className="text-2xl font-headline font-bold text-[var(--text-primary)] mb-2">FraudSentinel Intelligence</h2>
                <p className="text-[var(--text-secondary)] max-w-sm">Paste a suspicious message, email, or conversation snippet to get evidence, confidence, and next steps.</p>
              </div>
            )}

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

            {(stage === "loading" || stage === "success") && submittedMessages.length > 0 && (
              <Reveal>
                <div className="flex flex-col items-end gap-2 mb-6">
                  {submittedMessages.map((message, index) => (
                    <div key={index} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm text-sm max-w-md shadow-glow-violet whitespace-pre-wrap break-words">
                      {message}
                    </div>
                  ))}
                </div>
              </Reveal>
            )}

            {stage === "loading" && (
              <Reveal delay={0.2}>
                <div className="flex justify-start">
                  <ChatAnalysisLoading />
                </div>
              </Reveal>
            )}

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

        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[var(--surface-0)] via-[var(--surface-0)] to-transparent pt-10 pb-6 px-4 md:px-8 flex flex-col items-center z-20">
          <div className="w-full max-w-4xl flex flex-wrap items-center gap-2 mb-2">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-t-xl font-bold text-sm transition-all border-b-2 border-accent-violet text-accent-violet glass-card !rounded-b-none !shadow-none">
              <span className="material-symbols-outlined text-[18px]">notes</span> Text
            </button>
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
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-4xl relative">
            <div className="relative glass-card !rounded-b-2xl !rounded-tr-2xl flex flex-col justify-end min-h-[100px]">
              <textarea
                className={`w-full bg-transparent p-4 pr-16 text-sm focus:outline-none resize-none overflow-y-auto text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ${inputError ? "border-red-500 focus:ring-1 focus:ring-red-500" : ""}`}
                placeholder={conversationMode ? "One message per line (e.g. Hello, then Send OTP now)..." : "Paste a message, email, or conversation snippet to analyze..."}
                value={inputMessage}
                onChange={(event) => { setInputMessage(event.target.value); if (inputError) setInputError(""); }}
                onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); handleSubmit(event); } }}
                disabled={stage === "loading"}
                rows={conversationMode ? 5 : 2}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || stage === "loading"}
                className="absolute right-3 bottom-3 w-10 h-10 bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-full flex items-center justify-center disabled:opacity-30 disabled:bg-[var(--surface-3)] disabled:from-transparent disabled:to-transparent disabled:text-[var(--text-tertiary)] transition-all shadow-glow-violet disabled:shadow-none"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
              </button>
            </div>
            {inputError && <p className="text-red-500 text-xs font-bold mt-2 absolute -bottom-6 left-2">{inputError}</p>}
            <p className="text-center text-xs text-[var(--text-tertiary)] mt-6">
              Signed-in analyses are stored for History. Analysis runs through your FraudSentinel backend.
            </p>
          </form>
        </div>

        <AnimatePresence>
          {isInsightsOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInsightsOpen(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm z-20" />
              <InsightsPanel onClose={() => setInsightsOpen(false)} result={analysisResult} previewText={lastPreviewText} />
            </>
          )}
        </AnimatePresence>

        <FeedbackDetailModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          onSubmit={async (reason, details) => {
            setIsFeedbackOpen(false);
            if (analysisResult?.conversation_id) {
              await feedbackApi.submit({
                conversation_id: analysisResult.conversation_id,
                is_correct: false,
                reason: details ? `${reason}: ${details}` : reason,
              });
            }
            triggerToast("Feedback Submitted", "Thank you. Your feedback helps improve the system.");
          }}
        />
        <ToastNotification show={showToast} onClose={() => setShowToast(false)} message={toastConfig.title} subtext={toastConfig.subtext} />
      </div>
    </div>
  );
}
