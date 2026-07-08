/* eslint-disable react-refresh/only-export-components */
import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { HoverButton } from "../components/Motion"
import { authApi } from "../services/api"
import { useAuth } from "../context/AuthContext"

// ─── Password Strength ──────────────────────────────────────────────

function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const gradients = [
    "from-red-500 to-red-400",
    "from-orange-500 to-amber-400",
    "from-amber-500 to-yellow-400",
    "from-emerald-500 to-green-400",
    "from-cyan-500 to-emerald-400",
  ];
  const textColors = ["text-red-500", "text-orange-500", "text-amber-500", "text-emerald-500", "text-cyan-500"];
  const idx = Math.min(score, 4);
  return (
    <div className="mt-2.5">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= idx ? `bg-gradient-to-r ${gradients[idx]}` : "bg-[var(--surface-3)]"
            }`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-bold ${textColors[idx]}`}>{labels[idx]}</p>
    </div>
  );
}

// ─── Auth Input ─────────────────────────────────────────────────────

function AuthInput({ label, type = "text", value, onChange, placeholder, error, icon, rightElement, disabled }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">{label}</label>
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-[20px]">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-[var(--surface-2)] border rounded-xl ${icon ? "pl-11" : "pl-4"} pr-12 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-all duration-200 ${
            error
              ? "border-red-500/50 focus:ring-2 focus:ring-red-500/20"
              : "border-[var(--border-default)] focus:border-accent-violet focus:ring-2 focus:ring-accent-violet/15"
          } disabled:opacity-50`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">error</span>{error}
        </p>
      )}
    </div>
  );
}

// ─── Form Variants ──────────────────────────────────────────────────

function EyeToggleIcon({ hidden }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {hidden ? (
        <>
          <path d="m3 3 18 18" />
          <path d="M10.6 10.6A3 3 0 0 0 14 14" />
          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3 3.8" />
          <path d="M6.5 6.8C3.7 8.6 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 5-1.2" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

function PasswordVisibilityButton({ visible, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={visible ? "Hide password" : "Show password"}
      className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
    >
      <EyeToggleIcon hidden={visible} />
    </button>
  );
}

const formVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// ─── Login Form ─────────────────────────────────────────────────────

function LoginForm({ onSwitch }) {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      const res = await login(email, password);
      if (res.error) {
        setApiError(res.error);
        setLoading(false);
        return;
      }
      navigate("/dashboard");
    } catch {
      setApiError("Server not reachable. Please try again.");
      setLoading(false);
    }
  };
  return (
    <motion.form key="login" variants={formVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} onSubmit={handleSubmit} className="space-y-5">
      {apiError && (
        <div className="glass-card !rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm text-red-500 font-medium border-l-4 !border-l-red-500">
          <span className="material-symbols-outlined text-[18px]">error</span>{apiError}
        </div>
      )}
      <AuthInput label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" error={errors.email} icon="mail" disabled={loading} />
      <AuthInput label="Password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" error={errors.password} icon="lock" disabled={loading}
        rightElement={<PasswordVisibilityButton visible={showPw} onClick={() => setShowPw(!showPw)} disabled={loading} />}
      />
      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-xs font-semibold text-accent-violet hover:opacity-80 transition-opacity">Forgot password?</Link>
      </div>
      <HoverButton type="submit" disabled={loading} className="w-full bg-gradient-to-r from-violet-600 to-pink-500 text-white py-3 rounded-xl font-semibold text-sm shadow-glow-violet hover:shadow-glow-violet-lg transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">
        {loading ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Signing in...</> : <>Sign In<span className="material-symbols-outlined text-[18px]">arrow_forward</span></>}
      </HoverButton>
      <p className="text-center text-sm text-[var(--text-secondary)]">Don&apos;t have an account? <button type="button" onClick={onSwitch} className="font-semibold text-accent-violet hover:opacity-80 transition-opacity">Create one</button></p>
    </motion.form>
  );
}

// ─── Register Form ──────────────────────────────────────────────────

function RegisterForm({ onSwitch }) {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
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
    if (Object.keys(v).length) { setErrors(v); setApiError(""); return; }
    setErrors({}); setApiError(""); setLoading(true);
    try {
      const reg = await register(name, email, password);
      if (reg.error) { setApiError(reg.error); setLoading(false); return; }
    } catch {
      setApiError("Server not reachable. Please try again.");
      setLoading(false);
      return;
    }
    navigate("/dashboard");
  };
  return (
    <motion.form key="register" variants={formVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} onSubmit={handleSubmit} className="space-y-4 relative z-20 pointer-events-auto">
      {apiError && (
        <div className="glass-card !rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm text-red-500 font-medium border-l-4 !border-l-red-500">
          <span className="material-symbols-outlined text-[18px]">error</span>{apiError}
        </div>
      )}
      <AuthInput label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" error={errors.name} icon="person" disabled={loading} />
      <AuthInput label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" error={errors.email} icon="mail" disabled={loading} />
      <div>
        <AuthInput label="Password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" error={errors.password} icon="lock" disabled={loading}
          rightElement={<PasswordVisibilityButton visible={showPw} onClick={() => setShowPw(!showPw)} disabled={loading} />}
        />
        <PasswordStrength password={password} />
      </div>
      <AuthInput label="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" error={errors.confirm} icon="lock" disabled={loading} />
      <button type="button" onClick={handleSubmit} disabled={loading} className="relative z-20 pointer-events-auto w-full bg-gradient-to-r from-violet-600 to-pink-500 text-white py-3 rounded-xl font-semibold text-sm shadow-glow-violet hover:shadow-glow-violet-lg transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">
        {loading ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Creating account...</> : <>Create Account<span className="material-symbols-outlined text-[18px]">arrow_forward</span></>}
      </button>
      <p className="text-center text-sm text-[var(--text-secondary)]">Already have an account? <button type="button" onClick={onSwitch} className="font-semibold text-accent-violet hover:opacity-80 transition-opacity">Sign in</button></p>
    </motion.form>
  );
}

// ─── Forgot Password ────────────────────────────────────────────────

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address"); return; }
    setError(""); setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      if (res.error) { setError(res.error); } else { setSent(true); }
    } catch {
      setError("Server not reachable.");
    } finally {
      setLoading(false);
    }
  };
  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow-cyan">
          <span className="material-symbols-outlined text-white text-[32px]">mark_email_read</span>
        </div>
        <h2 className="text-xl font-headline font-bold text-[var(--text-primary)] mb-2">Check your email</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs mx-auto">We&apos;ve sent password reset instructions to <strong className="text-[var(--text-primary)]">{email}</strong></p>
        <Link to="/login" className="text-sm font-semibold text-accent-violet hover:opacity-80 transition-opacity flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Sign In
        </Link>
      </motion.div>
    );
  }
  return (
    <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-violet">
          <span className="material-symbols-outlined text-white text-[28px]">lock_reset</span>
        </div>
        <h2 className="text-xl font-headline font-bold text-[var(--text-primary)] mb-1">Reset your password</h2>
        <p className="text-sm text-[var(--text-secondary)]">Enter your email and we&apos;ll send you instructions.</p>
      </div>
      <AuthInput label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" error={error} icon="mail" disabled={loading} />
      <HoverButton type="submit" disabled={loading} className="w-full bg-gradient-to-r from-violet-600 to-pink-500 text-white py-3 rounded-xl font-semibold text-sm shadow-glow-violet transition-all disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Sending...</> : "Send Reset Link"}
      </HoverButton>
      <Link to="/login" className="block text-center text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <span className="material-symbols-outlined text-[14px] align-middle mr-1">arrow_back</span>Back to Sign In
      </Link>
    </motion.form>
  );
}

// ─── Reset Password ─────────────────────────────────────────────────

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
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");
    if (!token) {
      setErrors({ general: "Invalid or missing reset token. Please request a new link." });
      return;
    }
    setErrors({}); setLoading(true);
    try {
      const res = await authApi.resetPassword(token, password);
      if (res.error) { setErrors({ general: res.error }); } else { navigate("/login"); }
    } catch {
      setErrors({ general: "Server not reachable." });
    } finally {
      setLoading(false);
    }
  };
  return (
    <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-violet">
          <span className="material-symbols-outlined text-white text-[28px]">password</span>
        </div>
        <h2 className="text-xl font-headline font-bold text-[var(--text-primary)] mb-1">Set new password</h2>
        <p className="text-sm text-[var(--text-secondary)]">Your new password must be different from previous ones.</p>
      </div>
      {errors.general && (
        <div className="glass-card !rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm text-red-500 font-medium border-l-4 !border-l-red-500">
          <span className="material-symbols-outlined text-[18px]">error</span>{errors.general}
        </div>
      )}
      <div>
        <AuthInput label="New Password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" error={errors.password} icon="lock" disabled={loading}
          rightElement={<PasswordVisibilityButton visible={showPw} onClick={() => setShowPw(!showPw)} disabled={loading} />}
        />
        <PasswordStrength password={password} />
      </div>
      <AuthInput label="Confirm New Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" error={errors.confirm} icon="lock" disabled={loading} />
      <HoverButton type="submit" disabled={loading} className="w-full bg-gradient-to-r from-violet-600 to-pink-500 text-white py-3 rounded-xl font-semibold text-sm shadow-glow-violet transition-all disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Resetting...</> : "Reset Password"}
      </HoverButton>
    </motion.form>
  );
}

// ─── Auth Guard ─────────────────────────────────────────────────────

export function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const isAuthed = isAuthenticated && Boolean(localStorage.getItem("token"));

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center p-6">
        <span className="material-symbols-outlined animate-spin text-[40px] text-accent-violet">progress_activity</span>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen aurora-bg bg-[var(--surface-0)] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-2xl p-8 max-w-sm w-full text-center shadow-xl relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
            <span className="material-symbols-outlined text-white text-[28px]">lock</span>
          </div>
          <h2 className="text-xl font-headline font-bold text-[var(--text-primary)] mb-2">Authentication Required</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Please sign in to access this page.</p>
          <Link to="/login">
            <HoverButton className="bg-gradient-to-r from-violet-600 to-pink-500 text-white px-8 py-2.5 rounded-xl font-semibold text-sm shadow-glow-violet w-full">
              Sign In
            </HoverButton>
          </Link>
        </motion.div>
      </div>
    );
  }
  return children;
}

// ─── Perform Logout ─────────────────────────────────────────────────

export function performLogout(navigate) {
  localStorage.removeItem("fs_authed");
  localStorage.removeItem("fs_user");
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  navigate("/login");
}

// ─── Main Auth Page ─────────────────────────────────────────────────

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
        {/* Tab Toggle */}
        <div className="flex bg-[var(--surface-2)] rounded-xl p-1 mb-8 relative">
          <button onClick={() => setMode("login")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all relative z-10 ${mode === "login" ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`}>Sign In</button>
          <button onClick={() => setMode("register")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all relative z-10 ${mode === "register" ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`}>Register</button>
          {/* Sliding indicator */}
          <motion.div
            layout
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-[var(--surface-1)] shadow-sm"
            style={{ left: mode === "login" ? 4 : "calc(50% + 2px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        </div>
        <AnimatePresence mode="wait">
          {mode === "login" ? <LoginForm key="l" onSwitch={() => setMode("register")} /> : <RegisterForm key="r" onSwitch={() => setMode("login")} />}
        </AnimatePresence>
      </>
    );
  };

  return (
    <div className="min-h-screen aurora-bg bg-[var(--surface-0)] flex items-center justify-center p-6 font-body">
      {/* Decorative floating glass shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[15%] left-[10%] w-32 h-32 rounded-3xl bg-violet-500/5 backdrop-blur-sm border border-violet-500/10 rotate-12 animate-float" />
        <div className="absolute bottom-[20%] right-[15%] w-24 h-24 rounded-full bg-pink-500/5 backdrop-blur-sm border border-pink-500/10 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[60%] left-[5%] w-20 h-20 rounded-2xl bg-cyan-500/5 backdrop-blur-sm border border-cyan-500/10 -rotate-12 animate-float" style={{ animationDelay: "2s" }} />
      </div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-strong rounded-2xl p-8 md:p-10 glow-border">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-violet text-[28px]">shield_locked</span>
              <span className="font-headline font-bold text-xl gradient-text tracking-tight">FraudSentinel</span>
            </Link>
          </div>

          {!isForgotRoute && !isResetRoute && (
            <div className="text-center mb-6">
              <h1 className="text-2xl font-headline font-bold text-[var(--text-primary)] mb-1">
                {mode === "login" ? "Welcome back" : "Get started"}
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {mode === "login" ? "Sign in to your fraud detection dashboard" : "Create your free account to start analyzing"}
              </p>
            </div>
          )}

          {getContent()}

          <p className="text-center text-xs text-[var(--text-tertiary)] mt-8">
            By continuing you agree to our <a href="#" className="text-accent-violet hover:opacity-80">Terms</a> and <a href="#" className="text-accent-violet hover:opacity-80">Privacy Policy</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
