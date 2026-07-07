import { useState } from "react"
import { Navbar, Footer } from "./Landing";
import { motion, AnimatePresence } from "framer-motion"
import { Reveal, StaggerContainer, StaggerItem, HoverCard, Float, HoverButton } from "../components/Motion"

function HeroSection() {
  return (
    <section className="w-full py-24 px-6 relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[60vh]">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center gap-6">
        <Reveal><h1 className="font-headline text-[56px] leading-[1.1] font-bold text-[var(--text-primary)] tracking-tight">AI That Understands Real-World Fraud</h1></Reveal>
        <Reveal delay={0.1}>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            From suspicious messages to full conversations, FraudSentinel helps identify scams using behavioral intelligence and contextual analysis.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="flex items-center gap-4 mt-6">
            <HoverButton scale={1.05} className="bg-gradient-to-r from-violet-600 to-pink-500 text-white px-8 py-3.5 rounded-full font-headline font-semibold shadow-glow-violet hover:shadow-glow-violet-lg">Try Analysis</HoverButton>
            <HoverButton className="glass text-[var(--text-primary)] border border-[var(--border-default)] px-8 py-3.5 rounded-full font-headline font-semibold hover:bg-[var(--surface-2)]">View Demo</HoverButton>
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
          <h2 className="font-headline text-[36px] font-bold text-[var(--text-primary)] leading-tight">Detect Everyday Scams Instantly</h2>
          <p className="text-lg text-[var(--text-secondary)] mt-4 leading-relaxed">
            Analyze messages from unknown numbers, emails, or social platforms and identify fraud before taking action.
          </p>
        </Reveal>
      </div>
      <div className="w-full md:w-1/2">
        <Reveal delay={0.2}>
          <Float y={5} duration={4}>
            <div className="glass-card rounded-2xl p-6 relative">
              <div className="absolute top-4 right-4 bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">warning</span> HIGH RISK (0.91)
              </div>
              <div className="mt-8 space-y-4">
                <div className="bg-[var(--surface-1)] border border-[var(--border-default)] px-4 py-3 rounded-2xl rounded-bl-none text-[var(--text-primary)] w-[85%] leading-relaxed">
                  Send <span className="bg-red-500/10 text-red-500 font-medium px-1 rounded mx-0.5">OTP</span> now or your account will be <span className="bg-orange-500/10 text-orange-500 font-medium px-1 rounded mx-0.5">blocked</span>
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
          <h2 className="font-headline text-[36px] font-bold text-[var(--text-primary)] leading-tight">Understand Conversations, Not Just Messages</h2>
          <p className="text-lg text-[var(--text-secondary)] mt-4 leading-relaxed">
            Track how fraud evolves across multiple messages using context-aware analysis. Watch risk increase as manipulation tactics compound.
          </p>
        </Reveal>
      </div>
      <div className="w-full md:w-1/2">
        <Reveal delay={0.2}>
          <Float y={5} duration={5}>
            <div className="glass-card rounded-2xl p-6">
               <div className="flex gap-4">
                 <div className="w-1 bg-[var(--surface-1)] rounded-full flex flex-col overflow-hidden relative">
                    <motion.div initial={{ height: "0%" }} whileInView={{ height: "100%" }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeInOut" }} className="bg-gradient-to-b from-emerald-400 via-amber-400 to-red-500 absolute top-0 w-full"></motion.div>
                 </div>
                 <div className="space-y-4 w-full">
                    <div className="bg-[var(--surface-1)] px-4 py-2 rounded-xl border border-[var(--border-default)] text-sm flex justify-between items-center"><span className="text-[var(--text-secondary)]">Hi, I'm calling from your bank.</span><span className="text-emerald-500 font-medium text-xs">Low Risk</span></div>
                    <div className="bg-[var(--surface-1)] px-4 py-2 rounded-xl border border-[var(--border-default)] text-sm flex justify-between items-center"><span className="text-[var(--text-secondary)]">We noticed unauthorized access.</span><span className="text-amber-500 font-medium text-xs">Medium Risk</span></div>
                    <div className="bg-red-500/5 border border-red-500/20 px-4 py-2 rounded-xl text-sm flex justify-between items-center"><span className="text-red-500 font-medium">Verify your SSN to secure it.</span><span className="text-red-500 font-bold text-xs">High Risk</span></div>
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
          <h2 className="font-headline text-[36px] font-bold text-[var(--text-primary)] leading-tight">Detect Manipulation Tactics</h2>
          <p className="text-lg text-[var(--text-secondary)] mt-4 leading-relaxed">
            Identify urgency, authority, fear, and credential requests using behavioral signals before the victim compromises their information.
          </p>
        </Reveal>
      </div>
      <div className="w-full md:w-1/2">
        <Reveal delay={0.2}>
          <Float y={5} duration={4.5}>
            <div className="glass-card rounded-2xl p-6">
               <div className="flex flex-wrap gap-3">
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium text-sm"><span className="material-symbols-outlined text-[16px]">timer</span> Urgency</motion.div>
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium text-sm"><span className="material-symbols-outlined text-[16px]">local_police</span> Authority</motion.div>
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="bg-purple-500/10 text-purple-500 border border-purple-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium text-sm"><span className="material-symbols-outlined text-[16px]">key</span> Credential Request</motion.div>
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }} className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium text-sm"><span className="material-symbols-outlined text-[16px]">warning</span> Fear Inducing</motion.div>
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
          <div className="bg-emerald-500/10 text-emerald-500 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">Use Case 4</div>
          <h2 className="font-headline text-[36px] font-bold text-[var(--text-primary)] leading-tight">Keep Your Data Private</h2>
          <p className="text-lg text-[var(--text-secondary)] mt-4 leading-relaxed">
            Messages are analyzed by your FraudSentinel backend and are not sent to third-party AI APIs. Built for a clear, controlled privacy boundary.
          </p>
        </Reveal>
      </div>
      <div className="w-full md:w-1/2">
        <Reveal delay={0.2}>
          <Float y={5} duration={6}>
            <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl"></div>
               <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center relative z-10 shadow-lg shadow-emerald-500/20">
                  <span className="material-symbols-outlined text-emerald-500 text-[40px]">shield_lock</span>
               </motion.div>
               <div className="mt-6 bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-full font-bold text-sm border border-emerald-500/20 relative z-10">
                 PRIVACY MODE ACTIVE
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
    <section className="py-24 px-6 glass border-y border-[var(--border-default)]">
       <div className="max-w-[800px] mx-auto">
          <Reveal>
             <div className="text-center mb-12">
               <h2 className="font-headline text-[32px] font-bold text-[var(--text-primary)] mb-4">Try It Yourself</h2>
               <p className="text-[var(--text-secondary)] text-lg">See how the engine evaluates a real-world phishing attempt.</p>
             </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="glass-card rounded-3xl overflow-hidden">
               <div className="bg-[var(--surface-1)] border-b border-[var(--border-default)] p-4 flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500/50"></div><div className="w-3 h-3 rounded-full bg-amber-500/50"></div><div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
               </div>
               <div className="p-8">
                 <div className="mb-6">
                   <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Input Message</label>
                   <div className="w-full bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-4 text-[var(--text-primary)] font-medium">
                     "URGENT: Your account has been suspended due to suspicious activity. Please click here to verify your identity immediately: http://secure-login-update.com"
                   </div>
                 </div>
                 <div className="flex justify-center mb-8">
                   <HoverButton onClick={runDemo} disabled={running} className={`bg-gradient-to-r from-violet-600 to-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-glow-violet flex items-center gap-2 ${running ? "opacity-70 cursor-not-allowed" : ""}`}>
                     {running ? <><span className="material-symbols-outlined animate-spin">refresh</span> Analyzing...</> : <><span className="material-symbols-outlined">analytics</span> Run Analysis</>}
                   </HoverButton>
                 </div>
                 <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-2xl min-h-[160px] p-6 relative overflow-hidden">
                   {stage === 0 && <div className="absolute inset-0 flex items-center justify-center text-[var(--text-tertiary)] font-medium">Results will appear here</div>}
                   {stage >= 1 && <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-violet-500 to-pink-500 w-full animate-pulse"></div>}
                   <AnimatePresence>
                     {stage >= 2 && (
                       <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                         <div className="flex items-center gap-4">
                           <div className="text-4xl font-black text-red-500">98%</div>
                           <div><div className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider w-fit mb-1">Critical Risk</div><div className="w-48 bg-[var(--surface-2)] h-2 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: "98%" }} className="bg-red-500 h-full"></motion.div></div></div>
                         </div>
                       </motion.div>
                     )}
                     {stage === 3 && (
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 rounded-xl text-sm text-[var(--text-secondary)] leading-relaxed">
                         <strong className="text-[var(--text-primary)]">Behavioral Explanation:</strong> The message attempts to manufacture artificial urgency ("URGENT", "immediately") combined with a fear tactic ("account suspended") to manipulate the user into clicking a deceptive URL ("secure-login-update.com").
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
    { icon: "speed", title: "Identify Scams Faster", desc: "Fast analysis helps you decide before responding." },
    { icon: "hub", title: "Understand Patterns", desc: "Gain deep insights into attacker methodologies." },
    { icon: "lock", title: "Stay in Control", desc: "Analysis stays inside your FraudSentinel backend and avoids third-party AI APIs." }
  ]
  return (
    <section className="py-24 px-6 max-w-[1440px] mx-auto">
      <Reveal><div className="text-center mb-16"><h2 className="font-headline text-[36px] font-bold text-[var(--text-primary)]">Impact and Outcomes</h2></div></Reveal>
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(c => (
          <StaggerItem key={c.title}>
            <HoverCard className="glass-card p-8 rounded-2xl flex flex-col items-center text-center h-full">
               <div className="w-14 h-14 bg-accent-violet/10 rounded-full flex items-center justify-center mb-6 text-accent-violet"><span className="material-symbols-outlined text-[28px]">{c.icon}</span></div>
               <h3 className="font-headline text-xl font-bold text-[var(--text-primary)] mb-3">{c.title}</h3>
               <p className="text-[var(--text-secondary)]">{c.desc}</p>
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
        <div className="max-w-3xl mx-auto glass p-12 rounded-3xl border border-[var(--border-default)] shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <span className="material-symbols-outlined text-[40px] text-accent-violet mb-6">rocket_launch</span>
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-[var(--text-primary)] leading-tight">Built for individuals today, with room to grow into broader fraud intelligence workflows.</h2>
        </div>
      </Reveal>
    </section>
  )
}
function FinalCTA() {
  return (
    <section className="py-28 px-6 aurora-bg text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-transparent opacity-50"></div>
      <Reveal className="relative z-10 flex flex-col items-center">
        <h2 className="text-4xl md:text-5xl font-headline font-black mb-8 text-[var(--text-primary)]">Start Detecting Fraud Today</h2>
        <HoverButton scale={1.05} className="bg-gradient-to-r from-violet-600 to-pink-500 text-white px-10 py-4 rounded-full font-bold text-lg shadow-glow-violet hover:shadow-glow-violet-lg">Try Now</HoverButton>
      </Reveal>
    </section>
  )
}

export default function Solutions() {
  return (
    <div className="aurora-bg bg-[var(--surface-0)] text-[var(--text-primary)] font-body min-h-screen flex flex-col">
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
