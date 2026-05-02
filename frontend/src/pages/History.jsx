import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sidebar, TopNavbar, ToastNotification } from "./Dashboard";
import { Reveal, HoverButton } from "../components/Motion";
import { motion, AnimatePresence } from "framer-motion";
import { analysisApi } from "../services/api";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, YAxis as BarYAxis, XAxis as BarXAxis
} from "recharts";
function riskBucketFromLevel(level) {
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
function mapHistoryItem(item) {
  const res = item.result || {};
  const prob =
    res.fraud_probability ??
    res.final_score ??
    res.risk_summary?.weighted_risk ??
    0;
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
  const timeline = Array.isArray(ma)
    ? ma.map((m, i) => ({ index: `Msg ${i + 1}`, risk: m.fraud_probability ?? 0 }))
    : [{ index: "Msg 1", risk: prob }];
  const lastFeats =
    Array.isArray(ma) && ma.length > 0
      ? ma[ma.length - 1]?.features
      : res.features;
  const signals = featuresToBarData(lastFeats);
  return {
    id: item.id,
    title,
    lastMessage: lastText,
    risk,
    time: item.timestamp
      ? (() => {
          try {
            return new Date(item.timestamp).toLocaleString();
          } catch {
            return "Recently";
          }
        })()
      : "Recently",
    prob: Number(prob) || 0,
    behavior: res.behavior_score ?? 0,
    levelLabel: levelStr,
    explanation: res.explanation || res.llm_explanation || res.reasoning || "No explanation stored.",
    messages,
    signals,
    timeline,
    keySignals: [],
  };
}
function RiskBadge({ level }) {
  const styles = {
    HIGH: "bg-red-100 text-red-800 border-red-200",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
    SAFE: "bg-emerald-100 text-emerald-800 border-emerald-200"
  };
  const icon = { HIGH: "warning", MEDIUM: "info", SAFE: "check_circle" };
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[level]} uppercase tracking-wider`}>
      <span className="material-symbols-outlined text-[12px]">{icon[level]}</span>
      {level}
    </div>
  );
}
function HistoryListSkeleton() {
  return (
    <div className="flex flex-col">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="p-4 border-b border-surface-variant flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse"></div>
            <div className="h-3 bg-slate-100 rounded w-8 animate-pulse"></div>
          </div>
          <div className="h-3 bg-slate-100 rounded w-5/6 animate-pulse mt-1"></div>
          <div className="flex justify-between items-center mt-2">
            <div className="h-5 bg-slate-200 rounded-full w-16 animate-pulse"></div>
            <div className="h-3 bg-slate-100 rounded w-6 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
function EmptyState({ icon, title, desc, ctaTo }) {
  return (
    <div className="p-8 text-center flex flex-col items-center justify-center h-full">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">{desc}</p>
      {ctaTo && (
        <Link to={ctaTo}>
          <HoverButton className="bg-primary text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-sm">
            Analyze your first message
          </HoverButton>
        </Link>
      )}
    </div>
  );
}
function HistoryList({ conversations, activeId, setActiveId, filter, setFilter, searchQuery, setSearchQuery, isLoading, onDelete, onSave, onExport }) {
  let filtered = filter === "ALL" ? conversations : conversations.filter(c => c.risk === filter);
  if (searchQuery) {
    filtered = filtered.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  return (
    <div className="w-80 md:w-96 bg-white border-r border-surface-variant h-full flex flex-col shrink-0">
      {}
      <div className="p-4 border-b border-surface-variant bg-slate-50/50">
        <h2 className="font-bold text-slate-900 text-lg mb-4">Conversations</h2>
        <div className="relative mb-3">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input 
            type="text" 
            placeholder="Search history..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {["ALL", "HIGH", "MEDIUM", "SAFE"].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      {}
      <div className="flex-grow overflow-y-auto bg-white">
        {isLoading ? (
          <HistoryListSkeleton />
        ) : conversations.length === 0 ? (
          <EmptyState icon="history" title="No conversations yet" desc="You haven't run any analysis yet. Start now." ctaTo="/analyze" />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search_off" title="No matching results found" desc="Try adjusting your search or filters." />
        ) : (
          <div className="flex flex-col">
            <AnimatePresence>
              {filtered.map(c => (
                <motion.div 
                  key={c.id} 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={() => setActiveId(c.id)}
                  className={`relative p-4 border-b border-surface-variant cursor-pointer transition-all group ${activeId === c.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm text-slate-900 truncate pr-2">{c.title}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap group-hover:hidden block">{c.time}</span>
                    <div className="hidden group-hover:flex items-center gap-1 absolute right-2 top-2 bg-white/90 shadow-sm rounded-lg border border-slate-100 p-0.5">
                      <button onClick={(e) => { e.stopPropagation(); onSave(c.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Save"><span className="material-symbols-outlined text-[14px]">bookmark</span></button>
                      <button onClick={(e) => { e.stopPropagation(); onExport(c.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Export"><span className="material-symbols-outlined text-[14px]">download</span></button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-2">{c.lastMessage}</p>
                  <div className="flex items-center justify-between mt-2">
                    <RiskBadge level={c.risk} />
                    <span className={`text-xs font-bold ${c.prob > 0.7 ? 'text-red-500' : c.prob > 0.3 ? 'text-amber-500' : 'text-emerald-500'}`}>
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
function ChatMessage({ msg }) {
  const content = msg.highlighted ? (
    <span>
      {msg.text.split("OTP").map((part, i, arr) => 
        i < arr.length - 1 ? <span key={i}>{part}<span className="bg-red-200 text-red-900 px-1 rounded font-medium">OTP</span></span> : part
      )}
    </span>
  ) : msg.text;
  const isUser = msg.sender === "user";
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mr-3 mt-1">
          <span className="material-symbols-outlined text-slate-500 text-[16px]">person</span>
        </div>
      )}
      <div className={`max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
          {content}
        </div>
        {!isUser && msg.risk !== undefined && (
          <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${msg.risk > 0.7 ? 'bg-red-100 text-red-700' : msg.risk > 0.3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {(msg.risk * 100).toFixed(0)}% Risk
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
function ChatPanel({ conversation, toggleInsights, showInsights, onDelete, onExport, onContinue }) {
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  if (!conversation) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-50">
        <EmptyState icon="forum" title="Select a conversation" desc="Click on a conversation in the list to view its details." />
      </div>
    );
  }
  const handleContinue = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setIsSubmitting(true);
    if (onContinue) {
      await onContinue(conversation.id, inputText.trim());
    }
    setIsSubmitting(false);
    setInputText("");
  };
  return (
    <div className="flex-grow flex flex-col bg-slate-50 h-full overflow-hidden relative">
      {}
      <div className="h-16 px-6 bg-white border-b border-surface-variant flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-slate-900 text-lg truncate max-w-[200px] md:max-w-xs">{conversation.title}</h2>
          <RiskBadge level={conversation.risk} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSaved(true)} className={`p-2 rounded-lg flex items-center justify-center transition-colors ${isSaved ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`} title={isSaved ? "Saved" : "Save"}>
            <span className="material-symbols-outlined text-[20px]">{isSaved ? "check_circle" : "bookmark"}</span>
          </button>
          <button onClick={() => onExport(conversation.id)} className="p-2 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors" title="Export">
            <span className="material-symbols-outlined text-[20px]">download</span>
          </button>
          <button onClick={() => onDelete(conversation.id)} className="p-2 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <HoverButton onClick={toggleInsights} className={`p-2 rounded-lg flex items-center justify-center transition-colors ${showInsights ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100'}`} title="Toggle Insights">
            <span className="material-symbols-outlined text-[20px]">analytics</span>
          </HoverButton>
        </div>
      </div>
      {}
      <div className="p-6 shrink-0 bg-white border-b border-slate-100 shadow-sm z-10">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${conversation.risk === 'HIGH' ? 'bg-red-100 text-red-600' : conversation.risk === 'MEDIUM' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
            <span className="material-symbols-outlined text-[24px]">
              {conversation.risk === 'HIGH' ? 'warning' : conversation.risk === 'MEDIUM' ? 'info' : 'verified'}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Analysis Summary</h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{conversation.explanation}</p>
          </div>
        </div>
      </div>
      {}
      <div className="flex-grow overflow-y-auto p-6 scroll-smooth">
        {conversation.messages.map(msg => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        {isSubmitting && (
           <div className="flex justify-end mb-4">
             <div className="bg-primary text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm opacity-50 flex items-center gap-2">
               <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> Analyzing...
             </div>
           </div>
        )}
      </div>
      {}
      <div className="p-4 bg-white border-t border-surface-variant shrink-0 z-20">
        <form onSubmit={handleContinue} className="relative flex items-center">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSubmitting}
            placeholder="Type a reply to continue analysis..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-6 pr-14 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors disabled:opacity-50 disabled:bg-slate-100"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || isSubmitting}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
function InsightsPanel({ conversation }) {
  if (!conversation) return null;
  return (
    <div className="w-80 md:w-96 bg-white border-l border-surface-variant h-full flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-surface-variant sticky top-0 bg-white/90 backdrop-blur-md z-10">
        <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">insights</span> Detailed Insights
        </h2>
      </div>
      <div className="p-6 space-y-8">
        {}
        <section>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Behavior Breakdown</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversation.signals} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <BarXAxis type="number" domain={[0, 100]} hide />
                <BarYAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} width={90} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={12}>
                  {conversation.signals.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        {}
        <section>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Risk Timeline</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversation.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="index" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, dy: 5 }} />
                <YAxis domain={[0, 1]} tickFormatter={(val) => `${val * 100}%`} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Line type="stepAfter" dataKey="risk" stroke={conversation.risk === 'HIGH' ? '#ef4444' : conversation.risk === 'MEDIUM' ? '#f59e0b' : '#10b981'} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        {}
        {conversation.keySignals && conversation.keySignals.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Detected Signals</h3>
            <div className="space-y-3">
              {conversation.keySignals.map((signal, idx) => (
                <div key={idx} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${signal.color}`}>
                    <span className="material-symbols-outlined text-[16px]">{signal.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{signal.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{signal.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
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
          setLoadError(
            data._network ? "Server not reachable." : data.error || "Unable to load history."
          );
          setConversations([]);
          setActiveId(null);
          return;
        }
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(mapHistoryItem);
          setConversations(mapped);
          setActiveId(mapped[0]?.id ?? null);
        } else {
          setConversations([]);
          setActiveId(null);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Server not reachable.");
          setConversations([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const triggerToast = (title, subtext) => {
    setToastConfig({ title, subtext });
    setShowToast(true);
  };
  const activeConversation = conversations.find(c => c.id === activeId);
  const confirmDelete = async () => {
    if (!convoToDelete) return;
    try {
      await analysisApi.deleteConversation(convoToDelete);
    } catch (e) {
      console.error(e);
    }
    setConversations(prev => prev.filter(c => c.id !== convoToDelete));
    if (activeId === convoToDelete) {
      setActiveId(null);
    }
    setDeleteModalOpen(false);
    setConvoToDelete(null);
    triggerToast("Conversation Deleted", "The item has been removed from your history.");
  };
  const handleContinueConversation = async (id, text) => {
    try {
      const result = await analysisApi.continueConversation(id, text);
      if (result && !result.error) {
        const updated = await analysisApi.getConversation(id);
        if (updated && !updated.error) {
          const mapped = mapHistoryItem(updated);
          setConversations(prev => prev.map(c => c.id === id ? mapped : c));
        }
      } else {
        triggerToast("Error", result.error || "Failed to continue conversation");
      }
    } catch (e) {
      triggerToast("Error", "Server not reachable");
    }
  };
  const handleExport = (id) => {
    triggerToast("Export Complete", "Conversation exported as PDF.");
  };
  const handleSave = (id) => {
    triggerToast("Conversation Saved", "You can access this in your saved items.");
  };
  return (
    <div className="bg-slate-50 min-h-screen flex font-body-md text-slate-900 overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden relative">
        <TopNavbar title="Conversation History" />
        {}
        <div className="flex-grow flex overflow-hidden">
          {loadError && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium px-4 py-2 rounded-lg shadow">
              {loadError}
            </div>
          )}
          <HistoryList 
            conversations={conversations} 
            activeId={activeId} 
            setActiveId={setActiveId} 
            filter={filter}
            setFilter={setFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isLoading={isLoading}
            onDelete={(id) => { setConvoToDelete(id); setDeleteModalOpen(true); }}
            onExport={handleExport}
            onSave={handleSave}
          />
          <ChatPanel 
            conversation={isLoading ? null : activeConversation} 
            toggleInsights={() => setShowInsights(!showInsights)}
            showInsights={showInsights}
            onDelete={(id) => { setConvoToDelete(id); setDeleteModalOpen(true); }}
            onExport={handleExport}
            onContinue={handleContinueConversation}
          />
          {showInsights && !isLoading && activeConversation && (
            <InsightsPanel conversation={activeConversation} />
          )}
        </div>
        {}
        <AnimatePresence>
          {deleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)}></motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                  <span className="material-symbols-outlined text-[32px]">delete</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Conversation?</h3>
                <p className="text-slate-500 mb-6 text-sm">This action cannot be undone. Are you sure you want to permanently delete this analysis?</p>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                  <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm">Delete</button>
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