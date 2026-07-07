import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "./Landing";
import { Reveal, StaggerContainer, StaggerItem, HoverCard, HoverButton } from "../components/Motion";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    badge: null,
    features: [
      "Basic message analysis",
      "20 analyses/day",
      "Conversation-level detection",
      "Basic explanations",
    ],
    cta: "Start Free",
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    badge: "Most Popular",
    features: [
      "Higher daily analysis limits",
      "Full conversation analysis",
      "Detailed behavioral insights",
      "History and saved conversations",
      "Faster processing",
    ],
    cta: "Upgrade to Pro",
  },
  {
    name: "Advanced",
    price: "$19",
    period: "/month",
    badge: null,
    features: [
      "Everything in Pro",
      "Priority performance",
      "Extended conversation history",
      "Advanced explanation depth",
      "Early access to new features",
    ],
    cta: "Get Advanced",
  },
];

const comparisonRows = [
  { name: "Message analysis", values: ["yes", "yes", "yes"] },
  { name: "Conversation analysis", values: ["yes", "yes", "yes"] },
  { name: "Behavioral insights", values: ["no", "yes", "yes"] },
  { name: "History", values: ["no", "yes", "yes"] },
  { name: "Intelligence reports", values: ["basic", "yes", "yes"] },
  { name: "Advanced explanations", values: ["no", "no", "yes"] },
];

function FAQAccordion({ items }) {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={item.q} className="border border-surface-variant rounded-xl overflow-hidden bg-white shadow-sm">
          <button
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            className="w-full px-6 py-4 flex justify-between items-center glass-card hover:bg-[var(--surface-2)] transition-colors text-left font-semibold text-[var(--text-primary)]"
          >
            {item.q}
            <span className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${openIdx === idx ? "rotate-180" : ""}`}>expand_more</span>
          </button>
          {openIdx === idx && (
            <div className="px-6 py-4 text-slate-600 bg-white border-t border-surface-variant leading-relaxed">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Pricing() {
  const faqItems = [
    { q: "Is my data private?", a: "Yes. Messages are processed by your FraudSentinel backend for fraud detection and are not sent to third-party AI APIs." },
    { q: "Does this work offline?", a: "The hosted SaaS version requires the backend API. Local development can run the frontend, backend, and models on your own machine." },
    { q: "Can I upgrade later?", a: "You can switch plans at any time from your dashboard. Upgrades are immediate." },
    { q: "What happens when I hit the free plan limits?", a: "Once you reach the daily quota, the UI will prompt you to upgrade to continue analysis." },
  ];

  return (
    <div className="aurora-bg bg-[var(--surface-0)] text-[var(--text-primary)] font-body min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow px-6 py-12 max-w-7xl mx-auto flex flex-col gap-16 w-full relative z-10">
        <section className="text-center py-12 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
          <Reveal>
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-4">
              Simple, Transparent Pricing
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-6">
              Choose the personal plan that fits how often you analyze suspicious messages and conversations.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex items-center justify-center gap-4 mt-6">
              <HoverButton className="bg-gradient-to-r from-violet-600 to-pink-500 text-white px-8 py-3 rounded-full font-headline font-semibold shadow-glow-violet hover:shadow-glow-violet-lg">
                Get Started
              </HoverButton>
              <HoverButton className="glass text-[var(--text-primary)] border border-[var(--border-default)] px-8 py-3 rounded-full font-headline font-semibold hover:bg-[var(--surface-2)]">
                View Plans
              </HoverButton>
            </div>
          </Reveal>
        </section>

        <section>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <StaggerItem key={plan.name}>
                <HoverCard className="glass-card rounded-2xl p-8 flex flex-col h-full relative">
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-[var(--text-primary)]">{plan.price}</span>
                      {plan.period && <span className="text-[var(--text-tertiary)] font-medium">{plan.period}</span>}
                    </div>
                  </div>
                  <ul className="space-y-4 mt-2 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-[var(--text-secondary)] font-medium">
                        <span className="material-symbols-outlined text-emerald-500 text-[20px] shrink-0">check_circle</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link to="/login" className={`block w-full text-center py-3.5 rounded-xl font-bold transition-all shadow-sm ${plan.badge ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:bg-primary/90" : "bg-slate-50 text-[var(--text-primary)] border border-slate-200 hover:bg-slate-100"}`}>
                      {plan.cta}
                    </Link>
                  </div>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <section className="py-12">
          <Reveal>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-8 text-center">Compare Plans</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-5 px-6 text-left font-bold text-[var(--text-primary)] w-1/3">Feature</th>
                    <th className="py-5 px-6 text-center font-bold text-[var(--text-primary)]">Starter</th>
                    <th className="py-5 px-6 text-center font-bold text-primary">Pro</th>
                    <th className="py-5 px-6 text-center font-bold text-[var(--text-primary)]">Advanced</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.name} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-[var(--text-secondary)]">{row.name}</td>
                      {row.values.map((value, index) => (
                        <td key={index} className="py-4 px-6 text-center">
                          {value === "basic" ? (
                            <span className="text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Basic</span>
                          ) : (
                            <span className={`material-symbols-outlined text-[20px] ${value === "yes" ? "text-emerald-500" : "text-slate-300"}`}>
                              {value === "yes" ? "check_circle" : "close"}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </section>

        <section className="py-12">
          <Reveal>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-10 text-center">Why FraudSentinel?</h2>
          </Reveal>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "shield", title: "Prevent costly mistakes", desc: "Stop scams before they hit your account.", color: "text-primary", bg: "bg-indigo-50" },
              { icon: "visibility", title: "Understand risk quickly", desc: "Clear insights let you make confident decisions.", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: "privacy_tip", title: "Data stays controlled", desc: "Analysis stays within your FraudSentinel backend, with no third-party AI API calls.", color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: "auto_awesome", title: "AI-powered support", desc: "Hybrid models help explain why a message was flagged.", color: "text-purple-600", bg: "bg-purple-50" },
            ].map((value) => (
              <StaggerItem key={value.title}>
                <HoverCard className="bg-white p-8 rounded-3xl flex flex-col items-center text-center border border-slate-200 shadow-sm h-full">
                  <div className={`w-14 h-14 ${value.bg} ${value.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <span className="material-symbols-outlined text-[28px]">{value.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">{value.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{value.desc}</p>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <section className="py-12 max-w-3xl mx-auto w-full">
          <Reveal>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-8 text-center">Frequently Asked Questions</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <FAQAccordion items={faqItems} />
          </Reveal>
        </section>

        <section className="py-24 px-8 bg-slate-900 text-white text-center relative overflow-hidden rounded-[3rem] shadow-2xl mb-12">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary to-indigo-900 opacity-90" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
          <Reveal className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Start Protecting Yourself Today</h2>
            <p className="text-lg text-indigo-100 mb-10">Analyze suspicious messages with clearer evidence, confidence, and next steps.</p>
            <HoverButton scale={1.05} className="bg-white text-[var(--text-primary)] px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-indigo-900/50 hover:shadow-2xl transition-all">
              Try FraudSentinel Free
            </HoverButton>
          </Reveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}
