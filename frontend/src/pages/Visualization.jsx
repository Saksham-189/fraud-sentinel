import { useState } from "react";
import { Sidebar, TopNavbar } from "./Dashboard";
import { Reveal, StaggerContainer, StaggerItem, HoverCard } from "../components/Motion";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, YAxis as BarYAxis, XAxis as BarXAxis, ReferenceLine
} from "recharts";
const timelineData = [
  { index: "Msg 1", risk: 0.1, text: "Hi, this is bank support.", time: "10:01 AM" },
  { index: "Msg 2", risk: 0.4, text: "We noticed unauthorized access on your account.", time: "10:02 AM" },
  { index: "Msg 3", risk: 0.95, text: "Send OTP now or your account will be blocked.", time: "10:05 AM" }
];
const behaviorData = [
  { name: "Credential Intent", score: 92, fill: "#d946ef", desc: "Detected phrases like 'Send OTP', 'password'" },
  { name: "Urgency", score: 85, fill: "#3b82f6", desc: "Detected phrases like 'act now', 'immediately'" },
  { name: "Fear", score: 75, fill: "#f43f5e", desc: "Detected threats like 'will be blocked'" },
  { name: "Authority", score: 60, fill: "#6366f1", desc: "Claiming to be 'bank support'" },
  { name: "Link Risk", score: 10, fill: "#10b981", desc: "No suspicious links found" }
];
const highlightedMessage = [
  { text: "Send ", type: "normal" },
  { text: "OTP", type: "highlight", color: "bg-fuchsia-200 text-fuchsia-800", label: "Credential Intent", desc: "Direct request for authentication code", conf: "98%" },
  { text: " ", type: "normal" },
  { text: "now", type: "highlight", color: "bg-blue-200 text-blue-800", label: "Urgency", desc: "Artificial time pressure applied", conf: "92%" },
  { text: " or your account will be ", type: "normal" },
  { text: "blocked", type: "highlight", color: "bg-rose-200 text-rose-800", label: "Fear", desc: "Threat of negative consequence", conf: "89%" },
  { text: ".", type: "normal" }
];
const keySignals = [
  { title: "Credential Request", desc: "Explicitly asking for OTP or password.", icon: "password", color: "text-fuchsia-600 bg-fuchsia-100" },
  { title: "High Urgency", desc: "Forcing immediate action to bypass logic.", icon: "timer", color: "text-blue-600 bg-blue-100" },
  { title: "Authority Impersonation", desc: "Claiming to be an official bank representative.", icon: "local_police", color: "text-indigo-600 bg-indigo-100" }
];
const CustomTimelineTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 max-w-xs">
        <p className="text-xs text-slate-400 font-bold mb-1">{data.index} • {data.time}</p>
        <p className="text-sm font-medium leading-relaxed mb-2">"{data.text}"</p>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Risk Score</span>
          <span className={`text-sm font-black ${data.risk > 0.7 ? 'text-red-400' : data.risk > 0.3 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {(data.risk * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};
function RiskTimelineChart() {
  return (
    <HoverCard className="bg-white border border-surface-variant rounded-3xl p-6 shadow-sm h-[350px] flex flex-col">
      <div className="mb-6">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">timeline</span> Risk Escalation
        </h3>
        <p className="text-sm text-slate-500">How fraud probability evolved across the conversation.</p>
      </div>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timelineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.8}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="index" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dy={10} />
            <YAxis domain={[0, 1]} tickFormatter={(val) => `${val * 100}%`} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
            <RechartsTooltip content={<CustomTimelineTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <ReferenceLine y={0.7} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.3} />
            <ReferenceLine y={0.3} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.3} />
            <Line 
              type="monotone" 
              dataKey="risk" 
              stroke="url(#riskGradient)" 
              strokeWidth={4} 
              dot={{ r: 6, strokeWidth: 2, fill: "#fff" }} 
              activeDot={{ r: 8, fill: "#0f172a", stroke: "#fff", strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </HoverCard>
  );
}
const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 max-w-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold">{data.name}</span>
          <span className="text-sm font-black text-primary">{data.score}%</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">{data.desc}</p>
      </div>
    );
  }
  return null;
};
function BehaviorBreakdownChart() {
  return (
    <HoverCard className="bg-white border border-surface-variant rounded-3xl p-6 shadow-sm h-[350px] flex flex-col">
      <div className="mb-6">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">bar_chart</span> Behavior Breakdown
        </h3>
        <p className="text-sm text-slate-500">Contribution of each psychological signal.</p>
      </div>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={behaviorData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <BarXAxis type="number" domain={[0, 100]} hide />
            <BarYAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} width={120} />
            <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20} animationDuration={1000} animationBegin={200}>
              {behaviorData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </HoverCard>
  );
}
function MessageHighlightViewer() {
  return (
    <HoverCard className="bg-white border border-surface-variant rounded-3xl p-6 shadow-sm h-full">
      <div className="mb-6">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">find_in_page</span> Context Analysis
        </h3>
        <p className="text-sm text-slate-500">Hover over highlighted phrases to understand the AI's reasoning.</p>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner min-h-[150px] flex items-center justify-center">
        <p className="text-xl leading-relaxed text-slate-800 font-medium text-center max-w-lg">
          {highlightedMessage.map((chunk, idx) => {
            if (chunk.type === "normal") return <span key={idx}>{chunk.text}</span>;
            return (
              <span key={idx} className={`relative group inline-block cursor-help mx-1 px-2 py-0.5 rounded-lg font-bold ${chunk.color} transition-all hover:ring-2 hover:ring-offset-2 hover:ring-slate-300`}>
                {chunk.text}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-[200px] bg-slate-900 text-left px-4 py-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10 shadow-2xl scale-95 group-hover:scale-100 origin-bottom">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-xs font-black uppercase tracking-wider">{chunk.label}</span>
                    <span className="text-primary text-[10px] font-bold bg-primary/20 px-1.5 rounded">{chunk.conf}</span>
                  </div>
                  <span className="text-slate-300 text-xs leading-snug block">{chunk.desc}</span>
                  <svg className="absolute text-slate-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                </span>
              </span>
            );
          })}
        </p>
      </div>
    </HoverCard>
  );
}
function KeySignalsPanel() {
  return (
    <HoverCard className="bg-white border border-surface-variant rounded-3xl p-6 shadow-sm h-full">
      <div className="mb-6">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">psychology</span> Key Signals
        </h3>
        <p className="text-sm text-slate-500">Summary of detected manipulation tactics.</p>
      </div>
      <div className="space-y-4">
        {keySignals.map((signal, idx) => (
          <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-default group">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${signal.color} group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-[20px]">{signal.icon}</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">{signal.title}</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{signal.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </HoverCard>
  );
}
export default function InsightsDashboard() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
    <div className="bg-slate-50 min-h-screen flex font-body-md text-slate-900 overflow-x-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-grow flex flex-col min-w-0">
        <TopNavbar title="Advanced Visualization" />
        <main className="flex-grow p-8 max-w-6xl mx-auto w-full pb-24">
          <Reveal>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Intelligence Report</h1>
              <p className="text-slate-500 mt-2">Deep dive into the reasoning behind the AI's risk assessment.</p>
            </div>
          </Reveal>
          <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <StaggerItem>
              <RiskTimelineChart />
            </StaggerItem>
            <StaggerItem>
              <BehaviorBreakdownChart />
            </StaggerItem>
            <StaggerItem>
              <MessageHighlightViewer />
            </StaggerItem>
            <StaggerItem>
              <KeySignalsPanel />
            </StaggerItem>
          </StaggerContainer>
        </main>
      </div>
    </div>
  );
}