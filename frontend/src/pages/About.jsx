import { Link } from "react-router-dom";
import { Navbar } from "./Landing";
import { Reveal, StaggerContainer, StaggerItem, HoverCard } from "../components/Motion";
export default function About() {
  return (
    <div className="bg-slate-50 min-h-screen font-body-md text-slate-900 overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {}
      <Navbar />
      <main className="pt-24 pb-20">
        {}
        <section className="px-4 py-20 text-center max-w-4xl mx-auto">
          <Reveal>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
              Defending the digital world with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-fuchsia-600">behavioral intelligence.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              FraudSentinel was built to move beyond simple keyword blocking. We analyze the psychology behind the message to catch sophisticated social engineering before it causes harm.
            </p>
          </Reveal>
        </section>
        {}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <StaggerItem>
              <HoverCard className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 h-full flex flex-col justify-center">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[28px]">rocket_launch</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h3>
                <p className="text-slate-600 leading-relaxed">
                  To provide democratized, enterprise-grade fraud detection that operates locally and respects user privacy. We believe that everyone deserves protection from increasingly sophisticated scams.
                </p>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard className="bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-xl shadow-slate-900/20 h-full flex flex-col justify-center text-white">
                <div className="w-14 h-14 bg-slate-800 text-primary rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[28px]">visibility</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-slate-400 leading-relaxed">
                  A digital ecosystem where malicious intent is neutralized instantly at the edge, before it ever reaches the user's inbox, chat thread, or text messages.
                </p>
              </HoverCard>
            </StaggerItem>
          </StaggerContainer>
        </section>
        {}
        <section className="py-20 bg-white border-y border-slate-100 mt-10">
          <div className="max-w-6xl mx-auto px-4">
            <Reveal>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Core Principles</h2>
                <p className="text-slate-500 max-w-xl mx-auto">The foundation of everything we build.</p>
              </div>
            </Reveal>
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: "lock", title: "Privacy First", desc: "Our models run locally. Your conversations never leave your network unless you explicitly share them." },
                { icon: "psychology", title: "Behavioral Analysis", desc: "We don't just look for bad words. We look for bad intentions—urgency, fear, and manipulation." },
                { icon: "bolt", title: "Real-time Speed", desc: "Security is useless if it's slow. Our hybrid engine returns complex analysis in under 50 milliseconds." }
              ].map((value, i) => (
                <StaggerItem key={i}>
                  <div className="p-8 text-center border border-slate-100 rounded-3xl hover:border-primary/30 transition-colors bg-slate-50 hover:bg-white h-full group">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[32px] text-primary">{value.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{value.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
        {}
        <section className="py-24 px-4 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Ready to secure your communications?</h2>
            <p className="text-lg text-slate-500 mb-10">Join thousands of users trusting FraudSentinel.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register" className="bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                Create Free Account
              </Link>
              <Link to="/solutions" className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-colors w-full sm:w-auto">
                View Solutions
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      {}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 text-center text-sm border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-white font-black text-xl tracking-tight">
            <span className="material-symbols-outlined text-primary">shield_locked</span>
            FraudSentinel
          </div>
          <p>© 2026 FraudSentinel. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}