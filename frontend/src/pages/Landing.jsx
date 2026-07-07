import { useState, useEffect, useMemo } from "react"
import { Link, useLocation } from "react-router-dom"
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion"
import { Reveal, StaggerContainer, StaggerItem, HoverCard, Float, HoverButton } from "../components/Motion"
export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])
  
  const navItems = [
    { l: "Platform", to: "/" }, 
    { l: "Solutions", to: "/solutions" }, 
    { l: "Developers", to: "/developers" }, 
    { l: "Pricing", to: "/pricing" }
  ];

  return (
    <m.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 w-full font-headline antialiased transition-all duration-300 ${scrolled ? "glass border-b border-[var(--border-default)]" : "bg-transparent"}`}>
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-8">
          <Link className="text-xl font-bold tracking-tight gradient-text" to="/">FraudSentinel</Link>
          <div className="hidden md:flex gap-6">
            {navItems.map(n => {
              const isActive = location.pathname === n.to;
              return (
              <Link key={n.l} to={n.to} className={`relative font-medium transition-colors duration-200 group ${isActive ? "text-accent-violet font-semibold" : "text-[var(--text-secondary)] hover:text-accent-violet"}`}>
                {n.l}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"}`}></span>
              </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-accent-violet font-medium hover:opacity-80 transition-opacity">Login</Link>
          <HoverButton className="bg-gradient-to-r from-violet-600 to-pink-500 text-white px-4 py-2 rounded-xl font-medium shadow-glow-violet hover:shadow-glow-violet-lg transition-all">View Demo</HoverButton>
        </div>
      </div>
    </m.nav>
  )
}
function HeroSection() {
  return (
    <section className="w-full max-w-[1440px] mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-16 relative overflow-hidden">
      {}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="w-full lg:w-1/2 flex flex-col gap-6 relative z-10">
        <Reveal><h1 className="font-headline-xl text-headline-xl text-on-background">Stop Fraud with Intelligent Conversation Analysis</h1></Reveal>
        <Reveal delay={0.1}><p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">Analyze suspicious messages and conversations with evidence-backed fraud intelligence and clear next steps.</p></Reveal>
        <Reveal delay={0.2}>
          <div className="flex items-center gap-4 mt-4">
            <m.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
              <Link to="/login" className="bg-gradient-to-r from-primary to-secondary text-on-primary px-6 py-3 rounded-lg font-headline-md text-body-md shadow-[0_4px_20px_rgba(0,0,0,0.1)] block">Try Now</Link>
            </m.div>
            <HoverButton className="border border-outline-variant text-on-surface px-6 py-3 rounded-lg font-headline-md text-body-md hover:bg-surface-variant transition-colors">View Demo</HoverButton>
          </div>
        </Reveal>
      </div>
      <Reveal delay={0.3} className="w-full lg:w-1/2 relative z-10">
        <Float y={8} duration={5}>
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-surface-variant p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-variant">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden">
                  <img alt="User avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuChULx6OvkvWrz0Xke0LjBLODExRdHSHtheW1o9IX51KBAixL3NY3sqP57VJArXpaTqXB0U0UsuZJ_1ndL-TgeNZj4mQ0c48izPG5Iu_YvIc1kEwdT0ka87zk1_Qmo69S90-xLujJGfsupx9dPkOp4XTnY2HR2nGVGttDF7eQe7_ewhnK94M7tNHgTqhZVNqewyrz6Cs1eNXZS7OOwB66fnWZp8qed_4jsTBqApbCoiinSb39y7cYMca853pp2jL6GEhdobmG8Kvl1r" />
                </div>
                <div>
                  <div className="font-headline-md text-body-md">External User A</div>
                  <div className="font-body-sm text-body-sm text-outline">ID: x-9284-A</div>
                </div>
              </div>
              <div className="bg-error-container text-on-error-container px-3 py-1 rounded-full flex items-center gap-2">
                <span className="material-symbols-outlined fill text-[16px]">warning</span>
                <span className="font-headline-md text-label-caps">92 - High Risk</span>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div className="bg-surface p-4 rounded-lg rounded-tl-none max-w-[80%] border border-surface-variant">
                <p className="font-body-md text-body-md text-on-surface">Hello, I need to verify your account details. Please provide your <span className="bg-error-container/50 text-error font-semibold px-1 rounded">routing number and full SSN</span> to proceed with the wire transfer.</p>
              </div>
            </div>
            <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <span className="material-symbols-outlined">auto_awesome</span>
                <h3 className="font-headline-md text-body-md">AI Analysis</h3>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Detected high-risk pattern matching known phishing typologies. Request for sensitive PII (SSN) combined with urgent financial action (wire transfer) via non-secure channel.</p>
            </div>
          </div>
        </Float>
      </Reveal>
    </section>
  )
}
function FeaturesSection() {
  const [activeStep, setActiveStep] = useState(0);
  const steps = useMemo(() => [
    {
      id: "input",
      icon: "forum",
      title: "Conversation Input",
      desc: "Ingests raw, multi-turn messages.",
      detailTitle: "Data Intake",
      detailText: "The system processes chat history, maintaining the context of previous messages rather than analyzing single lines in isolation.",
      preview: (
        <div className="space-y-3">
          <div className="bg-surface-variant/30 px-3 py-2 rounded-xl rounded-bl-none text-sm w-4/5 text-on-surface-variant">Hi, I need help with my account.</div>
          <div className="bg-primary text-on-primary px-3 py-2 rounded-xl rounded-br-none text-sm w-4/5 ml-auto">Sure, I can help. What's the issue?</div>
          <div className="bg-surface-variant/30 px-3 py-2 rounded-xl rounded-bl-none text-sm w-4/5 text-on-surface-variant">My card is blocked. Send me the OTP so I can fix it <span className="text-error font-medium">immediately</span>.</div>
        </div>
      )
    },
    {
      id: "signals",
      icon: "radar",
      title: "Signal Detection",
      desc: "Extracts urgency, intent & entities.",
      detailTitle: "Feature Extraction",
      detailText: "NLP pipelines identify specific phrases, monetary values, and linguistic markers commonly associated with social engineering.",
      preview: (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm"><span className="text-outline">Urgency Marker</span><span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md font-mono font-medium">"immediately"</span></div>
          <div className="flex justify-between items-center text-sm"><span className="text-outline">Credential Request</span><span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md font-mono font-medium">"OTP"</span></div>
          <div className="flex justify-between items-center text-sm"><span className="text-outline">Fear Tactic</span><span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md font-mono font-medium">"blocked"</span></div>
        </div>
      )
    },
    {
      id: "behavior",
      icon: "psychology",
      title: "Behavioral Analysis",
      desc: "Identifies manipulation tactics.",
      detailTitle: "Context & Behavior",
      detailText: "The engine maps extracted signals to known fraud lifecycles, evaluating how the conversation progresses over time.",
      preview: (
        <div className="relative pt-6 pb-2 pl-4">
          <div className="absolute left-[27px] top-0 bottom-0 w-[2px] bg-surface-variant"></div>
          <div className="space-y-6">
             <div className="relative flex items-center gap-4">
               <div className="w-6 h-6 rounded-full bg-emerald-100 border-4 border-surface-container-low flex items-center justify-center z-10"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span></div>
               <div className="text-sm font-semibold text-on-surface-variant">Greeting / Setup</div>
             </div>
             <div className="relative flex items-center gap-4">
               <div className="w-6 h-6 rounded-full bg-red-100 border-4 border-surface-container-low flex items-center justify-center z-10"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span></div>
               <div className="text-sm font-semibold text-error">Attack Escalation</div>
             </div>
          </div>
        </div>
      )
    },
    {
      id: "risk",
      icon: "speed",
      title: "Risk Scoring",
      desc: "Calculates an exact probability.",
      detailTitle: "Threat Evaluation",
      detailText: "Machine learning models synthesize behavioral features into a final, actionable risk score from 0 to 1.",
      preview: (
         <div className="flex flex-col items-center justify-center h-full gap-4 py-4">
           <div className="text-6xl font-bold text-error tracking-tight">91%</div>
           <div className="bg-error-container text-on-error-container px-4 py-1.5 rounded-full font-bold text-xs tracking-wider uppercase">High Risk</div>
           <div className="w-full bg-surface-variant rounded-full h-2 mt-4 overflow-hidden">
              <m.div initial={{ scaleX: 0 }} animate={{ scaleX: 0.91 }} transition={{ duration: 1, delay: 0.2 }} className="bg-error h-full rounded-full origin-left"></m.div>
           </div>
         </div>
      )
    },
    {
      id: "explanation",
      icon: "lightbulb",
      title: "Explanation",
      desc: "Generates clear, human rationale.",
      detailTitle: "Explainable AI",
      detailText: "Instead of a black-box score, the system provides a clear explanation detailing exactly why the conversation was flagged.",
      preview: (
         <div className="bg-surface p-5 rounded-2xl border border-outline-variant/30 shadow-sm relative mt-4">
           <div className="absolute -top-4 -left-4 w-8 h-8 bg-surface-container-lowest rounded-full flex items-center justify-center border border-outline-variant/30 shadow-sm"><span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span></div>
           <p className="text-sm text-on-surface-variant italic leading-relaxed">
             "The conversation exhibits a classic account takeover pattern. The user employs fear ('card is blocked') to artificially manufacture urgency ('immediately') while simultaneously requesting sensitive credentials ('OTP')."
           </p>
         </div>
      )
    }
  ], []);
  return (
    <section className="w-full bg-surface-container-low py-28 px-6 overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-headline-lg text-[40px] font-bold text-on-background mb-4 tracking-tight">How FraudSentinel Understands Fraud</h2>
          <p className="font-body-md text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">Our system doesn’t just scan for keywords — it understands intent, behavior, and context across conversations.</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          {}
          <div className="w-full lg:w-5/12 flex flex-col gap-3 relative">
             <div className="absolute left-[35px] top-8 bottom-8 w-[2px] bg-outline-variant/20 hidden md:block"></div>
             {steps.map((step, index) => {
               const isActive = activeStep === index;
               return (
                 <div 
                   key={step.id} 
                   className={`relative flex gap-5 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${isActive ? 'bg-surface-container-lowest shadow-md border border-primary/10 scale-[1.02]' : 'hover:bg-surface-variant/30 hover:scale-[1.01]'}`}
                   onClick={() => setActiveStep(index)}
                   onMouseEnter={() => setActiveStep(index)}
                 >
                   <div className={`relative z-10 w-14 h-14 rounded-xl shrink-0 flex items-center justify-center transition-colors duration-300 ${isActive ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-variant text-on-surface-variant'}`}>
                     <span className="material-symbols-outlined text-[24px]">{step.icon}</span>
                   </div>
                   <div className="flex flex-col justify-center">
                     <h3 className={`font-headline-md font-bold text-base transition-colors ${isActive ? 'text-primary' : 'text-on-surface'}`}>{step.title}</h3>
                     <p className={`text-sm mt-0.5 transition-colors ${isActive ? 'text-on-surface-variant' : 'text-outline'}`}>{step.desc}</p>
                   </div>
                   {isActive && (
                      <m.div layoutId="active-indicator" className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-primary rounded-r-md" />
                   )}
                 </div>
               )
             })}
          </div>
          {}
          <div className="w-full lg:w-7/12 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)] overflow-hidden lg:sticky lg:top-28">
             <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-tertiary"></div>
             <div className="p-8 md:p-12 min-h-[420px] flex flex-col">
                <AnimatePresence mode="wait">
                  <m.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex-grow flex flex-col"
                  >
                    <div className="mb-8">
                       <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                          <span className="material-symbols-outlined text-[14px]">bolt</span> Step {activeStep + 1}
                       </div>
                       <h4 className="font-headline-md text-2xl font-bold text-on-surface mb-3">{steps[activeStep].detailTitle}</h4>
                       <p className="text-on-surface-variant leading-relaxed">{steps[activeStep].detailText}</p>
                    </div>
                    <div className="mt-auto bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-outline-variant/10 to-transparent"></div>
                       {steps[activeStep].preview}
                    </div>
                  </m.div>
                </AnimatePresence>
             </div>
          </div>
        </div>
      </div>
    </section>
  )
}
function ComprehensiveSection() {
  return (
    <section className="w-full bg-surface-container-low py-16 px-6 border-t border-surface-variant">
      <div className="max-w-[1440px] mx-auto">
        <Reveal><div className="text-center mb-16">
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-4">Comprehensive Protection Toolkit</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">Everything you need to understand suspicious messages, review evidence, and decide what to do next.</p>
        </div></Reveal>
        {}
        <Reveal><div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-surface-variant p-10 md:p-16 mb-12 flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div className="bg-primary/10 text-primary w-fit px-3 py-1 rounded-full font-label-caps flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">verified_user</span> Flagship Feature
            </div>
            <h3 className="font-headline-xl text-headline-xl text-on-background">Privacy-First Analysis</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant">Analyze sensitive messages through your own FraudSentinel backend. Data is used only for fraud detection and is not sent to third-party AI APIs.</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-on-surface"><span className="material-symbols-outlined text-primary">check_circle</span><span className="font-body-sm font-medium">No third-party AI API</span></div>
              <div className="flex items-center gap-2 text-on-surface"><span className="material-symbols-outlined text-primary">check_circle</span><span className="font-body-sm font-medium">Controlled data boundary</span></div>
            </div>
          </div>
          <div className="w-full md:w-1/2 bg-surface-container rounded-xl p-8 flex items-center justify-center min-h-[300px] border border-surface-variant/50 relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-surface-container-lowest rounded-2xl shadow-lg border border-surface-variant flex items-center justify-center mb-6"><span className="material-symbols-outlined text-[48px] text-primary">dns</span></div>
              <div className="bg-surface-container-lowest px-6 py-4 rounded-xl shadow-md border border-surface-variant text-center">
                <div className="flex justify-center mb-2"><span className="material-symbols-outlined text-[32px] text-secondary">shield</span></div>
                <div className="font-headline-md text-on-surface">Secure Backend Analysis</div>
                <div className="font-body-sm text-outline mt-1">Purpose-built fraud pipeline</div>
              </div>
              <div className="absolute top-1/2 -right-16 w-16 h-[2px] bg-error border-t border-dashed border-error -translate-y-1/2"></div>
              <div className="absolute top-1/2 -right-20 -translate-y-1/2"><span className="material-symbols-outlined text-error text-[24px]">block</span></div>
            </div>
          </div>
        </div></Reveal>
        {}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Hybrid AI Detection", desc: "Combine ML, NLP, and heuristics for unmatched accuracy.", content: (<div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30 flex flex-col gap-2">{[["bg-blue-500","ML Models"],["bg-purple-500","NLP Analysis"],["bg-teal-500","Behavior Rules"]].map(([c,l])=><div key={l} className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white px-2 py-1 rounded border border-slate-200"><span className={`w-2 h-2 rounded-full ${c}`}></span>{l}</div>)}<div className="flex justify-center mt-2"><span className="material-symbols-outlined text-outline">arrow_downward</span></div><div className="text-center font-bold text-sm text-primary bg-primary/10 py-1 rounded">Single Risk Score</div></div>)},
            { title: "Real-Time Risk Scoring", desc: "Instant quantitative evaluation of threat probability.", content: (<div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30 min-h-[120px]"><div className="flex justify-between items-end mb-2"><span className="text-xs font-bold text-error bg-error-container px-2 py-0.5 rounded">HIGH RISK</span><span className="text-sm font-bold text-on-surface">0.92</span></div><div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden"><div className="bg-error h-2.5 rounded-full" style={{width:"92%"}}></div></div></div>)},
            { title: "Behavioral Intelligence", desc: "Identify manipulation tactics and artificial urgency.", content: (<div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30 text-sm min-h-[120px]"><p className="text-slate-600 leading-relaxed">I need this done <span className="bg-orange-100 text-orange-800 font-medium px-1 rounded border border-orange-200">urgently</span>, my account is <span className="bg-red-100 text-red-800 font-medium px-1 rounded border border-red-200">blocked</span>. Send the <span className="bg-purple-100 text-purple-800 font-medium px-1 rounded border border-purple-200">OTP</span> now.</p></div>)},
            { title: "Context-Aware Analysis", desc: "Understand risk across the entire conversation history.", content: (<div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30 flex flex-col gap-2 min-h-[120px]">{[["bg-green-500","Hi, I'm new here.","text-slate-500"],["bg-yellow-500","Can you help me reset?","text-slate-600"],["bg-red-500","Just tell me the SMS code.","text-error font-medium"]].map(([c,t,tc],i)=><div key={i} className="flex gap-2 items-center"><div className={`w-2 h-2 rounded-full ${c}`}></div><div className={`bg-white px-2 py-1 rounded border border-slate-200 text-xs flex-grow ${tc}`}>{t}</div></div>)}</div>)},
            { title: "Explainable AI", desc: "Clear, human-readable rationale for every flag.", content: (<div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30 min-h-[120px]"><div className="flex items-center gap-2 mb-2 text-secondary"><span className="material-symbols-outlined text-[18px]">psychology</span><span className="text-xs font-bold uppercase tracking-wider">AI Insight</span></div><div className="bg-white rounded p-2 border border-slate-200 text-xs text-slate-600 italic">"Urgency + credential request detected. Matches known account takeover pattern."</div></div>)},
            { title: "Adaptive Learning", desc: "Models that evolve automatically as new threats emerge.", content: (<div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30 flex flex-col items-center justify-center min-h-[120px] text-center gap-2"><span className="material-symbols-outlined text-[32px] text-primary animate-spin" style={{animationDuration:"4s"}}>sync</span><span className="text-sm font-semibold text-on-surface">Constant Model Evolution</span></div>)},
            { title: "Conversation Memory", desc: "Track entities and risk profiles over long periods.", content: (<div className="bg-surface-container rounded-lg p-3 border border-outline-variant/30 flex flex-col gap-1.5 min-h-[120px]">{[["Oct 12","High Risk","bg-red-100 text-red-700"],["Sep 28","Medium Risk","bg-yellow-100 text-yellow-700"],["Sep 01","Low Risk","bg-green-100 text-green-700"]].map(([d,r,c])=><div key={d} className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-200"><span className="text-[10px] text-slate-500">{d}</span><span className={`text-[10px] ${c} px-1 rounded`}>{r}</span></div>)}</div>)},
            { title: "Multi-Layer Safety", desc: "Redundant checks ensure stable, unbiased AI decisions.", content: (<div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30 flex flex-col items-center justify-center min-h-[120px] text-center gap-3"><div className="relative"><span className="material-symbols-outlined text-[40px] text-indigo-200">shield</span><span className="material-symbols-outlined text-[24px] text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">verified</span></div><span className="text-sm font-semibold text-on-surface">Stable AI Decisions</span></div>)},
          ].map((card) => (
            <StaggerItem key={card.title}><HoverCard className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-variant flex flex-col h-full">
              <h4 className="font-headline-md text-on-surface mb-2">{card.title}</h4>
              <p className="font-body-sm text-on-surface-variant mb-6 flex-grow">{card.desc}</p>
              {card.content}
            </HoverCard></StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
function CTASection() {
  const badges = ["Free to start", "No credit card required", "Clear evidence", "Actionable reports"]
  return (
    <section className="w-full bg-[#0c111d] py-28 px-6 text-center relative overflow-hidden">
      {}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <Reveal><div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center gap-8">
        {}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
          <span className="material-symbols-outlined text-[18px] text-slate-400">shield</span>
          <span className="text-sm font-medium text-slate-300 tracking-wide">Start Protecting Today</span>
        </div>
        <h2 className="font-headline-xl text-[44px] leading-[1.15] font-bold text-white tracking-tight">
          Start Detecting Fraud Now
        </h2>
        <p className="font-body-lg text-body-lg text-slate-400 max-w-xl">
          Use FraudSentinel to understand suspicious messages before you reply, click, or share sensitive information.
        </p>
        {}
        <div className="flex justify-center gap-4 mt-2">
          <Link to="/login" className="bg-white text-slate-900 px-7 py-3.5 rounded-full font-headline-md text-body-md font-semibold shadow-lg hover:bg-slate-100 hover:scale-[1.03] transition-all duration-200 flex items-center gap-2">
            Get Started Free
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </Link>
          <Link to="/solutions" className="border border-slate-600 text-slate-300 px-7 py-3.5 rounded-full font-headline-md text-body-md font-semibold hover:bg-white/5 hover:border-slate-500 transition-all duration-200">
            See How It Works
          </Link>
        </div>
        {}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-6">
          {badges.map((b) => (
            <div key={b} className="flex items-center gap-2">
              <span className="material-symbols-outlined fill text-[18px] text-emerald-400">check_circle</span>
              <span className="text-sm text-slate-300">{b}</span>
            </div>
          ))}
        </div>
      </div></Reveal>
    </section>
  )
}
export function Footer() {
  return (
    <Reveal><footer className="glass w-full py-12 px-6 border-t border-[var(--border-default)] text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-lg font-bold gradient-text font-headline">FraudSentinel</div>
        <div className="flex flex-wrap justify-center gap-6">
          {["Privacy Policy", "Terms of Service", "Security", "Status", "Contact"].map((t) => (
            <a key={t} className="text-[var(--text-tertiary)] hover:text-accent-violet transition-colors" href="#">{t}</a>
          ))}
        </div>
        <div className="text-[var(--text-tertiary)]">© {new Date().getFullYear()} FraudSentinel AI. All rights reserved.</div>
      </div>
    </footer></Reveal>
  )
}
export default function Landing() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="aurora-bg bg-[var(--surface-0)] text-[var(--text-primary)] font-body min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center w-full">
          <HeroSection />
          <FeaturesSection />
          <ComprehensiveSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </LazyMotion>
  )
}
