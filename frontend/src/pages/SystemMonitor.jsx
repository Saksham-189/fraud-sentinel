import { useState, useEffect } from "react";
import { Sidebar, TopNavbar } from "./Dashboard";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { axiosClient } from "../services/api";

function MetricCard({ title, value, subtitle, icon, color }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-slate-500 font-medium text-sm mb-1">{title}</h3>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
    </div>
  );
}

export default function SystemMonitor() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Poll for metrics every 5 seconds
  useEffect(() => {
    let interval;
    const fetchStatus = async () => {
      try {
        const res = await axiosClient.get("/system-status");
        setStatus(res.data);
      } catch (err) {
        console.error("Failed to fetch system metrics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const dummyChartData = [
    { name: "08:00", requests: 120 },
    { name: "09:00", requests: 210 },
    { name: "10:00", requests: 180 },
    { name: "11:00", requests: 290 },
    { name: "12:00", requests: 350 },
    { name: "13:00", requests: 420 },
    { name: "14:00", requests: 380 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[40px] text-slate-400">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="fs-app min-h-screen flex font-body-md">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-grow flex flex-col min-w-0">
        <TopNavbar title="System Monitor" />
        <div className="p-6 md:p-8 flex-grow overflow-y-auto">
          
          {/* SECTION 1 - STATUS HEADER */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`relative flex items-center justify-center w-16 h-16 rounded-full ${status?.status === "healthy" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                <span className="material-symbols-outlined text-[32px] absolute z-10">{status?.status === "healthy" ? "check_circle" : "error"}</span>
                {status?.status === "healthy" && <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">System {status?.status === "healthy" ? "Healthy" : "Degraded"}</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">v{status?.version} • Uptime: <span className="text-slate-800">{status?.uptime}</span></p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Backend</p>
                <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1 justify-center"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online</p>
              </div>
              <div className="text-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Database</p>
                <p className={`text-sm font-semibold flex items-center gap-1 justify-center ${status?.database === "connected" ? "text-emerald-600" : "text-red-600"}`}>
                  <span className={`w-2 h-2 rounded-full ${status?.database === "connected" ? "bg-emerald-500" : "bg-red-500"}`}></span> {status?.database}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2 - METRICS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard title="Total Analyses" value={status?.total_analyses || 0} icon="analytics" color="bg-indigo-100 text-indigo-600" subtitle="Processed by pipeline" />
            <MetricCard title="Fraud Detections" value={status?.fraud_detections || 0} icon="security" color="bg-red-100 text-red-600" subtitle={`Detection rate: ${status?.fraud_detection_rate}`} />
            <MetricCard title="API Latency" value={`${status?.api_latency_ms || 0}ms`} icon="speed" color="bg-amber-100 text-amber-600" subtitle="Avg response time" />
            <MetricCard title="CPU Usage" value={status?.system?.cpu_usage || "0%"} icon="memory" color="bg-blue-100 text-blue-600" subtitle={`RAM: ${status?.system?.ram_usage || "0%"}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* SECTION 4 - PERFORMANCE CHARTS */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">monitoring</span> API Throughput
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dummyChartData}>
                    <defs>
                      <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorReq)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SECTION 3 - LIVE ACTIVITY */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history_toggle_off</span> Live Activity
              </h3>
              <div className="flex-grow overflow-y-auto space-y-4">
                {status?.recent_activity?.length > 0 ? (
                  status.recent_activity.map((act, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                      <p className="text-slate-600 font-medium">{act}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-8">No recent activity detected.</p>
                )}
              </div>
              
              {status?.recent_errors?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="font-bold text-sm text-red-600 mb-3 uppercase tracking-wider">Recent Errors</h4>
                  <div className="space-y-2">
                    {status.recent_errors.slice(0,3).map((err, i) => (
                      <p key={i} className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded border border-slate-100 truncate">
                        [{err.timestamp}] {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
