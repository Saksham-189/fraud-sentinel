import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sidebar, TopNavbar, ToastNotification } from "./Dashboard";
import { Reveal } from "../components/Motion";
import { BentoGrid, SpatialTile } from "../components/Bento";
import { axiosClient } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { DoodleWall, EvidenceTape, GraffitiTag, ScoutMascot } from "../components/StreetArt";

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("fs_user") || "{}"); } catch { return {}; }
}

function formatDate(value) {
  if (!value) return "Not available";
  try { return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return "Not available"; }
}

function initialsFor(nameOrEmail) {
  const text = nameOrEmail || "User";
  const namePart = text.includes("@") ? text.split("@")[0] : text;
  return namePart.split(/[.\s_-]+/).filter(Boolean).map((part) => part[0]).join("").toUpperCase().slice(0, 2) || "U";
}

function DetailRow({ label, value, icon, tone = "default" }) {
  const toneClass =
    tone === "success" ? "text-emerald-500" :
    tone === "primary" ? "text-accent-cyan" :
    tone === "warning" ? "text-amber-500" :
    "text-[var(--text-primary)]";
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-[var(--border-default)] last:border-b-0">
      <p className="text-sm font-semibold text-[var(--text-secondary)]">{label}</p>
      <div className={`flex items-center gap-2 text-sm font-bold text-right min-w-0 ${toneClass}`}>
        {icon && <span className="material-symbols-outlined text-[18px] shrink-0">{icon}</span>}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function ProfileHero({ profile }) {
  return (
    <div className="case-sheet p-6 overflow-hidden relative">
      <DoodleWall tag="LOCKER" />
      <div className="absolute right-0 top-0 h-full w-1/3 bg-[linear-gradient(to_left,color-mix(in_srgb,var(--evidence-blue)_10%,transparent),transparent)] pointer-events-none" />
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-5 min-w-0">
          <div className="w-20 h-20 rounded-md border border-[var(--border-default)] bg-[var(--surface-2)] p-[3px] shrink-0">
            <div className="w-full h-full rounded-[4px] bg-[var(--surface-1)] flex items-center justify-center text-2xl font-bold text-accent-cyan">
              {initialsFor(profile.name || profile.email)}
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-headline font-bold text-[var(--text-primary)] truncate">{profile.name || "User"}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="neon-dot neon-dot-green !w-1.5 !h-1.5 !animate-none" />
                Active
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] truncate">{profile.email || "No email available"}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-2 font-mono truncate">ID {profile.id || "Not available"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 relative z-10">
          <EvidenceTape>INVESTIGATOR ID</EvidenceTape>
          <Link to="/settings" className="px-4 py-2 rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)] text-sm font-bold hover:bg-[var(--surface-3)] transition-colors flex items-center gap-2 border border-[var(--border-default)]">
            <span className="material-symbols-outlined text-[18px]">settings</span> Settings
          </Link>
          <Link to="/history" className="px-4 py-2 rounded-md bg-[var(--text-primary)] text-[var(--surface-0)] text-sm font-bold transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">history</span> View History
          </Link>
        </div>
      </div>
    </div>
  );
}

function AccountDetails({ profile }) {
  return (
    <div className="glass-card p-6">
      <div className="mb-4">
        <h2 className="font-headline font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-cyan text-[20px]">badge</span> Account Details
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Identity and subscription information for your account.</p>
      </div>
      <DetailRow label="Full name" value={profile.name || "User"} />
      <DetailRow label="Email" value={profile.email || "Not available"} />
      <DetailRow label="Role" value={profile.role || "User"} tone="primary" />
      <DetailRow label="Plan" value="Free Tier" tone="primary" />
      <DetailRow label="Created" value={formatDate(profile.created_at)} />
      <DetailRow label="Last sign in" value={formatDate(profile.last_login)} />
    </div>
  );
}

function SecurityCard({ tokenPresent }) {
  return (
    <div className="glass-card p-6">
      <div className="mb-4">
        <h2 className="font-headline font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-cyan text-[20px]">shield</span> Security
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Current authentication and data protection status.</p>
      </div>
      <DetailRow label="Password storage" value="Hashed with bcrypt" icon="lock" tone="success" />
      <DetailRow label="Session" value={tokenPresent ? "JWT active" : "No active token"} icon={tokenPresent ? "check_circle" : "error"} tone={tokenPresent ? "success" : "warning"} />
      <DetailRow label="Data isolation" value="Enabled per user" icon="verified_user" tone="success" />
      <DetailRow label="Transport policy" value="HTTPS in production" icon="encrypted" tone="success" />
    </div>
  );
}

function getStoredPrefs() {
  try { return JSON.parse(localStorage.getItem("fs_profile_prefs") || "{}"); } catch { return {}; }
}

function PreferencesCard({ onSave }) {
  const [prefs, setPrefs] = useState(() => ({ emailAlerts: true, autoSaveHistory: true, compactReports: false, ...getStoredPrefs() }));
  const toggle = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem("fs_profile_prefs", JSON.stringify(next));
    onSave();
  };
  const rows = [
    { key: "emailAlerts", label: "Security alerts", desc: "Show important account and analysis warnings." },
    { key: "autoSaveHistory", label: "Save analysis history", desc: "Keep signed-in analyses available in History." },
    { key: "compactReports", label: "Compact reports", desc: "Use denser spacing on intelligence reports." },
  ];
  return (
    <div className="glass-card p-6">
      <div className="mb-4">
        <h2 className="font-headline font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-cyan text-[20px]">tune</span> Profile Preferences
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Personalize how FraudSentinel behaves for this account.</p>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border-default)] hover:bg-[var(--surface-2)] transition-colors">
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{row.label}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{row.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(row.key)}
              className={`w-11 h-6 rounded-full p-1 transition-all shrink-0 ${prefs[row.key] ? "bg-accent-cyan" : "bg-[var(--surface-3)]"}`}
              aria-label={row.label}
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${prefs[row.key] ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DangerZone({ onLogout }) {
  return (
    <div className="glass-card !border-red-500/20 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-headline font-bold text-lg text-red-500 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">warning</span> Danger Zone
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Sign out of this browser and clear local session data.</p>
        </div>
        <button
          onClick={onLogout}
          className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span> Log out
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, title: "", subtext: "" });
  const navigate = useNavigate();
  const { logout } = useAuth();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token && localStorage.getItem("fs_authed") !== "true") { navigate("/login"); return; }
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      try {
        const meResponse = await (token ? axiosClient.get("/auth/me") : Promise.resolve(null));
        if (cancelled) return;
        if (meResponse?.data?.success) {
          const apiUser = meResponse.data.data || {};
          setProfile((prev) => ({ ...prev, ...apiUser }));
          localStorage.setItem("fs_user", JSON.stringify({ id: apiUser.id, name: apiUser.name, email: apiUser.email }));
        }
      } finally { if (!cancelled) setLoading(false); }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [navigate, token]);

  const normalizedProfile = useMemo(() => {
    const stored = getStoredUser();
    return {
      id: profile.id || stored.id || localStorage.getItem("user_id") || "Not available",
      name: profile.name || stored.name || stored.email?.split("@")[0] || "User",
      email: profile.email || stored.email || "Not available",
      role: profile.role || "User",
      created_at: profile.created_at,
      last_login: profile.last_login,
      is_active: profile.is_active ?? true,
    };
  }, [profile]);

  const handleLogout = () => { logout(); localStorage.removeItem("username"); localStorage.removeItem("user_id"); navigate("/login"); };
  const showSavedToast = () => setToast({ show: true, title: "Preferences updated", subtext: "Your profile preferences were saved locally." });

  return (
    <div className="app-shell min-h-screen flex font-body overflow-x-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-grow flex flex-col min-w-0 relative z-10">
        <TopNavbar title="Profile" />
        <main className="flex-grow p-4 md:p-8 max-w-[1180px] mx-auto w-full pb-20">
          <Reveal>
            <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <GraffitiTag tone="yellow">Investigator Locker</GraffitiTag>
                <h1 className="text-3xl font-headline font-black text-[var(--text-primary)] tracking-tight mt-3">Profile</h1>
                <p className="text-[var(--text-secondary)] mt-1">Manage your identity, security status, and account preferences.</p>
              </div>
              <ScoutMascot mood="safe" className="hidden md:block w-20 h-20" />
              {loading && (
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-tertiary)]">
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Syncing account
                </span>
              )}
            </div>
          </Reveal>

          <BentoGrid>
            <SpatialTile span="full" className="p-6">
              <ProfileHero profile={normalizedProfile} />
            </SpatialTile>
            <SpatialTile span="wide" className="p-6">
              <AccountDetails profile={normalizedProfile} />
            </SpatialTile>
            <SpatialTile span="wide" className="p-6">
              <SecurityCard tokenPresent={Boolean(token)} />
            </SpatialTile>
            <SpatialTile span="wide" className="p-6">
              <PreferencesCard onSave={showSavedToast} />
            </SpatialTile>
            <SpatialTile span="wide" className="p-6">
              <DangerZone onLogout={handleLogout} />
            </SpatialTile>
          </BentoGrid>
        </main>
      </div>
      <ToastNotification show={toast.show} message={toast.title} subtext={toast.subtext} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
    </div>
  );
}
