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
            {[{ l: "Platform", to: "/" }, { l: "Solutions", active: true }, { l: "Developers", to: "/developers" }, { l: "Pricing", to: "/pricing" }].map(n => (
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
    <section className="w-full py-24 px-6 relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[60vh]">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center gap-6">
        <Reveal><h1 className="font-headline-xl text-[56px] leading-[1.1] font-bold text-on-background tracking-tight">AI That Understands Real-World Fraud</h1></Reveal>
        <Reveal delay={0.1}>
          <p className="font-body-lg text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            From suspicious messages to full conversations, FraudSentinel helps identify scams using behavioral intelligence and contextual analysis.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="flex items-center gap-4 mt-6">
            <HoverButton scale={1.05} className="bg-gradient-to-r from-primary to-secondary text-on-primary px-8 py-3.5 rounded-full font-headline-md font-semibold shadow-lg shadow-primary/25">Try Analysis</HoverButton>
            <HoverButton className="bg-white text-slate-700 border border-slate-200 px-8 py-3.5 rounded-full font-headline-md font-semibold shadow-sm hover:bg-slate-50">View Demo</HoverButton>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
function Solution1() {
  return (
    <section className="py-20 px-6 max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-16">
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <Reveal>
          <div className="bg-primary/10 text-primary w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">Use Case 1</div>
          <h2 className="font-headline-lg text-[36px] font-bold text-on-background leading-tight">Detect Everyday Scams Instantly</h2>
          <p className="font-body-md text-lg text-on-surface-variant mt-4 leading-relaxed">
            Analyze messages from unknown numbers, emails, or social platforms and identify fraud before taking action.
          </p>
        </Reveal>
      </div>
      <div className="w-full md:w-1/2">
        <Reveal delay={0.2}>
          <Float y={5} duration={4}>
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-surface-variant relative">
              <div className="absolute top-4 right-4 bg-error-container text-error px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">warning</span> HIGH RISK (0.91)
              </div>
              <div className="mt-8 space-y-4">
                <div className="bg-surface-variant/40 px-4 py-3 rounded-2xl rounded-bl-none text-on-surface w-[85%] leading-relaxed border border-outline-variant/30">
                  Send <span className="bg-red-100 text-red-800 font-medium px-1 rounded mx-0.5">OTP</span> now or your account will be <span className="bg-orange-100 text-orange-800 font-medium px-1 rounded mx-0.5">blocked</span>
                </div>
              </div>
            </div>
          </Float>
        </Reveal>
      </div>
    </section>
  )
}
function Solution2() {
  return (
    <section className="py-20 px-6 max-w-[1200px] mx-auto flex flex-col md:flex-row-reverse items-center gap-16">
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <Reveal>
          <div className="bg-secondary/10 text-secondary w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">Use Case 2</div>
          <h2 className="font-headline-lg text-[36px] font-bold text-on-background leading-tight">Understand Conversations, Not Just Messages</h2>
          <p className="font-body-md text-lg text-on-surface-variant mt-4 leading-relaxed">
            Track how fraud evolves across multiple messages using context-aware analysis. Watch risk increase as manipulation tactics compound.
          </p>
        </Reveal>
      </div>
      <div className="w-full md:w-1/2">
        <Reveal delay={0.2}>
          <Float y={5} duration={5}>
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-surface-variant">
               <div className="flex gap-4">
                 <div className="w-1 bg-surface-variant rounded-full flex flex-col overflow-hidden relative">
                    <motion.div initial={{ height: "0%" }} whileInView={{ height: "100%" }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeInOut" }} className="bg-gradient-to-b from-emerald-400 via-amber-400 to-red-500 absolute top-0 w-full"></motion.div>
                 </div>
                 <div className="space-y-4 w-full">
                    <div className="bg-surface px-4 py-2 rounded-xl border border-surface-variant text-sm flex justify-between items-center"><span className="text-slate-600">Hi, I'm calling from your bank.</span><span className="text-emerald-500 font-medium text-xs">Low Risk</span></div>
                    <div className="bg-surface px-4 py-2 rounded-xl border border-surface-variant text-sm flex justify-between items-center"><span className="text-slate-600">We noticed unauthorized access.</span><span className="text-amber-500 font-medium text-xs">Medium Risk</span></div>
                    <div className="bg-error/5 border border-error/20 px-4 py-2 rounded-xl text-sm flex justify-between items-center"><span className="text-error font-medium">Verify your SSN to secure it.</span><span className="text-error font-bold text-xs">High Risk</span></div>
                 </div>
               </div>
            </div>
          </Float>
        </Reveal>
      </div>
    </section>
  )
}
function Solution3() {
  return (
    <section className="py-20 px-6 max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-16">
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <Reveal>
          <div className="bg-tertiary/10 text-tertiary w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">Use Case 3</div>
          <h2 className="font-headline-lg text-[36px] font-bold text-on-background leading-tight">Detect Manipulation Tactics</h2>
          <p className="font-body-md text-lg text-on-surface-variant mt-4 leading-relaxed">
            Identify urgency, authority, fear, and credential requests using behavioral signals before the victim compromises their information.
          </p>
        </Reveal>
      </div>
      <div className="w-full md:w-1/2">
        <Reveal delay={0.2}>
          <Float y={5} duration={4.5}>
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-surface-variant">
               <div className="flex flex-wrap gap-3">
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium text-sm"><span className="material-symbols-outlined text-[16px]">timer</span> Urgency</motion.div>
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium text-sm"><span className="material-symbols-outlined text-[16px]">local_police</span> Authority</motion.div>
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium text-sm"><span className="material-symbols-outlined text-[16px]">key</span> Credential Request</motion.div>
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }} className="bg-red-100 text-red-800 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium text-sm"><span className="material-symbols-outlined text-[16px]">warning</span> Fear Inducing</motion.div>
               </div>
            </div>
          </Float>
        </Reveal>
      </div>
    </section>
  )
}
function Solution4() {
  return (
    <section className="py-20 px-6 max-w-[1200px] mx-auto flex flex-col md:flex-row-reverse items-center gap-16">
      <div className="w-full md:w-1/2 flex flex-col gap-6">
        <Reveal>
          <div className="bg-emerald-500/10 text-emerald-600 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">Use Case 4</div>
          <h2 className="font-headline-lg text-[36px] font-bold text-on-background leading-tight">Keep Your Data Private</h2>
          <p className="font-body-md text-lg text-on-surface-variant mt-4 leading-relaxed">
            All processing happens locally — your data never leaves your system. Built from the ground up for maximum privacy.
          </p>
        </Reveal>
      </div>
      <div className="w-full md:w-1/2">
        <Reveal delay={0.2}>
          <Float y={5} duration={6}>
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-surface-variant flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl"></div>
               <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center relative z-10 shadow-lg shadow-emerald-500/20">
                  <span className="material-symbols-outlined text-emerald-500 text-[40px]">shield_lock</span>
               </motion.div>
               <div className="mt-6 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full font-bold text-sm border border-emerald-200 relative z-10">
                 OFFLINE MODE ACTIVE
               </div>
            </div>
          </Float>
        </Reveal>
      </div>
    </section>
  )
}
function InteractiveDemo() {
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(0);
  const runDemo = () => {
    if (running) return;
    setRunning(true);
    setStage(1);
    setTimeout(() => setStage(2), 1500);
    setTimeout(() => { setStage(3); setRunning(false); }, 3000);
  }
  return (
    <section className="py-24 px-6 bg-surface-container-low border-y border-surface-variant">
       <div className="max-w-[800px] mx-auto">
          <Reveal>
             <div className="text-center mb-12">
               <h2 className="font-headline-lg text-[32px] font-bold text-on-background mb-4">Try It Yourself</h2>
               <p className="text-on-surface-variant text-lg">See how the engine evaluates a real-world phishing attempt.</p>
             </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="bg-surface-container-lowest rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-surface-variant overflow-hidden">
               <div className="bg-surface-container border-b border-surface-variant p-4 flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-emerald-400"></div>
               </div>
               <div className="p-8">
                 <div className="mb-6">
                   <label className="block text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">Input Message</label>
                   <div className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-700 font-medium">
                     "URGENT: Your account has been suspended due to suspicious activity. Please click here to verify your identity immediately: http://secure-login-update.com"
                   </div>
                 </div>
                 <div className="flex justify-center mb-8">
                   <HoverButton onClick={runDemo} disabled={running} className={`bg-primary text-white px-8 py-3 rounded-full font-bold shadow-md flex items-center gap-2 ${running ? "opacity-70 cursor-not-allowed" : ""}`}>
                     {running ? <><span className="material-symbols-outlined animate-spin">refresh</span> Analyzing...</> : <><span className="material-symbols-outlined">analytics</span> Run Analysis</>}
                   </HoverButton>
                 </div>
                 <div className="bg-slate-50 border border-slate-200 rounded-2xl min-h-[160px] p-6 relative overflow-hidden">
                   {stage === 0 && <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">Results will appear here</div>}
                   {stage >= 1 && <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary to-secondary w-full animate-pulse"></div>}
                   <AnimatePresence>
                     {stage >= 2 && (
                       <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                         <div className="flex items-center gap-4">
                           <div className="text-4xl font-black text-error">98%</div>
                           <div><div className="bg-error-container text-error px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider w-fit mb-1">Critical Risk</div><div className="w-48 bg-slate-200 h-2 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: "98%" }} className="bg-error h-full"></motion.div></div></div>
                         </div>
                       </motion.div>
                     )}
                     {stage === 3 && (
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-600 leading-relaxed shadow-sm">
                         <strong>Behavioral Explanation:</strong> The message attempts to manufacture artificial urgency ("URGENT", "immediately") combined with a fear tactic ("account suspended") to manipulate the user into clicking a deceptive URL ("secure-login-update.com").
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
               </div>
            </div>
          </Reveal>
       </div>
    </section>
  )
}
function ValueSection() {
  const cards = [
    { icon: "block", title: "Avoid Costly Mistakes", desc: "Catch sophisticated fraud before financial loss occurs." },
    { icon: "speed", title: "Identify Scams Faster", desc: "Sub-millisecond analysis provides instant protection." },
    { icon: "hub", title: "Understand Patterns", desc: "Gain deep insights into attacker methodologies." },
    { icon: "lock", title: "Stay in Control", desc: "Your data remains entirely on your own infrastructure." }
  ]
  return (
    <section className="py-24 px-6 max-w-[1440px] mx-auto">
      <Reveal><div className="text-center mb-16"><h2 className="font-headline-lg text-[36px] font-bold text-on-background">Impact and Outcomes</h2></div></Reveal>
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(c => (
          <StaggerItem key={c.title}>
            <HoverCard className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-surface-variant flex flex-col items-center text-center h-full">
               <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary"><span className="material-symbols-outlined text-[28px]">{c.icon}</span></div>
               <h3 className="font-headline-md text-xl font-bold text-on-surface mb-3">{c.title}</h3>
               <p className="text-on-surface-variant">{c.desc}</p>
            </HoverCard>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  )
}
function FutureSection() {
  return (
    <section className="py-20 px-6 text-center">
      <Reveal>
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-surface-container-lowest to-surface-container p-12 rounded-3xl border border-surface-variant shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <span className="material-symbols-outlined text-[40px] text-primary mb-6">rocket_launch</span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">Built for individuals today, scalable for fintech and enterprise security tomorrow.</h2>
        </div>
      </Reveal>
    </section>
  )
}
function FinalCTA() {
  return (
    <section className="py-28 px-6 bg-primary text-white text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-secondary to-transparent opacity-50"></div>
      <Reveal className="relative z-10 flex flex-col items-center">
        <h2 className="text-4xl md:text-5xl font-black mb-8">Start Detecting Fraud Today</h2>
        <HoverButton scale={1.05} className="bg-white text-primary px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-primary-900/20 hover:shadow-2xl hover:bg-slate-50">Try Now</HoverButton>
      </Reveal>
    </section>
  )
}
function Footer() {
  return (
    <footer className="bg-slate-50 w-full py-12 px-6 border-t border-slate-200 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-lg font-bold text-slate-900">FraudSentinel</div>
        <div className="flex flex-wrap justify-center gap-6">
          {["Privacy Policy", "Terms of Service", "Security", "Contact"].map((t) => (
            <a key={t} className="text-slate-500 hover:text-indigo-600 transition-colors opacity-80 hover:opacity-100" href="#">{t}</a>
          ))}
        </div>
        <div className="text-slate-500">© 2024 FraudSentinel AI. All rights reserved.</div>
      </div>
    </footer>
  )
}
export default function Solutions() {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center w-full">
        <HeroSection />
        <Solution1 />
        <Solution2 />
        <Solution3 />
        <Solution4 />
        <InteractiveDemo />
        <ValueSection />
        <FutureSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}