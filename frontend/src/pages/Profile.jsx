import { useNavigate } from "react-router-dom"
import { Sidebar } from "./Dashboard"
export default function Profile() {
  const navigate = useNavigate()
  const username = localStorage.getItem("username") || "User"
  const userId = localStorage.getItem("user_id") || "—"
  if (!localStorage.getItem("token")) { navigate("/login"); return null }
  return (
    <div className="flex min-h-screen bg-[#0c111d] text-white">
      <Sidebar active="profile" />
      <main className="flex-grow p-8 overflow-auto">
        <h1 className="text-2xl font-bold mb-8">Profile</h1>
        <div className="max-w-2xl space-y-6">
          {}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[40px] text-indigo-400">person</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{username}</h2>
              <p className="text-sm text-slate-400 mt-1">ID: {userId.slice(0, 8)}...</p>
              <span className="inline-block mt-2 text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-semibold">Active</span>
            </div>
          </div>
          {}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-slate-400">info</span>Account Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-sm text-slate-400">Username</span><span className="text-sm font-medium">{username}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-sm text-slate-400">User ID</span><span className="text-sm font-mono text-slate-300">{userId}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/5">
                <span className="text-sm text-slate-400">Plan</span><span className="text-sm font-medium text-indigo-400">Free Tier</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-sm text-slate-400">Data Isolation</span>
                <span className="flex items-center gap-1 text-sm text-emerald-400"><span className="material-symbols-outlined fill text-[16px]">check_circle</span>Enabled</span>
              </div>
            </div>
          </div>
          {}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-slate-400">shield</span>Security
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div><p className="text-sm font-medium">Password</p><p className="text-xs text-slate-500">Hashed with bcrypt</p></div>
                <span className="flex items-center gap-1 text-xs text-emerald-400"><span className="material-symbols-outlined fill text-[14px]">lock</span>Secure</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div><p className="text-sm font-medium">Session Token</p><p className="text-xs text-slate-500">UUID-based session</p></div>
                <span className="flex items-center gap-1 text-xs text-emerald-400"><span className="material-symbols-outlined fill text-[14px]">check_circle</span>Active</span>
              </div>
            </div>
          </div>
          {}
          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
            <h3 className="font-bold mb-4 text-red-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">warning</span>Danger Zone
            </h3>
            <button onClick={() => { localStorage.clear(); navigate("/login") }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-all">
              Logout from all sessions
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}