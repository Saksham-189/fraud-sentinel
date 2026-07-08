import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sidebar, TopNavbar, ToastNotification } from "./Dashboard";
import { HoverButton } from "../components/Motion";
import { motion, AnimatePresence } from "framer-motion";
import { analysisApi } from "../services/api";
import { buildLegacyIntelligenceFallback, IntelligenceDetails } from "../components/Intelligence";

// ─── Helpers ────────────────────────────────────────────────────────

function riskBucketFromLevel(level) {
  const u = (level || "").toUpperCase();
  if (u.includes("HIGH")) return "HIGH";
  if (u.includes("MEDIUM") || u.includes("MODERATE")) return "MEDIUM";
  return "SAFE";
}

function mapHistoryItem(item) {
  const res = item.result || {};
  const prob = res.fraud_probability ?? res.final_score ?? res.risk_summary?.weighted_risk ?? 0;
  const levelStr = res.behavior_level || res.risk_level || res.final_risk_level || "";
  const risk = riskBucketFromLevel(levelStr);
  const input = item.input || {};
  const msgs = input.messages || (input.text != null ? [{ text: String(input.text) }] : []);
  const lastText = msgs.length ? msgs[msgs.length - 1].text : "";
  const titleBase = lastText || "Analysis";
  const title = titleBase.length > 48 ? `${titleBase.slice(0, 48)}…` : titleBase;
  const ma = res.messages_analysis;
  const messages = msgs.map((m, j) => {
    const per = Array.isArray(ma) && ma[j] ? ma[j] : null;
    return {
      id: `${item.id}-${j}`,
      text: m.text,
      sender: "other",
      risk: per?.fraud_probability ?? prob,
      highlighted: false,
    };
  });
  const intelligence = buildLegacyIntelligenceFallback(res, input);
  return {
    id: item.id, title, lastMessage: lastText, risk, prob: Number(prob) || 0,
    time: item.timestamp ? (() => { try { return new Date(item.timestamp).toLocaleString(); } catch { return "Recently"; } })() : "Recently",
    behavior: res.behavior_score ?? 0, levelLabel: levelStr,
    explanation: intelligence.summary || res.explanation || res.llm_explanation || res.reasoning || "No explanation stored.",
    messages, keySignals: [], intelligence, inputText: getTextForConversation(input, res),
  };
}

function getTextForConversation(input, result) {
  if (input?.text) return String(input.text);
  if (Array.isArray(input?.messages)) return input.messages.map((m) => m?.text || "").filter(Boolean).join("\n");
  if (Array.isArray(result?.messages_analysis)) return result.messages_analysis.map((m) => m?.text || "").filter(Boolean).join("\n");
  return "";
}

// ─── Risk Badge ─────────────────────────────────────────────────────

function RiskBadge({ level }) {
  const styles = {
    HIGH: "from-red-500/10 to-pink-500/10 text-red-500 border-red-500/20",
    MEDIUM: "from-amber-500/10 to-orange-500/10 text-amber-500 border-amber-500/20",
    SAFE: "from-emerald-500/10 to-cyan-500/10 text-emerald-500 border-emerald-500/20",
  };
  const icon = { HIGH: "warning", MEDIUM: "info", SAFE: "check_circle" };
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-gradient-to-r ${styles[level]} uppercase tracking-wider`}>
      <span className="material-symbols-outlined text-[12px]">{icon[level]}</span>
      {level}
    </div>
  );
}

// ─── Skeletons & Empty State ────────────────────────────────────────

function HistoryListSkeleton() {
  return (
    <div className="flex flex-col">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 border-b border-[var(--border-default)] flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="h-4 animate-shimmer rounded w-2/3" />
            <div className="h-3 animate-shimmer rounded w-8" />
          </div>
          <div className="h-3 animate-shimmer rounded w-5/6 mt-1" />
          <div className="flex justify-between items-center mt-2">
            <div className="h-5 animate-shimmer rounded-full w-16" />
            <div className="h-3 animate-shimmer rounded w-6" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, desc, ctaTo }) {
  return (
    <div className="p-8 text-center flex flex-col items-center justify-center h-full">
      <div className="w-16 h-16 bg-[var(--surface-2)] rounded-2xl flex items-center justify-center mb-4 text-[var(--text-tertiary)]">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      <h3 className="font-headline font-bold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs">{desc}</p>
      {ctaTo && (
        <Link to={ctaTo}>
          <HoverButton className="bg-gradient-to-r from-violet-600 to-pink-500 text-white px-5 py-2 rounded-xl font-semibold text-sm shadow-glow-violet">
            Analyze your first message
          </HoverButton>
        </Link>
      )}
    </div>
  );
}

// ─── History List (Left Panel) ──────────────────────────────────────

function HistoryList({ conversations, activeId, setActiveId, filter, setFilter, searchQuery, setSearchQuery, isLoading, onDelete }) {
  let filtered = filter === "ALL" ? conversations : conversations.filter((c) => c.risk === filter);
  if (searchQuery) {
    filtered = filtered.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  const filterColors = {
    ALL: "from-violet-600 to-pink-500",
    HIGH: "from-red-500 to-pink-500",
    MEDIUM: "from-amber-500 to-orange-500",
    SAFE: "from-emerald-500 to-cyan-500",
  };
  return (
    <div className="w-80 md:w-96 glass-sidebar border-r border-[var(--border-default)] h-full flex flex-col shrink-0">
      <div className="p-4 border-b border-[var(--border-default)]">
        <h2 className="font-headline font-bold text-[var(--text-primary)] text-lg mb-4">Conversations</h2>
        <div className="relative mb-3">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl text-sm focus:ring-2 focus:ring-accent-violet/20 focus:border-accent-violet outline-none transition-all text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {["ALL", "HIGH", "MEDIUM", "SAFE"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f ? `bg-gradient-to-r ${filterColors[f]} text-white shadow-sm` : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <HistoryListSkeleton />
        ) : conversations.length === 0 ? (
          <EmptyState icon="history" title="No conversations yet" desc="You haven't run any analysis yet. Start now." ctaTo="/analyze" />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search_off" title="No matching results found" desc="Try adjusting your search or filters." />
        ) : (
          <div className="flex flex-col">
            <AnimatePresence>
              {filtered.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={() => setActiveId(c.id)}
                  className={`relative p-4 border-b border-[var(--border-default)] cursor-pointer transition-all group ${
                    activeId === c.id
                      ? "bg-accent-violet/5 border-l-[3px] border-l-accent-violet"
                      : "hover:bg-[var(--surface-2)] border-l-[3px] border-l-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm text-[var(--text-primary)] truncate pr-2">{c.title}</h4>
                    <span className="text-[10px] text-[var(--text-tertiary)] whitespace-nowrap group-hover:hidden block">{c.time}</span>
                    <div className="hidden group-hover:flex items-center gap-1 absolute right-2 top-2 glass-card !p-0.5 !rounded-lg">
                      <Link to={`/visualization?id=${c.id}`} onClick={(e) => e.stopPropagation()} className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-accent-violet hover:bg-accent-violet/10 transition-colors" title="View report">
                        <span className="material-symbols-outlined text-[14px]">article</span>
                      </Link>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Delete">
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] truncate mb-2">{c.lastMessage}</p>
                  <div className="flex items-center justify-between mt-2">
                    <RiskBadge level={c.risk} />
                    <span className={`text-xs font-bold ${c.prob > 0.7 ? "text-red-500" : c.prob > 0.3 ? "text-amber-500" : "text-emerald-500"}`}>
                      {(c.prob * 100).toFixed(0)}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chat Message ───────────────────────────────────────────────────

function ChatMessage({ msg }) {
  const content = msg.highlighted ? (
    <span>
      {msg.text.split("OTP").map((part, i, arr) =>
        i < arr.length - 1 ? <span key={i}>{part}<span className="bg-pink-500/20 text-pink-500 px-1 rounded font-medium">OTP</span></span> : part
      )}
    </span>
  ) : msg.text;
  const isUser = msg.sender === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 group`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center shrink-0 mr-3 mt-1">
          <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[16px]">person</span>
        </div>
      )}
      <div className={`max-w-[75%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-glow-violet"
            : "glass-card !rounded-tl-sm"
        }`}>
          {content}
        </div>
        {!isUser && msg.risk !== undefined && (
          <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              msg.risk > 0.7 ? "bg-red-500/10 text-red-500" : msg.risk > 0.3 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
            }`}>
              {(msg.risk * 100).toFixed(0)}% Risk
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chat Panel (Center) ────────────────────────────────────────────

function ChatPanel({ conversation, toggleInsights, showInsights, onDelete, onContinue }) {
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!conversation) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <EmptyState icon="forum" title="Select a conversation" desc="Click on a conversation in the list to view its details." />
      </div>
    );
  }

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setIsSubmitting(true);
    if (onContinue) await onContinue(conversation.id, inputText.trim());
    setIsSubmitting(false);
    setInputText("");
  };

  const riskGradient = conversation.risk === "HIGH" ? "from-red-500 to-pink-500" : conversation.risk === "MEDIUM" ? "from-amber-500 to-orange-500" : "from-emerald-500 to-cyan-500";
  const intelligence = conversation.intelligence;
  const primaryAction = intelligence?.recommended_actions?.[0] || "Review the analysis details.";

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden relative">
      {/* Header */}
      <div className="h-16 px-6 glass border-b border-[var(--border-default)] flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <h2 className="font-headline font-bold text-[var(--text-primary)] text-lg truncate max-w-[200px] md:max-w-xs">{conversation.title}</h2>
          <RiskBadge level={conversation.risk} />
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/visualization?id=${conversation.id}`} className="p-2 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-accent-violet/10 hover:text-accent-violet transition-colors" title="View intelligence report">
            <span className="material-symbols-outlined text-[20px]">article</span>
          </Link>
          <button onClick={() => onDelete(conversation.id)} className="p-2 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-red-500/10 hover:text-red-500 transition-colors" title="Delete">
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
          <div className="w-px h-6 bg-[var(--border-default)] mx-1" />
          <HoverButton onClick={toggleInsights} className={`p-2 rounded-lg flex items-center justify-center transition-colors ${showInsights ? "bg-accent-violet/10 text-accent-violet" : "text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]"}`} title="Toggle Insights">
            <span className="material-symbols-outlined text-[20px]">analytics</span>
          </HoverButton>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="p-6 shrink-0 glass border-b border-[var(--border-default)] z-10">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${riskGradient} text-white shadow-lg`}>
            <span className="material-symbols-outlined text-[24px]">
              {conversation.risk === "HIGH" ? "warning" : conversation.risk === "MEDIUM" ? "info" : "verified"}
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-headline font-bold text-[var(--text-primary)]">{intelligence?.classification?.primary || "Analysis Summary"}</h3>
              {intelligence && (
                <span className="text-xs font-bold text-[var(--text-tertiary)]">
                  Confidence {(Number(intelligence.confidence) * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">{conversation.explanation}</p>
            <p className="text-sm text-[var(--text-primary)] mt-2"><span className="font-bold">Recommended:</span> {primaryAction}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-6 scroll-smooth scrollbar-hide">
        {conversation.messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        {isSubmitting && (
          <div className="flex justify-end mb-4">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm opacity-50 flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> Analyzing...
            </div>
          </div>
        )}
      </div>

      {/* Continue Input */}
      <div className="p-4 glass border-t border-[var(--border-default)] shrink-0 z-20">
        <form onSubmit={handleContinue} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSubmitting}
            placeholder="Type a reply to continue analysis..."
            className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-full pl-6 pr-14 py-3 text-sm focus:ring-2 focus:ring-accent-violet/20 focus:border-accent-violet outline-none transition-all text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-full flex items-center justify-center shadow-sm disabled:opacity-30 disabled:from-[var(--surface-3)] disabled:to-[var(--surface-3)] disabled:text-[var(--text-tertiary)] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Insights Panel (Right) ────────────────────────────────────────

function InsightsPanel({ conversation }) {
  if (!conversation) return null;
  return (
    <div className="w-80 md:w-[430px] glass-sidebar border-l border-[var(--border-default)] h-full flex flex-col shrink-0 overflow-y-auto scrollbar-hide">
      <div className="p-4 border-b border-[var(--border-default)] sticky top-0 glass z-10">
        <h2 className="font-headline font-bold text-[var(--text-primary)] text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-violet">insights</span> Analysis Explanation
        </h2>
      </div>
      <div className="p-5">
        <IntelligenceDetails intelligence={conversation.intelligence} text={conversation.inputText} compact />
      </div>
    </div>
  );
}

// ─── Main History Page ──────────────────────────────────────────────

export default function History() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [showInsights, setShowInsights] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [convoToDelete, setConvoToDelete] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastConfig, setToastConfig] = useState({ title: "", subtext: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError("");
      try {
        const data = await analysisApi.getHistory();
        if (cancelled) return;
        if (data?.error) {
          setLoadError(data._network ? "Server not reachable." : data.error || "Unable to load history.");
          setConversations([]); setActiveId(null); return;
        }
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(mapHistoryItem);
          setConversations(mapped);
          setActiveId(mapped[0]?.id ?? null);
        } else { setConversations([]); setActiveId(null); }
      } catch { if (!cancelled) { setLoadError("Server not reachable."); setConversations([]); } }
      finally { if (!cancelled) setIsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const triggerToast = (title, subtext) => { setToastConfig({ title, subtext }); setShowToast(true); };
  const activeConversation = conversations.find((c) => c.id === activeId);

  const confirmDelete = async () => {
    if (!convoToDelete) return;
    try { await analysisApi.deleteConversation(convoToDelete); } catch (e) { console.error(e); }
    setConversations((prev) => prev.filter((c) => c.id !== convoToDelete));
    if (activeId === convoToDelete) setActiveId(null);
    setDeleteModalOpen(false); setConvoToDelete(null);
    triggerToast("Conversation Deleted", "The item has been removed from your history.");
  };

  const handleContinueConversation = async (id, text) => {
    try {
      const result = await analysisApi.continueConversation(id, text);
      if (result && !result.error) {
        const updated = await analysisApi.getConversation(id);
        if (updated && !updated.error) {
          const mapped = mapHistoryItem(updated);
          setConversations((prev) => prev.map((c) => (c.id === id ? mapped : c)));
        }
      } else { triggerToast("Error", result.error || "Failed to continue conversation"); }
    } catch { triggerToast("Error", "Server not reachable"); }
  };

  return (
    <div className="app-shell min-h-screen flex font-body overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
        <TopNavbar title="Conversation History" />

        <div className="flex-grow flex overflow-hidden">
          {loadError && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 glass-card !rounded-xl px-4 py-2 text-sm font-medium text-amber-500 border-l-4 !border-l-amber-500">
              {loadError}
            </div>
          )}
          <HistoryList
            conversations={conversations} activeId={activeId} setActiveId={setActiveId}
            filter={filter} setFilter={setFilter} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            isLoading={isLoading} onDelete={(id) => { setConvoToDelete(id); setDeleteModalOpen(true); }}
          />
          <ChatPanel
            conversation={isLoading ? null : activeConversation}
            toggleInsights={() => setShowInsights(!showInsights)}
            showInsights={showInsights}
            onDelete={(id) => { setConvoToDelete(id); setDeleteModalOpen(true); }}
            onContinue={handleContinueConversation}
          />
          {showInsights && !isLoading && activeConversation && (
            <InsightsPanel conversation={activeConversation} />
          )}
        </div>

        {/* Delete Modal */}
        <AnimatePresence>
          {deleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative glass-strong rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-glow-pink">
                  <span className="material-symbols-outlined text-[32px]">delete</span>
                </div>
                <h3 className="text-xl font-headline font-bold text-[var(--text-primary)] mb-2">Delete Conversation?</h3>
                <p className="text-[var(--text-secondary)] mb-6 text-sm">This action cannot be undone. Are you sure you want to permanently delete this analysis?</p>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-[var(--text-secondary)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors">Cancel</button>
                  <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transition-all shadow-glow-pink">Delete</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <ToastNotification show={showToast} onClose={() => setShowToast(false)} message={toastConfig.title} subtext={toastConfig.subtext} />
      </div>
    </div>
  );
}
