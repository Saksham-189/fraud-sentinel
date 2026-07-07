import { useState } from "react"
import { Navbar, Footer } from "./Landing";
import { Reveal, StaggerContainer, StaggerItem, HoverCard, HoverButton } from "../components/Motion"

function HeroSection() {
  return (
    <section className="w-full py-24 px-6 relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[50vh]">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center gap-6">
        <Reveal><h1 className="font-headline text-[56px] leading-[1.1] font-bold text-[var(--text-primary)] tracking-tight">Built for Developers</h1></Reveal>
        <Reveal delay={0.1}>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Explore how FraudSentinel works under the hood — from hybrid AI models to behavioral intelligence systems. Designed for transparency and extensibility.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="flex items-center gap-4 mt-6">
            <HoverButton className="bg-gradient-to-r from-violet-600 to-pink-500 text-white px-8 py-3.5 rounded-full font-headline font-semibold shadow-glow-violet hover:shadow-glow-violet-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">code</span> View GitHub
            </HoverButton>
            <HoverButton className="glass text-[var(--text-primary)] border border-[var(--border-default)] px-8 py-3.5 rounded-full font-headline font-semibold hover:bg-[var(--surface-2)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">play_arrow</span> Run Locally
            </HoverButton>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
function QuickStart() {
  const code = `git clone https://github.com/your-repo/fraudsentinel
cd fraudsentinel
# Start backend (FastAPI)
pip install -r requirements.txt
uvicorn api.main:app --reload
# Start frontend (React/Vite)
npm install
npm run dev`
  const copyCode = () => {
    navigator.clipboard.writeText(code);
  }
  return (
    <section className="py-16 px-6 max-w-[800px] mx-auto w-full">
      <Reveal>
        <div className="glass-card rounded-2xl overflow-hidden group">
          <div className="bg-[var(--surface-2)] px-6 py-4 flex items-center justify-between border-b border-[var(--border-default)]">
            <h2 className="font-headline text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-violet">terminal</span> Get Started in Seconds
            </h2>
            <button onClick={copyCode} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" title="Copy to clipboard">
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
            </button>
          </div>
          <div className="p-6 bg-[#0f111a] font-mono text-sm text-slate-300 overflow-x-auto">
            <pre><code>{code}</code></pre>
          </div>
          <div className="bg-[var(--surface-1)] p-4 flex flex-col md:flex-row gap-4 justify-between items-center text-sm border-t border-[var(--border-default)]">
             <div className="flex items-center gap-2 text-[var(--text-secondary)]"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Requires Python 3.10+</div>
             <div className="flex items-center gap-2 text-[var(--text-secondary)]"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Requires Node.js 18+</div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
function Architecture() {
  const steps = [
    { id: 1, name: "Input", icon: "input" },
    { id: 2, name: "Feature Extraction", icon: "troubleshoot" },
    { id: 3, name: "ML Model", icon: "model_training" },
    { id: 4, name: "Transformer", icon: "psychology" },
    { id: 5, name: "Behavioral Engine", icon: "hub" },
    { id: 6, name: "Hybrid Output", icon: "output" }
  ];
  return (
    <section className="py-24 px-6 max-w-[1200px] mx-auto w-full">
      <Reveal><div className="text-center mb-16"><h2 className="font-headline text-[32px] font-bold text-[var(--text-primary)]">System Architecture</h2><p className="text-[var(--text-secondary)] mt-2">Data flow from raw input to hybrid intelligence score.</p></div></Reveal>
      <div className="relative">
        <StaggerContainer className="flex flex-wrap md:flex-nowrap justify-center gap-4 md:gap-2 relative z-10">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <StaggerItem>
                <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center w-36 h-32 text-center relative hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-10 h-10 rounded-full bg-accent-violet/10 flex items-center justify-center mb-2 text-accent-violet">
                    <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">{step.name}</span>
                </div>
              </StaggerItem>
              {idx < steps.length - 1 && (
                <StaggerItem>
                  <div className="hidden md:flex text-slate-300 mx-2 animate-pulse">
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </div>
                </StaggerItem>
              )}
            </div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
function CoreModules() {
  const modules = [
    { title: "Text Processing", desc: "Cleanses input, handles tokenization, and normalizes text for downstream analysis.", icon: "text_fields", color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Feature Extraction", desc: "Extracts structural, lexical, and metadata features (e.g., urgency markers, caps ratio).", icon: "troubleshoot", color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "ML Model (LR)", desc: "Calibrated Logistic Regression baseline for fast, interpretable structural probability.", icon: "linear_scale", color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Transformer Layer", desc: "DistilBERT semantic classification to catch nuanced, context-dependent manipulation.", icon: "psychology", color: "text-fuchsia-600", bg: "bg-fuchsia-100" },
    { title: "Behavioral Engine", desc: "Applies dynamic heuristic rules based on entity history and conversation lifecycle.", icon: "hub", color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Hybrid Engine", desc: "Fuses outputs from ML, Transformer, and Behavior rules into a unified risk assessment.", icon: "merge", color: "text-emerald-600", bg: "bg-emerald-100" }
  ];
  return (
    <section className="py-16 px-6 max-w-[1200px] mx-auto w-full glass rounded-3xl border border-[var(--border-default)]">
      <Reveal><div className="text-center mb-12"><h2 className="font-headline text-[28px] font-bold text-[var(--text-primary)]">Core Modules</h2></div></Reveal>
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(m => (
          <StaggerItem key={m.title}>
            <HoverCard className="glass-card p-6 rounded-2xl h-full flex flex-col">
              <div className={`w-12 h-12 ${m.bg} ${m.color} rounded-xl flex items-center justify-center mb-4`}>
                <span className="material-symbols-outlined">{m.icon}</span>
              </div>
              <h3 className="font-headline font-bold text-[var(--text-primary)] mb-2">{m.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] flex-grow leading-relaxed">{m.desc}</p>
            </HoverCard>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  )
}
function APISection() {
  const [activeTab, setActiveTab] = useState("request");
  const reqJson = `POST /analyze-message
{
  "text": "Send OTP now to secure your bank account",
  "metadata": {
    "sender_id": "unknown_5928",
    "channel": "sms"
  }
}`;
  const resJson = `{
  "fraud_probability": 0.91,
  "behavior_score": 0.84,
  "behavior_level": "HIGH RISK",
  "flags": ["urgency", "credential_request"],
  "explanation": "Detected urgency combined with a request for sensitive credentials (OTP)."
}`;
  return (
    <section className="py-24 px-6 max-w-[1000px] mx-auto w-full">
      <div className="flex flex-col md:flex-row gap-12 items-center">
        <div className="w-full md:w-1/2">
          <Reveal>
            <h2 className="font-headline text-[32px] font-bold text-[var(--text-primary)] mb-4">Clean REST API</h2>
            <p className="text-lg text-[var(--text-secondary)] mb-6 leading-relaxed">
              Integrate FraudSentinel into any stack instantly. The API accepts raw text or conversation objects and returns structured, explainable intelligence.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3"><span className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-bold px-2 py-0.5 rounded text-xs w-12 text-center">POST</span><code className="text-sm text-[var(--text-primary)] bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border-default)]">/analyze-message</code></div>
              <div className="flex items-center gap-3"><span className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-bold px-2 py-0.5 rounded text-xs w-12 text-center">POST</span><code className="text-sm text-[var(--text-primary)] bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border-default)]">/analyze-conversation</code></div>
              <div className="flex items-center gap-3"><span className="bg-blue-500/20 text-blue-500 border border-blue-500/30 font-bold px-2 py-0.5 rounded text-xs w-12 text-center">GET</span><code className="text-sm text-[var(--text-primary)] bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border-default)]">/history</code></div>
            </div>
          </Reveal>
        </div>
        <div className="w-full md:w-1/2">
          <Reveal delay={0.2}>
            <div className="bg-[#0d1117] rounded-2xl shadow-xl overflow-hidden border border-slate-800">
              <div className="flex bg-[#161b22] border-b border-slate-800">
                <button onClick={() => setActiveTab("request")} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === "request" ? "text-white border-b-2 border-indigo-500 bg-[#0d1117]" : "text-slate-500 hover:text-slate-300"}`}>Request</button>
                <button onClick={() => setActiveTab("response")} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === "response" ? "text-white border-b-2 border-emerald-500 bg-[#0d1117]" : "text-slate-500 hover:text-slate-300"}`}>Response</button>
              </div>
              <div className="p-6 font-mono text-sm text-slate-300 overflow-x-auto min-h-[240px]">
                <pre><code>{activeTab === "request" ? reqJson : resJson}</code></pre>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
function Extensibility() {
  const points = [
    { title: "Add Custom Behavioral Features", desc: "Inject new regex or heuristic rules directly into the configuration JSON." },
    { title: "Adjust Scoring Weights", desc: "Fine-tune the balance between the ML Baseline and Transformer layer dynamically." },
    { title: "Bring Your Own Model", desc: "Swap out DistilBERT for your custom fine-tuned transformer with minimal pipeline friction." },
    { title: "Custom Output Formatting", desc: "Easily modify the API layer to match your existing SIEM or logging schemas." }
  ];
  return (
    <section className="py-16 px-6 max-w-[1000px] mx-auto w-full">
      <Reveal><div className="text-center mb-12"><h2 className="font-headline text-[32px] font-bold text-[var(--text-primary)]">Built to Extend</h2></div></Reveal>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {points.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.1}>
            <div className="flex gap-4 p-4 border-l-2 border-accent-violet/20 hover:border-accent-violet transition-colors">
              <div className="mt-1 text-accent-violet"><span className="material-symbols-outlined text-[20px]">extension</span></div>
              <div>
                <h4 className="font-bold text-[var(--text-primary)] mb-1">{p.title}</h4>
                <p className="text-sm text-[var(--text-secondary)]">{p.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
function PrivacySection() {
  return (
    <section className="py-20 px-6">
      <Reveal>
        <div className="max-w-[800px] mx-auto glass-card rounded-3xl p-10 md:p-14 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
            <span className="material-symbols-outlined text-[32px]">security</span>
          </div>
          <div className="bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">Privacy Mode Enabled</div>
          <h2 className="text-3xl font-headline font-bold text-[var(--text-primary)] mb-4">Privacy-First Architecture</h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-lg leading-relaxed">
            Analysis runs through the FraudSentinel backend you deploy. The runtime is designed to avoid third-party AI API calls and keep fraud analysis inside your controlled service boundary.
          </p>
        </div>
      </Reveal>
    </section>
  )
}
function Roadmap() {
  const items = [
    { title: "Public API Release", status: "In Progress" },
    { title: "Browser Extension", status: "Planned" },
    { title: "WhatsApp Integration", status: "Planned" },
    { title: "Voice Scam Detection", status: "Research" }
  ];
  return (
    <section className="py-16 px-6 max-w-[800px] mx-auto w-full mb-12">
      <Reveal><h2 className="font-headline text-[24px] font-bold text-[var(--text-primary)] mb-8 border-b border-[var(--border-default)] pb-2">Future Roadmap</h2></Reveal>
      <div className="space-y-4">
        {items.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.1}>
            <div className="flex items-center justify-between p-4 glass-card rounded-xl hover:border-accent-violet/50 transition-colors">
              <span className="font-medium text-[var(--text-primary)]">{item.title}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${item.status === 'In Progress' ? 'bg-blue-500/20 text-blue-500' : item.status === 'Planned' ? 'bg-[var(--surface-2)] text-[var(--text-secondary)]' : 'bg-purple-500/20 text-purple-500'}`}>{item.status}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export default function Developers() {
  return (
    <div className="aurora-bg bg-[var(--surface-0)] text-[var(--text-primary)] font-body min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center w-full">
        <HeroSection />
        <QuickStart />
        <Architecture />
        <CoreModules />
        <APISection />
        <Extensibility />
        <PrivacySection />
        <Roadmap />
      </main>
      <Footer />
    </div>
  )
}
