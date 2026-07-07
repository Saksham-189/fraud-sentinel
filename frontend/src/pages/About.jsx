import { Link } from "react-router-dom";
import { Navbar, Footer } from "./Landing";
import { Reveal, StaggerContainer, StaggerItem, HoverCard } from "../components/Motion";
export default function About() {
  return (
    <div className="aurora-bg bg-[var(--surface-0)] text-[var(--text-primary)] font-body min-h-screen flex flex-col">
      {}
      <Navbar />
      <main className="pt-24 pb-20">
        {}
        <section className="px-4 py-20 text-center max-w-4xl mx-auto">
          <Reveal>
            <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight text-[var(--text-primary)] mb-6 leading-tight">
              Defending the digital world with <span className="gradient-text">behavioral intelligence.</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
              FraudSentinel was built to move beyond simple keyword blocking. We analyze the psychology behind the message to catch sophisticated social engineering before it causes harm.
            </p>
          </Reveal>
        </section>
        {}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <StaggerItem>
              <HoverCard className="glass-card p-10 rounded-3xl h-full flex flex-col justify-center">
                <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[28px]">rocket_launch</span>
                </div>
                <h3 className="text-2xl font-headline font-bold text-[var(--text-primary)] mb-4">Our Mission</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  To provide explainable, privacy-conscious fraud detection that is practical for individual users. We believe that everyone deserves protection from increasingly sophisticated scams.
                </p>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard className="glass p-10 rounded-3xl border border-[var(--border-default)] shadow-lg h-full flex flex-col justify-center">
                <div className="w-14 h-14 bg-accent-violet/10 text-accent-violet rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[28px]">visibility</span>
                </div>
                <h3 className="text-2xl font-headline font-bold mb-4 text-[var(--text-primary)]">Our Vision</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  A digital experience where suspicious intent is easier to understand before the user replies, clicks, or shares sensitive information.
                </p>
              </HoverCard>
            </StaggerItem>
          </StaggerContainer>
        </section>
        {}
        <section className="py-20 glass border-y border-[var(--border-default)] mt-10">
          <div className="max-w-6xl mx-auto px-4">
            <Reveal>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-headline font-bold text-[var(--text-primary)] mb-4">Core Principles</h2>
                <p className="text-[var(--text-secondary)] max-w-xl mx-auto">The foundation of everything we build.</p>
              </div>
            </Reveal>
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: "lock", title: "Privacy First", desc: "Your messages are used only for fraud detection inside the FraudSentinel backend and are not sent to third-party AI APIs." },
                { icon: "psychology", title: "Behavioral Analysis", desc: "We don't just look for bad words. We look for bad intentions—urgency, fear, and manipulation." },
                { icon: "bolt", title: "Fast Feedback", desc: "The product is designed to return useful analysis quickly enough to help you decide before you act." }
              ].map((value, i) => (
                <StaggerItem key={i}>
                  <div className="glass-card p-8 text-center rounded-3xl hover:border-accent-violet/50 transition-colors h-full group">
                    <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[32px] text-accent-violet">{value.icon}</span>
                    </div>
                    <h3 className="text-xl font-headline font-bold text-[var(--text-primary)] mb-3">{value.title}</h3>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{value.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
        {}
        <section className="py-24 px-4 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-[var(--text-primary)] mb-6">Ready to secure your communications?</h2>
            <p className="text-lg text-[var(--text-secondary)] mb-10">Join thousands of users trusting FraudSentinel.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register" className="bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow-glow-violet hover:shadow-glow-violet-lg px-8 py-4 rounded-xl font-bold hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                Create Free Account
              </Link>
              <Link to="/solutions" className="glass text-[var(--text-primary)] border border-[var(--border-default)] px-8 py-4 rounded-xl font-bold hover:bg-[var(--surface-2)] transition-colors w-full sm:w-auto">
                View Solutions
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      {}
      <Footer />
    </div>
  );
}
