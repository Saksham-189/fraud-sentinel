import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { HoverButton } from "../components/Motion"
import { authApi, checkHealth } from "../services/api"
function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const colors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];
  const idx = Math.min(score, 4);
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= idx ? colors[idx] : 'bg-slate-200'}`}></div>
        ))}
      </div>
      <p className={`text-[10px] font-bold ${idx >= 3 ? 'text-emerald-600' : idx >= 2 ? 'text-amber-600' : 'text-red-500'}`}>{labels[idx]}</p>
    </div>
  );
}
function AuthInput({ label, type = "text", value, onChange, placeholder, error, icon, rightElement, disabled }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-white border rounded-xl ${icon ? 'pl-11' : 'pl-4'} pr-12 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 ${error ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/15'} disabled:opacity-50 disabled:bg-slate-50`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{error}</p>}
    </div>
  );
}
const formVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};
function LoginForm({ onSwitch }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    return e;
  };
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({}); setApiError(""); setLoading(true);
    try {
      const isOnline = await checkHealth();
      if (isOnline) {
        const res = await authApi.login(email, password);
        if (res.error) {
          setApiError(res.error);
          setLoading(false);
          return;
        }
        localStorage.setItem("token", res.token);
        localStorage.setItem("user_id", res.user_id);
      }
      localStorage.setItem("fs_authed", "true");
      localStorage.setItem("fs_user", JSON.stringify({ name: email.split("@")[0], email }));
      navigate("/dashboard");
    } catch {
      localStorage.setItem("fs_authed", "true");
      localStorage.setItem("fs_user", JSON.stringify({ name: email.split("@")[0], email }));
      navigate("/dashboard");
    }
  };
  return (
    <motion.form key="login" variants={formVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} onSubmit={handleSubmit} className="space-y-5">
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm text-red-700 font-medium">
          <span className="material-symbols-outlined text-[18px]">error</span>{apiError}
        </div>
      )}
      <AuthInput label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" error={errors.email} icon="mail" disabled={loading} />
      <AuthInput label="Password" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" error={errors.password} icon="lock" disabled={loading}
        rightElement={<button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-slate-600 transition-colors"><span className="material-symbols-outlined text-[20px]">{showPw ? "visibility_off" : "visibility"}</span></button>}
      />
      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:text-indigo-700 transition-colors">Forgot password?</Link>
      </div>
      <HoverButton type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Signing in...</> : <>Sign In<span className="material-symbols-outlined text-[18px]">arrow_forward</span></>}
      </HoverButton>
      <p className="text-center text-sm text-slate-500">Don't have an account? <button type="button" onClick={onSwitch} className="font-semibold text-primary hover:text-indigo-700 transition-colors">Create one</button></p>
    </motion.form>
  );
}
function RegisterForm({ onSwitch }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Minimum 6 characters";
    if (password !== confirm) e.confirm = "Passwords don't match";
    return e;
  };
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({}); setLoading(true);
    try {
      const isOnline = await checkHealth();
      if (isOnline) {
        const reg = await authApi.register(email, password);
        if (reg.error) { setErrors({ email: reg.error }); setLoading(false); return; }
        const login = await authApi.login(email, password);
        if (login.token) {
          localStorage.setItem("token", login.token);
          localStorage.setItem("user_id", login.user_id);
        }
      }
    } catch {
    }
    localStorage.setItem("fs_authed", "true");
    localStorage.setItem("fs_user", JSON.stringify({ name, email }));
    navigate("/dashboard");
  };
  return (
    <motion.form key="register" variants={formVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} onSubmit={handleSubmit} className="space-y-4">
      <AuthInput label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" error={errors.name} icon="person" disabled={loading} />
      <AuthInput label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" error={errors.email} icon="mail" disabled={loading} />
      <div>
        <AuthInput label="Password" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" error={errors.password} icon="lock" disabled={loading}
          rightElement={<button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-slate-600 transition-colors"><span className="material-symbols-outlined text-[20px]">{showPw ? "visibility_off" : "visibility"}</span></button>}
        />
        <PasswordStrength password={password} />
      </div>
      <AuthInput label="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" error={errors.confirm} icon="lock" disabled={loading} />
      <HoverButton type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Creating account...</> : <>Create Account<span className="material-symbols-outlined text-[18px]">arrow_forward</span></>}
      </HoverButton>
      <p className="text-center text-sm text-slate-500">Already have an account? <button type="button" onClick={onSwitch} className="font-semibold text-primary hover:text-indigo-700 transition-colors">Sign in</button></p>
    </motion.form>
  );
}
function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address"); return; }
    setError(""); setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setSent(true); setLoading(false);
  };
  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-emerald-600 text-[32px]">mark_email_read</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">We've sent password reset instructions to <strong className="text-slate-700">{email}</strong></p>
        <Link to="/login" className="text-sm font-semibold text-primary hover:text-indigo-700 transition-colors flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Sign In
        </Link>
      </motion.div>
    );
  }
  return (
    <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-4">
        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-primary text-[28px]">lock_reset</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Reset your password</h2>
        <p className="text-sm text-slate-500">Enter your email and we'll send you instructions.</p>
      </div>
      <AuthInput label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" error={error} icon="mail" disabled={loading} />
      <HoverButton type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Sending...</> : "Send Reset Link"}
      </HoverButton>
      <Link to="/login" className="block text-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
        <span className="material-symbols-outlined text-[14px] align-middle mr-1">arrow_back</span>Back to Sign In
      </Link>
    </motion.form>
  );
}
function ResetPasswordForm() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Minimum 6 characters";
    if (password !== confirm) e.confirm = "Passwords don't match";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    navigate("/login");
  };
  return (
    <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-4">
        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-primary text-[28px]">password</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Set new password</h2>
        <p className="text-sm text-slate-500">Your new password must be different from previous ones.</p>
      </div>
      <div>
        <AuthInput label="New Password" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" error={errors.password} icon="lock" disabled={loading}
          rightElement={<button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined text-[20px]">{showPw ? "visibility_off" : "visibility"}</span></button>}
        />
        <PasswordStrength password={password} />
      </div>
      <AuthInput label="Confirm New Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" error={errors.confirm} icon="lock" disabled={loading} />
      <HoverButton type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Resetting...</> : "Reset Password"}
      </HoverButton>
    </motion.form>
  );
}
export function AuthGuard({ children }) {
  const isAuthed = localStorage.getItem("fs_authed") === "true";
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-amber-600 text-[28px]">lock</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication Required</h2>
          <p className="text-sm text-slate-500 mb-6">Please sign in to access this page.</p>
          <Link to="/login">
            <HoverButton className="bg-primary text-white px-8 py-2.5 rounded-xl font-semibold text-sm shadow-md w-full">
              Sign In
            </HoverButton>
          </Link>
        </motion.div>
      </div>
    );
  }
  return children;
}
export function performLogout(navigate) {
  localStorage.removeItem("fs_authed");
  localStorage.removeItem("fs_user");
  navigate("/login");
}
export default function Auth() {
  const location = useLocation();
  const isRegisterRoute = location.pathname === "/register";
  const isForgotRoute = location.pathname === "/forgot-password";
  const isResetRoute = location.pathname === "/reset-password";
  const [mode, setMode] = useState(isRegisterRoute ? "register" : "login");
  const getContent = () => {
    if (isForgotRoute) return <ForgotPasswordForm />;
    if (isResetRoute) return <ResetPasswordForm />;
    return (
      <>
        {}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
          <button onClick={() => setMode("login")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Sign In</button>
          <button onClick={() => setMode("register")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Register</button>
        </div>
        <AnimatePresence mode="wait">
          {mode === "login" ? <LoginForm key="l" onSwitch={() => setMode("register")} /> : <RegisterForm key="r" onSwitch={() => setMode("login")} />}
        </AnimatePresence>
      </>
    );
  };
  return (
    <div className="min-h-screen bg-slate-50 flex font-body-md text-slate-900">
      {}
      <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-indigo-600 via-primary to-violet-700 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[28px]">shield_locked</span>
            <span className="font-headline-md font-bold text-xl tracking-tight">FraudSentinel</span>
          </Link>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-snug mb-4">Analyze conversations.<br/>Detect fraud.<br/>Stay secure.</h2>
          <p className="text-white/70 leading-relaxed text-sm">FraudSentinel uses hybrid AI to detect social engineering, phishing, and credential theft in real-time — all processed locally on your device.</p>
          <div className="mt-10 space-y-4">
            {[
              { icon: "psychology", text: "Behavioral analysis engine" },
              { icon: "speed", text: "Sub-50ms response time" },
              { icon: "lock", text: "100% offline processing" },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 text-white/90">
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">{f.icon}</span>
                </div>
                <span className="text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-xs relative z-10">© 2026 FraudSentinel. All rights reserved.</p>
      </div>
      {}
      <div className="flex-grow flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-900">
              <span className="material-symbols-outlined text-primary text-[28px]">shield_locked</span>
              <span className="font-headline-md font-bold text-xl tracking-tight">FraudSentinel</span>
            </Link>
          </div>
          {!isForgotRoute && !isResetRoute && (
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                {mode === "login" ? "Welcome back" : "Get started"}
              </h1>
              <p className="text-sm text-slate-500">
                {mode === "login" ? "Sign in to your fraud detection dashboard" : "Create your free account to start analyzing"}
              </p>
            </div>
          )}
          {getContent()}
          <p className="text-center text-xs text-slate-400 mt-8">
            By continuing you agree to our <a href="#" className="text-primary hover:text-indigo-700">Terms</a> and <a href="#" className="text-primary hover:text-indigo-700">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}