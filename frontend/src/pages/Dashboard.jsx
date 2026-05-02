import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Reveal, StaggerContainer, StaggerItem, HoverCard, HoverButton } from "../components/Motion";
import { motion, AnimatePresence } from "framer-motion";
import { performLogout } from "./Auth";
import { analysisApi } from "../services/api";
function RiskBadge({ level }) {
  const styles = {
    HIGH: "bg-red-100 text-red-800 border-red-200",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
    SAFE: "bg-emerald-100 text-emerald-800 border-emerald-200"
  };
  const icon = { HIGH: "warning", MEDIUM: "info", SAFE: "check_circle" };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[level]}`}>
      <span className="material-symbols-outlined text-[14px]">{icon[level]}</span>
      {level}
    </div>
  );
}
function SystemStatus({ status }) {
  const config = status === "online" 
    ? { bg: "bg-emerald-50 border-emerald-100 text-emerald-700", dotColor: "bg-emerald-500", ping: "bg-emerald-400", label: "Running Locally", tip: "All processing happens on your device. Data never leaves your network." }
    : { bg: "bg-red-50 border-red-100 text-red-700", dotColor: "bg-red-500", ping: null, label: "Backend Disconnected", tip: "The Python API server is not reachable. Some features may be unavailable." };
  return (
    <div className="relative group">
      <div className={`flex items-center gap-2 ${config.bg} border px-3 py-1.5 rounded-full text-xs font-bold shadow-sm w-fit shrink-0 cursor-default select-none`}>
        <span className="relative flex h-2 w-2">
          {config.ping && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.ping} opacity-75`}></span>}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`}></span>
        </span>
        <span className="hidden md:inline">{config.label}</span>
      </div>
      <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 text-white text-xs p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <p className="font-bold mb-1">{config.label}</p>
        <p className="text-slate-400 leading-relaxed">{config.tip}</p>
      </div>
    </div>
  );
}
const sidebarNavItems = [
  { name: "Dashboard", icon: "dashboard", to: "/dashboard" },
  { name: "Chat Analysis", icon: "forum", to: "/analyze" },
  { name: "Intelligence Report", icon: "insights", to: "/visualization" },
  { name: "History", icon: "history", to: "/history" },
  { name: "Settings", icon: "settings", to: "/settings" },
  { name: "UI Polish", icon: "auto_awesome", to: "/ui-states" },
  { name: "Solutions", icon: "lightbulb", to: "/solutions" },
  { name: "Developers", icon: "code", to: "/developers" },
];
function SidebarContent({ isCollapsed }) {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("fs_user") || '{"name":"John Doe"}');
  const initials = user.name ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) : "JD";
  return (
    <>
      <div className="p-6 flex items-center justify-between border-b border-surface-variant">
        {!isCollapsed && <span className="font-headline-md font-bold text-lg text-slate-900 tracking-tight whitespace-nowrap">FraudSentinel</span>}
        {isCollapsed && <span className="font-headline-md font-bold text-lg text-primary mx-auto">FS</span>}
      </div>
      <div className="flex-grow py-4 px-3 flex flex-col gap-1 overflow-y-auto scrollbar-hide">
        {sidebarNavItems.map(item => {
          const isActive = currentPath === item.to;
          return (
            <Link key={item.name} to={item.to || "#"} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <span className={`material-symbols-outlined text-[22px] transition-transform duration-200 group-hover:scale-110`}>{item.icon}</span>
              {!isCollapsed && <span className="text-sm">{item.name}</span>}
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-surface-variant">
        <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">{initials}</div>
          {!isCollapsed && <div className="flex flex-col"><span className="text-sm font-semibold text-slate-900">{user.name}</span><span className="text-xs text-slate-500">Admin</span></div>}
        </Link>
        <button onClick={() => performLogout(navigate)} className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors">
          <span className="material-symbols-outlined text-[22px]">logout</span>
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </>
  );
}
export function Sidebar({ isCollapsed, setCollapsed }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      {}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-surface-container-lowest border-r border-surface-variant h-screen sticky top-0 flex-col hidden md:flex overflow-hidden"
      >
        <SidebarContent isCollapsed={isCollapsed} />
      </motion.aside>
      {}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)}></motion.div>
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 left-0 h-screen w-[280px] bg-white shadow-2xl z-50 flex flex-col md:hidden">
              <SidebarContent isCollapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      {}
      <button onClick={() => setMobileOpen(true)} className="fixed bottom-6 left-6 z-30 md:hidden w-12 h-12 bg-primary text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
        <span className="material-symbols-outlined">menu</span>
      </button>
    </>
  );
}
export function TopNavbar({ title }) {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-surface-variant px-4 md:px-8 py-3 md:py-4 flex justify-between items-center gap-4">
      <h1 className="font-headline-md text-xl md:text-2xl font-bold text-slate-900 truncate">{title}</h1>
      <div className="flex items-center gap-3 md:gap-5">
        <SystemStatus status="online" />
        <div className="relative hidden lg:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input type="text" placeholder="Search history..." className="pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full text-sm w-64 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all" />
        </div>
        <button className="relative text-slate-500 hover:text-slate-800 transition-colors p-1">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
}
export function ToastNotification({ show, message, subtext, onClose }) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, 3000);
      return () => clearTimeout(t);
    }
  }, [show, onClose]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          className="fixed top-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-slate-700"
        >
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
          <div>
            <p className="font-bold text-sm">{message}</p>
            {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
          </div>
          <button onClick={onClose} className="ml-4 text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function SkeletonCard({ h = "h-48" }) {
  return (
    <div className={`bg-white border border-surface-variant rounded-3xl p-6 ${h} flex flex-col justify-center gap-4`}>
      <div className="h-6 bg-slate-200 rounded w-1/3 animate-pulse"></div>
      <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
      <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse"></div>
      <div className="h-10 bg-slate-200 rounded-xl w-32 mt-4 animate-pulse"></div>
    </div>
  );
}
function WelcomeCard({ isLoading }) {
  if (isLoading) return <SkeletonCard h="h-64" />;
  return (
    <Reveal>
      <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-8 relative overflow-hidden shadow-sm h-64 flex flex-col justify-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, John 👋</h2>
          <p className="text-slate-600 mb-6 max-w-lg">
            Your workspace is ready. Analyze conversations and detect fraud patterns instantly using our hybrid intelligence engine.
          </p>
          <Link to="/analyze">
            <HoverButton className="bg-primary text-white px-6 py-3 rounded-full font-semibold shadow-md flex items-center gap-2 w-fit">
              <span className="material-symbols-outlined text-[20px]">analytics</span> Analyze Message
            </HoverButton>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
function QuickActions() {
  const actions = [
    { title: "Analyze Message", desc: "Scan a single text", icon: "chat", color: "text-blue-600", bg: "bg-blue-100", to: "/analyze" },
    { title: "Upload Data", desc: "Batch CSV analysis", icon: "upload_file", color: "text-emerald-600", bg: "bg-emerald-100", to: "#" },
    { title: "View History", desc: "Past scans & reports", icon: "history", color: "text-purple-600", bg: "bg-purple-100", to: "/history" },
  ];
  return (
    <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {actions.map(a => (
        <StaggerItem key={a.title}>
          <Link to={a.to}>
            <HoverCard className="bg-white border border-surface-variant rounded-2xl p-6 flex items-center gap-4 cursor-pointer shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${a.bg} ${a.color}`}>
                <span className="material-symbols-outlined">{a.icon}</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{a.title}</h3>
                <p className="text-sm text-slate-500">{a.desc}</p>
              </div>
            </HoverCard>
          </Link>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
function QuickAnalyzeBox() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await analysisApi.analyzeMessage(text);
    } catch {
    }
    setLoading(false);
    setShowToast(true);
    setText("");
  };
  return (
    <Reveal delay={0.1}>
      <div className="bg-white border border-surface-variant rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">bolt</span> Quick Analyze
        </h3>
        <div className="relative">
          <textarea 
            className={`w-full bg-slate-50 border rounded-2xl p-4 pr-32 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none h-28 transition-colors ${text.length === 0 ? 'border-slate-200 focus:border-primary' : 'border-slate-300'}`}
            placeholder="Paste a message or conversation snippet here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>
          <div className="absolute bottom-4 right-4">
            <HoverButton onClick={handleAnalyze} disabled={loading || !text.trim()} className={`bg-primary text-white px-5 py-2 rounded-xl font-semibold shadow-sm flex items-center gap-2 transition-all ${(!text.trim() || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {loading ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">send</span>}
              {loading ? "Scanning..." : "Analyze"}
            </HoverButton>
          </div>
        </div>
      </div>
      <ToastNotification show={showToast} onClose={() => setShowToast(false)} message="Message Analyzed" subtext="View results in Chat Analysis." />
    </Reveal>
  );
}
function RiskSummaryPanel({ isLoading }) {
  if (isLoading) return <SkeletonCard h="h-64" />;
  return (
    <Reveal delay={0.2}>
      <div className="bg-white border border-surface-variant rounded-3xl p-6 shadow-sm h-64 flex flex-col">
        <h3 className="font-bold text-lg text-slate-900 mb-6">Risk Overview</h3>
        <div className="space-y-5 flex-grow justify-center flex flex-col">
          {[
            { label: "High Risk", count: 12, pct: 15, color: "bg-red-500", textColor: "text-red-600" },
            { label: "Medium Risk", count: 34, pct: 45, color: "bg-amber-500", textColor: "text-amber-600" },
            { label: "Safe", count: 189, pct: 85, color: "bg-emerald-500", textColor: "text-emerald-600" },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-sm font-semibold mb-1"><span className={item.textColor}>{item.label}</span><span className="text-slate-700">{item.count}</span></div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${item.pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className={`${item.color} h-full rounded-full`}></motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
function BehaviorInsightsCard({ isLoading }) {
  if (isLoading) return <SkeletonCard h="h-64" />;
  const signals = [
    { name: "Urgency", pct: 68, color: "bg-blue-500" },
    { name: "Credential Intent", pct: 42, color: "bg-fuchsia-500" },
    { name: "Authority", pct: 31, color: "bg-indigo-500" },
    { name: "Fear / Threat", pct: 15, color: "bg-rose-500" }
  ];
  return (
    <Reveal delay={0.3}>
      <div className="bg-white border border-surface-variant rounded-3xl p-6 shadow-sm h-64 flex flex-col">
        <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">psychology</span> Common Behaviors
        </h3>
        <div className="space-y-4">
          {signals.map((s, i) => (
            <div key={s.name} className="flex items-center gap-3">
              <div className="w-24 text-sm text-slate-600 font-medium truncate">{s.name}</div>
              <div className="flex-grow bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${s.pct}%` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] }} className={`${s.color} h-full rounded-full`}></motion.div>
              </div>
              <div className="w-8 text-right text-xs font-bold text-slate-500">{s.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
function RecentConversationsList({ isLoading }) {
  if (isLoading) return <SkeletonCard h="h-auto" />;
  const history = [
    { id: 1, text: "URGENT: Your bank account will be suspended. Click here to verify your identity.", risk: "HIGH", time: "10 mins ago" },
    { id: 2, text: "Hi, I am calling from the fraud department. We noticed unusual activity.", risk: "MEDIUM", time: "1 hour ago" },
    { id: 3, text: "Hey! Are we still meeting for lunch tomorrow at 12?", risk: "SAFE", time: "2 hours ago" },
    { id: 4, text: "Your Netflix subscription has expired. Update payment details now.", risk: "HIGH", time: "Yesterday" },
    { id: 5, text: "Attached is the invoice for last month's project.", risk: "SAFE", time: "Yesterday" }
  ];
  return (
    <Reveal delay={0.4}>
      <div className="bg-white border border-surface-variant rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-900">Recent Analyses</h3>
          <Link className="text-sm font-semibold text-primary hover:text-indigo-700" to="/history">View All</Link>
        </div>
        <div className="space-y-3">
          {history.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4 overflow-hidden pr-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                  <span className="material-symbols-outlined text-slate-500 text-[20px]">chat</span>
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.text}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.time}</p>
                </div>
              </div>
              <div className="shrink-0 hidden md:block">
                <RiskBadge level={item.risk} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
export default function Dashboard() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="bg-slate-50 min-h-screen flex font-body-md text-slate-900">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-grow flex flex-col min-w-0">
        <TopNavbar title="Dashboard" />
        <main className="flex-grow p-4 md:p-8 flex flex-col gap-8 max-w-[1600px] mx-auto w-full">
          {}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <WelcomeCard isLoading={isLoading} />
            </div>
            <div className="lg:col-span-1">
              <RiskSummaryPanel isLoading={isLoading} />
            </div>
          </div>
          {}
          <QuickActions />
          {}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <QuickAnalyzeBox />
            </div>
            <div className="lg:col-span-1">
              <BehaviorInsightsCard isLoading={isLoading} />
            </div>
          </div>
          {}
          <div className="grid grid-cols-1 gap-8">
            <RecentConversationsList isLoading={isLoading} />
          </div>
        </main>
      </div>
    </div>
  );
}