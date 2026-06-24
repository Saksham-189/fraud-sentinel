import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Reveal, StaggerContainer, StaggerItem, HoverButton, AnimatedCounter } from "../components/Motion";
import { motion, AnimatePresence } from "framer-motion";
import { performLogout } from "./Auth";
import { analysisApi } from "../services/api";

// ─── Shared Components ──────────────────────────────────────────────

function RiskBadge({ level }) {
  const normalized = (level || "").toUpperCase().replace(/\s+/g, "");
  let key = "SAFE";
  if (normalized.includes("HIGH")) key = "HIGH";
  else if (normalized.includes("MEDIUM")) key = "MEDIUM";

  const styles = {
    HIGH: "bg-gradient-to-r from-red-500/10 to-pink-500/10 text-red-500 border-red-500/20",
    MEDIUM: "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-500 border-amber-500/20",
    SAFE: "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 text-emerald-500 border-emerald-500/20",
  };
  const icon = { HIGH: "warning", MEDIUM: "info", SAFE: "check_circle" };
  const label = { HIGH: "High Risk", MEDIUM: "Medium Risk", SAFE: "Safe" };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[key]}`}>
      <span className="material-symbols-outlined text-[14px]">{icon[key]}</span>
      {label[key]}
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────

const sidebarNavItems = [
  { name: "Dashboard", icon: "dashboard", to: "/dashboard" },
  { name: "Analyze", icon: "forum", to: "/analyze" },
  { name: "History", icon: "history", to: "/history" },
  { name: "Settings", icon: "settings", to: "/settings" },
];

function SidebarContent({ isCollapsed }) {
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("fs_user") || '{"name":"User"}');
  const displayName = user.name || user.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <>
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-[var(--border-default)]">
        {!isCollapsed && (
          <span className="font-headline text-lg font-bold gradient-text tracking-tight whitespace-nowrap">
            FraudSentinel
          </span>
        )}
        {isCollapsed && (
          <span className="font-headline text-lg font-bold gradient-text mx-auto">FS</span>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-grow py-4 px-3 flex flex-col gap-1 overflow-y-auto scrollbar-hide">
        {sidebarNavItems.map((item) => {
          const isActive = currentPath === item.to;
          return (
            <Link
              key={item.name}
              to={item.to || "#"}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                ${isActive
                  ? "bg-accent-violet/10 text-accent-violet font-semibold"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-violet-500 to-pink-500"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:scale-110 ${isActive ? "fill" : ""}`}>
                {item.icon}
              </span>
              {!isCollapsed && <span className="text-sm">{item.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-[var(--border-default)]">
        <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 p-[2px] shrink-0">
            <div className="w-full h-full rounded-full bg-[var(--surface-1)] flex items-center justify-center font-bold text-xs text-accent-violet">
              {initials}
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{displayName}</span>
              <span className="text-xs text-[var(--text-tertiary)]">Free Plan</span>
            </div>
          )}
        </Link>
        <button
          onClick={() => performLogout(navigate)}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </>
  );
}

export function Sidebar({ isCollapsed }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: isCollapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="glass-sidebar border-r border-[var(--border-default)] h-screen sticky top-0 flex-col hidden md:flex overflow-hidden z-30"
      >
        <SidebarContent isCollapsed={isCollapsed} />
      </motion.aside>

      {/* Mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-screen w-[260px] glass-strong shadow-2xl z-50 flex flex-col md:hidden"
            >
              <SidebarContent isCollapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile FAB */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 left-6 z-30 md:hidden w-12 h-12 bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-full shadow-glow-violet flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>
    </>
  );
}

export function TopNavbar({ title }) {
  return (
    <header className="glass sticky top-0 z-20 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center gap-4 border-b border-[var(--border-default)]">
      <h1 className="font-headline text-xl md:text-2xl font-bold text-[var(--text-primary)] truncate">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        <div className="relative hidden lg:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-full text-sm w-56 focus:ring-2 focus:ring-accent-violet/20 focus:border-accent-violet outline-none transition-all text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
        </div>
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
          className="fixed top-6 right-6 glass-strong px-5 py-3.5 rounded-2xl shadow-lg flex items-center gap-3 z-50 border-l-4 border-l-emerald-500"
        >
          <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
          <div>
            <p className="font-semibold text-sm text-[var(--text-primary)]">{message}</p>
            {subtext && <p className="text-xs text-[var(--text-secondary)]">{subtext}</p>}
          </div>
          <button onClick={onClose} className="ml-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Dashboard Cards ────────────────────────────────────────────────

function SkeletonPulse({ className, tag: Tag = "div" }) {
  return <Tag className={`animate-shimmer rounded ${className}`} />;
}

function WelcomeBanner({ userName, totalAnalyses, isLoading }) {
  const displayName = userName || "there";
  const greeting = totalAnalyses > 0
    ? `${totalAnalyses} analyse${totalAnalyses === 1 ? "" : "s"} completed`
    : "Get started by analyzing your first message below.";
  return (
    <Reveal>
      <div className="glass-card px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="font-headline text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            Welcome back,{" "}
            {isLoading ? (
              <SkeletonPulse tag="span" className="inline-block w-24 h-6 align-middle" />
            ) : (
              <span className="gradient-text">{displayName}</span>
            )}{" "}
            <span className="animate-wave">👋</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isLoading ? <SkeletonPulse tag="span" className="inline-block w-40 h-4 align-middle" /> : greeting}
          </p>
        </div>
        <Link to="/history" className="text-sm font-semibold text-accent-violet hover:opacity-80 flex items-center gap-1 shrink-0 transition-opacity">
          <span className="material-symbols-outlined text-[18px]">history</span>
          View History
        </Link>
      </div>
    </Reveal>
  );
}

function QuickAnalyzeHero({ onAnalysisComplete }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const result = await analysisApi.analyzeMessage(text);
      if (result && !result.error) {
        setShowToast(true);
        setText("");
        if (onAnalysisComplete) onAnalysisComplete();
        setTimeout(() => navigate("/analyze", { state: { prefill: text, result } }), 1200);
      }
    } catch {
      // silently handle
    }
    setLoading(false);
  };

  return (
    <Reveal delay={0.05}>
      <div className="glass-card p-6 glow-border">
        <h3 className="font-headline font-bold text-lg text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-violet">bolt</span>
          Quick Analyze
        </h3>
        <div className="relative">
          <textarea
            className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-2xl p-4 pr-32 text-sm focus:ring-2 focus:ring-accent-violet/20 outline-none resize-none h-28 transition-all text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            placeholder="Paste a suspicious message, SMS, email, or conversation snippet here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="absolute bottom-4 right-4">
            <HoverButton
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              className={`bg-gradient-to-r from-violet-600 to-pink-500 text-white px-5 py-2 rounded-xl font-semibold shadow-glow-violet flex items-center gap-2 transition-all ${(!text.trim() || loading) ? "opacity-40 cursor-not-allowed shadow-none" : ""}`}
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">send</span>
              )}
              {loading ? "Scanning..." : "Analyze"}
            </HoverButton>
          </div>
        </div>
      </div>
      <ToastNotification show={showToast} onClose={() => setShowToast(false)} message="Analysis Complete" subtext="Redirecting to results..." />
    </Reveal>
  );
}

function StatsCards({ stats, isLoading }) {
  const cards = [
    {
      title: "Total Analyses",
      value: stats.total_analyses,
      icon: "analytics",
      gradient: "from-violet-500 to-indigo-500",
      glowClass: "hover:shadow-glow-violet",
    },
    {
      title: "High Risk Found",
      value: stats.high_risk,
      icon: "warning",
      gradient: "from-red-500 to-pink-500",
      glowClass: "hover:shadow-glow-pink",
    },
    {
      title: "Safe Messages",
      value: stats.safe,
      icon: "verified_user",
      gradient: "from-emerald-500 to-cyan-500",
      glowClass: "hover:shadow-glow-cyan",
    },
  ];

  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => (
        <StaggerItem key={c.title}>
          <div className={`glass-card p-5 flex items-center gap-4 transition-shadow ${c.glowClass}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${c.gradient} text-white shrink-0 shadow-lg`}>
              <span className="material-symbols-outlined text-[22px]">{c.icon}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{c.title}</p>
              {isLoading ? (
                <SkeletonPulse className="w-12 h-8 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  <AnimatedCounter value={c.value} />
                </p>
              )}
            </div>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}

function RecentAnalysesList({ analyses, isLoading }) {
  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <SkeletonPulse className="w-32 h-6" />
          <SkeletonPulse className="w-16 h-4" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl">
              <SkeletonPulse className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-grow">
                <SkeletonPulse className="w-3/4 h-4 mb-2" />
                <SkeletonPulse className="w-20 h-3" />
              </div>
              <SkeletonPulse className="w-20 h-6 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = !analyses || analyses.length === 0;

  return (
    <Reveal delay={0.15}>
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-headline font-bold text-lg text-[var(--text-primary)]">Recent Analyses</h3>
          {!isEmpty && (
            <Link className="text-sm font-semibold text-accent-violet hover:opacity-80 flex items-center gap-1 transition-opacity" to="/history">
              View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          )}
        </div>

        {isEmpty ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[28px]">inbox</span>
            </div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">No analyses yet</p>
            <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
              Paste your first suspicious message in the Quick Analyze box above to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {analyses.map((item) => (
              <Link
                key={item.id}
                to="/history"
                className="flex items-center justify-between p-3.5 rounded-xl hover:bg-[var(--surface-2)] border border-transparent hover:border-[var(--border-default)] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 overflow-hidden pr-4">
                  <div className="w-9 h-9 rounded-full bg-[var(--surface-2)] flex items-center justify-center shrink-0 group-hover:bg-[var(--surface-3)] transition-colors">
                    <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[18px]">chat</span>
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.input_text}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{formatTimeAgo(item.created_at)}</p>
                  </div>
                </div>
                <div className="shrink-0">
                  <RiskBadge level={item.threat_level} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}

function ScamTypesCard({ scamTypes, isLoading }) {
  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <SkeletonPulse className="w-48 h-6 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonPulse className="w-8 h-8 rounded-lg shrink-0" />
              <SkeletonPulse className="flex-grow h-4" />
              <SkeletonPulse className="w-12 h-4 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = !scamTypes || scamTypes.length === 0;

  const iconMap = {
    "Urgency Language": "schedule",
    "Fear / Threat Tactics": "warning",
    "Authority Impersonation": "shield_person",
    "Credential Request": "key",
    "Suspicious Links": "link",
  };
  const gradientMap = {
    "Urgency Language": "from-amber-500 to-orange-500",
    "Fear / Threat Tactics": "from-red-500 to-pink-500",
    "Authority Impersonation": "from-violet-500 to-indigo-500",
    "Credential Request": "from-fuchsia-500 to-pink-500",
    "Suspicious Links": "from-cyan-500 to-blue-500",
  };

  return (
    <Reveal delay={0.2}>
      <div className="glass-card p-6 h-full flex flex-col">
        <h3 className="font-headline font-bold text-lg text-[var(--text-primary)] mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-violet">psychology</span>
          Scam Types Detected
        </h3>

        {isEmpty ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[24px]">shield</span>
            </div>
            <p className="font-semibold text-[var(--text-primary)] text-sm mb-1">No patterns detected</p>
            <p className="text-xs text-[var(--text-secondary)] max-w-[200px]">
              Analyze messages to see common scam patterns here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 flex-grow">
            {scamTypes.map((type) => {
              const gradient = gradientMap[type.name] || "from-slate-500 to-slate-600";
              const icon = iconMap[type.name] || "category";
              return (
                <div key={type.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${gradient} text-white shrink-0`}>
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{type.name}</p>
                  </div>
                  <span className="text-xs font-bold text-[var(--text-tertiary)] shrink-0">
                    {type.count} {type.count === 1 ? "case" : "cases"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Reveal>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatTimeAgo(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

// ─── Main Dashboard ─────────────────────────────────────────────────

export default function Dashboard() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total_analyses: 0,
    high_risk: 0,
    medium_risk: 0,
    safe: 0,
    recent_analyses: [],
    top_scam_types: [],
  });

  const user = JSON.parse(localStorage.getItem("fs_user") || '{"name":"User"}');
  const displayName = user.name || user.email?.split("@")[0] || "User";

  const fetchStats = useCallback(async () => {
    try {
      const res = await analysisApi.getDashboardStats();
      if (res && !res.error) {
        setStats(res);
      }
    } catch {
      // silently fail — empty state will show
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchStats();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchStats]);

  const handleAnalysisComplete = useCallback(() => {
    setTimeout(() => fetchStats(), 500);
  }, [fetchStats]);

  return (
    <div className="app-shell min-h-screen flex font-body">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-grow flex flex-col min-w-0 relative z-10">
        <TopNavbar title="Dashboard" />
        <main className="flex-grow p-4 md:p-8 flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
          {/* 1. Compact Welcome Banner */}
          <WelcomeBanner userName={displayName} totalAnalyses={stats.total_analyses} isLoading={isLoading} />

          {/* 2. Quick Analyze — Hero position */}
          <QuickAnalyzeHero onAnalysisComplete={handleAnalysisComplete} />

          {/* 3. Stats Cards — Real data with animated counters */}
          <StatsCards stats={stats} isLoading={isLoading} />

          {/* 4. Recent Analyses + Scam Types */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <RecentAnalysesList analyses={stats.recent_analyses} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-2">
              <ScamTypesCard scamTypes={stats.top_scam_types} isLoading={isLoading} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
