import { useState } from "react";
import { Reveal, StaggerContainer, StaggerItem, HoverButton, HoverCard } from "../components/Motion";
import { Sidebar, TopNavbar } from "./Dashboard";
import { motion, AnimatePresence } from "framer-motion";
function SkeletonLoading() {
  return (
    <div className="space-y-4 w-full">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse"></div>
        <div className="space-y-2 flex-grow">
          <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
        <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse"></div>
        <div className="h-4 bg-slate-200 rounded w-4/6 animate-pulse"></div>
      </div>
    </div>
  );
}
function ChatAnalysisLoading() {
  return (
    <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 w-fit">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
      <span className="font-semibold text-sm">Analyzing conversation...</span>
    </div>
  );
}
function EmptyState({ icon, title, desc, cta }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">{desc}</p>
      {cta && (
        <HoverButton className="bg-primary text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-sm">
          {cta}
        </HoverButton>
      )}
    </div>
  );
}
function ErrorState({ type }) {
  if (type === "api") {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
        <span className="material-symbols-outlined text-red-600">error</span>
        <div>
          <h4 className="font-bold text-red-900 text-sm">Something went wrong</h4>
          <p className="text-xs text-red-700 mt-1">Failed to fetch analysis history. Please try again.</p>
          <button className="mt-3 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded transition-colors">Retry</button>
        </div>
      </div>
    );
  }
  if (type === "model") {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800">
        <span className="material-symbols-outlined text-amber-600">dns</span>
        <div>
          <h4 className="font-bold text-sm">Model not available</h4>
          <p className="text-xs mt-1 opacity-80">Please check local setup or restart the system engine.</p>
        </div>
      </div>
    );
  }
}
function ToastNotification({ show, onClose }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          className="fixed top-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-slate-700"
        >
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
          <div>
            <p className="font-bold text-sm">Analysis completed</p>
            <p className="text-xs text-slate-400">Results saved to history.</p>
          </div>
          <button onClick={onClose} className="ml-4 text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function ButtonShowcase() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <HoverButton className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm">Default</HoverButton>
      <button className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transform scale-105 transition-all">Hovered</button>
      <button className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm flex items-center gap-2 cursor-wait opacity-90">
        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Analyzing...
      </button>
      <button className="bg-slate-200 text-slate-400 px-5 py-2.5 rounded-lg font-semibold cursor-not-allowed">Disabled</button>
    </div>
  );
}
function InputShowcase() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Default Input</label>
        <input type="text" placeholder="Enter message..." className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors" />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Focused Input</label>
        <input type="text" value="Testing" readOnly className="w-full bg-white border-2 border-primary rounded-lg px-4 py-2.5 text-sm outline-none shadow-[0_0_0_4px_rgba(79,70,229,0.1)] transition-all" />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Error Input</label>
        <input type="text" value="" placeholder="Message..." readOnly className="w-full bg-red-50 border border-red-300 rounded-lg px-4 py-2.5 text-sm outline-none text-red-900" />
        <p className="text-xs text-red-600 mt-1 font-medium">Please enter a valid message.</p>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Disabled Input</label>
        <input type="text" disabled placeholder="Not allowed" className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed" />
      </div>
    </div>
  );
}
function SystemStatus({ status }) {
  if (status === "online") {
    return (
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm w-fit">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Backend Connected
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm w-fit">
      <span className="w-2 h-2 rounded-full bg-red-500"></span>
      Backend Disconnected
    </div>
  );
}
function ConfirmModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          ></motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-slate-100"
          >
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Conversation?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Are you sure you want to delete this conversation? This action cannot be undone.</p>
            <div className="flex gap-3 w-full">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors">Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default function UIStates() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="bg-slate-50 min-h-screen flex font-body-md text-slate-900 overflow-x-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-grow flex flex-col min-w-0">
        <TopNavbar title="UI Polish & States" />
        <main className="flex-grow p-8 max-w-6xl mx-auto w-full pb-24">
          <Reveal>
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">UI Component System</h1>
              <p className="text-slate-500 mt-2">Production-ready interaction states for FraudSentinel.</p>
            </div>
          </Reveal>
          <StaggerContainer className="space-y-12">
            {}
            <StaggerItem>
              <section>
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">hourglass_empty</span> Loading States
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <HoverCard className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Skeleton Block</h3>
                    <SkeletonLoading />
                  </HoverCard>
                  <HoverCard className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                    <div className="w-full">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Chat Analysis Indicator</h3>
                      <ChatAnalysisLoading />
                    </div>
                  </HoverCard>
                </div>
              </section>
            </StaggerItem>
            {}
            <StaggerItem>
              <section>
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">inbox</span> Empty States
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <EmptyState icon="forum" title="No conversations yet" desc="You haven't run any analysis yet." cta="Start Analysis" />
                  <EmptyState icon="analytics" title="No Results" desc="Run an analysis to see insights." />
                  <EmptyState icon="search_off" title="No Matches" desc="We couldn't find any conversations matching your search." />
                </div>
              </section>
            </StaggerItem>
            {}
            <StaggerItem>
              <section>
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">warning</span> Error & Status Indicators
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <ErrorState type="api" />
                    <ErrorState type="model" />
                  </div>
                  <div className="space-y-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">System Status Tokens</h3>
                    <SystemStatus status="online" />
                    <SystemStatus status="offline" />
                  </div>
                </div>
              </section>
            </StaggerItem>
            {}
            <StaggerItem>
              <section>
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">smart_button</span> Interactive Forms
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <HoverCard className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Button Hierarchy</h3>
                    <ButtonShowcase />
                  </HoverCard>
                  <HoverCard className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Input Field States</h3>
                    <InputShowcase />
                  </HoverCard>
                </div>
              </section>
            </StaggerItem>
            {}
            <StaggerItem>
              <section>
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">layers</span> Overlays & Feedback
                </h2>
                <div className="flex gap-4">
                  <HoverButton onClick={() => setShowToast(true)} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-sm">
                    Trigger Success Toast
                  </HoverButton>
                  <HoverButton onClick={() => setShowModal(true)} className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-slate-50">
                    Open Confirmation Modal
                  </HoverButton>
                </div>
              </section>
            </StaggerItem>
          </StaggerContainer>
        </main>
      </div>
      <ToastNotification show={showToast} onClose={() => setShowToast(false)} />
      <ConfirmModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
