import { useState, useRef, useEffect } from "react";
import { Sidebar, TopNavbar, ToastNotification } from "./Dashboard";
import { Reveal, StaggerContainer, StaggerItem, HoverCard, HoverButton } from "../components/Motion";
import { motion, AnimatePresence } from "framer-motion";
import { analysisApi } from "../services/api";
function riskBucket(level) {
  const u = (level || "").toUpperCase();
  if (u.includes("HIGH")) return "HIGH";
  if (u.includes("MEDIUM") || u.includes("MODERATE")) return "MEDIUM";
  return "SAFE";
}
function featuresToBarData(features) {
  if (!features || typeof features !== "object") return [];
  const keys = [
    ["credential_intent", "Credential Intent", "#d946ef"],
    ["urgency", "Urgency", "#3b82f6"],
    ["fear", "Fear", "#f43f5e"],
    ["authority", "Authority", "#6366f1"],
    ["link_risk", "Link Risk", "#10b981"],
  ];
  return keys.map(([k, name, fill]) => ({
    name,
    score: Math.round((Number(features[k]) || 0) * 100),
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
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, YAxis as BarYAxis, XAxis as BarXAxis
} from "recharts";
function ChatAnalysisLoading() {
  return (
    <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 w-fit">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
      <span className="font-semibold text-sm">Analyzing...</span>
    </div>
  );
}
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
    HIGH: { bg: "bg-red-100 text-red-600", badge: "bg-red-100 text-red-800 border-red-200", icon: "warning" },
    MEDIUM: { bg: "bg-amber-100 text-amber-600", badge: "bg-amber-100 text-amber-800 border-amber-200", icon: "info" },
    SAFE: { bg: "bg-emerald-100 text-emerald-600", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: "check_circle" },
  };
  const style = levelStyles[bucket];
  return (
    <Reveal>
      <div className="flex flex-col gap-3">
        <div className="bg-white border border-surface-variant rounded-2xl p-6 shadow-sm max-w-2xl">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined">{style.icon}</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="font-bold text-slate-900">Analysis Complete</h3>
                <span className={`${style.badge} border px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider max-w-[220px] truncate`} title={levelLabel}>
                  {levelLabel || `${bucket} risk`}
                </span>
                <span className="text-xs font-bold text-slate-500">Fraud {(prob * 100).toFixed(0)}%</span>
                {result?.behavior_score != null && (
                  <span className="text-xs font-bold text-slate-400">
                    Behavior {(Number(result.behavior_score) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-4">
                {explanation}
              </p>
              <HoverButton onClick={() => setInsightsOpen(true)} className="bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">
                View Detailed Insights
              </HoverButton>
            </div>
          </div>
        </div>
        {}
        <div className="bg-slate-100/50 border border-slate-200 rounded-xl p-3 flex items-center justify-between w-full max-w-2xl text-sm">
          <span className="text-slate-600 font-medium">Was this analysis correct?</span>
          <div className="flex gap-2">
            <button 
              onClick={async () => {
                setFeedbackGiven("positive");
                if (result?.conversation_id) {
                   try {
                     await import("../services/api").then(m => m.feedbackApi.submit({
                       conversation_id: result.conversation_id,
                       is_correct: true,
                       reason: "correct"
                     }));
                   } catch(e) {}
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${feedbackGiven === "positive" ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'} border shadow-sm`}
            >
              <span className="material-symbols-outlined text-[16px]">thumb_up</span> Correct
            </button>
            <button 
              onClick={() => {
                setFeedbackGiven("negative");
                setFeedbackOpen(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${feedbackGiven === "negative" ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'} border shadow-sm`}
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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          ></motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full border border-slate-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">What went wrong?</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { id: "false_positive", label: "False positive", desc: "Flagged a safe message as fraud." },
                { id: "missed_fraud", label: "Missed fraud", desc: "Did not detect an actual scam." },
                { id: "wrong_explanation", label: "Wrong explanation", desc: "The reasoning was incorrect." },
                { id: "other", label: "Other", desc: "Something else." }
              ].map(opt => (
                <label key={opt.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="radio" name="feedback_reason" value={opt.id} checked={reason === opt.id} onChange={(e) => setReason(e.target.value)} className="mt-1 accent-primary" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{opt.label}</h4>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="mb-6">
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none h-20"
                placeholder="Add details (optional)..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              ></textarea>
            </div>
            <div className="flex gap-3 w-full">
              <HoverButton onClick={handleSubmit} disabled={!reason} className={`flex-1 py-2.5 rounded-xl font-semibold text-white bg-primary shadow-sm transition-colors ${!reason ? 'opacity-50 cursor-not-allowed' : ''}`}>
                Submit Feedback
              </HoverButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
function InsightsPanel({ onClose, result, previewText }) {
  const prob = result?.fraud_probability ?? 0;
  const levelLabel = result?.behavior_level ?? "";
  const bucket = riskBucket(levelLabel);
  const ringColor =
    bucket === "HIGH" ? "text-red-500" : bucket === "MEDIUM" ? "text-amber-500" : "text-emerald-500";
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
      className="absolute top-0 right-0 w-full md:w-[450px] lg:w-[550px] h-full bg-white border-l border-surface-variant shadow-2xl flex flex-col z-30"
    >
      <div className="p-6 border-b border-surface-variant flex items-center justify-between bg-slate-50">
        <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">insights</span> Detailed Breakdown
        </h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-8">
        <section className="flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center mb-4">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
              <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="314" strokeDashoffset={314 - (prob * 314)} className={`${ringColor} transition-all duration-1500`} />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900">{(prob * 100).toFixed(0)}<span className="text-lg text-slate-500 font-bold">%</span></span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider max-w-full truncate ${
            bucket === "HIGH" ? "bg-red-100 text-red-800" : bucket === "MEDIUM" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
          }`}>{levelLabel || "Risk profile"}</div>
        </section>
        <section>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Detected Signals</h3>
          <div className="h-48">
            {behaviorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={behaviorData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <BarXAxis type="number" domain={[0, 100]} hide />
                  <BarYAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} width={110} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                    {behaviorData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500">No feature breakdown available.</p>
            )}
          </div>
        </section>
        <section>
           <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Input preview</h3>
           <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm leading-relaxed text-slate-700 font-medium whitespace-pre-wrap break-words">
            {previewText || "—"}
          </div>
        </section>
        <section>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Risk Escalation</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="index" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, dy: 5 }} />
                <YAxis domain={[0, 1]} tickFormatter={(val) => `${val * 100}%`} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Line type="stepAfter" dataKey="risk" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
export default function Analyze() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stage, setStage] = useState("default");
  const [activeTab, setActiveTab] = useState("text"); // 'text' | 'url' | 'file'
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
  const [isSaved, setIsSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const scrollRef = useRef(null);
  const triggerToast = (title, subtext) => {
    setToastConfig({ title, subtext });
    setShowToast(true);
  };
  const handleSave = async () => {
    if (!analysisResult?.conversation_id) {
      triggerToast("Nothing to save", "Run an analysis first.");
      return;
    }
    setIsSaved(true);
    triggerToast(
      "Saved to history",
      `Reference ${analysisResult.conversation_id.slice(0, 8)}… — view under History.`
    );
  };
  const handleExport = (type) => {
    setShowExportMenu(false);
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      triggerToast("Export Complete", `Report downloaded as ${type.toUpperCase()}`);
    }, 1500);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    let lines = [];
    let preview = "";
    if (activeTab === "text") {
      if (!inputMessage.trim()) {
        setInputError("Please enter a message to analyze.");
        return;
      }
      if (conversationMode) {
        lines = inputMessage.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        if (lines.length === 0) {
          setInputError("Enter at least one non-empty line.");
          return;
        }
        preview = lines.join("\n");
      } else {
        lines = [inputMessage.trim()];
        preview = lines[0];
      }
    } else if (activeTab === "url") {
      if (!inputUrl.trim() || !inputUrl.includes(".")) {
        setInputError("Please enter a valid URL.");
        return;
      }
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
    setIsSaved(false);
    setAnalysisResult(null);
    try {
      const result =
        activeTab === "text" && conversationMode
          ? await analysisApi.analyzeConversation(lines)
          : await analysisApi.analyzeMessage(lines[0]);
      if (result.error) {
        setStage("error");
        const msg = result._network
          ? "Server not reachable"
          : result.error || "Unable to analyze. Try again.";
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
    <div className="bg-slate-50 min-h-screen flex font-body-md text-slate-900 overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-grow flex flex-col min-w-0 relative">
        <TopNavbar title="Chat Analysis" />
        {}
        <div className="flex-grow flex flex-col items-center justify-between p-4 md:p-8 overflow-y-auto relative" ref={scrollRef}>
          <div className="w-full max-w-4xl flex flex-col gap-6 pt-4 pb-24">
            {}
            {stage === "default" && (
              <div className="flex flex-col items-center justify-center text-center mt-20 opacity-60">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6 text-slate-400">
                  <span className="material-symbols-outlined text-[40px]">security</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">FraudSentinel Intelligence</h2>
                <p className="text-slate-600 max-w-sm">Paste a suspicious message, email, or conversation snippet to run it through the behavioral engine.</p>
              </div>
            )}
            {}
            {stage === "error" && (
              <div className="flex flex-col items-center justify-center text-center mt-20">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600">
                  <span className="material-symbols-outlined text-[40px]">error_outline</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Analysis failed</h2>
                <p className="text-slate-600 max-w-sm mb-6">
                  {errorDetail || "Unable to analyze. Try again."}
                </p>
                <HoverButton onClick={() => { setStage("default"); setErrorDetail(""); }} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-slate-300">
                  Dismiss
                </HoverButton>
              </div>
            )}
            {}
            {(stage === "loading" || stage === "success") && submittedMessages.length > 0 && (
              <Reveal>
                <div className="flex flex-col items-end gap-2 mb-6">
                  {submittedMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800 text-white px-5 py-3 rounded-2xl rounded-tr-sm text-sm max-w-md shadow-sm whitespace-pre-wrap break-words"
                    >
                      {msg}
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
                {}
                <div className="absolute top-2 -right-16 md:-right-24 flex flex-col gap-2">
                  <button onClick={handleSave} disabled={isSaved} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm border ${isSaved ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-white text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-50'}`}>
                    <span className="material-symbols-outlined text-[20px]">{isSaved ? "check_circle" : "bookmark"}</span>
                  </button>
                  <div className="relative">
                    <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={isExporting} className="w-10 h-10 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-full flex items-center justify-center transition-all shadow-sm">
                      {isExporting ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-[20px]">download</span>}
                    </button>
                    <AnimatePresence>
                      {showExportMenu && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute top-0 left-12 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30">
                          <button onClick={() => handleExport("pdf")} className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 border-b border-slate-100">As PDF</button>
                          <button onClick={() => handleExport("json")} className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">As JSON</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-10 pb-6 px-4 md:px-8 flex flex-col items-center z-20">
          <div className="w-full max-w-4xl flex flex-wrap items-center gap-2 mb-2">
            {[
              { id: "text", icon: "notes", label: "Text" },
              { id: "url", icon: "link", label: "URL" },
              { id: "file", icon: "upload_file", label: "File" }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setInputError(""); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl font-bold text-sm transition-colors border-b-2 ${activeTab === tab.id ? 'border-primary text-primary bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span> {tab.label}
              </button>
            ))}
            {activeTab === "text" && (
              <div className="flex items-center gap-1 ml-auto text-xs font-semibold text-slate-500">
                <span className="hidden sm:inline">Mode:</span>
                <button
                  type="button"
                  onClick={() => { setConversationMode(false); setInputError(""); }}
                  className={`px-3 py-1.5 rounded-lg border ${!conversationMode ? "border-primary bg-primary/10 text-primary" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  One message
                </button>
                <button
                  type="button"
                  onClick={() => { setConversationMode(true); setInputError(""); }}
                  className={`px-3 py-1.5 rounded-lg border ${conversationMode ? "border-primary bg-primary/10 text-primary" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  Conversation
                </button>
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="w-full max-w-4xl relative">
            <div className="relative shadow-lg rounded-b-2xl rounded-tr-2xl border border-slate-200 bg-white flex flex-col justify-end min-h-[100px]">
              {activeTab === "text" && (
                <textarea 
                  className={`w-full bg-transparent p-4 pr-16 text-sm focus:outline-none resize-none overflow-y-auto ${inputError ? 'border-red-500 focus:ring-1 focus:ring-red-500' : ''}`}
                  placeholder={conversationMode ? "One message per line (e.g. Hello, then Send OTP now)..." : "Paste a message, email, or conversation snippet to analyze..."}
                  value={inputMessage}
                  onChange={(e) => { setInputMessage(e.target.value); if (inputError) setInputError(""); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                  disabled={stage === "loading"}
                  rows={conversationMode ? 5 : 2}
                ></textarea>
              )}
              {activeTab === "url" && (
                <div className="flex items-center w-full p-2 h-full">
                  <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-center text-slate-400 mr-2">
                    <span className="material-symbols-outlined">public</span>
                  </div>
                  <input 
                    type="url"
                    className={`flex-grow bg-transparent text-sm focus:outline-none pr-14 ${inputError ? 'text-red-600' : 'text-slate-800'}`}
                    placeholder="Enter URL to analyze for phishing..."
                    value={inputUrl}
                    onChange={(e) => { setInputUrl(e.target.value); if (inputError) setInputError(""); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e); } }}
                    disabled={stage === "loading"}
                  />
                </div>
              )}
              {activeTab === "file" && (
                <div className="w-full h-full min-h-[120px] border-2 border-dashed border-slate-200 m-2 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-primary/50 transition-colors cursor-pointer group">
                  <span className="material-symbols-outlined text-[32px] group-hover:text-primary transition-colors mb-2">cloud_upload</span>
                  <span className="text-sm font-semibold group-hover:text-primary">Drag & drop or click to upload</span>
                  <span className="text-xs text-slate-400 mt-1">Accepts .txt, .pdf (Max 5MB)</span>
                </div>
              )}
              {activeTab !== "file" && (
                <button 
                  type="submit" 
                  disabled={(activeTab === "text" && !inputMessage.trim()) || (activeTab === "url" && !inputUrl.trim()) || stage === "loading"} 
                  className="absolute right-3 bottom-3 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                </button>
              )}
            </div>
            {inputError && <p className="text-red-500 text-xs font-bold mt-2 absolute -bottom-6 left-2">{inputError}</p>}
            <p className="text-center text-xs text-slate-400 mt-6">
              Signed-in analyses are stored for History. The core model runs in your local API.
            </p>
          </form>
        </div>
        {}
        <AnimatePresence>
          {isInsightsOpen && (
            <>
              {}
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setInsightsOpen(false)}
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-20"
              ></motion.div>
              <InsightsPanel
                onClose={() => setInsightsOpen(false)}
                result={analysisResult}
                previewText={lastPreviewText}
              />
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
                 reason: reason
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