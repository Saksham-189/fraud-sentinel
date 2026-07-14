import { useState } from "react";
import { Sidebar, TopNavbar, ToastNotification } from "./Dashboard";
import { Reveal } from "../components/Motion";
import { BentoGrid, SpatialTile } from "../components/Bento";
import { useTheme } from "../context/ThemeContext";
import { EvidenceTape, GraffitiTag, ScoutMascot } from "../components/StreetArt";

function readPrefs() {
  try { return JSON.parse(localStorage.getItem("fs_user_preferences") || "{}"); } catch { return {}; }
}

function SettingRow({ icon, title, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-md bg-[var(--surface-1)] border border-[var(--border-default)] text-accent-cyan flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-label={label}
      aria-pressed={checked}
      className={`w-12 h-7 rounded-full p-1 transition-all ${checked ? "bg-accent-cyan" : "bg-[var(--surface-3)]"}`}
    >
      <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function ThemePreview({ theme, active, onClick }) {
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-md border-2 p-4 transition-all ${active ? "border-accent-cyan" : "border-[var(--border-default)] hover:border-[var(--border-strong)]"}`}
    >
      <div className={`h-28 rounded-xl border overflow-hidden ${dark ? "bg-[#09090b] border-[#27272a]" : "bg-[#fafafa] border-[#e4e4e7]"}`}>
        <div className={`h-7 border-b ${dark ? "bg-[#111114] border-[#27272a]" : "bg-white border-[#e4e4e7]"}`} />
        <div className="p-3 space-y-2">
          <div className={`h-3 w-2/3 rounded ${dark ? "bg-[#fafafa]" : "bg-[#09090b]"}`} />
          <div className={`h-3 w-full rounded ${dark ? "bg-[#27272a]" : "bg-[#e4e4e7]"}`} />
          <div className="h-3 w-1/2 rounded bg-accent-cyan" />
        </div>
      </div>
      <p className="font-headline font-bold text-[var(--text-primary)] mt-3">{dark ? "Street Case Dark" : "Case Paper Light"}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-1">{dark ? "Default obsidian case desk with controlled street-art accents." : "Warm paper mode for daytime review."}</p>
    </button>
  );
}

export default function Settings() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState(() => ({ motion: true, compactReports: false, saveHistory: true, ...readPrefs() }));
  const [toast, setToast] = useState({ show: false, title: "", subtext: "" });

  const savePrefs = (nextPrefs) => {
    setPrefs(nextPrefs);
    localStorage.setItem("fs_user_preferences", JSON.stringify(nextPrefs));
    setToast({ show: true, title: "Settings updated", subtext: "Your preferences were saved on this device." });
  };

  const togglePref = (key) => savePrefs({ ...prefs, [key]: !prefs[key] });

  const chooseTheme = (nextTheme) => {
    setTheme(nextTheme);
    setToast({ show: true, title: `${nextTheme === "dark" ? "Dark" : "Light"} theme enabled`, subtext: "Theme preference saved." });
  };

  return (
    <div className="app-shell min-h-screen flex font-body overflow-x-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-grow flex flex-col min-w-0 relative z-10">
        <TopNavbar title="Settings" />
        <main className="flex-grow p-4 md:p-8 max-w-[980px] mx-auto w-full pb-20">
          <Reveal>
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <GraffitiTag tone="yellow">Investigator Locker</GraffitiTag>
                  <h1 className="text-3xl md:text-4xl font-headline font-black text-[var(--text-primary)] mt-3">Your case-file setup</h1>
                </div>
                <ScoutMascot mood="ready" className="hidden sm:block w-20 h-20" />
              </div>
              <p className="text-[var(--text-secondary)] mt-2 max-w-2xl">
                These settings affect how the app looks and behaves for you. Detection model tuning remains managed by the backend.
              </p>
            </div>
          </Reveal>

          <BentoGrid dense={false}>
            <SpatialTile span="wide" className="p-5 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-lg font-headline font-black text-[var(--text-primary)]">Theme</h2>
                  <EvidenceTape>STYLE SWITCH</EvidenceTape>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-1 mb-5">Dark mode is the default. Switch to light mode when you want a brighter interface.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ThemePreview theme="dark" active={theme === "dark"} onClick={() => chooseTheme("dark")} />
                  <ThemePreview theme="light" active={theme === "light"} onClick={() => chooseTheme("light")} />
                </div>
            </SpatialTile>

            <SpatialTile span="wide" className="p-5 md:p-6">
                <h2 className="text-lg font-headline font-bold text-[var(--text-primary)]">Interface behavior</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1 mb-5">Small preferences that make the assistant feel better in daily use.</p>
                <div className="space-y-3">
                  <SettingRow icon="animation" title="Motion and transitions" description="Use smooth reveals, hover states, and scan feedback.">
                    <Toggle checked={prefs.motion} onChange={() => togglePref("motion")} label="Toggle motion" />
                  </SettingRow>
                  <SettingRow icon="article" title="Compact intelligence reports" description="Use denser report spacing when reviewing many analyses.">
                    <Toggle checked={prefs.compactReports} onChange={() => togglePref("compactReports")} label="Toggle compact reports" />
                  </SettingRow>
                  <SettingRow icon="history" title="Save analysis history" description="Keep signed-in analyses available from History.">
                    <Toggle checked={prefs.saveHistory} onChange={() => togglePref("saveHistory")} label="Toggle save history" />
                  </SettingRow>
                </div>
            </SpatialTile>
          </BentoGrid>
        </main>
      </div>
      <ToastNotification show={toast.show} message={toast.title} subtext={toast.subtext} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
    </div>
  );
}
