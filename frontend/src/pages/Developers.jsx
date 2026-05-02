import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Reveal, StaggerContainer, StaggerItem, HoverCard, Float, HoverButton } from "../components/Motion"
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])
  return (
    <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 w-full font-headline-md antialiased transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.05)]" : "bg-transparent"}`}>
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-8">
          <Link className="text-xl font-bold tracking-tight text-slate-900" to="/">FraudSentinel</Link>
          <div className="hidden md:flex gap-6">
            {[{ l: "Platform", to: "/" }, { l: "Solutions", to: "/solutions" }, { l: "Developers", active: true }, { l: "Pricing", to: "/pricing" }].map(n => (
              <Link key={n.l} to={n.to || "#"} className={`relative font-medium transition-colors duration-200 group ${n.active ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-indigo-500"}`}>
                {n.l}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-600 transition-all duration-300 ${n.active ? "w-full" : "w-0 group-hover:w-full"}`}></span>
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-500 transition-colors duration-200">Login</Link>
          <HoverButton className="bg-primary text-on-primary px-4 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-shadow">View Demo</HoverButton>
        </div>
      </div>
    </motion.nav>
  )
}
function HeroSection() {
  return (
    <section className="w-full py-24 px-6 relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[50vh]">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center gap-6">
        <Reveal><h1 className="font-headline-xl text-[56px] leading-[1.1] font-bold text-on-background tracking-tight">Built for Developers</h1></Reveal>
        <Reveal delay={0.1}>
          <p className="font-body-lg text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Explore how FraudSentinel works under the hood — from hybrid AI models to behavioral intelligence systems. Designed for transparency and extensibility.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="flex items-center gap-4 mt-6">
            <HoverButton className="bg-slate-900 text-white px-8 py-3.5 rounded-full font-headline-md font-semibold shadow-lg shadow-slate-900/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">code</span> View GitHub
            </HoverButton>
            <HoverButton className="bg-white text-slate-700 border border-slate-200 px-8 py-3.5 rounded-full font-headline-md font-semibold shadow-sm hover:bg-slate-50 flex items-center gap-2">
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
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-surface-variant overflow-hidden group">
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-white/10">
            <h2 className="font-headline-md text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">terminal</span> Get Started in Seconds
            </h2>
            <button onClick={copyCode} className="text-slate-400 hover:text-white transition-colors" title="Copy to clipboard">
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
            </button>
          </div>
          <div className="p-6 bg-slate-950 font-mono text-sm text-slate-300 overflow-x-auto">
            <pre><code>{code}</code></pre>
          </div>
          <div className="bg-surface-container p-4 flex flex-col md:flex-row gap-4 justify-between items-center text-sm border-t border-surface-variant">
             <div className="flex items-center gap-2 text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Requires Python 3.10+</div>
             <div className="flex items-center gap-2 text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Requires Node.js 18+</div>
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
      <Reveal><div className="text-center mb-16"><h2 className="font-headline-lg text-[32px] font-bold text-on-background">System Architecture</h2><p className="text-on-surface-variant mt-2">Data flow from raw input to hybrid intelligence score.</p></div></Reveal>
      <div className="relative">
        <StaggerContainer className="flex flex-wrap md:flex-nowrap justify-center gap-4 md:gap-2 relative z-10">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <StaggerItem>
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col items-center justify-center w-36 h-32 text-center relative hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 text-primary">
                    <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 leading-tight">{step.name}</span>
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
    <section className="py-16 px-6 max-w-[1200px] mx-auto w-full bg-surface-container-low rounded-3xl border border-surface-variant">
      <Reveal><div className="text-center mb-12"><h2 className="font-headline-lg text-[28px] font-bold text-on-background">Core Modules</h2></div></Reveal>
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(m => (
          <StaggerItem key={m.title}>
            <HoverCard className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-variant h-full flex flex-col">
              <div className={`w-12 h-12 ${m.bg} ${m.color} rounded-xl flex items-center justify-center mb-4`}>
                <span className="material-symbols-outlined">{m.icon}</span>
              </div>
              <h3 className="font-headline-md font-bold text-slate-800 mb-2">{m.title}</h3>
              <p className="text-sm text-slate-600 flex-grow leading-relaxed">{m.desc}</p>
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
            <h2 className="font-headline-lg text-[32px] font-bold text-on-background mb-4">Clean REST API</h2>
            <p className="text-lg text-on-surface-variant mb-6 leading-relaxed">
              Integrate FraudSentinel into any stack instantly. The API accepts raw text or conversation objects and returns structured, explainable intelligence.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3"><span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs w-12 text-center">POST</span><code className="text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">/analyze-message</code></div>
              <div className="flex items-center gap-3"><span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs w-12 text-center">POST</span><code className="text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">/analyze-conversation</code></div>
              <div className="flex items-center gap-3"><span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-xs w-12 text-center">GET</span><code className="text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">/history</code></div>
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
      <Reveal><div className="text-center mb-12"><h2 className="font-headline-lg text-[32px] font-bold text-on-background">Built to Extend</h2></div></Reveal>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {points.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.1}>
            <div className="flex gap-4 p-4 border-l-2 border-primary/20 hover:border-primary transition-colors">
              <div className="mt-1 text-primary"><span className="material-symbols-outlined text-[20px]">extension</span></div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1">{p.title}</h4>
                <p className="text-sm text-slate-600">{p.desc}</p>
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
        <div className="max-w-[800px] mx-auto bg-emerald-50 border border-emerald-200 rounded-3xl p-10 md:p-14 text-center flex flex-col items-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[32px]">security</span>
          </div>
          <div className="bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">Offline Mode Enabled</div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Privacy-First Architecture</h2>
          <p className="text-lg text-emerald-800/80 max-w-lg leading-relaxed">
            All data processing, including transformer inference, runs locally on your infrastructure. No external APIs required. Your conversation data never leaves your environment.
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
      <Reveal><h2 className="font-headline-lg text-[24px] font-bold text-slate-800 mb-8 border-b border-slate-200 pb-2">Future Roadmap</h2></Reveal>
      <div className="space-y-4">
        {items.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.1}>
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow">
              <span className="font-medium text-slate-700">{item.title}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${item.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : item.status === 'Planned' ? 'bg-slate-100 text-slate-600' : 'bg-purple-100 text-purple-700'}`}>{item.status}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
function Footer() {
  return (
    <footer className="bg-slate-50 w-full py-12 px-6 border-t border-slate-200 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-lg font-bold text-slate-900">FraudSentinel</div>
        <div className="flex flex-wrap justify-center gap-6">
          {["Documentation", "GitHub", "API Reference", "Contact"].map((t) => (
            <a key={t} className="text-slate-500 hover:text-indigo-600 transition-colors opacity-80 hover:opacity-100" href="#">{t}</a>
          ))}
        </div>
        <div className="text-slate-500">© 2024 FraudSentinel AI. Built for developers.</div>
      </div>
    </footer>
  )
}
export default function Developers() {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
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