import { useState } from "react";
import { Sidebar, TopNavbar, ToastNotification } from "./Dashboard";
import { Reveal, StaggerContainer, StaggerItem, HoverCard, HoverButton } from "../components/Motion";
import { motion, AnimatePresence } from "framer-motion";
function ModelSelectorCard({ model, setModel }) {
  const models = [
    { id: "logistic", name: "Logistic Regression", desc: "Fast, basic keyword detection.", badge: null },
    { id: "distilbert", name: "DistilBERT", desc: "Deep semantic analysis for complex patterns.", badge: null },
    { id: "hybrid", name: "Hybrid Engine", desc: "Combines both for maximum accuracy.", badge: "Recommended" }
  ];
  return (
    <HoverCard className="bg-white border border-surface-variant rounded-3xl p-6 shadow-sm">
      <h3 className="font-bold text-lg text-slate-900 mb-1">Analysis Model</h3>
      <p className="text-sm text-slate-500 mb-6">Choose the core intelligence engine used to scan messages.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {models.map(m => (
          <div 
            key={m.id} 
            onClick={() => setModel(m.id)}
            className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${model === m.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}
          >
            {m.badge && (
              <div className="absolute -top-2.5 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {m.badge}
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-bold text-sm ${model === m.id ? 'text-primary' : 'text-slate-800'}`}>{m.name}</h4>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${model === m.id ? 'border-primary' : 'border-slate-300'}`}>
                {model === m.id && <div className="w-2 h-2 rounded-full bg-primary"></div>}
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
          </div>
        ))}
      </div>
    </HoverCard>
  );
}
function BehaviorSensitivitySlider({ sensitivity, setSensitivity }) {
  const getLabel = () => {
    if (sensitivity < 33) return { text: "Low (Fewer false positives)", color: "text-emerald-600" };
    if (sensitivity < 66) return { text: "Medium (Balanced detection)", color: "text-amber-600" };
    return { text: "High (Strict security)", color: "text-red-600" };
  };
  const label = getLabel();
  return (
    <HoverCard className="bg-white border border-surface-variant rounded-3xl p-6 shadow-sm">
      <h3 className="font-bold text-lg text-slate-900 mb-1">Detection Sensitivity</h3>
      <p className="text-sm text-slate-500 mb-6">Control how aggressively the AI flags potential threats.</p>
      <div className="mb-4">
        <div className="flex justify-between items-end mb-2">
          <span className={`text-sm font-bold ${label.color}`}>{label.text}</span>
          <span className="text-xs font-bold text-slate-400">{sensitivity}%</span>
        </div>
        <input 
          type="range" 
          min="0" max="100" 
          value={sensitivity} 
          onChange={(e) => setSensitivity(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
          style={{ background: `linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%)` }}
        />
      </div>
    </HoverCard>
  );
}
function BehaviorWeightsPanel({ weights, setWeights }) {
  const handleReset = () => {
    setWeights({ urgency: 80, fear: 70, authority: 60, credential: 90, link: 50 });
  };
  return (
    <HoverCard className="bg-white border border-surface-variant rounded-3xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-bold text-lg text-slate-900 mb-1">Behavior Signal Weights</h3>
          <p className="text-sm text-slate-500">Fine-tune the importance of specific manipulation tactics.</p>
        </div>
        <button onClick={handleReset} className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg">
          <span className="material-symbols-outlined text-[14px]">restart_alt</span> Reset
        </button>
      </div>
      <div className="space-y-6">
        {Object.entries(weights).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className="text-xs font-bold text-slate-500">{value}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={value} 
              onChange={(e) => setWeights({ ...weights, [key]: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        ))}
      </div>
    </HoverCard>
  );
}
function UIPreferencesCard({ prefs, setPrefs }) {
  const togglePref = (key) => setPrefs({ ...prefs, [key]: !prefs[key] });
  return (
    <HoverCard className="bg-white border border-surface-variant rounded-3xl p-6 shadow-sm">
      <h3 className="font-bold text-lg text-slate-900 mb-1">Interface Preferences</h3>
      <p className="text-sm text-slate-500 mb-6">Customize your dashboard experience.</p>
      <div className="space-y-4">
        {[
          { id: "animations", label: "Enable Animations", desc: "Smooth transitions and micro-interactions." },
          { id: "compact", label: "Compact View", desc: "Reduce spacing for higher data density." },
          { id: "autoExpand", label: "Auto-expand Insights", desc: "Always show detailed breakdown on analysis." }
        ].map(p => (
          <div key={p.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
            <div>
              <h4 className="font-bold text-sm text-slate-900">{p.label}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
            </div>
            <button 
              onClick={() => togglePref(p.id)}
              className={`w-11 h-6 rounded-full flex items-center transition-colors p-1 ${prefs[p.id] ? 'bg-primary' : 'bg-slate-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${prefs[p.id] ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>
        ))}
      </div>
    </HoverCard>
  );
}
export default function Settings() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [model, setModel] = useState("hybrid");
  const [sensitivity, setSensitivity] = useState(65);
  const [weights, setWeights] = useState({ urgency: 80, fear: 70, authority: 60, credentialIntent: 90, linkRisk: 50 });
  const [prefs, setPrefs] = useState({ animations: true, compact: false, autoExpand: false });
  const [showToast, setShowToast] = useState(false);
  const handleSave = () => {
    setShowToast(true);
  };
  return (
    <div className="bg-slate-50 min-h-screen flex font-body-md text-slate-900 overflow-x-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-grow flex flex-col min-w-0">
        <TopNavbar title="System Settings" />
        <main className="flex-grow p-8 max-w-4xl mx-auto w-full pb-24">
          <Reveal>
            <div className="mb-10 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configuration</h1>
                <p className="text-slate-500 mt-2">Customize how FraudSentinel analyzes and presents data.</p>
              </div>
              <HoverButton onClick={handleSave} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-sm">
                Save Changes
              </HoverButton>
            </div>
          </Reveal>
          <StaggerContainer className="space-y-8">
            <StaggerItem>
              <ModelSelectorCard model={model} setModel={setModel} />
            </StaggerItem>
            <StaggerItem>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <BehaviorSensitivitySlider sensitivity={sensitivity} setSensitivity={setSensitivity} />
                <UIPreferencesCard prefs={prefs} setPrefs={setPrefs} />
              </div>
            </StaggerItem>
            <StaggerItem>
              <BehaviorWeightsPanel weights={weights} setWeights={setWeights} />
            </StaggerItem>
          </StaggerContainer>
        </main>
      </div>
      <ToastNotification show={showToast} onClose={() => setShowToast(false)} message="Settings Saved" subtext="Your configuration has been updated." />
    </div>
  );
}