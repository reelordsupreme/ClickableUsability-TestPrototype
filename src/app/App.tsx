import { useState, useRef, useEffect, useCallback, createContext, useContext } from "react";
import LandingPage from "./LandingPage";
import { supabase } from "../../utils/supabase/client";
import {
  LayoutDashboard, TrendingUp, Briefcase, BookOpen,
  Bot, GraduationCap, Trophy, ChevronLeft,
  ChevronDown, Search, Bell, ArrowUpRight,
  CheckCircle, Star, Send, Users, Clock,
  Plus, Minus, BarChart2, Zap, AlertCircle, SlidersHorizontal,
  Cpu, Calendar, Wallet, PieChart, Activity, Award,
  ArrowRight, Layers, RefreshCw, Info, FileText,
  MousePointer2, Crosshair, Ruler, Pencil, Square, Type, Eraser,
  Maximize2, Settings, ChevronRight, Bookmark, Share2, Sparkles, Newspaper,
  TrendingDown, ExternalLink, Hash, Flame,
  LogOut, User, Mail, Lock, Eye, EyeOff,
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from "recharts";

// ── Auth ──────────────────────────────────────────────────────────────────────
// All auth consumers use AuthContext — the Supabase implementation is isolated
// inside useAuthState(). No auth tokens, passwords, or secrets are stored in
// application tables, localStorage, or client-visible state.

interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  onboardingCompleted: boolean;
  experienceLevel?: string;
  goal?: string;
  interests?: string[];
}

interface OnboardingData {
  firstName: string;
  name: string;
  experienceLevel: string;
  goal: string;
  interests: string[];
  watchlistSymbols: string[];
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  passwordRecovery: boolean;
}

interface AuthContextValue extends AuthState {
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  clearError: () => void;
  sendPasswordReset: (email: string) => Promise<{ ok: boolean }>;
  updatePassword: (password: string) => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("user already registered") || m.includes("already registered"))
    return "An account with this email already exists.";
  if (m.includes("invalid login credentials") || m.includes("invalid_credentials"))
    return "Incorrect email or password.";
  if (m.includes("email not confirmed"))
    return "Check your inbox and confirm your email before signing in.";
  if (m.includes("password should be at least") || m.includes("weak_password"))
    return "Password must be at least 8 characters.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "Enter a valid email address.";
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("network"))
    return "Network error. Check your connection and try again.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Wait a moment and try again.";
  if (m.includes("same password"))
    return "New password must be different from your current password.";
  if (m.includes("database error saving new user") || m.includes("database error"))
    return "Account creation failed due to a setup issue. Please contact support or try again shortly.";
  return msg || "Something went wrong. Please try again.";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadProfile(sbUser: { id: string; email?: string; created_at: string }): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, display_name, onboarding_completed, experience_level, goal, interests")
    .eq("id", sbUser.id)
    .single();
  if (error || !data) return null;
  const name = (data.display_name || data.first_name || sbUser.email || "").trim();
  return {
    id: sbUser.id,
    email: sbUser.email ?? "",
    name: name || "User",
    createdAt: sbUser.created_at,
    onboardingCompleted: data.onboarding_completed ?? false,
    experienceLevel: data.experience_level ?? undefined,
    goal: data.goal ?? undefined,
    interests: data.interests ?? [],
  };
}

function useAuthState(): AuthContextValue {
  const [state, setState] = useState<AuthState>({
    user: null, loading: true, error: null, passwordRecovery: false,
  });

  useEffect(() => {
    // Check for existing session on mount — prevents login flash on refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user).then(user => {
          setState({ user, loading: false, error: null, passwordRecovery: false });
        });
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    });

    // Subscribe to auth state changes (sign in, sign out, token refresh, password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setState(s => ({ ...s, loading: false, passwordRecovery: true }));
        return;
      }
      if (event === "SIGNED_OUT") {
        setState({ user: null, loading: false, error: null, passwordRecovery: false });
        return;
      }
      if (session?.user) {
        const user = await loadProfile(session.user);
        setState({ user, loading: false, error: null, passwordRecovery: false });
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    const firstName = name.trim().split(" ")[0];
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, display_name: name.trim() },
      },
    });
    if (error) {
      setState(s => ({ ...s, loading: false, error: mapAuthError(error.message) }));
    }
    // onAuthStateChange handles SIGNED_IN and profile load
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState(s => ({ ...s, loading: false, error: mapAuthError(error.message) }));
    }
  }, []);

  const signOut = useCallback(() => {
    supabase.auth.signOut();
  }, []);

  const sendPasswordReset = useCallback(async (email: string): Promise<{ ok: boolean }> => {
    setState(s => ({ ...s, loading: true, error: null }));
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      setState(s => ({ ...s, loading: false, error: mapAuthError(error.message) }));
      return { ok: false };
    }
    setState(s => ({ ...s, loading: false }));
    return { ok: true };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setState(s => ({ ...s, loading: false, error: mapAuthError(error.message) }));
    } else {
      setState(s => ({ ...s, loading: false, passwordRecovery: false }));
    }
  }, []);

  const completeOnboarding = useCallback(async (data: OnboardingData) => {
    setState(s => ({ ...s, loading: true, error: null }));
    const { data: { user: sbUser } } = await supabase.auth.getUser();
    if (!sbUser) { setState(s => ({ ...s, loading: false })); return; }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: data.firstName,
        display_name: data.name,
        experience_level: data.experienceLevel,
        goal: data.goal,
        interests: data.interests,
        initial_watchlist: data.watchlistSymbols,
        onboarding_completed: true,
      })
      .eq("id", sbUser.id);

    if (error) {
      setState(s => ({ ...s, loading: false, error: "Failed to save your preferences. Please try again." }));
    } else {
      const user = await loadProfile(sbUser);
      setState(s => ({ ...s, user, loading: false }));
    }
  }, []);

  const clearError = useCallback(() => setState(s => ({ ...s, error: null })), []);

  return { ...state, signUp, signIn, signOut, clearError, sendPasswordReset, updatePassword, completeOnboarding };
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// ── Auth shared UI helpers ────────────────────────────────────────────────────

function AtlasLogo() {
  return (
    <div className="flex items-center gap-3 mb-8 justify-center">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#2962FF" }}>
        <BarChart2 size={18} color="#fff" />
      </div>
      <div>
        <div className="text-lg font-bold text-white tracking-tight">Atlas</div>
        <div className="text-xs" style={{ color: "#7D8794" }}>Investing Platform</div>
      </div>
    </div>
  );
}

function AuthError({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg mb-5 text-sm"
      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}>
      <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="text-xs opacity-60 hover:opacity-100 ml-1">✕</button>
    </div>
  );
}

function AuthInput({
  label, type = "text", value, onChange, placeholder, icon: Icon, rightSlot, autoComplete,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  icon: React.ElementType; rightSlot?: React.ReactNode;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9AA4B2" }}>{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#5B6780" }} />
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full h-11 pl-10 pr-10 rounded-lg text-sm outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#F1F3F5" }}
          onFocus={e => { e.currentTarget.style.borderColor = "#2962FF"; e.currentTarget.style.background = "rgba(41,98,255,0.06)"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        />
        {rightSlot && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </div>
  );
}

// ── Auth screens ──────────────────────────────────────────────────────────────

function LoginScreen({ onSwitch, onForgot }: { onSwitch: () => void; onForgot: () => void }) {
  const { signIn, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0B0E11" }}>
      <div className="w-full max-w-sm">
        <AtlasLogo />
        <div className="rounded-2xl p-8" style={{ background: "#111418", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: "#7D8794" }}>Sign in to your Atlas account</p>

          {error && <AuthError message={error} onDismiss={clearError} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput label="Email" type="email" value={email} onChange={setEmail}
              placeholder="you@example.com" icon={Mail} autoComplete="email" />
            <div>
              <AuthInput
                label="Password" type={showPw ? "text" : "password"} value={password}
                onChange={setPassword} placeholder="••••••••" icon={Lock} autoComplete="current-password"
                rightSlot={
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ color: "#5B6780" }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />
              <div className="flex justify-end mt-1.5">
                <button type="button" onClick={onForgot} className="text-xs" style={{ color: "#7D8794" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#93C5FD")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#7D8794")}>
                  Forgot password?
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-lg font-semibold text-sm text-white transition-opacity mt-1"
              style={{ background: "#2962FF", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: "#7D8794" }}>
            Don&apos;t have an account?{" "}
            <button onClick={onSwitch} className="font-semibold" style={{ color: "#93C5FD" }}>Create one</button>
          </p>
        </div>
        <p className="text-center text-xs mt-6" style={{ color: "#4A5568" }}>
          By continuing you agree to Atlas&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function SignupScreen({ onSwitch }: { onSwitch: () => void }) {
  const { signUp, loading, error, clearError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(email, password, name);
    // If signup succeeded without immediate error, Supabase may require email confirmation
    setEmailSent(true);
  };

  if (emailSent && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0B0E11" }}>
        <div className="w-full max-w-sm">
          <AtlasLogo />
          <div className="rounded-2xl p-8 text-center" style={{ background: "#111418", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(8,153,129,0.15)", border: "1px solid rgba(8,153,129,0.3)" }}>
              <CheckCircle size={22} color="#089981" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Check your inbox</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#7D8794" }}>
              We sent a confirmation link to <span className="text-white font-medium">{email}</span>.
              Click it to activate your account, then come back and sign in.
            </p>
            <button onClick={onSwitch} className="w-full h-11 rounded-lg font-semibold text-sm text-white"
              style={{ background: "#2962FF" }}>
              Go to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0B0E11" }}>
      <div className="w-full max-w-sm">
        <AtlasLogo />
        <div className="rounded-2xl p-8" style={{ background: "#111418", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h1 className="text-xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-sm mb-6" style={{ color: "#7D8794" }}>Start learning to invest with paper trading</p>

          {error && <AuthError message={error} onDismiss={() => { clearError(); setEmailSent(false); }} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput label="Full name" value={name} onChange={setName}
              placeholder="Alex Morgan" icon={User} autoComplete="name" />
            <AuthInput label="Email" type="email" value={email} onChange={setEmail}
              placeholder="you@example.com" icon={Mail} autoComplete="email" />
            <div>
              <AuthInput
                label="Password" type={showPw ? "text" : "password"} value={password}
                onChange={setPassword} placeholder="Min. 8 characters" icon={Lock}
                autoComplete="new-password"
                rightSlot={
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ color: "#5B6780" }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />
              <div className="flex gap-1 mt-2">
                {[8, 12, 16].map(n => (
                  <div key={n} className="h-1 flex-1 rounded-full transition-colors"
                    style={{ background: password.length >= n ? "#2962FF" : "rgba(255,255,255,0.08)" }} />
                ))}
              </div>
              <p className="text-[11px] mt-1" style={{ color: "#5B6780" }}>
                {password.length === 0 ? "Use 8+ characters" : password.length < 8 ? "Too short" : password.length < 12 ? "Good" : "Strong"}
              </p>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-lg font-semibold text-sm text-white transition-opacity"
              style={{ background: "#2962FF", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: "#7D8794" }}>
            Already have an account?{" "}
            <button onClick={onSwitch} className="font-semibold" style={{ color: "#93C5FD" }}>Sign in</button>
          </p>
        </div>
        <p className="text-center text-xs mt-6" style={{ color: "#4A5568" }}>
          Atlas uses paper trading only. No real money is ever involved.
        </p>
      </div>
    </div>
  );
}

function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const { sendPasswordReset, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await sendPasswordReset(email);
    if (result.ok) setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0B0E11" }}>
      <div className="w-full max-w-sm">
        <AtlasLogo />
        <div className="rounded-2xl p-8" style={{ background: "#111418", border: "1px solid rgba(255,255,255,0.07)" }}>
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(8,153,129,0.15)", border: "1px solid rgba(8,153,129,0.3)" }}>
                <Mail size={20} color="#089981" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Reset link sent</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#7D8794" }}>
                If an account exists for <span className="text-white font-medium">{email}</span>, you&apos;ll receive a password reset link shortly.
              </p>
              <button onClick={onBack} className="w-full h-11 rounded-lg font-semibold text-sm text-white"
                style={{ background: "#2962FF" }}>
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <button onClick={onBack} className="flex items-center gap-1.5 text-xs mb-5 transition-colors"
                style={{ color: "#7D8794" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#F1F3F5")}
                onMouseLeave={e => (e.currentTarget.style.color = "#7D8794")}>
                <ChevronLeft size={14} /> Back to sign in
              </button>
              <h1 className="text-xl font-bold text-white mb-1">Reset your password</h1>
              <p className="text-sm mb-6" style={{ color: "#7D8794" }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>
              {error && <AuthError message={error} onDismiss={clearError} />}
              <form onSubmit={handleSubmit} className="space-y-4">
                <AuthInput label="Email" type="email" value={email} onChange={setEmail}
                  placeholder="you@example.com" icon={Mail} autoComplete="email" />
                <button type="submit" disabled={loading}
                  className="w-full h-11 rounded-lg font-semibold text-sm text-white transition-opacity"
                  style={{ background: "#2962FF", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResetPasswordScreen() {
  const { updatePassword, loading, error, clearError } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch || password.length < 8) return;
    await updatePassword(password);
    setDone(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0B0E11" }}>
      <div className="w-full max-w-sm">
        <AtlasLogo />
        <div className="rounded-2xl p-8" style={{ background: "#111418", border: "1px solid rgba(255,255,255,0.07)" }}>
          {done && !error ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(8,153,129,0.15)", border: "1px solid rgba(8,153,129,0.3)" }}>
                <CheckCircle size={22} color="#089981" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Password updated</h2>
              <p className="text-sm" style={{ color: "#7D8794" }}>Your password has been changed. Signing you in…</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Set new password</h1>
              <p className="text-sm mb-6" style={{ color: "#7D8794" }}>Choose a strong password for your Atlas account.</p>
              {error && <AuthError message={error} onDismiss={clearError} />}
              <form onSubmit={handleSubmit} className="space-y-4">
                <AuthInput
                  label="New password" type={showPw ? "text" : "password"}
                  value={password} onChange={setPassword} placeholder="Min. 8 characters"
                  icon={Lock} autoComplete="new-password"
                  rightSlot={
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ color: "#5B6780" }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                />
                <div>
                  <AuthInput
                    label="Confirm password" type="password"
                    value={confirm} onChange={setConfirm} placeholder="Re-enter password"
                    icon={Lock} autoComplete="new-password"
                  />
                  {mismatch && <p className="text-xs mt-1" style={{ color: "#F23645" }}>Passwords do not match.</p>}
                </div>
                <button type="submit" disabled={loading || mismatch || password.length < 8}
                  className="w-full h-11 rounded-lg font-semibold text-sm text-white transition-opacity"
                  style={{ background: "#2962FF", opacity: (loading || mismatch || password.length < 8) ? 0.5 : 1 }}>
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Onboarding ────────────────────────────────────────────────────────────────

const ONBOARDING_INTERESTS = [
  "Technology", "Artificial Intelligence", "Energy", "Consumer",
  "Healthcare", "Finance", "ETFs", "Broad Market",
];

const ONBOARDING_WATCHLIST_SYMBOLS = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "META", name: "Meta" },
  { symbol: "SPY", name: "S&P 500 ETF" },
  { symbol: "QQQ", name: "Nasdaq ETF" },
  { symbol: "BRK.B", name: "Berkshire B" },
  { symbol: "JPM", name: "JPMorgan" },
  { symbol: "V", name: "Visa" },
];

type OnboardingStep = 0 | 1 | 2 | 3 | 4;

function OnboardingProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="h-1 flex-1 rounded-full transition-all"
          style={{ background: i <= step ? "#2962FF" : "rgba(255,255,255,0.1)" }} />
      ))}
    </div>
  );
}

function OnboardingFlow() {
  const { user, completeOnboarding, loading, error, clearError } = useAuth();
  const [step, setStep] = useState<OnboardingStep>(0);
  const [firstName, setFirstName] = useState(user?.name.split(" ")[0] ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [experience, setExperience] = useState("");
  const [goal, setGoal] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const toggleInterest = (v: string) =>
    setInterests(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const toggleWatchlist = (sym: string) =>
    setWatchlist(prev => prev.includes(sym) ? prev.filter(x => x !== sym) : [...prev, sym]);

  const handleFinish = async () => {
    await completeOnboarding({
      firstName,
      name: name || firstName,
      experienceLevel: experience,
      goal,
      interests,
      watchlistSymbols: watchlist,
    });
  };

  const CARD_STYLE = { background: "#111418", border: "1px solid rgba(255,255,255,0.07)" };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: "#0B0E11" }}>
      <div className="w-full max-w-md">
        <AtlasLogo />

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="rounded-2xl p-8" style={CARD_STYLE}>
            <OnboardingProgress step={0} total={5} />
            <h2 className="text-xl font-bold text-white mb-1">
              Welcome to Atlas{firstName ? `, ${firstName}` : ""}
            </h2>
            <p className="text-sm mb-6" style={{ color: "#7D8794" }}>
              Let&apos;s personalize your experience. It takes under a minute.
            </p>
            <div className="space-y-3 mb-6">
              <AuthInput label="First name" value={firstName} onChange={v => { setFirstName(v); setName(v + (name.includes(" ") ? name.slice(name.indexOf(" ")) : "")); }}
                placeholder="Alex" icon={User} autoComplete="given-name" />
            </div>
            <button
              onClick={() => setStep(1)} disabled={!firstName.trim()}
              className="w-full h-11 rounded-lg font-semibold text-sm text-white transition-opacity"
              style={{ background: "#2962FF", opacity: firstName.trim() ? 1 : 0.4 }}>
              Get started
            </button>
          </div>
        )}

        {/* Step 1 — Experience */}
        {step === 1 && (
          <div className="rounded-2xl p-8" style={CARD_STYLE}>
            <OnboardingProgress step={1} total={5} />
            <h2 className="text-xl font-bold text-white mb-1">Your investing experience</h2>
            <p className="text-sm mb-6" style={{ color: "#7D8794" }}>Atlas uses this to match content to your level.</p>
            <div className="space-y-2.5 mb-6">
              {[
                { value: "new", label: "New to investing", sub: "I'm just getting started" },
                { value: "some", label: "Some experience", sub: "I've traded before but want to improve" },
                { value: "experienced", label: "Experienced", sub: "I understand markets well" },
              ].map(opt => (
                <button key={opt.value} onClick={() => setExperience(opt.value)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 rounded-xl text-left transition-all"
                  style={{
                    background: experience === opt.value ? "rgba(41,98,255,0.15)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${experience === opt.value ? "#2962FF" : "rgba(255,255,255,0.08)"}`,
                  }}>
                  <div className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center"
                    style={{ border: `2px solid ${experience === opt.value ? "#2962FF" : "#4A5568"}`, background: experience === opt.value ? "#2962FF" : "transparent" }}>
                    {experience === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{opt.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#7D8794" }}>{opt.sub}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="h-11 px-5 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", color: "#9AA4B2" }}>Back</button>
              <button onClick={() => setStep(2)} disabled={!experience}
                className="flex-1 h-11 rounded-lg font-semibold text-sm text-white transition-opacity"
                style={{ background: "#2962FF", opacity: experience ? 1 : 0.4 }}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 2 — Goal */}
        {step === 2 && (
          <div className="rounded-2xl p-8" style={CARD_STYLE}>
            <OnboardingProgress step={2} total={5} />
            <h2 className="text-xl font-bold text-white mb-1">What&apos;s your main goal?</h2>
            <p className="text-sm mb-6" style={{ color: "#7D8794" }}>We&apos;ll tailor Atlas AI, news, and your learn path.</p>
            <div className="space-y-2.5 mb-6">
              {[
                { value: "learn", label: "Learn investing", sub: "Understand how markets and stocks work" },
                { value: "practice", label: "Practice trading", sub: "Simulate trades without risking real money" },
                { value: "understand", label: "Understand markets", sub: "Follow market news and trends" },
                { value: "habits", label: "Build better habits", sub: "Improve my decision-making and discipline" },
              ].map(opt => (
                <button key={opt.value} onClick={() => setGoal(opt.value)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 rounded-xl text-left transition-all"
                  style={{
                    background: goal === opt.value ? "rgba(41,98,255,0.15)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${goal === opt.value ? "#2962FF" : "rgba(255,255,255,0.08)"}`,
                  }}>
                  <div className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center"
                    style={{ border: `2px solid ${goal === opt.value ? "#2962FF" : "#4A5568"}`, background: goal === opt.value ? "#2962FF" : "transparent" }}>
                    {goal === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{opt.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#7D8794" }}>{opt.sub}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="h-11 px-5 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "#9AA4B2" }}>Back</button>
              <button onClick={() => setStep(3)} disabled={!goal}
                className="flex-1 h-11 rounded-lg font-semibold text-sm text-white transition-opacity"
                style={{ background: "#2962FF", opacity: goal ? 1 : 0.4 }}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 3 — Interests */}
        {step === 3 && (
          <div className="rounded-2xl p-8" style={CARD_STYLE}>
            <OnboardingProgress step={3} total={5} />
            <h2 className="text-xl font-bold text-white mb-1">What interests you?</h2>
            <p className="text-sm mb-6" style={{ color: "#7D8794" }}>Select any that apply. You can change these later.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {ONBOARDING_INTERESTS.map(tag => {
                const selected = interests.includes(tag);
                return (
                  <button key={tag} onClick={() => toggleInterest(tag)}
                    className="px-3.5 py-2 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: selected ? "#2962FF" : "rgba(255,255,255,0.05)",
                      color: selected ? "#fff" : "#9AA4B2",
                      border: `1px solid ${selected ? "#2962FF" : "rgba(255,255,255,0.1)"}`,
                    }}>
                    {tag}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="h-11 px-5 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "#9AA4B2" }}>Back</button>
              <button onClick={() => setStep(4)}
                className="flex-1 h-11 rounded-lg font-semibold text-sm text-white"
                style={{ background: "#2962FF" }}>
                {interests.length === 0 ? "Skip" : "Continue"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Watchlist seed */}
        {step === 4 && (
          <div className="rounded-2xl p-8" style={CARD_STYLE}>
            <OnboardingProgress step={4} total={5} />
            <h2 className="text-xl font-bold text-white mb-1">Start your watchlist</h2>
            <p className="text-sm mb-1" style={{ color: "#7D8794" }}>
              Select stocks you want to follow. Only what you choose will be added.
            </p>
            <p className="text-xs mb-5" style={{ color: "#4A5568" }}>You can add or remove stocks any time.</p>

            {error && <AuthError message={error} onDismiss={clearError} />}

            <div className="grid grid-cols-2 gap-2 mb-6">
              {ONBOARDING_WATCHLIST_SYMBOLS.map(({ symbol, name: sName }) => {
                const selected = watchlist.includes(symbol);
                return (
                  <button key={symbol} onClick={() => toggleWatchlist(symbol)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all"
                    style={{
                      background: selected ? "rgba(41,98,255,0.15)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${selected ? "#2962FF" : "rgba(255,255,255,0.08)"}`,
                    }}>
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: selected ? "#2962FF" : "rgba(255,255,255,0.08)" }}>
                      {selected && <CheckCircle size={12} color="#fff" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white">{symbol}</div>
                      <div className="text-[10px] truncate" style={{ color: "#7D8794" }}>{sName}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="h-11 px-5 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "#9AA4B2" }}>Back</button>
              <button onClick={handleFinish} disabled={loading}
                className="flex-1 h-11 rounded-lg font-semibold text-sm text-white transition-opacity"
                style={{ background: "#2962FF", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Setting up Atlas…" : watchlist.length === 0 ? "Skip and enter Atlas" : `Enter Atlas (${watchlist.length} added)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Auth gate ─────────────────────────────────────────────────────────────────

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, passwordRecovery } = useAuth();
  const [view, setView] = useState<"login" | "signup" | "forgot">("login");

  // Loading — suppress flash of login screen while session is being restored
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0E11" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#2962FF" }}>
            <BarChart2 size={14} color="#fff" />
          </div>
          <span className="text-sm font-semibold text-white">Loading Atlas…</span>
        </div>
      </div>
    );
  }

  // Password recovery — user followed the reset link
  if (passwordRecovery) return <ResetPasswordScreen />;

  // Unauthenticated
  if (!user) {
    if (view === "forgot") return <ForgotPasswordScreen onBack={() => setView("login")} />;
    return view === "login"
      ? <LoginScreen onSwitch={() => setView("signup")} onForgot={() => setView("forgot")} />
      : <SignupScreen onSwitch={() => setView("login")} />;
  }

  // Authenticated but onboarding incomplete
  if (!user.onboardingCompleted) return <OnboardingFlow />;

  // Fully authenticated + onboarded
  return <>{children}</>;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Screen =
  | "dashboard" | "markets" | "nvda" | "buy" | "review-order"
  | "order-filled" | "journal-trade" | "trade-review" | "atlas-ai"
  | "tournaments" | "tech-challenge" | "join-tournament" | "leaderboard"
  | "portfolio" | "news" | "learn";

interface OHLC {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ── OHLC Generation ────────────────────────────────────────────────────────────
function lcrng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateOHLC(symbol: string, count = 60): OHLC[] {
  const configs: Record<string, { start: number; end: number; seed: number }> = {
    NVDA: { start: 115, end: 142.65, seed: 42 },
    AAPL: { start: 176, end: 189.25, seed: 73 },
    TSLA: { start: 208, end: 248.50, seed: 15 },
    MSFT: { start: 376, end: 402.15, seed: 88 },
    AMZN: { start: 170, end: 185.80, seed: 31 },
    META: { start: 460, end: 512.30, seed: 57 },
  };
  const cfg = configs[symbol] ?? { start: 95, end: 110, seed: 99 };
  const rand = lcrng(cfg.seed);

  const dates: string[] = [];
  const endMs = new Date("2025-10-28").getTime();
  let cur = endMs;
  while (dates.length < count) {
    cur -= 86400000;
    const d = new Date(cur);
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.unshift(
        d.toLocaleString("en-US", { month: "short" }) + " " + d.getDate()
      );
    }
  }

  let price = cfg.start;
  const totalDelta = cfg.end - cfg.start;
  const result: OHLC[] = [];

  for (let i = 0; i < count; i++) {
    const progress = i / Math.max(1, count - 1);
    const target = cfg.start + totalDelta * progress;
    const amp = price * 0.016;
    const bias = (target - price) * 0.14;
    const open = price + (rand() - 0.5) * amp * 0.25;
    const move = bias + (rand() - 0.47) * amp;
    const close = open + move;
    const high = Math.max(open, close) + rand() * amp * 0.5;
    const low = Math.min(open, close) - rand() * amp * 0.4;
    const volume = Math.floor((100 + rand() * 400) * 1e6);
    result.push({
      date: dates[i] ?? `D${i + 1}`,
      open: +open.toFixed(2), high: +high.toFixed(2),
      low: +Math.max(0.01, low).toFixed(2), close: +close.toFixed(2),
      volume,
    });
    price = close;
  }

  const factor = cfg.end / (result[result.length - 1].close || 1);
  return result.map(d => ({
    ...d,
    open: +(d.open * factor).toFixed(2),
    high: +(d.high * factor).toFixed(2),
    low: +(d.low * factor).toFixed(2),
    close: +(d.close * factor).toFixed(2),
  }));
}

function niceStep(rough: number): number {
  if (!rough || rough <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const r = rough / mag;
  if (r < 1.5) return mag;
  if (r < 3.5) return 2 * mag;
  if (r < 7.5) return 5 * mag;
  return 10 * mag;
}

// ── Trading workspace data ─────────────────────────────────────────────────────
const WATCHLIST = ["NVDA", "AAPL", "TSLA", "MSFT", "AMZN", "META"];

const SYM_INFO: Record<string, {
  name: string; price: number; change: number; changePct: number;
  mktCap: string; pe: string; vol: string; sector: string;
}> = {
  NVDA: { name: "NVIDIA Corporation", price: 142.65, change: 1.73, changePct: 1.23, mktCap: "3.49T", pe: "54.2", vol: "284.5M", sector: "Technology" },
  AAPL: { name: "Apple Inc", price: 189.25, change: -0.86, changePct: -0.45, mktCap: "2.91T", pe: "31.8", vol: "52.1M", sector: "Technology" },
  TSLA: { name: "Tesla Inc", price: 248.50, change: 6.97, changePct: 2.87, mktCap: "793B", pe: "62.4", vol: "118.3M", sector: "Consumer" },
  MSFT: { name: "Microsoft Corp", price: 402.15, change: 2.60, changePct: 0.65, mktCap: "2.99T", pe: "36.5", vol: "19.4M", sector: "Technology" },
  AMZN: { name: "Amazon.com", price: 185.80, change: -2.10, changePct: -1.12, mktCap: "1.95T", pe: "43.1", vol: "41.7M", sector: "Consumer" },
  META: { name: "Meta Platforms", price: 512.30, change: 8.45, changePct: 1.68, mktCap: "1.31T", pe: "27.3", vol: "15.9M", sector: "Technology" },
};

const SYM_NEWS: Record<string, { headline: string; time: string }[]> = {
  NVDA: [
    { headline: "Analysts raise NVDA target to $175 on Blackwell demand", time: "2h" },
    { headline: "Data center revenue up 112% YoY; beats estimates", time: "4h" },
    { headline: "Jensen: Blackwell supply constraint easing in Q1", time: "6h" },
  ],
  AAPL: [
    { headline: "Apple M5 MacBook event expected next week", time: "1h" },
    { headline: "iPhone 17 supply chain ramp underway in Vietnam", time: "3h" },
    { headline: "Services revenue grows 14% YoY to $24.2B", time: "8h" },
  ],
  TSLA: [
    { headline: "Cybertruck production hits 50K/month milestone", time: "1h" },
    { headline: "FSD v13 rollout expands to 100K vehicles this week", time: "5h" },
    { headline: "Musk: Robotaxi launch set for Austin in December", time: "7h" },
  ],
  MSFT: [
    { headline: "Azure AI services revenue up 33% this quarter", time: "2h" },
    { headline: "Copilot+ PC sales exceed internal forecasts", time: "5h" },
    { headline: "GitHub Copilot reaches 2M paid subscribers", time: "9h" },
  ],
  AMZN: [
    { headline: "AWS revenue accelerates to $27B, beats estimates", time: "3h" },
    { headline: "Amazon Fresh expansion adds 12 new markets in Q4", time: "6h" },
    { headline: "AWS wins $3.4B DoD cloud contract renewal", time: "10h" },
  ],
  META: [
    { headline: "Meta AI DAU hits 500M; Llama 4 accelerates adoption", time: "1h" },
    { headline: "Quest 4 pre-orders open; ships November", time: "4h" },
    { headline: "Reels ad revenue grows 27% quarter-over-quarter", time: "7h" },
  ],
};

const CHART_CACHE: Record<string, OHLC[]> = {};
WATCHLIST.forEach(sym => { CHART_CACHE[sym] = generateOHLC(sym, 60); });

// ── Screener data ──────────────────────────────────────────────────────────────
const SCREENER = [
  { symbol: "NVDA", price: 142.65, changePct: 1.23, vol: "284.5M", mktCap: "3.49T", pe: "54.2", sector: "Technology" },
  { symbol: "AAPL", price: 189.25, changePct: -0.45, vol: "52.1M", mktCap: "2.91T", pe: "31.8", sector: "Technology" },
  { symbol: "TSLA", price: 248.50, changePct: 2.87, vol: "118.3M", mktCap: "793B", pe: "62.4", sector: "Consumer" },
  { symbol: "MSFT", price: 402.15, changePct: 0.65, vol: "19.4M", mktCap: "2.99T", pe: "36.5", sector: "Technology" },
  { symbol: "AMZN", price: 185.80, changePct: -1.12, vol: "41.7M", mktCap: "1.95T", pe: "43.1", sector: "Consumer" },
  { symbol: "GOOGL", price: 165.40, changePct: 0.98, vol: "24.6M", mktCap: "2.06T", pe: "21.4", sector: "Technology" },
  { symbol: "META", price: 512.30, changePct: 1.68, vol: "15.9M", mktCap: "1.31T", pe: "27.3", sector: "Technology" },
  { symbol: "AMD",  price: 168.90, changePct: -1.86, vol: "54.2M", mktCap: "273B", pe: "N/A", sector: "Technology" },
];

// ── Dashboard & other screen data (unchanged) ──────────────────────────────────
const stocks = [
  { symbol: "NVDA", name: "NVIDIA Corp", price: 142.65, change: 1.73, changePct: 1.23, sector: "Technology", vol: "284.5M", mktCap: "3.49T" },
  { symbol: "AAPL", name: "Apple Inc", price: 189.25, change: -0.86, changePct: -0.45, sector: "Technology", vol: "52.1M", mktCap: "2.91T" },
  { symbol: "TSLA", name: "Tesla Inc", price: 248.50, change: 6.97, changePct: 2.87, sector: "Consumer", vol: "118.3M", mktCap: "793B" },
  { symbol: "MSFT", name: "Microsoft Corp", price: 402.15, change: 2.60, changePct: 0.65, sector: "Technology", vol: "19.4M", mktCap: "2.99T" },
];

const AI_RESPONSES: Record<string, string> = {
  "Why is NVDA up today?": "NVDA is trading up +1.23%, driven by continued data center spending from hyperscalers. Three sell-side analysts raised price targets this week — Barclays moved to $175, Citi to $170. The stock has held its 20-day MA at $138.50 as support. Keep watching that level; a close below it would shift the short-term setup.",
  "What's my downside risk?": "Your 2-share position at $142.65 represents $285.30 of exposure. Key support sits at $138.50 (20-day MA) and stronger floor at $136.00. A stop-loss at $136 limits the trade to roughly -4.7% or $13/share. That's a defined, manageable risk for a learning position — good trade structure.",
  "Should I hold or set a stop loss?": "Hold with a stop at $136 — just below the 20-day MA. This gives the trade room while protecting against a genuine reversal. If NVDA pushes through $148, raise your stop to entry to remove downside risk. You're currently in a good spot: entered near support, momentum intact.",
  "What's my exit strategy?": "Short-term resistance: $150–155 (September high retest). Medium-term: analyst consensus is $165–170. A clean plan: sell half at $150 to book partial profit, trail the rest with a stop at entry. That structure locks in gains on the upside while eliminating loss risk if the trade reverses.",
};

const LEADERBOARD = [
  { rank: 1, name: "TechParticipant99", ret: 12.46, value: 11246, today: 0.84, trades: 12, risk: "High" },
  { rank: 2, name: "AIQueen", ret: 9.87, value: 10987, today: 1.12, trades: 8, risk: "High" },
  { rank: 3, name: "NVDABull", ret: 8.21, value: 10821, today: -0.23, trades: 15, risk: "High" },
  { rank: 4, name: "GrowthHunter", ret: 5.40, value: 10540, today: 0.45, trades: 7, risk: "Med" },
  { rank: 5, name: "Alex M.", ret: 2.85, value: 10285, today: 0.00, trades: 1, risk: "Low", isUser: true },
  { rank: 6, name: "MarketMover", ret: 1.81, value: 10181, today: 0.32, trades: 5, risk: "Low" },
  { rank: 7, name: "QuietProfit", ret: 0.85, value: 10085, today: 0.11, trades: 3, risk: "Low" },
  { rank: 8, name: "DiamondHands", ret: -0.60, value: 9940, today: -0.20, trades: 2, risk: "Low" },
];

const TOURNEY_CHART = [
  { day: "D1", v: 10000 }, { day: "D2", v: 10140 }, { day: "D3", v: 10085 },
  { day: "D4", v: 10220 }, { day: "D5", v: 10195 }, { day: "D6", v: 10285 },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtPct = (n: number, plus = true) => `${n >= 0 && plus ? "+" : ""}${n.toFixed(2)}%`;
const fmtUSD = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const rankStyle = (r: number) => {
  if (r === 1) return { bg: "#A76A13", text: "#fff" };
  if (r === 2) return { bg: "#7A8590", text: "#fff" };
  if (r === 3) return { bg: "#A76A13", text: "#fff" };
  return { bg: "transparent", text: "#7A8590" };
};
const riskColor = (r: string) =>
  r === "High" ? "text-red-700 bg-red-50" :
  r === "Med" ? "text-amber-700 bg-amber-50" : "text-green-700 bg-green-50";

// ── Ticker data ────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { label: "S&P 500", value: "5,628.41", change: 0.72 },
  { label: "Nasdaq", value: "17,754.82", change: 1.08 },
  { label: "Dow Jones", value: "41,198.08", change: 0.31 },
  { label: "Russell 2K", value: "2,091.74", change: -0.18 },
  { label: "VIX", value: "17.42", change: -3.21 },
  { label: "10Y Yield", value: "4.28%", change: 0.04 },
  { label: "NVDA", value: "$142.65", change: 1.23 },
  { label: "AAPL", value: "$189.25", change: -0.45 },
  { label: "MSFT", value: "$402.15", change: 0.65 },
  { label: "TSLA", value: "$248.50", change: 2.87 },
  { label: "AMZN", value: "$185.80", change: -1.12 },
  { label: "META", value: "$512.30", change: 1.68 },
  { label: "GOOGL", value: "$165.40", change: 0.98 },
  { label: "Gold", value: "$2,748", change: 0.44 },
  { label: "WTI", value: "$72.81", change: -0.89 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TRADING WORKSPACE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── SVG Candlestick Chart ──────────────────────────────────────────────────────
function SVGChart({ data, symbol, chartType }: {
  data: OHLC[];
  symbol: string;
  chartType: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 700, h: 360 });
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDims({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  if (!data || data.length === 0) return <div style={{ flex: 1, background: "#FFFFFF" }} />;

  const { w, h } = dims;
  const ML = 0, MR = 66, MT = 38, MB = 26;
  const plotW = w - ML - MR;
  const plotH = h - MT - MB;
  const VOL_H = Math.max(30, plotH * 0.17);
  const CANDLE_H = plotH - VOL_H - 8;
  const n = data.length;

  const pMin = Math.min(...data.map(d => d.low));
  const pMax = Math.max(...data.map(d => d.high));
  const pad = (pMax - pMin) * 0.04;
  const lo = pMin - pad;
  const hi = pMax + pad;
  const range = Math.max(hi - lo, 0.01);
  const volMax = Math.max(...data.map(d => d.volume), 1);

  const xOf = (i: number) => ML + (i + 0.5) * (plotW / n);
  const cw = Math.max(1.5, (plotW / n) * 0.62);
  const priceY = (p: number) => MT + CANDLE_H * (1 - (p - lo) / range);
  const volBottom = MT + CANDLE_H + 8 + VOL_H;
  const volBH = (v: number) => VOL_H * 0.88 * (v / volMax);

  // Grid
  const step = niceStep((hi - lo) / 5);
  const gridPrices: number[] = [];
  for (let p = Math.ceil(lo / step) * step; p <= hi + 0.001; p += step) {
    if (priceY(p) >= MT && priceY(p) <= MT + CANDLE_H) gridPrices.push(+p.toFixed(2));
  }
  const dateStep = Math.max(1, Math.floor(n / 8));

  const dispIdx = hoverIdx ?? n - 1;
  const dc = data[dispIdx];
  const dcUp = dc.close >= dc.open;

  const lastClose = data[n - 1].close;
  const lastY = priceY(lastClose);

  const hoverPrice = lo + (1 - (mousePos.y - MT) / CANDLE_H) * range;
  const crosshairX = hoverIdx !== null ? xOf(hoverIdx) : null;
  const inCandleArea = mousePos.y >= MT && mousePos.y <= MT + CANDLE_H;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    const idx = Math.floor((x - ML) / (plotW / n));
    setHoverIdx(idx >= 0 && idx < n ? idx : null);
  };

  // Line chart path
  const linePath = data.map((d, i) =>
    `${i === 0 ? "M" : "L"} ${xOf(i).toFixed(1)} ${priceY(d.close).toFixed(1)}`
  ).join(" ");
  const areaPath = linePath
    + ` L ${xOf(n - 1).toFixed(1)} ${(MT + CANDLE_H).toFixed(1)}`
    + ` L ${xOf(0).toFixed(1)} ${(MT + CANDLE_H).toFixed(1)} Z`;

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, width: "100%", position: "relative", overflow: "hidden", background: "#FFFFFF", cursor: "crosshair", userSelect: "none", minHeight: 0, borderTop: "1px solid #E7EAED" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIdx(null)}
    >
      {/* OHLC bar */}
      <div style={{
        position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center",
        gap: 14, fontSize: 11, fontFamily: "Inter, sans-serif", pointerEvents: "none", zIndex: 10
      }}>
        <span style={{ color: "#1F2933", fontWeight: 600, fontSize: 12 }}>{symbol}</span>
        {[
          ["O", dc.open], ["H", dc.high], ["L", dc.low], ["C", dc.close]
        ].map(([lbl, val]) => (
          <span key={lbl as string}>
            <span style={{ color: "#7A8590" }}>{lbl} </span>
            <span style={{ color: dcUp ? "#16834B" : "#C93636", fontWeight: 500 }}>
              {(val as number).toFixed(2)}
            </span>
          </span>
        ))}
        <span style={{ color: "#7A8590" }}>{dc.date}</span>
        {dc.close !== data[n - 1].close && (
          <span style={{ color: dcUp ? "#16834B" : "#C93636", fontSize: 10 }}>
            {fmtPct(((dc.close - data[0].close) / data[0].close) * 100)}
          </span>
        )}
      </div>

      <svg width={w} height={h} style={{ display: "block" }}>
        {/* Horizontal grid lines */}
        {gridPrices.map(p => {
          const y = priceY(p);
          return (
            <g key={p}>
              <line x1={ML} y1={y} x2={w - MR} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
              <text x={w - MR + 5} y={y + 3.5} fill="#7A8590" fontSize={10} fontFamily="Inter, sans-serif">
                {p >= 100 ? p.toFixed(0) : p.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Volume area separator */}
        <line x1={ML} y1={MT + CANDLE_H + 4} x2={w - MR} y2={MT + CANDLE_H + 4} stroke="rgba(0,0,0,0.07)" strokeWidth={1} />
        <text x={ML + 4} y={MT + CANDLE_H + 17} fill="#7A8590" fontSize={9} fontFamily="Inter, sans-serif" fontWeight={500} letterSpacing="0.05em">VOL</text>

        {/* Volume bars */}
        {data.map((d, i) => {
          const bh = volBH(d.volume);
          const up = d.close >= d.open;
          return (
            <rect key={`v${i}`}
              x={xOf(i) - cw / 2} y={volBottom - bh} width={cw} height={bh}
              fill={up ? "rgba(22,131,75,0.18)" : "rgba(201,54,54,0.18)"}
            />
          );
        })}

        {/* === CANDLESTICK MODE === */}
        {chartType === "candles" && data.map((d, i) => {
          const up = d.close >= d.open;
          const color = up ? "#16834B" : "#C93636";
          const bodyTop = priceY(Math.max(d.open, d.close));
          const bodyBot = priceY(Math.min(d.open, d.close));
          const bh = Math.max(1, bodyBot - bodyTop);
          const cx = xOf(i);
          const isHov = i === hoverIdx;
          return (
            <g key={`c${i}`} opacity={isHov ? 1 : 0.85}>
              <line x1={cx} y1={priceY(d.high)} x2={cx} y2={priceY(d.low)} stroke={color} strokeWidth={1} />
              <rect
                x={cx - cw / 2} y={bodyTop} width={cw} height={bh}
                fill={up ? color : "rgba(201,54,54,0.12)"}
                stroke={color} strokeWidth={0.5}
              />
            </g>
          );
        })}

        {/* === LINE MODE === */}
        {chartType === "line" && (
          <>
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#246B9C" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#246B9C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#lg)" />
            <path d={linePath} stroke="#246B9C" strokeWidth={1.5} fill="none" />
          </>
        )}

        {/* Current price dashed line + label */}
        {lastY >= MT && lastY <= MT + CANDLE_H && (
          <g>
            <line x1={ML} y1={lastY} x2={w - MR} y2={lastY} stroke="rgba(23,59,87,0.35)" strokeWidth={1} strokeDasharray="3,4" />
            <rect x={w - MR} y={lastY - 9} width={MR - 1} height={18} fill="#173B57" rx={2} />
            <text x={w - MR + 5} y={lastY + 4} fill="#fff" fontSize={10} fontFamily="Inter, sans-serif" fontWeight={600}>
              {lastClose.toFixed(2)}
            </text>
          </g>
        )}

        {/* Crosshair */}
        {hoverIdx !== null && crosshairX !== null && (
          <g>
            <line x1={crosshairX} y1={MT} x2={crosshairX} y2={h - MB} stroke="rgba(0,0,0,0.15)" strokeWidth={1} />
            <line x1={ML} y1={mousePos.y} x2={w - MR} y2={mousePos.y} stroke="rgba(0,0,0,0.15)" strokeWidth={1} />
            {inCandleArea && (
              <>
                <rect x={w - MR} y={mousePos.y - 9} width={MR - 1} height={18} fill="#F5F6F7" stroke="#D8DDE3" strokeWidth={1} rx={2} />
                <text x={w - MR + 5} y={mousePos.y + 4} fill="#5F6B76" fontSize={10} fontFamily="Inter, sans-serif">
                  {Math.max(0, hoverPrice).toFixed(2)}
                </text>
              </>
            )}
          </g>
        )}

        {/* X axis date labels */}
        {data.map((d, i) => {
          if (i % dateStep !== 0) return null;
          return (
            <text key={`dl${i}`} x={xOf(i)} y={h - MB + 14} fill="#7A8590" fontSize={9} textAnchor="middle" fontFamily="Inter, sans-serif">
              {d.date}
            </text>
          );
        })}

        {/* Right axis border */}
        <line x1={w - MR} y1={MT} x2={w - MR} y2={h - MB} stroke="rgba(0,0,0,0.07)" strokeWidth={1} />
        {/* Bottom border */}
        <line x1={ML} y1={h - MB} x2={w - MR} y2={h - MB} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
      </svg>
    </div>
  );
}

// ── Drawing Toolbar ────────────────────────────────────────────────────────────
const DRAWING_TOOLS = [
  { id: "pointer", Icon: MousePointer2, tip: "Pointer" },
  { id: "crosshair", Icon: Crosshair, tip: "Crosshair" },
  { id: "trendline", Icon: TrendingUp, tip: "Trend Line" },
  { id: "hline", Icon: Minus, tip: "Horizontal Line" },
  { id: "ruler", Icon: Ruler, tip: "Measure" },
  { id: "pencil", Icon: Pencil, tip: "Draw" },
  { id: "rect", Icon: Square, tip: "Rectangle" },
  { id: "text", Icon: Type, tip: "Text" },
  { id: "eraser", Icon: Eraser, tip: "Eraser" },
];

function DrawingToolbar({ active, setActive }: { active: string; setActive: (t: string) => void }) {
  return (
    <div style={{
      width: 36, flexShrink: 0, display: "flex", flexDirection: "column",
      alignItems: "center", padding: "6px 0", gap: 2,
      borderRight: "1px solid #D8DDE3",
      background: "#FFFFFF",
    }}>
      {DRAWING_TOOLS.map(({ id, Icon, tip }) => (
        <button
          key={id}
          onClick={() => setActive(id)}
          title={tip}
          style={{
            width: 26, height: 26, borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: active === id ? "#EEF4F8" : "transparent",
            color: active === id ? "#246B9C" : "#7A8590",
            border: "none", cursor: "pointer", transition: "all 0.1s",
          }}
          onMouseEnter={e => { if (active !== id) (e.currentTarget as HTMLElement).style.background = "#F5F6F7"; }}
          onMouseLeave={e => { if (active !== id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Icon size={13} />
        </button>
      ))}
      <div style={{ flexGrow: 1 }} />
      <div style={{ height: 1, width: 20, background: "#E7EAED", margin: "4px 0" }} />
      <button style={{ width: 26, height: 26, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "#7A8590", border: "none", cursor: "pointer" }}>
        <Settings size={12} />
      </button>
    </div>
  );
}

// ── Right Panel (Watchlist + Details + News) ───────────────────────────────────
function TradingRightPanel({ symbol, setSymbol }: { symbol: string; setSymbol: (s: string) => void }) {
  const info = SYM_INFO[symbol] ?? SYM_INFO["NVDA"];
  const news = SYM_NEWS[symbol] ?? SYM_NEWS["NVDA"];

  return (
    <div style={{
      width: 210, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden",
      borderLeft: "1px solid #D8DDE3", background: "#FFFFFF",
    }}>
      {/* Watchlist header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px 6px", borderBottom: "1px solid #E7EAED", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#7A8590", textTransform: "uppercase", letterSpacing: "0.06em" }}>Watchlist</span>
        <Plus size={11} style={{ color: "#7A8590", cursor: "pointer" }} />
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "44px 1fr 48px 46px",
        padding: "4px 10px", borderBottom: "1px solid #E7EAED",
        flexShrink: 0,
      }}>
        {["Sym", "Last", "Chg", "%"].map(h => (
          <div key={h} style={{ fontSize: 9, color: "#7A8590", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: h === "Sym" ? "left" : "right" }}>
            {h}
          </div>
        ))}
      </div>

      {/* Watchlist rows */}
      {WATCHLIST.map(sym => {
        const d = SYM_INFO[sym];
        const sel = sym === symbol;
        const up = d.changePct >= 0;
        return (
          <button
            key={sym}
            onClick={() => setSymbol(sym)}
            style={{
              display: "grid", gridTemplateColumns: "44px 1fr 48px 46px",
              padding: "6px 10px", background: sel ? "#EEF4F8" : "transparent",
              borderLeft: `2px solid ${sel ? "#246B9C" : "transparent"}`,
              paddingLeft: 8, cursor: "pointer", border: "none", transition: "background 0.1s",
              borderBottom: "1px solid #E7EAED",
            }}
            onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = "#F5F6F7"; }}
            onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <div style={{ fontSize: 11, color: sel ? "#246B9C" : "#1F2933", fontWeight: 600, textAlign: "left" }}>{sym}</div>
            <div style={{ fontSize: 11, color: "#1F2933", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.price.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: up ? "#16834B" : "#C93636", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {up ? "+" : ""}{d.change.toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: up ? "#16834B" : "#C93636", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {up ? "+" : ""}{d.changePct.toFixed(2)}%
            </div>
          </button>
        );
      })}

      {/* Divider */}
      <div style={{ height: 1, background: "#D8DDE3", flexShrink: 0 }} />

      {/* Symbol details */}
      <div style={{ padding: "8px 10px", borderBottom: "1px solid #E7EAED", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2933" }}>{symbol}</span>
          <span style={{ fontSize: 20, fontWeight: 500, color: info.changePct >= 0 ? "#16834B" : "#C93636", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {info.price.toFixed(2)}
          </span>
        </div>
        <div style={{ fontSize: 10, color: "#7A8590", marginBottom: 7 }}>{info.name}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 8px" }}>
          {[
            { l: "Change", v: `${info.changePct >= 0 ? "+" : ""}${info.changePct.toFixed(2)}%`, c: info.changePct >= 0 ? "#16834B" : "#C93636" },
            { l: "P/E", v: info.pe },
            { l: "Mkt Cap", v: "$" + info.mktCap },
            { l: "Volume", v: info.vol },
            { l: "Sector", v: info.sector },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#7A8590" }}>{l}</span>
              <span style={{ fontSize: 10, color: c || "#1F2933", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* News */}
      <div style={{ flex: 1, overflow: "hidden", padding: "8px 10px" }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: "#7A8590", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>
          Latest News
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {news.map((n, i) => (
            <div key={i} style={{ cursor: "pointer" }}>
              <div style={{ fontSize: 11, color: "#5F6B76", lineHeight: 1.45, marginBottom: 2 }}>{n.headline}</div>
              <div style={{ fontSize: 10, color: "#7A8590" }}>{n.time} ago</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Bottom Panel ───────────────────────────────────────────────────────────────
function TradingBottomPanel({ navigate }: { navigate: (s: Screen) => void }) {
  const [tab, setTab] = useState("screener");
  const tabs = [
    { id: "screener", label: "Stock Screener" },
    { id: "news", label: "News" },
    { id: "orders", label: "Orders" },
    { id: "positions", label: "Positions" },
    { id: "journal", label: "Journal" },
  ];

  const NEWS_FEED = [
    { headline: "NVDA Q3 earnings beat — EPS $0.74 vs $0.64 expected; revenue up 94% YoY", source: "Bloomberg", sym: "NVDA", time: "2h" },
    { headline: "Fed holds rates; signals two cuts in 2026. Markets rally on dovish tone", source: "WSJ", sym: "MACRO", time: "3h" },
    { headline: "TSLA Cybertruck production reaches 50K/month milestone in Texas Gigafactory", source: "Reuters", sym: "TSLA", time: "4h" },
    { headline: "S&P 500 hits intraday record; tech sector leads broad gains across sectors", source: "CNBC", sym: "SPX", time: "5h" },
    { headline: "Apple set to unveil M5 MacBook lineup; event scheduled for Nov 5 in Cupertino", source: "The Verge", sym: "AAPL", time: "6h" },
  ];

  return (
    <div style={{ height: 210, flexShrink: 0, display: "flex", flexDirection: "column", borderTop: "1px solid #D8DDE3", background: "#FFFFFF" }}>
      {/* Tab bar */}
      <div style={{ height: 32, flexShrink: 0, display: "flex", alignItems: "stretch", borderBottom: "1px solid #E7EAED", paddingLeft: 4 }}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: "0 11px", fontSize: 11, fontWeight: tab === id ? 600 : 400,
              color: tab === id ? "#246B9C" : "#7A8590",
              background: "transparent", border: "none", borderBottom: tab === id ? "2px solid #246B9C" : "2px solid transparent",
              cursor: "pointer", transition: "color 0.1s", whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        ))}
        {tab === "screener" && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingRight: 10 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 4, background: "#F5F6F7", color: "#5F6B76", border: "1px solid #D8DDE3", fontSize: 10, cursor: "pointer" }}>
              <SlidersHorizontal size={10} /> Filter
            </button>
          </div>
        )}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* ── SCREENER ── */}
        {tab === "screener" && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ position: "sticky", top: 0, background: "#FFFFFF", zIndex: 1 }}>
                {["Symbol", "Price", "Change %", "Volume", "Market Cap", "P/E", "Sector"].map(h => (
                  <th key={h} style={{
                    padding: "5px 12px", textAlign: "left", fontWeight: 600, fontSize: 9,
                    color: "#7A8590", textTransform: "uppercase", letterSpacing: "0.06em",
                    borderBottom: "1px solid #E7EAED", whiteSpace: "nowrap",
                  }}>
                    {h} <ChevronDown size={7} style={{ display: "inline", verticalAlign: "middle", marginLeft: 2 }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCREENER.map(row => (
                <tr
                  key={row.symbol}
                  style={{ borderBottom: "1px solid #E7EAED", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F5F6F7"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <td style={{ padding: "6px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 3, background: "#EEF4F8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: "#24577A" }}>
                        {row.symbol.slice(0, 2)}
                      </div>
                      <span style={{ color: "#1F2933", fontWeight: 600 }}>{row.symbol}</span>
                    </div>
                  </td>
                  <td style={{ padding: "6px 12px", color: "#1F2933", fontVariantNumeric: "tabular-nums" }}>${row.price.toFixed(2)}</td>
                  <td style={{ padding: "6px 12px", color: row.changePct >= 0 ? "#16834B" : "#C93636", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {row.changePct >= 0 ? "+" : ""}{row.changePct.toFixed(2)}%
                  </td>
                  <td style={{ padding: "6px 12px", color: "#5F6B76", fontVariantNumeric: "tabular-nums" }}>{row.vol}</td>
                  <td style={{ padding: "6px 12px", color: "#5F6B76" }}>${row.mktCap}</td>
                  <td style={{ padding: "6px 12px", color: "#5F6B76" }}>{row.pe}</td>
                  <td style={{ padding: "6px 12px" }}>
                    <span style={{ padding: "2px 6px", borderRadius: 3, background: "#EEF4F8", color: "#246B9C", fontSize: 10 }}>
                      {row.sector}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── NEWS ── */}
        {tab === "news" && (
          <div style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
            {NEWS_FEED.map(({ headline, source, sym, time }) => (
              <div key={headline} style={{ borderBottom: "1px solid #E7EAED", paddingBottom: 8, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: "#EEF4F8", color: "#246B9C" }}>{sym}</span>
                  <span style={{ fontSize: 10, color: "#7A8590" }}>{source} · {time} ago</span>
                </div>
                <div style={{ fontSize: 12, color: "#5F6B76", lineHeight: 1.5 }}>{headline}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── ORDERS ── */}
        {tab === "orders" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#5F6B76" }}>No open orders</span>
            <span style={{ fontSize: 11, color: "#7A8590" }}>Submitted paper trades will appear here</span>
          </div>
        )}

        {/* ── POSITIONS ── */}
        {tab === "positions" && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ position: "sticky", top: 0, background: "#FFFFFF" }}>
                {["Symbol", "Shares", "Avg Cost", "Current", "P&L", "P&L %", "Actions"].map(h => (
                  <th key={h} style={{ padding: "5px 12px", textAlign: "left", fontWeight: 600, fontSize: 9, color: "#7A8590", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #E7EAED" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { sym: "NVDA", shares: 2, cost: 142.65, cur: 142.65, pnl: 0, pnlPct: 0 },
                { sym: "AAPL", shares: 15, cost: 183.37, cur: 189.25, pnl: 88.20, pnlPct: 3.21 },
                { sym: "MSFT", shares: 8, cost: 390.05, cur: 402.15, pnl: 96.80, pnlPct: 3.10 },
              ].map(p => (
                <tr key={p.sym} style={{ borderBottom: "1px solid #E7EAED" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F5F6F7"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <td style={{ padding: "6px 12px", color: "#1F2933", fontWeight: 600 }}>{p.sym}</td>
                  <td style={{ padding: "6px 12px", color: "#5F6B76" }}>{p.shares}</td>
                  <td style={{ padding: "6px 12px", color: "#5F6B76", fontVariantNumeric: "tabular-nums" }}>${p.cost.toFixed(2)}</td>
                  <td style={{ padding: "6px 12px", color: "#5F6B76", fontVariantNumeric: "tabular-nums" }}>${p.cur.toFixed(2)}</td>
                  <td style={{ padding: "6px 12px", color: p.pnl >= 0 ? "#16834B" : "#C93636", fontVariantNumeric: "tabular-nums" }}>{p.pnl >= 0 ? "+" : ""}${p.pnl.toFixed(2)}</td>
                  <td style={{ padding: "6px 12px", color: p.pnlPct >= 0 ? "#16834B" : "#C93636", fontVariantNumeric: "tabular-nums" }}>{p.pnlPct >= 0 ? "+" : ""}{p.pnlPct.toFixed(2)}%</td>
                  <td style={{ padding: "6px 12px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => navigate("buy")} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 3, background: "#EDFAF4", color: "#16834B", border: "1px solid #A7DFBE", cursor: "pointer" }}>Buy</button>
                      <button style={{ fontSize: 10, padding: "2px 7px", borderRadius: 3, background: "#FEF2F2", color: "#C93636", border: "1px solid #FCA5A5", cursor: "pointer" }}>Sell</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── JOURNAL ── */}
        {tab === "journal" && (
          <div style={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#5F6B76" }}>Recent Entries</span>
              <button onClick={() => navigate("journal-trade")} style={{ fontSize: 10, color: "#246B9C", background: "transparent", border: "none", cursor: "pointer" }}>View all →</button>
            </div>
            {[
              { sym: "NVDA", action: "Buy", date: "Oct 28", thesis: "AI demand breakout. Blackwell production ramp upcoming catalyst. Stop at $136." },
            ].map(e => (
              <div key={e.sym} style={{ padding: "8px 10px", background: "#F5F6F7", borderRadius: 4, border: "1px solid #D8DDE3" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#1F2933", fontWeight: 600 }}>{e.sym}</span>
                  <span style={{ fontSize: 10, color: "#16834B", background: "#EDFAF4", padding: "1px 6px", borderRadius: 3, border: "1px solid #A7DFBE" }}>{e.action}</span>
                  <span style={{ fontSize: 10, color: "#7A8590", marginLeft: "auto" }}>{e.date}</span>
                </div>
                <div style={{ fontSize: 11, color: "#5F6B76", lineHeight: 1.5 }}>{e.thesis}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Markets Workspace ──────────────────────────────────────────────────────────
type MarketView = "overview" | "chart" | "screener" | "research" | "calendar" | "alerts";

const MARKET_INDEXES = [
  { name: "S&P 500", value: "5,628.41", change: 0.72 },
  { name: "Nasdaq", value: "17,754.82", change: 1.08 },
  { name: "Dow", value: "41,198.08", change: 0.31 },
  { name: "Russell 2000", value: "2,091.74", change: -0.18 },
];

const MARKET_MOVERS = [
  { sym: "NVDA", name: "NVIDIA", price: 142.65, change: 1.23, note: "AI chip demand" },
  { sym: "META", name: "Meta Platforms", price: 512.30, change: 1.68, note: "Ad growth" },
  { sym: "MSFT", name: "Microsoft", price: 402.15, change: 0.65, note: "Cloud strength" },
  { sym: "TSLA", name: "Tesla", price: 248.50, change: -2.87, note: "Delivery concerns" },
  { sym: "AMZN", name: "Amazon", price: 185.80, change: -1.12, note: "Retail margin focus" },
];

function MarketHeader({ view, setView, learnMode, setLearnMode }: {
  view: MarketView;
  setView: (v: MarketView) => void;
  learnMode: boolean;
  setLearnMode: (v: boolean) => void;
}) {
  const views: { id: MarketView; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "chart", label: "Chart" },
    { id: "screener", label: "Screener" },
    { id: "research", label: "Research" },
    { id: "calendar", label: "Calendar" },
    { id: "alerts", label: "Alerts" },
  ];
  return (
    <div style={{ background: "#FFFFFF", borderBottom: "1px solid #D8DDE3", flexShrink: 0 }}>
      <div style={{ height: 46, display: "flex", alignItems: "center", padding: "0 20px", gap: 0 }}>
        <div style={{ marginRight: 16, paddingRight: 16, borderRight: "1px solid #E7EAED" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2933" }}>Markets</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, height: "100%", flex: 1 }}>
          {views.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} style={{
              height: "100%", padding: "0 12px", border: "none", borderBottom: view === item.id ? "2px solid #246B9C" : "2px solid transparent",
              background: "transparent", color: view === item.id ? "#173B57" : "#5F6B76", fontSize: 13, fontWeight: view === item.id ? 600 : 400, cursor: "pointer",
            }}>{item.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setLearnMode(!learnMode)} style={{
            display: "flex", alignItems: "center", gap: 6, height: 28, padding: "0 10px", borderRadius: 4,
            border: "1px solid #D8DDE3", background: learnMode ? "#EEF4F8" : "#FFFFFF", color: learnMode ? "#246B9C" : "#5F6B76", fontSize: 11, cursor: "pointer",
          }}><GraduationCap size={13} /> Learn <span style={{ fontWeight: 600 }}>{learnMode ? "ON" : "OFF"}</span></button>
          <button style={{ width: 28, height: 28, borderRadius: 4, border: "1px solid #D8DDE3", background: "#FFFFFF", color: "#5F6B76", display: "grid", placeItems: "center", cursor: "pointer" }}><Search size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function BeginnerTip({ title, children }: { title: string; children: any }) {
  return <div style={{ background: "#EEF4F8", border: "1px solid #B3D4E8", borderLeft: "3px solid #246B9C", padding: "10px 12px", borderRadius: 4 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#173B57", marginBottom: 3 }}><Info size={12} /> {title}</div>
    <div style={{ fontSize: 11, color: "#5F6B76", lineHeight: 1.5 }}>{children}</div>
  </div>;
}

function MarketsOverview({ setView, learnMode, navigate }: { setView: (v: MarketView) => void; learnMode: boolean; navigate: (s: Screen) => void }) {
  return <div style={{ flex: 1, overflowY: "auto", background: "#F5F6F7", padding: 16 }}>
    <div style={{ width: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", border: "1px solid #D8DDE3", background: "#FFFFFF", marginBottom: 14 }}>
        {MARKET_INDEXES.map((x, i) => <div key={x.name} style={{ padding: "12px 14px", borderRight: i < 3 ? "1px solid #E7EAED" : "none" }}>
          <div style={{ fontSize: 10, color: "#7A8590", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{x.name}</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}><span style={{ fontSize: 16, color: "#1F2933", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{x.value}</span><span style={{ fontSize: 11, color: x.change >= 0 ? "#16834B" : "#C93636", fontWeight: 600 }}>{x.change >= 0 ? "+" : ""}{x.change.toFixed(2)}%</span></div>
        </div>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.8fr) minmax(300px,.75fr)", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <section style={{ background: "#FFFFFF", border: "1px solid #D8DDE3", padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div><div style={{ color: "#1F2933", fontWeight: 600, fontSize: 14 }}>Today's market</div><div style={{ color: "#7A8590", fontSize: 11, marginTop: 2 }}>A quick read before you start researching.</div></div>
              <span style={{ color: "#16834B", fontSize: 10, fontWeight: 600, background: "#EDFAF4", border: "1px solid #A7DFBE", padding: "3px 7px", borderRadius: 3 }}>MARKET OPEN</span>
            </div>
            <div style={{ marginTop: 12, fontSize: 13, color: "#1F2933", lineHeight: 1.6 }}><b>Technology is leading today.</b> Semiconductor and mega-cap software stocks are helping the Nasdaq outperform, while smaller companies are slightly lower.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "#E7EAED", marginTop: 12, border: "1px solid #D8DDE3" }}>
              {[['Trend','Risk-on','Investors favoring growth'],['Volatility','Normal','Price swings near averages'],['Leadership','Technology','Tech leading gains']].map(([a,b,c]) => <div key={a} style={{ background: "#FFFFFF", padding: 10 }}><div style={{ fontSize: 10, color: "#7A8590" }}>{a}</div><div style={{ fontSize: 12, color: "#1F2933", fontWeight: 600, marginTop: 2 }}>{b}</div><div style={{ fontSize: 10, color: "#7A8590", marginTop: 2 }}>{c}</div></div>)}
            </div>
          </section>

          {learnMode && <BeginnerTip title="Reading the market"><b>Indexes</b> are groups of stocks used to show how part of the market is performing. You do not need to predict every move. Start by noticing which areas are strong, weak, or unusually active.</BeginnerTip>}

          <section style={{ background: "#FFFFFF", border: "1px solid #D8DDE3" }}>
            <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", borderBottom: "1px solid #E7EAED" }}><div style={{ fontSize: 13, fontWeight: 600, color: "#1F2933" }}>Stocks in focus</div><button onClick={() => setView("screener")} style={{ fontSize: 11, color: "#246B9C", background: "none", border: 0, cursor: "pointer" }}>Open screener →</button></div>
            <div style={{ display: "grid", gridTemplateColumns: "90px 1.2fr 90px 80px 1fr", padding: "7px 14px", color: "#7A8590", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid #E7EAED" }}><span>Symbol</span><span>Company</span><span>Price</span><span>Today</span><span>Note</span></div>
            {MARKET_MOVERS.map(m => <button key={m.sym} onClick={() => { if(m.sym === 'NVDA') setView('research'); }} style={{ width: "100%", display: "grid", gridTemplateColumns: "90px 1.2fr 90px 80px 1fr", padding: "10px 14px", alignItems: "center", background: "transparent", border: 0, borderBottom: "1px solid #E7EAED", color: "inherit", cursor: "pointer", textAlign: "left" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F5F6F7"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <span style={{ color: "#1F2933", fontWeight: 600, fontSize: 12 }}>{m.sym}</span><span style={{ color: "#5F6B76", fontSize: 12 }}>{m.name}</span><span style={{ color: "#1F2933", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>${m.price.toFixed(2)}</span><span style={{ color: m.change >= 0 ? "#16834B" : "#C93636", fontSize: 12, fontWeight: 600 }}>{m.change >= 0 ? "+" : ""}{m.change.toFixed(2)}%</span><span style={{ color: "#7A8590", fontSize: 11 }}>{m.note}</span>
            </button>)}
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <section style={{ background: "#FFFFFF", border: "1px solid #D8DDE3", padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1F2933", marginBottom: 8 }}>Your watchlist</div>
            {MARKET_MOVERS.slice(0,4).map(m => <div key={m.sym} style={{ display: "grid", gridTemplateColumns: "1fr auto", padding: "8px 0", borderBottom: "1px solid #E7EAED" }}>
              <div><div style={{ fontSize: 12, fontWeight: 600, color: "#1F2933" }}>{m.sym}</div><div style={{ fontSize: 10, color: "#7A8590" }}>{m.name}</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, color: "#1F2933", fontVariantNumeric: "tabular-nums" }}>${m.price.toFixed(2)}</div><div style={{ fontSize: 11, color: m.change >= 0 ? "#16834B" : "#C93636" }}>{m.change >= 0 ? "+" : ""}{m.change.toFixed(2)}%</div></div>
            </div>)}
          </section>
          <section style={{ background: "#FFFFFF", border: "1px solid #D8DDE3", padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1F2933", marginBottom: 8 }}>Upcoming events</div>
            {[['Today 3:00 PM','Fed Chair remarks','High impact'],['Tomorrow','NVDA earnings','Watchlist'],['Fri 8:30 AM','Jobs report','High impact']].map(([a,b,c]) => <div key={b} style={{ padding: "8px 0", borderBottom: "1px solid #E7EAED" }}><div style={{ fontSize: 10, color: "#7A8590" }}>{a}</div><div style={{ fontSize: 12, color: "#1F2933", marginTop: 1 }}>{b}</div><div style={{ fontSize: 10, color: c === 'High impact' ? '#A76A13' : '#7A8590', marginTop: 1 }}>{c}</div></div>)}
            <button onClick={() => setView("calendar")} style={{ marginTop: 8, fontSize: 11, color: "#246B9C", background: "none", border: 0, cursor: "pointer" }}>View calendar →</button>
          </section>
          <button onClick={() => navigate("buy")} style={{ height: 34, border: "1px solid #173B57", background: "#173B57", color: "white", fontSize: 12, fontWeight: 500, borderRadius: 4, cursor: "pointer" }}>Practice a trade</button>
        </div>
      </div>
    </div>
  </div>;
}

function MarketsChart({ navigate, learnMode }: { navigate: (s: Screen) => void; learnMode: boolean }) {
  const [symbol, setSymbol] = useState("NVDA");
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("candles");
  const [activeTool, setActiveTool] = useState("pointer");
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const info = SYM_INFO[symbol] ?? SYM_INFO["NVDA"];
  const data = CHART_CACHE[symbol] ?? CHART_CACHE["NVDA"];
  const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1D", "1W", "1M"];
  return <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F5F6F7", color: "#1F2933" }}>
    <div style={{ height: 40, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 8px", borderBottom: "1px solid #D8DDE3", background: "#FFFFFF" }}>
      <button style={{ display: "flex", alignItems: "center", gap: 5, height: 26, padding: "0 8px", borderRadius: 3, background: "#F5F6F7", border: "1px solid #D8DDE3", color: "#1F2933", fontSize: 12, fontWeight: 600, cursor: "pointer" }}><Search size={10}/>{symbol}<ChevronDown size={9}/></button>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginLeft: 10, paddingRight: 10, borderRight: "1px solid #E7EAED" }}><span style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{info.price.toFixed(2)}</span><span style={{ color: info.changePct >= 0 ? "#16834B" : "#C93636", fontSize: 11, fontWeight: 600 }}>{info.changePct >= 0 ? "+" : ""}{info.changePct.toFixed(2)}%</span></div>
      <div style={{ display: "flex", alignItems: "center", gap: 1, marginLeft: 6 }}>{TIMEFRAMES.map(tf => <button key={tf} onClick={() => setTimeframe(tf)} style={{ height: 24, minWidth: 26, padding: "0 4px", border: 0, borderRadius: 3, background: timeframe === tf ? "#EEF4F8" : "transparent", color: timeframe === tf ? "#173B57" : "#7A8590", fontSize: 11, fontWeight: timeframe === tf ? 600 : 400, cursor: "pointer" }}>{tf}</button>)}</div>
      <div style={{ height: 18, width: 1, background: "#E7EAED", margin: "0 6px" }} />
      {[{id:'candles',Icon:BarChart2},{id:'line',Icon:Activity}].map(({id,Icon}) => <button key={id} onClick={()=>setChartType(id)} style={{ width: 26, height: 26, background: chartType===id?'#EEF4F8':'transparent', color: chartType===id?'#246B9C':'#7A8590', border: 0, borderRadius: 3, display:'grid', placeItems:'center', cursor:'pointer' }}><Icon size={12}/></button>)}
      {[['Indicators',Layers],['Compare',Plus],['Alert',Bell]].map(([label, Icon]: any) => <button key={label} style={{ display:'flex', gap:4, alignItems:'center', height:26, padding:'0 6px', background:'transparent', border:0, color:'#7A8590', fontSize:11, cursor:'pointer' }}><Icon size={11}/>{label}</button>)}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ display:'flex', background:'#F5F6F7', border:'1px solid #D8DDE3', borderRadius:3, padding:2 }}>
          <button onClick={()=>setMode('simple')} style={{ border:0, background:mode==='simple'?'#FFFFFF':'transparent', color:mode==='simple'?'#1F2933':'#7A8590', fontSize:10, padding:'3px 7px', borderRadius:2, fontWeight: mode==='simple'?600:400 }}>Simple</button>
          <button onClick={()=>setMode('advanced')} style={{ border:0, background:mode==='advanced'?'#FFFFFF':'transparent', color:mode==='advanced'?'#1F2933':'#7A8590', fontSize:10, padding:'3px 7px', borderRadius:2, fontWeight: mode==='advanced'?600:400 }}>Advanced</button>
        </div>
        <button onClick={()=>navigate('buy')} style={{ height:26, padding:'0 10px', border:0, borderRadius:3, background:'#16834B', color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>Buy</button>
        <button style={{ height:26, padding:'0 10px', border:0, borderRadius:3, background:'#C93636', color:'#fff', fontSize:11, fontWeight:600 }}>Sell</button>
        <button style={{ width:26,height:26,border:0,background:'transparent',color:'#7A8590' }}><Settings size={13}/></button>
      </div>
    </div>
    {mode === 'simple' && <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', background:'#FFFFFF', borderBottom:'1px solid #D8DDE3' }}>{[['Trend','Up','Price making higher highs'],['Volume','Above avg','More shares trading today'],['52-week','Near high','Close to yearly high'],['Risk','Medium','Normal stock volatility']].map(([a,b,c])=><div key={a} style={{ padding:'8px 12px', borderRight:'1px solid #E7EAED' }}><div style={{fontSize:9,color:'#7A8590',textTransform:'uppercase',letterSpacing:'.04em'}}>{a}</div><div style={{fontSize:12,color:'#1F2933',fontWeight:600,marginTop:2}}>{b}</div><div style={{fontSize:9,color:'#7A8590',marginTop:2}}>{c}</div></div>)}</div>}
    <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
      <DrawingToolbar active={activeTool} setActive={setActiveTool}/>
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>
        <SVGChart data={data} symbol={symbol} chartType={chartType}/>
        {learnMode && mode==='simple' && <div style={{ height:40, flexShrink:0, borderTop:'1px solid #D8DDE3', background:'#EEF4F8', padding:'8px 12px', fontSize:11, color:'#5F6B76' }}><b style={{color:'#173B57'}}>How to read this:</b> Each candle shows the opening, high, low, and closing price for one time period. Green means the price closed higher; red means it closed lower.</div>}
      </div>
      <TradingRightPanel symbol={symbol} setSymbol={setSymbol}/>
    </div>
    {mode === 'advanced' && <TradingBottomPanel navigate={navigate}/>}
  </div>;
}

function MarketsScreener({ learnMode }: { learnMode: boolean }) {
  const presets=["Going up today","Most active","Large companies","Fast-growing","Dividend stocks","Near 52-week high"];
  return <div style={{flex:1,overflow:'auto',background:'#F5F6F7',padding:16}}>
    <div style={{background:'#FFFFFF',border:'1px solid #D8DDE3'}}>
      <div style={{padding:'14px 16px',borderBottom:'1px solid #E7EAED',display:'flex',alignItems:'center',gap:8}}>
        <div><div style={{fontSize:14,fontWeight:600,color:'#1F2933'}}>Stock Screener</div><div style={{fontSize:11,color:'#7A8590',marginTop:2}}>Find companies that match what you are looking for.</div></div>
        <button style={{marginLeft:'auto',height:28,padding:'0 10px',border:'1px solid #D8DDE3',background:'#FFFFFF',color:'#5F6B76',fontSize:11,borderRadius:3,display:'flex',alignItems:'center',gap:5}}><SlidersHorizontal size={11}/> Filters</button>
      </div>
      <div style={{padding:'10px 14px',borderBottom:'1px solid #E7EAED',display:'flex',gap:5,flexWrap:'wrap'}}>
        {presets.map((p,i)=><button key={p} style={{padding:'5px 9px',borderRadius:3,border:'1px solid '+(i===0?'#246B9C':'#D8DDE3'),background:i===0?'#EEF4F8':'#FFFFFF',color:i===0?'#246B9C':'#5F6B76',fontSize:11}}>{p}</button>)}
      </div>
      {learnMode&&<div style={{padding:'10px 14px',borderBottom:'1px solid #E7EAED'}}><BeginnerTip title="What is a stock screener?">A screener is a search tool for investments. Filters narrow thousands of stocks into a smaller list based on things like company size, price movement, growth, or dividends.</BeginnerTip></div>}
      <div style={{display:'grid',gridTemplateColumns:'85px 1.3fr 90px 90px 110px 80px 90px 110px',padding:'7px 14px',fontSize:9,color:'#7A8590',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',borderBottom:'1px solid #E7EAED'}}><span>Symbol</span><span>Company</span><span>Price</span><span>Today</span><span>Mkt Cap</span><span>P/E</span><span>Volume</span><span>Sector</span></div>
      {MARKET_MOVERS.concat([{sym:'AAPL',name:'Apple',price:189.25,change:-0.46,note:'Consumer tech'}]).map((m,i)=><div key={m.sym} style={{display:'grid',gridTemplateColumns:'85px 1.3fr 90px 90px 110px 80px 90px 110px',padding:'10px 14px',fontSize:12,borderBottom:'1px solid #E7EAED',alignItems:'center'}}
        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#F5F6F7'}
        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
      ><b style={{color:'#1F2933'}}>{m.sym}</b><span style={{color:'#5F6B76'}}>{m.name}</span><span style={{color:'#1F2933',fontVariantNumeric:'tabular-nums'}}>${m.price.toFixed(2)}</span><span style={{color:m.change>=0?'#16834B':'#C93636',fontWeight:600}}>{m.change>=0?'+':''}{m.change.toFixed(2)}%</span><span style={{color:'#5F6B76'}}>${['3.48T','1.31T','2.99T','790B','1.95T','2.89T'][i]||'—'}</span><span style={{color:'#5F6B76'}}>{['54.2','27.3','36.5','62.1','43.1','31.8'][i]||'—'}</span><span style={{color:'#5F6B76'}}>{['28.4M','19.4M','24.6M','92.1M','41.7M','51.2M'][i]||'—'}</span><span style={{background:'#EEF4F8',color:'#246B9C',padding:'2px 6px',borderRadius:3,fontSize:10}}>{['Technology','Communication','Technology','Consumer','Consumer','Technology'][i]||'—'}</span></div>)}
    </div>
  </div>;
}

function MarketsResearch({ learnMode, navigate }: { learnMode:boolean; navigate:(s:Screen)=>void }) {
 const tabs=['Overview','Chart','Financials','Earnings','News','Analysis'];
 const [tab,setTab]=useState('Overview');
 return <div style={{flex:1,overflow:'auto',background:'#F5F6F7',padding:16}}>
  <div style={{width:'100%'}}>
   <div style={{background:'#FFFFFF',border:'1px solid #D8DDE3'}}>
    <div style={{padding:'16px',display:'flex',alignItems:'center',borderBottom:'1px solid #E7EAED'}}>
     <div>
      <div style={{fontSize:16,fontWeight:600,color:'#1F2933'}}>NVDA <span style={{fontSize:12,fontWeight:400,color:'#7A8590'}}>NVIDIA Corporation</span></div>
      <div style={{display:'flex',alignItems:'baseline',gap:8,marginTop:4}}><span style={{fontSize:22,color:'#1F2933',fontWeight:500,fontVariantNumeric:'tabular-nums'}}>$142.65</span><span style={{fontSize:12,color:'#16834B',fontWeight:600}}>+1.23%</span></div>
     </div>
     <div style={{marginLeft:'auto',display:'flex',gap:6}}>
      <button style={{height:28,padding:'0 10px',border:'1px solid #D8DDE3',background:'#FFFFFF',color:'#5F6B76',borderRadius:3,fontSize:11,display:'flex',alignItems:'center',gap:5}}><Star size={12}/> Watchlist</button>
      <button onClick={()=>navigate('buy')} style={{height:28,padding:'0 12px',border:0,background:'#16834B',color:'#fff',borderRadius:3,fontSize:11,fontWeight:500,cursor:'pointer'}}>Buy</button>
     </div>
    </div>
    <div style={{display:'flex',padding:'0 12px',borderBottom:'1px solid #E7EAED'}}>
     {tabs.map(t=><button key={t} onClick={()=>setTab(t)} style={{height:36,padding:'0 11px',background:'transparent',border:0,borderBottom:tab===t?'2px solid #246B9C':'2px solid transparent',color:tab===t?'#173B57':'#7A8590',fontSize:12,fontWeight:tab===t?600:400,cursor:'pointer'}}>{t}</button>)}
    </div>
    <div style={{padding:16}}>
     {tab==='Overview'?<>
      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:14}}>
       <div>
        <div style={{fontSize:13,fontWeight:600,color:'#1F2933',marginBottom:8}}>What NVIDIA does</div>
        <p style={{fontSize:12,color:'#5F6B76',lineHeight:1.6,margin:0}}>NVIDIA designs processors and software used for artificial intelligence, data centers, gaming, and professional graphics. Its GPUs are widely used to train and run AI models.</p>
        {learnMode&&<div style={{marginTop:12}}><BeginnerTip title="Company value vs. stock price">A higher stock price does not automatically mean a company is worth more. <b>Company value (market cap)</b> is the stock price multiplied by all shares outstanding.</BeginnerTip></div>}
       </div>
       <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',border:'1px solid #D8DDE3'}}>
        {[['Company value','$3.48T'],['P/E ratio','54.2'],['52-week range','$88 – $148'],['Shares traded','28.4M'],['Sector','Technology'],['Next earnings','Tomorrow']].map(([a,b],i)=><div key={a} style={{padding:10,borderRight:i%2===0?'1px solid #D8DDE3':'none',borderBottom:i<4?'1px solid #D8DDE3':'none'}}><div style={{fontSize:10,color:'#7A8590'}}>{a}</div><div style={{fontSize:12,color:'#1F2933',fontWeight:600,marginTop:2}}>{b}</div></div>)}
       </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:14}}>
       {[['Revenue','$130.5B','+126% YoY'],['Net income','$72.9B','+581% YoY'],['Gross margin','75.3%','Strong']].map(([a,b,c])=><div key={a} style={{border:'1px solid #D8DDE3',padding:12,background:'#FAFBFC'}}><div style={{fontSize:10,color:'#7A8590'}}>{a}</div><div style={{fontSize:16,color:'#1F2933',fontWeight:500,marginTop:4,fontVariantNumeric:'tabular-nums'}}>{b}</div><div style={{fontSize:10,color:'#16834B',marginTop:3}}>{c}</div></div>)}
      </div>
     </>:<div style={{minHeight:280,display:'grid',placeItems:'center',color:'#7A8590',fontSize:12}}>{tab} — detailed data view ready for live API connection.</div>}
    </div>
   </div>
  </div>
 </div>;
}

function MarketsCalendar({ learnMode }: { learnMode:boolean }) {
 const events=[['Today · 3:00 PM','Fed Chair remarks','Economy','High','Interest rates can affect borrowing costs and stock valuations.'],['Tomorrow · After close','NVIDIA earnings','Earnings','High','Revenue, profit, and guidance can move NVDA and other chip stocks.'],['Friday · 8:30 AM','U.S. jobs report','Economy','High','Shows hiring strength and can change expectations for interest rates.'],['Friday · 10:00 AM','Consumer sentiment','Economy','Medium','Measures how confident households feel about the economy.']];
 return <div style={{flex:1,overflow:'auto',background:'#F5F6F7',padding:16}}>
  <div style={{width:'100%',background:'#FFFFFF',border:'1px solid #D8DDE3'}}>
   <div style={{padding:'14px 16px',borderBottom:'1px solid #E7EAED'}}><div style={{fontSize:14,fontWeight:600,color:'#1F2933'}}>Market Calendar</div><div style={{fontSize:11,color:'#7A8590',marginTop:2}}>Important economic events and company earnings.</div></div>
   {learnMode&&<div style={{padding:'12px 14px',borderBottom:'1px solid #E7EAED'}}><BeginnerTip title="Why calendars matter">Stocks can move sharply when new information arrives. A calendar helps you know when major reports or earnings are scheduled so a move does not surprise you.</BeginnerTip></div>}
   {events.map(([time,title,type,impact,why])=><div key={title} style={{display:'grid',gridTemplateColumns:'160px 1fr 110px 80px',padding:'12px 14px',borderBottom:'1px solid #E7EAED',alignItems:'center'}}
     onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#F5F6F7'}
     onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
   ><div style={{fontSize:11,color:'#7A8590'}}>{time}</div><div><div style={{fontSize:12,color:'#1F2933',fontWeight:600}}>{title}</div><div style={{fontSize:10,color:'#7A8590',marginTop:2}}>{why}</div></div><span style={{fontSize:11,color:'#5F6B76'}}>{type}</span><span style={{fontSize:11,fontWeight:600,color:impact==='High'?'#A76A13':'#7A8590'}}>{impact}</span></div>)}
  </div>
 </div>;
}

function MarketsAlerts({ learnMode }: { learnMode:boolean }) {
 return <div style={{flex:1,overflow:'auto',background:'#F5F6F7',padding:16}}>
  <div style={{width:'100%',display:'grid',gridTemplateColumns:'minmax(0,1.65fr) minmax(300px,.75fr)',gap:14}}>
   <div style={{background:'#FFFFFF',border:'1px solid #D8DDE3'}}>
    <div style={{padding:'14px 16px',borderBottom:'1px solid #E7EAED',display:'flex',alignItems:'center'}}>
     <div><div style={{fontSize:14,fontWeight:600,color:'#1F2933'}}>Alerts</div><div style={{fontSize:11,color:'#7A8590',marginTop:2}}>Get notified when something you care about changes.</div></div>
     <button style={{marginLeft:'auto',height:28,padding:'0 10px',border:0,borderRadius:3,background:'#173B57',color:'#fff',fontSize:11,fontWeight:500,display:'flex',alignItems:'center',gap:5,cursor:'pointer'}}><Plus size={11}/> New alert</button>
    </div>
    {[['NVDA above $145','Price alert','Active'],['NVDA earnings','Event reminder','Tomorrow'],['TSLA moves 5% in a day','Percent move','Active'],['AAPL unusual volume','Volume alert','Active']].map(([a,b,c])=><div key={a} style={{padding:'11px 14px',borderBottom:'1px solid #E7EAED',display:'grid',gridTemplateColumns:'1fr 120px 80px',alignItems:'center'}}><div style={{fontSize:12,color:'#1F2933',fontWeight:500}}>{a}</div><div style={{fontSize:11,color:'#7A8590'}}>{b}</div><div style={{fontSize:11,color:c==='Active'?'#16834B':'#A76A13',fontWeight:600}}>{c}</div></div>)}
   </div>
   <div style={{display:'flex',flexDirection:'column',gap:12}}>
    {learnMode&&<BeginnerTip title="Use alerts instead of staring at charts">An alert watches a condition for you. Beginners can use price, earnings, and percentage-move alerts instead of constantly checking the market.</BeginnerTip>}
    <div style={{background:'#FFFFFF',border:'1px solid #D8DDE3',padding:14}}>
     <div style={{fontSize:12,fontWeight:600,color:'#1F2933',marginBottom:8}}>Suggested alerts for beginners</div>
     {['Earnings reminders','5% daily moves','Watchlist news','Price reaches your planned buy level'].map(x=><div key={x} style={{fontSize:12,color:'#5F6B76',padding:'8px 0',borderBottom:'1px solid #E7EAED'}}>{x}</div>)}
    </div>
   </div>
  </div>
 </div>;
}

function TradingWorkspace({ navigate }: { navigate: (s: Screen) => void }) {
  const [view, setView] = useState<MarketView>("overview");
  const [learnMode, setLearnMode] = useState(true);
  return <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, minHeight:0, background:'#F5F6F7' }}>
    <MarketHeader view={view} setView={setView} learnMode={learnMode} setLearnMode={setLearnMode}/>
    {view === 'overview' && <MarketsOverview setView={setView} learnMode={learnMode} navigate={navigate}/>} 
    {view === 'chart' && <MarketsChart navigate={navigate} learnMode={learnMode}/>} 
    {view === 'screener' && <MarketsScreener learnMode={learnMode}/>} 
    {view === 'research' && <MarketsResearch learnMode={learnMode} navigate={navigate}/>} 
    {view === 'calendar' && <MarketsCalendar learnMode={learnMode}/>} 
    {view === 'alerts' && <MarketsAlerts learnMode={learnMode}/>} 
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALL OTHER SCREENS (unchanged from previous implementation)
// ═══════════════════════════════════════════════════════════════════════════════

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ activeSection, navigate }: {
  activeSection: Screen;
  navigate: (s: Screen) => void;
}) {
  const nav = [
    { id: "dashboard" as Screen, label: "Dashboard", icon: LayoutDashboard },
    { id: "markets" as Screen, label: "Markets", icon: TrendingUp },
    { id: "portfolio" as Screen, label: "Account value", icon: Briefcase },
    { id: "news" as Screen, label: "News", icon: Newspaper },
    { id: "journal-trade" as Screen, label: "Journal", icon: BookOpen },
    { id: "atlas-ai" as Screen, label: "Atlas AI", icon: Bot },
    { id: "learn" as Screen, label: "Learn", icon: GraduationCap },
    { id: "tournaments" as Screen, label: "Challenges", icon: Trophy },
  ];

  return (
    <div className="hidden sm:flex flex-col flex-shrink-0" style={{ width: 220, background: "#FFFFFF", borderRight: "1px solid #D8DDE3", height: "100%" }}>
      <div className="px-4 py-4 flex items-center gap-2.5" style={{ borderBottom: "1px solid #E7EAED" }}>
        <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#173B57" }}>
          <BarChart2 size={13} color="#fff" />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: "#173B57", letterSpacing: "-0.01em" }}>Atlas</div>
          <div className="text-xs" style={{ color: "#7A8590" }}>Investing Platform</div>
        </div>
      </div>

      <div className="px-3 py-2" style={{ borderBottom: "1px solid #E7EAED" }}>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: "#EDFAF4" }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#16834B" }} />
          <span className="text-xs font-medium" style={{ color: "#16834B" }}>Market Open</span>
          <span className="text-xs ml-auto" style={{ color: "#7A8590" }}>4h 22m</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {nav.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              className="w-full flex items-center gap-2.5 px-3 text-sm transition-all duration-100"
              style={{
                height: 38,
                borderRadius: 3,
                background: active ? "#EEF4F8" : "transparent",
                color: active ? "#173B57" : "#5F6B76",
                fontWeight: active ? 500 : 400,
                borderLeft: active ? "3px solid #246B9C" : "3px solid transparent",
                paddingLeft: active ? 9 : 12,
              }}
              onMouseEnter={e => !active && ((e.currentTarget as HTMLButtonElement).style.background = "#F5F6F7")}
              onMouseLeave={e => !active && ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
            >
              <Icon size={15} />
              {label}
              {id === "tournaments" && (
                <span className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: "#173B57", color: "#fff", fontSize: "10px" }}>3</span>
              )}
            </button>
          );
        })}
      </nav>

      <SidebarUser />
    </div>
  );
}

function SidebarUser() {
  const { user, signOut } = useAuth();
  const initials = user?.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "?";
  const firstName = user?.name.split(" ")[0] ?? "User";
  return (
    <div className="px-3 py-3" style={{ borderTop: "1px solid #E7EAED" }}>
      <div className="flex items-center gap-2.5 px-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: "#EEF4F8", color: "#173B57" }}>{initials}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate" style={{ color: "#1F2933" }}>{firstName}</div>
          <div className="text-xs truncate" style={{ color: "#7A8590" }}>Paper Account</div>
        </div>
        <button
          onClick={signOut}
          title="Sign out"
          className="transition-colors"
          style={{ color: "#7A8590" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#1F2933"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#7A8590"}
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Market ticker bar ─────────────────────────────────────────────────────────
function TickerBar() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="flex-shrink-0 overflow-hidden" style={{ background: "#FFFFFF", borderBottom: "1px solid #E7EAED", height: 32 }}>
      <style>{`@keyframes ticker-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.ticker-track{display:flex;animation:ticker-scroll 60s linear infinite;width:max-content}.ticker-track:hover{animation-play-state:paused}`}</style>
      <div className="ticker-track h-full items-center flex">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0 px-4 h-full" style={{ borderRight: "1px solid #F0F2F4" }}>
            <span className="text-xs font-medium" style={{ color: "#1F2933", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{item.label}</span>
            <span className="text-xs" style={{ color: "#5F6B76", fontVariantNumeric: "tabular-nums" }}>{item.value}</span>
            <span className="text-xs font-medium" style={{ color: item.change >= 0 ? "#16834B" : "#C93636", fontVariantNumeric: "tabular-nums" }}>
              {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Top header ────────────────────────────────────────────────────────────────
function TopHeader({ title }: { title: string }) {
  return (
    <div className="hidden sm:flex flex-shrink-0 items-center gap-4 px-5" style={{ height: 52, background: "#FFFFFF", borderBottom: "1px solid #D8DDE3" }}>
      <div className="flex-1 text-sm font-medium" style={{ color: "#1F2933" }}>{title}</div>
      <div className="flex items-center gap-1 px-3" style={{ height: 32, background: "#F5F6F7", border: "1px solid #D8DDE3", borderRadius: 3, width: 220 }}>
        <Search size={13} style={{ color: "#7A8590", flexShrink: 0 }} />
        <input
          placeholder="Search stocks, ETFs, news..."
          className="flex-1 bg-transparent text-xs outline-none"
          style={{ color: "#1F2933" }}
        />
      </div>
      <button className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 3, border: "1px solid #D8DDE3", background: "#FFFFFF", color: "#5F6B76", cursor: "pointer" }}>
        <Bell size={15} />
      </button>
    </div>
  );
}

// ── Mobile bottom nav ─────────────────────────────────────────────────────────
function BottomNav({ activeSection, navigate }: { activeSection: Screen; navigate: (s: Screen) => void }) {
  const items = [
    { id: "dashboard" as Screen, label: "Home", icon: LayoutDashboard },
    { id: "markets" as Screen, label: "Markets", icon: TrendingUp },
    { id: "news" as Screen, label: "News", icon: Newspaper },
    { id: "portfolio" as Screen, label: "Account", icon: Briefcase },
    { id: "atlas-ai" as Screen, label: "Atlas AI", icon: Bot },
  ];
  return (
    <nav className="sm:hidden flex-shrink-0 flex items-center justify-around" style={{ borderTop: "1px solid #D8DDE3", background: "#FFFFFF", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {items.map(({ id, label, icon: Icon }) => {
        const active = activeSection === id;
        return (
          <button
            key={id}
            onClick={() => navigate(id)}
            className="flex flex-col items-center gap-0.5 flex-1 py-2.5 transition-colors"
            style={{ color: active ? "#173B57" : "#7A8590" }}
          >
            <Icon size={19} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function DashboardScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] ?? "there";
  const miniData = [{ v: 11800 }, { v: 11950 }, { v: 11850 }, { v: 12100 }, { v: 12050 }, { v: 12200 }, { v: 12350 }, { v: 12450 }];
  return (
    <div className="flex-1 overflow-y-auto w-full px-4 sm:px-6 xl:px-8 2xl:px-10 py-4 sm:py-6 space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Welcome back, {firstName}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Mon, Oct 28, 2025 · Paper trading account</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary/40 transition-colors shadow-sm"><Bell size={14} className="text-muted-foreground" /></button>
          <button className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary/40 transition-colors shadow-sm"><RefreshCw size={14} className="text-muted-foreground" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 bg-card rounded border border-border p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Account Value</p>
              <div className="text-3xl font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>$12,450.00</div>
              <div className="flex items-center gap-1 mt-1.5">
                <ArrowUpRight size={13} className="text-green-700" />
                <span className="text-xs font-medium text-green-700">+$142.50</span>
                <span className="text-xs font-medium text-green-700">(+1.16%)</span>
                <span className="text-xs text-muted-foreground ml-1">today</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Available Cash</p>
              <p className="text-lg font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>$2,140.25</p>
              <p className="text-xs text-muted-foreground">of $10,000 initial</p>
            </div>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={miniData}><Line type="monotone" dataKey="v" stroke="#246B9C" strokeWidth={1.5} dot={false} /></LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="xl:col-span-4 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3">
          {[
            { label: "Today's P&L", value: "+$142.50", sub: "+1.16% · 4 positions", pos: true },
            { label: "Win Rate", value: "68%", sub: "17 wins of 25 trades", pos: null },
            { label: "Best Trade", value: "+$342", sub: "TSLA · Oct 14", pos: true },
          ].map(({ label, value, sub, pos }) => (
            <div key={label} className="bg-card rounded border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-xl font-medium" style={{ color: pos === true ? "#16834B" : pos === false ? "#C93636" : "#1F2933", fontVariantNumeric: "tabular-nums" }}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Find a Stock", sub: "Search, chart, and trade", icon: TrendingUp, screen: "markets" as Screen, accent: "#246B9C" },
          { label: "Join a Challenge", sub: "Practice against 247 other investors", icon: Trophy, screen: "tournaments" as Screen, accent: "#173B57" },
          { label: "Ask Atlas AI", sub: "Analyze your trades and positions", icon: Bot, screen: "atlas-ai" as Screen, accent: "#16834B" },
          { label: "Trade Journal", sub: "Record your thesis. Build your track record", icon: BookOpen, screen: "journal-trade" as Screen, accent: "#A76A13" },
        ].map(({ label, sub, icon: Icon, screen, accent }) => (
          <button key={label} onClick={() => navigate(screen)} className="bg-card rounded border border-border p-4 text-left transition-colors"
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#F5F6F7"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"}
          >
            <div className="w-7 h-7 rounded flex items-center justify-center mb-3" style={{ background: `${accent}18` }}>
              <Icon size={14} style={{ color: accent }} />
            </div>
            <div className="text-sm font-medium text-foreground leading-tight mb-1">{label}</div>
            <div className="text-xs text-muted-foreground leading-snug">{sub}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-card rounded border border-border">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Market Snapshot</h3>
            <p className="text-xs text-muted-foreground">Major indices · Oct 28</p>
          </div>
          {[["S&P 500", "5,712.40", "+0.48%"], ["NASDAQ", "18,014.20", "+0.92%"], ["DOW", "42,550.10", "+0.16%"], ["VIX", "17.42", "-1.20%"]].map(([name, val, chg]) => (
            <div key={name} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-background transition-colors">
              <div className="text-sm font-medium text-foreground">{name}</div>
              <div className="text-right">
                <div className="text-sm font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{val}</div>
                <div className="text-xs font-medium" style={{ color: chg.startsWith("+") ? "#16834B" : "#C93636", fontVariantNumeric: "tabular-nums" }}>{chg}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-card rounded border border-border">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Top Movers</h3>
              <p className="text-xs text-muted-foreground">Highest volume · Today</p>
            </div>
            <button onClick={() => navigate("markets")} className="text-xs font-medium flex items-center gap-1" style={{ color: "#246B9C" }}>All <ArrowRight size={11} /></button>
          </div>
          {stocks.map((s) => (
            <button key={s.symbol} onClick={() => navigate("markets")} className="w-full flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-background transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-medium" style={{ background: "#EEF4F8", color: "#24577A" }}>{s.symbol.slice(0, 2)}</div>
                <div className="text-left">
                  <div className="text-sm font-medium text-foreground">{s.symbol}</div>
                  <div className="text-xs text-muted-foreground">{s.vol} vol</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>${s.price.toFixed(2)}</div>
                <div className="text-xs font-medium" style={{ color: s.changePct >= 0 ? "#16834B" : "#C93636", fontVariantNumeric: "tabular-nums" }}>{fmtPct(s.changePct)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Buy ────────────────────────────────────────────────────────────────────────
function BuyScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [shares, setShares] = useState(2);
  const price = 142.65;
  const total = shares * price;
  const buyingPower = 2140.25;
  const remaining = buyingPower - total;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <button onClick={() => navigate("markets")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"><ChevronLeft size={14} /> NVDA</button>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-foreground">Buy NVDA</h1>
          <span className="px-2.5 py-1 text-xs font-bold rounded-md" style={{ background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" }}>PAPER TRADE</span>
        </div>
        <div className="bg-card rounded border border-border p-5 mb-3">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
            <div className="w-9 h-9 rounded flex items-center justify-center text-sm font-medium" style={{ background: "#EEF4F8", color: "#24577A" }}>NV</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">NVIDIA Corporation</div>
              <div className="text-xs text-muted-foreground">NVDA · NASDAQ · Technology</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>$142.65</div>
              <div className="text-xs font-medium" style={{ color: "#16834B" }}>+1.23% today</div>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground block mb-2">Number of Shares</label>
            <div className="flex items-center gap-4">
              <button onClick={() => setShares(Math.max(1, shares - 1))} className="w-10 h-10 rounded bg-muted border border-border flex items-center justify-center hover:bg-background active:scale-95 transition-all"><Minus size={14} className="text-foreground" /></button>
              <div className="flex-1 text-center text-3xl font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{shares}</div>
              <button onClick={() => setShares(shares + 1)} className="w-10 h-10 rounded bg-muted border border-border flex items-center justify-center hover:bg-background active:scale-95 transition-all"><Plus size={14} className="text-foreground" /></button>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground block mb-2">Order Type</label>
            <div className="bg-muted rounded border border-border px-3 py-2.5 flex items-center justify-between cursor-pointer">
              <span className="text-sm text-foreground">Market Order</span>
              <ChevronDown size={12} className="text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2.5 pt-4 border-t border-border">
            {[["Price per share", `$${price.toFixed(2)}`], ["Shares", `${shares}`], ["Commission", "Free"]].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm"><span className="text-muted-foreground">{l}</span><span className="font-medium text-foreground">{v}</span></div>
            ))}
            <div className="flex justify-between pt-2.5 border-t border-border">
              <span className="font-medium text-foreground text-sm">Estimated Total</span>
              <span className="font-medium text-foreground text-lg" style={{ fontVariantNumeric: "tabular-nums" }}>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="bg-card rounded border border-border p-4 mb-4">
          <div className="flex justify-between text-sm mb-2"><span className="text-muted-foreground">Available cash</span><span className="font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>${buyingPower.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm mb-3"><span className="text-muted-foreground">After this trade</span><span className="font-medium" style={{ color: remaining >= 0 ? "#1F2933" : "#C93636", fontVariantNumeric: "tabular-nums" }}>${remaining.toFixed(2)}</span></div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (total / buyingPower) * 100)}%`, background: "#246B9C" }} />
          </div>
        </div>
        <button onClick={() => navigate("review-order")} className="w-full text-white font-medium py-3 rounded transition-all text-sm" style={{ background: "#173B57" }}>Review Order</button>
      </div>
    </div>
  );
}

// ── Review Order ───────────────────────────────────────────────────────────────
function ReviewOrderScreen({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <button onClick={() => navigate("buy")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"><ChevronLeft size={14} /> Edit Order</button>
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <h1 className="text-xl font-bold text-foreground">Review Order</h1>
          <span className="px-2.5 py-1 text-xs font-bold rounded-md" style={{ background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" }}>PAPER TRADE</span>
        </div>
        <div className="bg-card rounded border border-border p-5 mb-3">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
            <div className="w-9 h-9 rounded flex items-center justify-center text-sm font-medium" style={{ background: "#EEF4F8", color: "#24577A" }}>NV</div>
            <div><div className="font-medium text-foreground">NVIDIA Corporation</div><div className="text-xs text-muted-foreground">Buy order · Market execution</div></div>
          </div>
          <div className="space-y-3">
            {[["Symbol", "NVDA"], ["Action", "Buy"], ["Shares", "2"], ["Order type", "Market Order"], ["Est. price", "$142.65"]].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm"><span className="text-muted-foreground">{l}</span><span className="font-medium text-foreground">{v}</span></div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="font-medium text-foreground">Estimated Cost</span>
              <span className="font-medium text-2xl text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>$285.30</span>
            </div>
          </div>
        </div>
        <div className="bg-card rounded border border-border p-4 mb-3">
          {[["Cash before trade", "$2,140.25"], ["Cash after trade", "$1,854.95"]].map(([l, v]) => (
            <div key={l} className="flex justify-between text-sm mb-2 last:mb-0"><span className="text-muted-foreground">{l}</span><span className="font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{v}</span></div>
          ))}
        </div>
        <div className="flex items-start gap-2.5 rounded p-3 mb-5 text-xs" style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          <span>Simulated paper trade — no real money. All trades are for practice and educational purposes only.</span>
        </div>
        <button onClick={() => navigate("order-filled")} className="w-full text-white font-medium py-3 rounded transition-all text-sm" style={{ background: "#173B57" }}>Place Paper Trade</button>
      </div>
    </div>
  );
}

// ── Order Filled ───────────────────────────────────────────────────────────────
function OrderFilledScreen({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 rounded flex items-center justify-center mx-auto mb-5" style={{ background: "#EDFAF4", border: "1px solid #A7DFBE" }}>
          <CheckCircle size={28} style={{ color: "#16834B" }} />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Order Filled</h1>
        <p className="text-sm text-muted-foreground mb-6">2 shares of NVDA purchased at $142.65. Your portfolio has been updated.</p>
        <div className="bg-card rounded border border-border p-5 mb-5 text-left">
          <div className="grid grid-cols-2 gap-3">
            {[["Symbol", "NVDA", ""], ["Shares", "2", ""], ["Price", "$142.65", ""], ["Total", "$285.30", ""], ["Cash remaining", "$1,854.95", ""], ["Status", "Filled", ""]].map(([l, v, _]) => (
              <div key={l}><p className="text-xs text-muted-foreground mb-0.5">{l}</p><p className="text-sm font-medium" style={{ color: l === "Status" ? "#16834B" : "#1F2933", fontVariantNumeric: "tabular-nums" }}>{v}</p></div>
            ))}
          </div>
        </div>
        <div className="space-y-2.5">
          <button onClick={() => navigate("journal-trade")} className="w-full text-white font-medium py-3 rounded transition-all flex items-center justify-center gap-2 text-sm" style={{ background: "#173B57" }}><BookOpen size={14} /> Journal This Trade</button>
          <button onClick={() => navigate("portfolio")} className="w-full bg-card border border-border text-foreground font-medium py-3 rounded transition-all text-sm hover:bg-background">View Account Value</button>
        </div>
      </div>
    </div>
  );
}

// ── Journal Trade ──────────────────────────────────────────────────────────────
function JournalTradeScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [thesis, setThesis] = useState("NVDA breaking out above $140 resistance on strong AI chip demand. Multiple upcoming catalysts: Q3 earnings next month and Blackwell GPU production ramp announcement. Position sized small — treating as a learning trade.");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(4);
  const [activeTags, setActiveTags] = useState(["Technology", "AI", "Breakout"]);
  const allTags = ["Technology", "AI", "Breakout", "Earnings Play", "Momentum", "Growth", "Long-term", "Sector Rotation"];
  const toggle = (tag: string) => setActiveTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <button onClick={() => navigate("order-filled")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"><ChevronLeft size={14} /> Order Confirmation</button>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-foreground">Trade Journal</h1>
          <span className="text-xs text-muted-foreground">Oct 28, 2025</span>
        </div>
        <div className="bg-card rounded border border-border p-4 mb-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-medium flex-shrink-0" style={{ background: "#EEF4F8", color: "#24577A" }}>NV</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground">NVDA — Bought 2 shares @ $142.65</div>
            <div className="text-xs text-muted-foreground">$285.30 total · Oct 28, 2025 · Paper account</div>
          </div>
        </div>
        <div className="bg-card rounded border border-border p-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Trade Thesis</label>
            <textarea value={thesis} onChange={e => setThesis(e.target.value)} rows={4} className="w-full bg-muted border border-border rounded px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none transition-colors" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map(tag => (
                <button key={tag} onClick={() => toggle(tag)} className="px-2.5 py-1 rounded text-xs font-medium transition-all" style={activeTags.includes(tag) ? { background: "#173B57", color: "#fff" } : { background: "#F5F6F7", border: "1px solid #D8DDE3", color: "#5F6B76" }}>{tag}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Conviction (1–5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(s => <button key={s} onClick={() => setRating(s)} className="active:scale-90 transition-transform"><Star size={22} className={s <= rating ? "text-amber-500 fill-amber-500" : "text-border"} /></button>)}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Exit Plan & Risk Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-muted border border-border rounded px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none transition-colors" placeholder="Target price, stop-loss level, what would invalidate this thesis…" />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => navigate("trade-review")} className="flex-1 text-white font-medium py-3 rounded transition-all text-sm" style={{ background: "#173B57" }}>Save Entry</button>
          <button onClick={() => navigate("atlas-ai")} className="bg-card border border-border text-foreground font-medium py-3 px-4 rounded transition-all flex items-center gap-1.5 text-sm hover:bg-background"><Bot size={14} style={{ color: "#246B9C" }} /> Ask Atlas</button>
        </div>
      </div>
    </div>
  );
}

// ── Trade Review ───────────────────────────────────────────────────────────────
function TradeReviewScreen({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <button onClick={() => navigate("journal-trade")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"><ChevronLeft size={14} /> Journal</button>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground">Trade Review</h1>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-md"><CheckCircle size={12} /> Saved</div>
      </div>
      <div className="bg-card rounded border border-border p-4 mb-3">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded flex items-center justify-center text-sm font-medium" style={{ background: "#EEF4F8", color: "#24577A" }}>NV</div>
            <div><div className="font-medium text-foreground">NVDA</div><div className="text-xs text-muted-foreground">NVIDIA Corporation</div></div>
          </div>
          <div className="text-right"><div className="text-xl font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>$285.30</div><div className="text-xs text-muted-foreground">2 shares @ $142.65</div></div>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[["Action", "Buy", "#246B9C"], ["Date", "Oct 28", "#1F2933"], ["Account", "Paper", "#A76A13"], ["Current P&L", "+$0.00", "#16834B"]].map(([l, v, c]) => (
            <div key={l}><p className="text-xs text-muted-foreground mb-0.5">{l}</p><p className="text-sm font-medium" style={{ color: c }}>{v}</p></div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded border border-border p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">Trade Thesis</h3>
          <div className="flex items-center gap-1">{[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= 4 ? "text-amber-500 fill-amber-500" : "text-border"} />)}</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">NVDA breaking out above $140 resistance on strong AI chip demand. Multiple upcoming catalysts: Q3 earnings next month and Blackwell GPU production ramp announcement.</p>
        <div className="flex flex-wrap gap-1.5">{["Technology", "AI", "Breakout"].map(tag => <span key={tag} className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: "#EEF4F8", color: "#246B9C" }}>{tag}</span>)}</div>
      </div>
      <div className="rounded border p-4 mb-4" style={{ background: "#EEF4F8", borderColor: "#B3D4E8", borderLeft: "3px solid #246B9C" }}>
        <div className="flex items-center gap-2 mb-2"><Bot size={13} style={{ color: "#246B9C" }} /><span className="text-xs font-medium" style={{ color: "#173B57" }}>Atlas Analysis</span></div>
        <p className="text-xs text-muted-foreground leading-relaxed">Solid thesis with clear catalysts. Trade is sized appropriately for a learning position. Key risk: NVDA trades at a premium valuation — any forward guidance cut could result in a sharp pullback. Watch $138.50 support.</p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => navigate("atlas-ai")} className="flex-1 bg-card border border-border text-foreground font-medium py-3 rounded transition-all flex items-center justify-center gap-1.5 text-sm hover:bg-background"><Bot size={14} style={{ color: "#246B9C" }} /> Ask Atlas</button>
        <button onClick={() => navigate("markets")} className="flex-1 text-white font-medium py-3 rounded transition-all flex items-center justify-center gap-1.5 text-sm" style={{ background: "#173B57" }}><TrendingUp size={14} /> Track Position</button>
      </div>
    </div>
  );
}

// ── Atlas AI ───────────────────────────────────────────────────────────────────
function AtlasAIScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "You have an open NVDA position — 2 shares at $142.65, currently flat. What do you want to analyze? I can walk through the trade thesis, risk levels, technical setup, or help you think through your exit." },
  ]);
  const [typing, setTyping] = useState(false);
  const prompts = ["Why is NVDA up today?", "What's my downside risk?", "Should I hold or set a stop loss?", "What's my exit strategy?"];

  const send = (text: string) => {
    if (!text.trim() || typing) return;
    setMsgs(p => [...p, { role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const resp = AI_RESPONSES[text] || "Good question. Based on your current NVDA position, the setup looks constructive — hold with a stop at $136. Earnings in 3 weeks are the key event risk.";
      setMsgs(p => [...p, { role: "ai", text: resp }]);
      setTyping(false);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-3 flex-shrink-0 bg-card">
        <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#EEF4F8" }}><Bot size={14} style={{ color: "#246B9C" }} /></div>
        <div><h2 className="text-sm font-semibold text-foreground">Atlas Research Assistant</h2><p className="text-xs text-muted-foreground">NVDA context · Paper trade active</p></div>
        <div className="ml-auto flex items-center gap-2">
          <div className="bg-muted border border-border rounded px-3 py-1.5 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:bg-background transition-colors">
            <span>NVDA position</span><ChevronDown size={11} />
          </div>
        </div>
      </div>
      <div className="px-5 py-2 border-b border-border flex items-center gap-3 flex-shrink-0 flex-wrap" style={{ background: "#EEF4F8" }}>
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#246B9C" }}><Info size={11} /><span>Context:</span></div>
        {["NVDA · 2 shares · $142.65 entry", "Paper account · +$0.00 unrealized", "Thesis: AI demand / breakout play"].map(ctx => (
          <span key={ctx} className="text-xs border rounded px-2 py-0.5" style={{ color: "#5F6B76", borderColor: "#D8DDE3", background: "#FFFFFF" }}>{ctx}</span>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "ai" && <div className="w-6 h-6 rounded flex items-center justify-center mr-2 flex-shrink-0 mt-0.5" style={{ background: "#EEF4F8" }}><Bot size={11} style={{ color: "#246B9C" }} /></div>}
            <div className="max-w-[78%] px-4 py-3 text-sm leading-relaxed rounded" style={m.role === "user" ? { background: "#173B57", color: "#fff" } : { background: "#FFFFFF", border: "1px solid #E7EAED", color: "#1F2933" }}>{m.text}</div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded flex items-center justify-center mr-2 flex-shrink-0" style={{ background: "#EEF4F8" }}><Bot size={11} style={{ color: "#246B9C" }} /></div>
            <div className="rounded border px-4 py-3" style={{ background: "#FFFFFF", borderColor: "#E7EAED" }}>
              <div className="flex gap-1.5 items-center">{[0, 160, 320].map(d => <div key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#7A8590", animationDelay: `${d}ms` }} />)}</div>
            </div>
          </div>
        )}
      </div>
      {msgs.length <= 1 && !typing && (
        <div className="px-5 pb-2 flex-shrink-0 bg-background">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Suggested questions</p>
          <div className="flex flex-wrap gap-1.5">
            {prompts.map(p => <button key={p} onClick={() => send(p)} className="text-xs rounded px-3 py-1.5 transition-all hover:bg-background" style={{ background: "#F5F6F7", border: "1px solid #D8DDE3", color: "#5F6B76" }}>{p}</button>)}
          </div>
        </div>
      )}
      <div className="px-5 pb-5 pt-3 border-t border-border flex-shrink-0 bg-background">
        <div className="flex items-center gap-2.5 bg-card rounded border border-border px-3 py-2.5 focus-within:border-primary/50 transition-colors">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)} placeholder="Ask about your trade, NVDA, or investing concepts…" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
          <button onClick={() => send(input)} disabled={!input.trim() || typing} className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90" style={{ background: "#173B57" }}><Send size={11} className="text-white" /></button>
        </div>
      </div>
    </div>
  );
}

// ── Challenges ────────────────────────────────────────────────────────────────
function TournamentsScreen({ navigate, joined }: { navigate: (s: Screen) => void; joined: boolean }) {
  const [countdown] = useState({ d: 6, h: 14, m: 22, s: 8 });
  const tournamentCards = [
    { id: "tech", icon: Cpu, label: "Tech Stock Challenge", sub: "Technology stocks only · 7 days", status: "IN PROGRESS", participants: 247, funds: "$10K", accentColor: "#246B9C" },
    { id: "longterm", icon: Calendar, label: "Long-Term Investor", sub: "Any stocks · 30 days", status: "JOIN NOW", participants: 189, funds: "$25K", accentColor: "#173B57" },
    { id: "smallacc", icon: Wallet, label: "Small Account", sub: "Any stocks · 14 days", status: "JOIN NOW", participants: 312, funds: "$2K", accentColor: "#16834B" },
    { id: "etf", icon: PieChart, label: "ETF Challenge", sub: "ETFs only · 7 days", status: "STARTS SOON", participants: 134, funds: "$15K", accentColor: "#A76A13" },
  ];
  const pastResults = [
    { name: "Growth Stocks Challenge", rank: 12, of: 189, ret: "+6.4%", date: "Nov 2024" },
    { name: "ETF Index Battle", rank: 8, of: 134, ret: "+3.1%", date: "Oct 2024" },
    { name: "Blue Chip Classic", rank: 24, of: 201, ret: "-1.2%", date: "Sep 2024" },
  ];

  return (
    <div className="flex-1 overflow-y-auto w-full px-6 xl:px-8 2xl:px-10 py-6">
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-xl font-bold text-foreground">Challenges</h1><p className="text-xs text-muted-foreground mt-0.5">Practice investing, compare results, and learn without risking real money.</p></div>
        <span className="text-xs font-medium px-2 py-0.5 rounded border" style={{ background: "#EEF4F8", color: "#246B9C", borderColor: "#B3D4E8" }}>4 challenges available</span>
      </div>

      <div className="bg-card border border-border rounded mb-4 px-4 py-3.5">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="text-sm font-medium text-foreground">How challenges work</div>
            <div className="text-xs text-muted-foreground mt-1">Practice competitions — no real money involved.</div>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 flex-1">
            {[
              ["1", "Pick a challenge", "Choose one with rules you understand."],
              ["2", "Get practice money", "Every player starts with the same balance."],
              ["3", "Build a portfolio", "Buy allowed investments during the challenge."],
              ["4", "Compare results", "Your gain or loss determines your ranking."],
            ].map(([n, title, desc]) => (
              <div key={n} className="flex gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-medium flex-shrink-0" style={{ background: "#EEF4F8", color: "#246B9C" }}>{n}</div>
                <div><div className="text-[11px] font-medium text-foreground">{title}</div><div className="text-[10px] text-muted-foreground leading-4 mt-0.5">{desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded mb-5" style={{ background: "#FFFFFF", border: "1px solid #D8DDE3", borderTop: "3px solid #173B57" }}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#C93636" }} />
                  <span className="text-xs font-medium" style={{ color: "#C93636" }}>LIVE</span>
                </div>
                <span className="text-xs text-muted-foreground">Tech Stock Challenge · Week 1</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Tech Stock Challenge</h2>
              <p className="text-sm mt-0.5 text-muted-foreground">Technology stocks only · $10,000 practice balance · 7 days</p>
            </div>
            <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#EEF4F8" }}>
              <Cpu size={17} style={{ color: "#246B9C" }} />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={11} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Ends in</span>
            {[{ val: countdown.d, label: "d" }, { val: countdown.h, label: "h" }, { val: countdown.m, label: "m" }, { val: countdown.s, label: "s" }].map(({ val, label }) => (
              <span key={label} className="text-foreground font-medium text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>{String(val).padStart(2, "0")}<span className="text-muted-foreground font-normal">{label} </span></span>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[{ label: "Participants", value: joined ? "248" : "247" }, { label: "Your Place", value: joined ? "#5" : "—" }, { label: "Your Gain/Loss", value: joined ? "+2.85%" : "—" }, { label: "Starting Balance", value: "$10,000" }].map(({ label, value }) => (
              <div key={label} className="rounded p-3" style={{ background: "#F5F6F7", border: "1px solid #E7EAED" }}>
                <div className="text-xs mb-1 text-muted-foreground">{label}</div>
                <div className="text-sm font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</div>
              </div>
            ))}
          </div>
          <div className="mb-4 rounded overflow-hidden" style={{ background: "#FAFBFC", border: "1px solid #E7EAED" }}>
            <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
              <span className="text-xs text-muted-foreground">Your challenge account · {joined ? "D1–D6" : "Not joined"}</span>
              {joined && <span className="text-xs font-medium" style={{ color: "#16834B" }}>+$285.30</span>}
            </div>
            <div className="h-16 px-1 pb-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TOURNEY_CHART} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
                  <defs><linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#246B9C" stopOpacity={0.15} /><stop offset="95%" stopColor="#246B9C" stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="v" stroke="#246B9C" strokeWidth={1.5} fill="url(#tGrad)" dot={false} />
                  <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #D8DDE3", borderRadius: 3, fontSize: 10, color: "#1F2933" }} formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          {joined ? (
            <div className="flex gap-2">
              <button onClick={() => navigate("leaderboard")} className="flex-1 font-medium py-2.5 rounded text-sm transition-all" style={{ background: "#173B57", color: "#fff" }}>View Rankings</button>
              <button onClick={() => navigate("tech-challenge")} className="font-medium py-2.5 px-4 rounded text-sm transition-all bg-card border border-border hover:bg-background text-foreground">Details</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => navigate("join-tournament")} className="flex-1 font-medium py-2.5 rounded text-sm transition-all" style={{ background: "#173B57", color: "#fff" }}>Join Challenge</button>
              <button onClick={() => navigate("leaderboard")} className="font-medium py-2.5 px-4 rounded text-sm transition-all bg-card border border-border hover:bg-background text-foreground">Rankings</button>
              <button onClick={() => navigate("tech-challenge")} className="font-medium py-2.5 px-4 rounded text-sm transition-all bg-card border border-border hover:bg-background text-foreground">Rules</button>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Available Challenges</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3 mb-6">
        {tournamentCards.map(({ id, icon: Icon, label, sub, status, participants, funds, accentColor }) => (
          <button key={id} onClick={() => id === "tech" ? navigate("tech-challenge") : undefined} className="bg-card rounded border border-border p-4 text-left transition-all relative overflow-hidden hover:bg-background">
            <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: accentColor }} />
            <div className="pl-2">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#EEF4F8" }}><Icon size={15} style={{ color: accentColor }} /></div>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={status === "IN PROGRESS" ? { background: "#FEF2F2", color: "#C93636", border: "1px solid #FCA5A5" } : status === "JOIN NOW" ? { background: "#EDFAF4", color: "#16834B", border: "1px solid #A7DFBE" } : { background: "#FFFBEB", color: "#A76A13", border: "1px solid #FDE68A" }}>{status}</span>
              </div>
              <div className="text-sm font-medium text-foreground leading-tight mb-0.5">{label}</div>
              <div className="text-xs text-muted-foreground mb-3">{sub}</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Users size={10} />{participants}</span><span>{funds} simulated</span></div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-card rounded border border-border mb-5">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div><h2 className="text-sm font-semibold text-foreground">Tech Challenge · Top Rankings</h2><p className="text-xs text-muted-foreground">Current standings · 247 participants</p></div>
          <button onClick={() => navigate("leaderboard")} className="text-xs font-medium flex items-center gap-1 hover:opacity-80" style={{ color: "#246B9C" }}>See all <ArrowRight size={11} /></button>
        </div>
        {LEADERBOARD.slice(0, 5).map(p => {
          const rs = rankStyle(p.rank);
          return (
            <div key={p.rank} className={`flex items-center px-4 py-3 border-b border-border last:border-0 ${(p as any).isUser ? "bg-blue-50/60" : "hover:bg-background"} transition-colors`}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0" style={p.rank <= 3 ? { background: rs.bg, color: rs.text } : { color: "#9AA4B2" }}>
                {p.rank <= 3 ? p.rank : `#${p.rank}`}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-semibold ${(p as any).isUser ? "text-primary" : "text-foreground"}`}>{p.name}</span>
                {(p as any).isUser && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${p.ret >= 0 ? "text-green-600" : "text-red-500"}`}>{fmtPct(p.ret)}</div>
                <div className="text-xs text-muted-foreground">${(p.value / 1000).toFixed(1)}K</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded border border-border p-4 mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">My Challenge Results</h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[{ label: "Challenges joined", value: "3" }, { label: "Average gain/loss", value: "+4.2%" }, { label: "Best place", value: "#8" }].map(({ label, value }) => (
            <div key={label} className="bg-muted rounded p-3 text-center"><div className="text-lg font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>
          ))}
        </div>
        <h3 className="text-xs font-medium text-muted-foreground mb-2">Past challenges</h3>
        <div className="space-y-2">
          {pastResults.map(({ name, rank, of, ret, date }) => (
            <div key={name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div><div className="text-sm font-medium text-foreground">{name}</div><div className="text-xs text-muted-foreground">#{rank} of {of} · {date}</div></div>
              <div className="text-sm font-medium" style={{ color: ret.startsWith("+") ? "#16834B" : "#C93636", fontVariantNumeric: "tabular-nums" }}>{ret}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tech Challenge ─────────────────────────────────────────────────────────────
function TechChallengeScreen({ navigate, joined }: { navigate: (s: Screen) => void; joined: boolean }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <button onClick={() => navigate("tournaments")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"><ChevronLeft size={14} /> Challenges</button>
      <div className="overflow-hidden rounded mb-5" style={{ background: "#FFFFFF", border: "1px solid #D8DDE3", borderTop: "3px solid #173B57" }}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#C93636" }} />
                  <span className="text-xs font-medium" style={{ color: "#C93636" }}>LIVE</span>
                </div>
              </div>
              <h1 className="text-xl font-semibold text-foreground mb-1">Tech Stock Challenge</h1>
              <p className="text-sm text-muted-foreground">Technology stocks only · 7 days · $10,000 practice balance</p>
            </div>
            <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#EEF4F8" }}><Cpu size={17} style={{ color: "#246B9C" }} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ label: "Participants", value: "247" }, { label: "Time Left", value: "6d 14h" }, { label: "Cost to join", value: "Free" }].map(({ label, value }) => (
              <div key={label} className="rounded p-2.5 text-center" style={{ background: "#F5F6F7", border: "1px solid #E7EAED" }}><div className="text-sm font-medium text-foreground">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-card rounded border border-border p-5 mb-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Challenge Rules</h3>
        <div className="space-y-2.5">
          {["Start with $10,000 in practice money — no real money.", "Trade technology sector stocks and ETFs only.", "Maximum 5 open positions at any time.", "No short selling or options in this challenge.", "Challenge closes at market open on Nov 4."].map((rule, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5" style={{ background: "#EEF4F8", color: "#246B9C" }}>{i + 1}</div>
              {rule}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded border border-border p-5 mb-5">
        <h3 className="text-sm font-medium text-foreground mb-3">Recognition</h3>
        <div className="space-y-2.5">
          {[{ tier: "1st place", reward: "Gold badge and a top finish on your profile" }, { tier: "2nd–3rd place", reward: "Silver or bronze badge" }, { tier: "Top 10%", reward: "Top 10% badge and saved challenge result" }, { tier: "All finishers", reward: "Completion badge and a simple performance review" }].map(({ tier, reward }) => (
            <div key={tier} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <Award size={13} className="text-muted-foreground flex-shrink-0" />
              <div><div className="text-sm font-medium text-foreground">{tier}</div><div className="text-xs text-muted-foreground">{reward}</div></div>
            </div>
          ))}
        </div>
      </div>
      {joined ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 rounded p-3.5" style={{ background: "#EDFAF4", border: "1px solid #A7DFBE" }}>
            <CheckCircle size={15} style={{ color: "#16834B" }} className="flex-shrink-0" />
            <span className="text-sm font-medium" style={{ color: "#16834B" }}>You joined the challenge. Your $10,000 practice balance is ready.</span>
          </div>
          <button onClick={() => navigate("leaderboard")} className="w-full text-white font-medium py-3 rounded transition-all text-sm" style={{ background: "#173B57" }}>View Rankings</button>
        </div>
      ) : (
        <button onClick={() => navigate("join-tournament")} className="w-full text-white font-medium py-3 rounded transition-all text-sm" style={{ background: "#173B57" }}>Join Challenge</button>
      )}
    </div>
  );
}

// ── Join Tournament ────────────────────────────────────────────────────────────
function JoinTournamentScreen({ navigate, onJoin }: { navigate: (s: Screen) => void; onJoin: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const handleJoin = () => { setConfirmed(true); onJoin(); setTimeout(() => navigate("leaderboard"), 1600); };

  if (confirmed) return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded flex items-center justify-center mx-auto mb-5" style={{ background: "#EEF4F8", border: "1px solid #B3D4E8" }}><Trophy size={26} style={{ color: "#173B57" }} /></div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">You are in.</h2>
        <p className="text-sm text-muted-foreground">Welcome to the Tech Stock Challenge. Your $10,000 practice account is ready.</p>
        <p className="text-xs text-muted-foreground mt-4">Taking you to the rankings...</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <button onClick={() => navigate("tech-challenge")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"><ChevronLeft size={14} /> Tech Stock Challenge</button>
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-foreground mb-1">Join the Challenge</h1>
        <p className="text-sm text-muted-foreground mb-5">Review the details below, then join. You will only use practice money.</p>
        <div className="bg-card rounded border border-border p-5 mb-4">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
            <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: "#EEF4F8" }}><Cpu size={16} style={{ color: "#246B9C" }} /></div>
            <div><div className="font-medium text-foreground">Tech Stock Challenge</div><div className="text-xs text-muted-foreground">7 days · Technology stocks only</div></div>
          </div>
          <div className="space-y-2.5">
            {[["Starting balance", "$10,000 practice money"], ["Cost to join", "Free"], ["Duration", "7 days · ends Nov 4"], ["Participants", "247 → 248 with you"], ["What you can buy", "Technology stocks and ETFs"], ["Money type", "Practice money — no real money"]].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm"><span className="text-muted-foreground">{l}</span><span className="font-medium text-foreground">{v}</span></div>
            ))}
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded p-3 mb-5 text-xs" style={{ background: "#EEF4F8", border: "1px solid #B3D4E8", color: "#246B9C" }}>
          <Zap size={13} className="flex-shrink-0 mt-0.5" />
          <span>This challenge uses practice money only. Nothing here can spend or lose real money.</span>
        </div>
        <button onClick={handleJoin} className="w-full text-white font-medium py-3 rounded transition-all text-sm" style={{ background: "#173B57" }}>Join Challenge</button>
        <button onClick={() => navigate("tech-challenge")} className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors py-2">Cancel</button>
      </div>
    </div>
  );
}

// ── Rankings ────────────────────────────────────────────────────────────────
function RankingsScreen({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <button onClick={() => navigate("tech-challenge")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"><ChevronLeft size={14} /> Tech Stock Challenge</button>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-xl font-bold text-foreground">Rankings</h1><p className="text-xs text-muted-foreground mt-0.5">Tech Stock Challenge · 248 traders · 6d 14h remaining</p></div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-1.5 shadow-sm"><Clock size={11} /> Updates automatically</div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {LEADERBOARD.slice(0, 3).map(p => {
          const rs = rankStyle(p.rank);
          return (
            <div key={p.rank} className="bg-card rounded border p-4 text-center" style={{ borderColor: p.rank === 1 ? "#A76A13" : "#D8DDE3" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mx-auto mb-2" style={{ background: rs.bg, color: rs.text }}>{p.rank}</div>
              <div className="text-xs font-medium text-foreground truncate">{p.name}</div>
              <div className="text-sm font-medium mt-1" style={{ color: p.ret >= 0 ? "#16834B" : "#C93636", fontVariantNumeric: "tabular-nums" }}>{fmtPct(p.ret)}</div>
              <div className="text-xs text-muted-foreground">${(p.value / 1000).toFixed(1)}K</div>
            </div>
          );
        })}
      </div>
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="grid px-4 py-2.5 border-b border-border bg-muted text-xs font-medium text-muted-foreground" style={{ gridTemplateColumns: "32px 1fr 72px 80px 60px 48px 52px" }}>
          {["#", "Participant", "Gain/Loss", "Account Value", "Today", "Trades", "Risk"].map(h => <div key={h} className={h === "#" || h === "Participant" ? "" : "text-right"}>{h}</div>)}
        </div>
        {LEADERBOARD.map(p => {
          const rs = rankStyle(p.rank);
          return (
            <div key={p.rank} className="grid px-4 py-3 border-b border-border last:border-0 items-center hover:bg-background transition-colors"
              style={{ gridTemplateColumns: "32px 1fr 72px 80px 60px 48px 52px", background: (p as any).isUser ? "#EEF4F8" : "", borderLeft: (p as any).isUser ? "3px solid #246B9C" : "" }}>
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium" style={p.rank <= 3 ? { background: rs.bg, color: rs.text } : { color: "#7A8590" }}>{p.rank}</div>
              </div>
              <div>
                <span className="text-sm font-medium" style={{ color: (p as any).isUser ? "#246B9C" : "#1F2933" }}>{p.name}</span>
                {(p as any).isUser && <span className="ml-1.5 text-xs font-medium" style={{ background: "#EEF4F8", color: "#246B9C", padding: "1px 5px", borderRadius: 3 }}>you</span>}
              </div>
              <div className="text-sm font-medium text-right" style={{ color: p.ret >= 0 ? "#16834B" : "#C93636", fontVariantNumeric: "tabular-nums" }}>{fmtPct(p.ret)}</div>
              <div className="text-sm font-medium text-foreground text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtUSD(p.value)}</div>
              <div className="text-xs font-medium text-right" style={{ color: p.today >= 0 ? "#16834B" : "#C93636", fontVariantNumeric: "tabular-nums" }}>{fmtPct(p.today)}</div>
              <div className="text-xs font-medium text-muted-foreground text-right">{p.trades}</div>
              <div className="text-right"><span className={`text-xs font-medium px-1.5 py-0.5 rounded ${riskColor(p.risk)}`}>{p.risk}</span></div>
            </div>
          );
        })}
      </div>
      <button onClick={() => navigate("markets")} className="w-full mt-4 text-white font-medium py-3 rounded transition-all text-sm" style={{ background: "#173B57" }}>Start Investing</button>
    </div>
  );
}

// ── News / Market Intelligence ────────────────────────────────────────────────
type NewsImpact = "Bullish" | "Bearish" | "Mixed" | "Neutral";
type NewsCategory = "For You" | "Markets" | "Companies" | "Economy" | "Earnings" | "Technology";

type NewsStory = {
  id: number;
  headline: string;
  summary: string;
  source: string;
  time: string;
  tickers: string[];
  category: Exclude<NewsCategory, "For You">;
  relevance: "IN YOUR PORTFOLIO" | "WATCHLIST" | "MARKET-WIDE" | "SECTOR";
  impact: NewsImpact;
  level: "Low" | "Medium" | "High";
  horizon: "Immediate" | "Short Term" | "Long Term";
  why: string;
  happened: string;
  affected: { symbol: string; direction: "up" | "down" | "mixed" }[];
  watch: string[];
};

const MARKET_NEWS: NewsStory[] = [
  {
    id: 1,
    headline: "NVIDIA demand outlook strengthens as hyperscalers expand AI infrastructure budgets",
    summary: "Large cloud providers are signaling another step-up in AI infrastructure spending, keeping demand expectations elevated for data-center GPUs and networking.",
    source: "Reuters",
    time: "18 min ago",
    tickers: ["NVDA", "MSFT", "AMZN"],
    category: "Technology",
    relevance: "WATCHLIST",
    impact: "Bullish",
    level: "High",
    horizon: "Short Term",
    happened: "Cloud spending plans point to continued heavy investment in AI compute capacity.",
    why: "NVDA is on your watchlist, while MSFT is in your portfolio. Stronger AI infrastructure demand can support revenue expectations across both semiconductor and cloud businesses.",
    affected: [{ symbol: "NVDA", direction: "up" }, { symbol: "MSFT", direction: "up" }, { symbol: "AMD", direction: "up" }],
    watch: ["Hyperscaler capex guidance", "Blackwell shipment timing", "Data-center gross margins"],
  },
  {
    id: 2,
    headline: "Fed officials keep rate cuts on the table as inflation data continues to cool",
    summary: "Policymakers indicated that future cuts remain possible if inflation keeps moving toward target without a sharp deterioration in employment.",
    source: "Bloomberg",
    time: "42 min ago",
    tickers: ["SPY", "QQQ"],
    category: "Economy",
    relevance: "MARKET-WIDE",
    impact: "Bullish",
    level: "High",
    horizon: "Immediate",
    happened: "The Fed left investors with a path toward lower rates if upcoming inflation and labor data cooperate.",
    why: "Lower expected interest rates can raise the value investors place on future earnings, which matters especially for the technology-heavy names in your portfolio and watchlist.",
    affected: [{ symbol: "QQQ", direction: "up" }, { symbol: "MSFT", direction: "up" }, { symbol: "AAPL", direction: "up" }],
    watch: ["Next CPI report", "Jobs data", "Treasury yields"],
  },
  {
    id: 3,
    headline: "Apple services growth offsets softer hardware demand ahead of next product cycle",
    summary: "Recurring services revenue remains a key support for margins as investors wait for the next major iPhone and device refresh cycle.",
    source: "Wall Street Journal",
    time: "1 hr ago",
    tickers: ["AAPL"],
    category: "Earnings",
    relevance: "IN YOUR PORTFOLIO",
    impact: "Mixed",
    level: "Medium",
    horizon: "Short Term",
    happened: "Services performed well, but hardware demand remained less consistent.",
    why: "AAPL is one of your current holdings. Services strength can stabilize earnings and margins, but weaker hardware growth may cap upside until the next product cycle accelerates.",
    affected: [{ symbol: "AAPL", direction: "mixed" }],
    watch: ["iPhone unit demand", "Services margin", "China revenue trends"],
  },
  {
    id: 4,
    headline: "Tesla shares jump as autonomous driving rollout expands to additional U.S. markets",
    summary: "The company broadened access to its latest driver-assistance software, renewing investor focus on software revenue and long-term autonomy economics.",
    source: "CNBC",
    time: "2 hr ago",
    tickers: ["TSLA"],
    category: "Companies",
    relevance: "WATCHLIST",
    impact: "Bullish",
    level: "Medium",
    horizon: "Long Term",
    happened: "Tesla expanded availability of its newest autonomous driving software features.",
    why: "TSLA is on your watchlist. Greater adoption could improve the market's expectations for high-margin software revenue, but regulatory and execution risk remain important.",
    affected: [{ symbol: "TSLA", direction: "up" }],
    watch: ["Paid adoption rate", "Regulatory response", "Safety intervention data"],
  },
  {
    id: 5,
    headline: "S&P 500 advances as megacap technology leads a broad risk-on session",
    summary: "Major indexes moved higher with technology and communication-services stocks leading, while market breadth improved from the prior session.",
    source: "MarketWatch",
    time: "2 hr ago",
    tickers: ["SPY", "QQQ", "META"],
    category: "Markets",
    relevance: "MARKET-WIDE",
    impact: "Bullish",
    level: "Medium",
    horizon: "Immediate",
    happened: "Large-cap technology led gains while participation broadened across the market.",
    why: "Your portfolio has meaningful exposure to large-cap technology. Broader participation makes a tech-led rally healthier than one driven by only one or two stocks.",
    affected: [{ symbol: "SPY", direction: "up" }, { symbol: "QQQ", direction: "up" }, { symbol: "META", direction: "up" }],
    watch: ["Market breadth", "VIX", "10-year Treasury yield"],
  },
  {
    id: 6,
    headline: "Amazon accelerates data-center investment as cloud AI demand remains strong",
    summary: "AWS infrastructure spending is rising as customers deploy more generative-AI workloads and reserve additional compute capacity.",
    source: "Financial Times",
    time: "3 hr ago",
    tickers: ["AMZN", "NVDA"],
    category: "Technology",
    relevance: "WATCHLIST",
    impact: "Bullish",
    level: "Medium",
    horizon: "Long Term",
    happened: "Amazon is increasing infrastructure investment to meet higher cloud and AI demand.",
    why: "AMZN and NVDA are on your watchlist. Higher AWS capex can pressure near-term free cash flow, but it also signals confidence in long-term AI and cloud demand.",
    affected: [{ symbol: "AMZN", direction: "mixed" }, { symbol: "NVDA", direction: "up" }],
    watch: ["AWS growth rate", "Capital expenditure", "Free-cash-flow guidance"],
  },
  {
    id: 7,
    headline: "Oil prices rise after supply concerns tighten the near-term crude outlook",
    summary: "Energy markets moved higher as traders weighed tighter supply expectations against still-moderate global demand growth.",
    source: "Associated Press",
    time: "4 hr ago",
    tickers: ["XLE"],
    category: "Markets",
    relevance: "SECTOR",
    impact: "Mixed",
    level: "Low",
    horizon: "Short Term",
    happened: "Crude prices increased as near-term supply expectations tightened.",
    why: "You do not currently have direct energy exposure, but sustained oil inflation can affect transportation costs, consumer spending, and the Fed's inflation outlook.",
    affected: [{ symbol: "XLE", direction: "up" }, { symbol: "SPY", direction: "mixed" }],
    watch: ["WTI above recent resistance", "OPEC commentary", "Gasoline inflation"],
  },
];

function impactTone(impact: NewsImpact) {
  if (impact === "Bullish") return { bg: "#EDFAF4", text: "#16834B", border: "#A7DFBE" };
  if (impact === "Bearish") return { bg: "#FEF2F2", text: "#C93636", border: "#FCA5A5" };
  if (impact === "Mixed") return { bg: "#FFFBEB", text: "#A76A13", border: "#FDE68A" };
  return { bg: "#F5F6F7", text: "#7A8590", border: "#D8DDE3" };
}

function relevanceTone(relevance: NewsStory["relevance"]) {
  if (relevance === "IN YOUR PORTFOLIO") return { bg: "#EEF4F8", text: "#246B9C", border: "#B3D4E8" };
  if (relevance === "WATCHLIST") return { bg: "#EEF4F8", text: "#24577A", border: "#B3D4E8" };
  if (relevance === "SECTOR") return { bg: "#FFFBEB", text: "#A76A13", border: "#FDE68A" };
  return { bg: "#F5F6F7", text: "#7A8590", border: "#D8DDE3" };
}

function NewsScreen() {
  const [category, setCategory] = useState<NewsCategory>("For You");
  const [expanded, setExpanded] = useState<number | null>(1);
  const [saved, setSaved] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const categories: NewsCategory[] = ["For You", "Markets", "Companies", "Economy", "Earnings", "Technology"];

  const filtered = MARKET_NEWS.filter(story => {
    const categoryMatch = category === "For You" || story.category === category;
    const q = query.trim().toLowerCase();
    const queryMatch = !q || story.headline.toLowerCase().includes(q) || story.summary.toLowerCase().includes(q) || story.tickers.some(t => t.toLowerCase().includes(q));
    return categoryMatch && queryMatch;
  });

  const toggleSaved = (id: number) => setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full px-6 xl:px-8 2xl:px-10 py-6">
        <div className="flex items-start justify-between gap-6 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-foreground">Market Intelligence</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#151D2D", color: "#9AB5FF", border: "1px solid #2D416F" }}>ATLAS AI</span>
            </div>
            <p className="text-xs text-muted-foreground">Market-moving news, personalized to your portfolio and watchlist.</p>
          </div>
          <div className="relative w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search news or tickers"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm text-foreground outline-none focus:border-primary/50 shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {categories.map(c => {
            const active = category === c;
            return (
              <button key={c} onClick={() => setCategory(c)} className="px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all" style={active ? { background: "#EEF4F8", color: "#173B57", border: "1px solid #B3D4E8" } : { background: "#FFFFFF", color: "#5F6B76", border: "1px solid #D8DDE3" }}>
                {c}
              </button>
            );
          })}
        </div>

        <button className="w-full mb-5 rounded border border-border bg-card px-4 py-3 flex items-center gap-3 text-left hover:bg-background transition-colors">
          <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#EEF4F8" }}><Sparkles size={14} style={{ color: "#246B9C" }} /></div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground">Atlas Research Brief</div>
            <div className="text-xs text-muted-foreground mt-0.5">Summarize the market news most likely to affect your portfolio and watchlist today.</div>
          </div>
          <ArrowRight size={13} className="text-muted-foreground" />
        </button>

        <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
          <div className="bg-card rounded border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-foreground">{category === "For You" ? "Top stories for you" : category}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Ranked by market importance and relevance to your investments</div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><RefreshCw size={11} /> Updated just now</div>
            </div>

            {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No stories match your search.</div>}
            {filtered.map((story, idx) => {
              const rel = relevanceTone(story.relevance);
              const impact = impactTone(story.impact);
              const isOpen = expanded === story.id;
              const isSaved = saved.includes(story.id);
              return (
                <article key={story.id} className="px-4 py-4 border-b border-border last:border-0 hover:bg-background transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5 text-[11px] font-medium w-5 text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{String(idx + 1).padStart(2, "0")}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: rel.bg, color: rel.text, border: `1px solid ${rel.border}` }}>{story.relevance}</span>
                        {story.tickers.map(t => <span key={t} className="text-[10px] font-medium" style={{ color: "#246B9C" }}>{t}</span>)}
                        <span className="text-[10px] text-muted-foreground">· {story.source} · {story.time}</span>
                      </div>
                      <button onClick={() => setExpanded(isOpen ? null : story.id)} className="text-left w-full group">
                        <h2 className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">{story.headline}</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{story.summary}</p>
                      </button>

                      <div className="flex items-center gap-3 mt-3">
                        <button onClick={() => setExpanded(isOpen ? null : story.id)} className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#246B9C" }}><Sparkles size={10} /> Why this matters <ChevronDown size={10} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} /></button>
                        <button onClick={() => toggleSaved(story.id)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"><Bookmark size={10} fill={isSaved ? "currentColor" : "none"} /> {isSaved ? "Saved" : "Save"}</button>
                        <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"><Share2 size={10} /> Share</button>
                      </div>

                      {isOpen && (
                        <div className="mt-3 rounded border overflow-hidden" style={{ borderColor: "#B3D4E8", borderLeft: "3px solid #246B9C" }}>
                          <div className="px-4 py-3 flex items-center justify-between border-b border-border" style={{ background: "#EEF4F8" }}>
                            <div className="flex items-center gap-2"><Sparkles size={12} style={{ color: "#246B9C" }} /><span className="text-xs font-medium" style={{ color: "#173B57" }}>Why this matters to you</span></div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: impact.bg, color: impact.text, border: `1px solid ${impact.border}` }}>{story.impact}</span>
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-card border border-border text-muted-foreground">{story.level}</span>
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-card border border-border text-muted-foreground">{story.horizon}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-0" style={{ background: "#FFFFFF" }}>
                            <div className="p-4 border-r border-border">
                              <div className="text-[10px] font-medium uppercase tracking-wider mb-1.5 text-muted-foreground">What happened</div>
                              <p className="text-xs text-foreground leading-relaxed">{story.happened}</p>
                            </div>
                            <div className="p-4">
                              <div className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "#246B9C" }}>Impact on your investments</div>
                              <p className="text-xs text-foreground leading-relaxed">{story.why}</p>
                            </div>
                          </div>
                          <div className="px-4 py-3 border-t border-border flex items-start justify-between gap-6" style={{ background: "#FAFBFC" }}>
                            <div>
                              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Potentially affected</div>
                              <div className="flex items-center gap-2">
                                {story.affected.map(a => <span key={a.symbol} className="text-xs font-medium" style={{ color: a.direction === "up" ? "#16834B" : a.direction === "down" ? "#C93636" : "#A76A13" }}>{a.symbol} {a.direction === "up" ? "↑" : a.direction === "down" ? "↓" : "↔"}</span>)}
                              </div>
                            </div>
                            <div className="flex-1 max-w-md">
                              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">What to watch</div>
                              <div className="flex flex-wrap gap-1.5">{story.watch.map(w => <span key={w} className="text-[10px] px-2 py-0.5 rounded border text-muted-foreground" style={{ background: "#F5F6F7", borderColor: "#D8DDE3" }}>{w}</span>)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="space-y-4 sticky top-6">
            <div className="bg-card rounded border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border"><h3 className="text-xs font-medium text-foreground">Your news exposure</h3><p className="text-[11px] text-muted-foreground mt-0.5">Why Atlas is prioritizing these stories</p></div>
              <div className="p-4 space-y-3">
                {[
                  { ticker: "AAPL", label: "In portfolio", count: 3 },
                  { ticker: "MSFT", label: "In portfolio", count: 4 },
                  { ticker: "NVDA", label: "Watchlist", count: 6 },
                  { ticker: "TSLA", label: "Watchlist", count: 2 },
                  { ticker: "AMZN", label: "Watchlist", count: 3 },
                  { ticker: "META", label: "Watchlist", count: 2 },
                ].map(x => (
                  <div key={x.ticker} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-medium" style={{ background: "#EEF4F8", color: "#24577A" }}>{x.ticker.slice(0,2)}</div>
                    <div className="flex-1"><div className="text-xs font-medium text-foreground">{x.ticker}</div><div className="text-[10px] text-muted-foreground">{x.label}</div></div>
                    <div className="text-[10px] font-medium" style={{ color: "#246B9C" }}>{x.count} stories</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded border p-4" style={{ background: "#EEF4F8", borderColor: "#B3D4E8", borderLeft: "3px solid #246B9C" }}>
              <div className="flex items-center gap-2 mb-2"><Sparkles size={13} style={{ color: "#246B9C" }} /><span className="text-xs font-medium" style={{ color: "#173B57" }}>Portfolio signal</span></div>
              <p className="text-xs text-muted-foreground leading-relaxed">Technology is driving most of your relevant news today. The biggest shared catalyst is AI infrastructure spending, which affects NVDA, MSFT, AMZN and META.</p>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex justify-between text-[10px] mb-1"><span className="text-muted-foreground">Portfolio news tone</span><span className="font-medium" style={{ color: "#16834B" }}>Moderately bullish</span></div>
                <div className="h-1.5 rounded-full overflow-hidden bg-muted"><div className="h-full rounded-full" style={{ background: "#16834B", width: "68%" }} /></div>
              </div>
            </div>

            <div className="bg-card rounded border border-border p-4">
              <div className="text-xs font-medium text-foreground mb-2">News preferences</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">Atlas ranks stories using your holdings, watchlist, sectors and major market events. It does not hide important news outside your portfolio.</p>
              <button className="text-xs font-medium flex items-center gap-1" style={{ color: "#246B9C" }}>Tune my feed <ArrowRight size={11} /></button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ── Account value ──────────────────────────────────────────────────────────────────
function AccountValueScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [range, setRange] = useState("1M");
  const holdings = [
    { symbol: "NVDA", name: "NVIDIA Corp", shares: 2, price: 142.65, day: 1.84, value: 285.30, cost: 285.30, gain: 0.00, pct: 0.00, weight: 2.6 },
    { symbol: "AAPL", name: "Apple Inc", shares: 15, price: 189.25, day: 0.72, value: 2838.75, cost: 2750.50, gain: 88.25, pct: 3.21, weight: 26.1 },
    { symbol: "MSFT", name: "Microsoft Corp", shares: 8, price: 402.15, day: -0.36, value: 3217.20, cost: 3120.40, gain: 96.80, pct: 3.10, weight: 29.6 },
    { symbol: "GOOGL", name: "Alphabet Inc", shares: 20, price: 165.40, day: 1.15, value: 3308.00, cost: 3240.80, gain: 67.20, pct: 2.07, weight: 30.4 },
  ];
  const perf = [
    { d: "Aug 1", v: 12190 }, { d: "Aug 5", v: 12245 }, { d: "Aug 9", v: 12170 },
    { d: "Aug 13", v: 12315 }, { d: "Aug 17", v: 12405 }, { d: "Aug 21", v: 12370 },
    { d: "Aug 25", v: 12560 }, { d: "Aug 30", v: 12735 },
  ];
  const allocation = [
    { label: "Technology", pct: 73, value: "$7,950.25" },
    { label: "Communication", pct: 16, value: "$1,740.00" },
    { label: "Cash", pct: 11, value: "$1,854.95" },
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#F4F6FA" }}>
      <div className="px-7 pt-6 pb-4 border-b border-border bg-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-semibold text-foreground">Account value</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded border" style={{ color: "#9A6700", background: "#FFF8E6", borderColor: "#F4D28A" }}>PAPER</span>
            </div>
            <p className="text-xs text-muted-foreground">Individual brokerage · Account ending in 4821</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 px-3.5 rounded-md border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-2"><RefreshCw size={13} /> Refresh</button>
            <button onClick={() => navigate("markets")} className="h-9 px-3.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"><Plus size={13} /> Trade</button>
          </div>
        </div>
      </div>

      <div className="w-full px-6 xl:px-8 2xl:px-10 py-6 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <section className="xl:col-span-8 bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total account value</div>
                <div className="flex items-end gap-3">
                  <div className="text-[34px] leading-none font-semibold tracking-tight text-foreground tabular-nums">$12,735.30</div>
                  <div className="pb-0.5 text-sm font-semibold text-green-600">+$285.30 (+2.29%)</div>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">As of Aug 30, 4:16 PM CT</div>
              </div>
              <div className="flex items-center rounded border border-border bg-card p-0.5">
                {["1D","1W","1M","3M","1Y","ALL"].map(r => (
                  <button key={r} onClick={() => setRange(r)} className="px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors" style={range === r ? { background: "#EEF4F8", color: "#173B57" } : { color: "#7A8590" }}>{r}</button>
                ))}
              </div>
            </div>
            <div className="h-64 2xl:h-72 px-2 pb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perf} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="portfolioArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#246B9C" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#246B9C" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#7A8590" }} axisLine={false} tickLine={false} minTickGap={30} />
                  <YAxis hide domain={[12000, 12900]} />
                  <Tooltip contentStyle={{ borderRadius: 3, border: "1px solid #D8DDE3", fontSize: 11, background: "#FFFFFF", color: "#1F2933" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]} />
                  <Area type="monotone" dataKey="v" stroke="#246B9C" strokeWidth={1.5} fill="url(#portfolioArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 border-t border-border">
              {[
                ["Cash available to trade", "$1,854.95"],
                ["Market value", "$10,880.35"],
                ["Day change", "+$118.40"],
                ["Total gain/loss", "+$252.25"],
              ].map(([l,v], i) => (
                <div key={l} className={`px-5 py-4 ${i ? "border-l border-border" : ""}`}>
                  <div className="text-[11px] text-muted-foreground mb-1">{l}</div>
                  <div className={`text-sm font-bold ${l.includes("change") || l.includes("gain") ? "text-green-600" : "text-foreground"}`}>{v}</div>
                </div>
              ))}
            </div>
          </section>

          <aside className="xl:col-span-4 bg-card border border-border rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-foreground">Asset allocation</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Current account mix</div>
              </div>
              <PieChart size={16} className="text-muted-foreground" />
            </div>
            <div className="p-5">
              <div className="h-3 flex rounded-sm overflow-hidden mb-5 bg-muted">
                <div style={{ width: "73%", background: "#173B57" }} />
                <div style={{ width: "16%", background: "#246B9C" }} />
                <div style={{ width: "11%", background: "#D8DDE3" }} />
              </div>
              <div className="space-y-4">
                {allocation.map((a, i) => (
                  <div key={a.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: i === 0 ? "#173B57" : i === 1 ? "#246B9C" : "#D8DDE3" }} />
                      <div><div className="text-xs font-semibold text-foreground">{a.label}</div><div className="text-[10px] text-muted-foreground">{a.value}</div></div>
                    </div>
                    <div className="text-xs font-bold text-foreground">{a.pct}%</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-border">
                <div className="flex justify-between text-[11px] mb-2"><span className="text-muted-foreground">Largest position</span><span className="font-semibold text-foreground">GOOGL · 30.4%</span></div>
                <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Positions</span><span className="font-semibold text-foreground">4 stocks</span></div>
              </div>
            </div>
          </aside>
        </div>

        <section className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-foreground">Positions</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Stocks held in this account</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-8 px-3 rounded-md border border-border text-[11px] font-semibold text-foreground hover:bg-muted flex items-center gap-1.5"><Search size={12} /> Search</button>
              <button className="h-8 px-3 rounded-md border border-border text-[11px] font-semibold text-foreground hover:bg-muted flex items-center gap-1.5"><SlidersHorizontal size={12} /> Columns</button>
            </div>
          </div>

          <div className="grid grid-cols-[2.1fr_.8fr_1fr_1fr_1.1fr_1fr_.8fr] px-5 py-2.5 border-b border-border text-[10px] font-medium text-muted-foreground" style={{ background: "#F5F6F7" }}>
            <div>Symbol / Description</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Price</div>
            <div className="text-right">Day</div>
            <div className="text-right">Market value</div>
            <div className="text-right">Gain / Loss</div>
            <div className="text-right">Weight</div>
          </div>

          {holdings.map((h, idx) => (
            <button key={h.symbol} onClick={() => navigate("markets")} className="w-full grid grid-cols-[2.1fr_.8fr_1fr_1fr_1.1fr_1fr_.8fr] px-5 py-3.5 items-center text-left transition-colors border-b border-border last:border-0 hover:bg-background">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded flex items-center justify-center text-[11px] font-medium flex-shrink-0" style={{ background: "#EEF4F8", color: "#24577A" }}>{h.symbol.slice(0,2)}</div>
                <div className="min-w-0"><div className="text-xs font-medium text-foreground">{h.symbol}</div><div className="text-[10px] text-muted-foreground truncate">{h.name}</div></div>
              </div>
              <div className="text-right text-xs font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{h.shares}</div>
              <div className="text-right text-xs font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>${h.price.toFixed(2)}</div>
              <div className="text-right text-xs font-medium" style={{ color: h.day >= 0 ? "#16834B" : "#C93636", fontVariantNumeric: "tabular-nums" }}>{h.day >= 0 ? "+" : ""}{h.day.toFixed(2)}%</div>
              <div className="text-right"><div className="text-xs font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>${h.value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div className="text-[10px] text-muted-foreground">Cost ${h.cost.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>
              <div className="text-right" style={{ color: h.gain >= 0 ? "#16834B" : "#C93636" }}><div className="text-xs font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{h.gain >= 0 ? "+" : ""}${h.gain.toFixed(2)}</div><div className="text-[10px] font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{h.pct >= 0 ? "+" : ""}{h.pct.toFixed(2)}%</div></div>
              <div className="text-right text-xs font-medium text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{h.weight.toFixed(1)}%</div>
            </button>
          ))}

          <div className="px-5 py-3.5 flex items-center justify-between" style={{ background: "#FAFBFC" }}>
            <div className="text-[11px] text-muted-foreground">4 positions · Prices shown are delayed for prototype use</div>
            <button onClick={() => navigate("markets")} className="text-xs font-semibold text-primary flex items-center gap-1">View markets <ArrowRight size={11} /></button>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3"><Wallet size={15} className="text-muted-foreground"/><span className="text-xs font-bold text-foreground">Buying power</span></div>
            <div className="text-xl font-bold text-foreground">$1,854.95</div>
            <div className="text-[11px] text-muted-foreground mt-1">Available for new positions</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3"><Activity size={15} className="text-muted-foreground"/><span className="text-xs font-bold text-foreground">Today's activity</span></div>
            <div className="text-xl font-bold text-green-600">+$118.40</div>
            <div className="text-[11px] text-muted-foreground mt-1">+0.94% across open positions</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3"><Info size={15} className="text-muted-foreground"/><span className="text-xs font-bold text-foreground">Account status</span></div>
            <div className="text-sm font-bold text-foreground">Good standing</div>
            <div className="text-[11px] text-muted-foreground mt-1">No restrictions · Paper trading enabled</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Learn ──────────────────────────────────────────────────────────────────────
function LearnScreen() {
  const courses = [
    { title: "Stock Market Fundamentals", progress: 80, lessons: 12, sub: "What stocks are, how they trade, and why prices move." },
    { title: "Reading a Price Chart", progress: 45, lessons: 18, sub: "Support, resistance, patterns, and timeframes." },
    { title: "Financial Statements", progress: 20, lessons: 15, sub: "How to read a 10-K, income statement, and balance sheet." },
    { title: "Risk and Position Sizing", progress: 0, lessons: 10, sub: "Why how much you risk matters as much as what you buy." },
  ];
  return (
    <div className="flex-1 overflow-y-auto w-full px-6 xl:px-8 2xl:px-10 py-6">
      <div className="mb-5"><h1 className="text-2xl font-semibold text-foreground">Learn</h1><p className="text-xs text-muted-foreground mt-0.5">Build a foundation before you build a portfolio.</p></div>
      <div className="space-y-3">
        {courses.map(c => (
          <div key={c.title} className="bg-card rounded border border-border p-4 hover:bg-background transition-all cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#EEF4F8" }}><FileText size={14} style={{ color: "#246B9C" }} /></div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1"><div className="text-sm font-medium text-foreground">{c.title}</div><span className="text-xs text-muted-foreground ml-3 flex-shrink-0">{c.lessons} lessons</span></div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{c.sub}</p>
                <div className="h-1 bg-muted rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ background: "#246B9C", width: `${c.progress}%` }} /></div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{c.progress}% complete</span>
                  {c.progress === 0 && <span className="text-xs font-medium" style={{ color: "#246B9C" }}>Start →</span>}
                  {c.progress > 0 && c.progress < 100 && <span className="text-xs font-medium" style={{ color: "#246B9C" }}>Continue →</span>}
                  {c.progress === 100 && <span className="text-xs font-medium" style={{ color: "#16834B" }}>Done</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Active section helper ──────────────────────────────────────────────────────
function getActiveSection(screen: Screen): Screen {
  if (["nvda", "buy", "review-order", "order-filled"].includes(screen)) return "markets";
  if (["trade-review"].includes(screen)) return "journal-trade";
  if (["tech-challenge", "join-tournament", "leaderboard"].includes(screen)) return "tournaments";
  return screen;
}

// ── App ────────────────────────────────────────────────────────────────────────
function AtlasApp() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [tournamentJoined, setTournamentJoined] = useState(false);
  const navigate = (s: Screen) => setScreen(s);

  const renderScreen = () => {
    switch (screen) {
      case "dashboard":       return <DashboardScreen navigate={navigate} />;
      case "markets":         return <TradingWorkspace navigate={navigate} />;
      case "nvda":            return <TradingWorkspace navigate={navigate} />;
      case "buy":             return <BuyScreen navigate={navigate} />;
      case "review-order":    return <ReviewOrderScreen navigate={navigate} />;
      case "order-filled":    return <OrderFilledScreen navigate={navigate} />;
      case "journal-trade":   return <JournalTradeScreen navigate={navigate} />;
      case "trade-review":    return <TradeReviewScreen navigate={navigate} />;
      case "atlas-ai":        return <AtlasAIScreen navigate={navigate} />;
      case "tournaments":     return <TournamentsScreen navigate={navigate} joined={tournamentJoined} />;
      case "tech-challenge":  return <TechChallengeScreen navigate={navigate} joined={tournamentJoined} />;
      case "join-tournament": return <JoinTournamentScreen navigate={navigate} onJoin={() => setTournamentJoined(true)} />;
      case "leaderboard":     return <RankingsScreen navigate={navigate} />;
      case "portfolio":       return <AccountValueScreen navigate={navigate} />;
      case "news":            return <NewsScreen />;
      case "learn":           return <LearnScreen />;
      default:                return <DashboardScreen navigate={navigate} />;
    }
  };

  const active = getActiveSection(screen);
  const screenTitles: Partial<Record<Screen, string>> = {
    dashboard: "Dashboard", markets: "Markets", nvda: "Markets", buy: "Trade",
    "review-order": "Review Order", "order-filled": "Order Confirmed",
    "journal-trade": "Trade Journal", "trade-review": "Trade Review",
    "atlas-ai": "Research Assistant", tournaments: "Challenges",
    "tech-challenge": "Tech Stock Challenge", "join-tournament": "Join Challenge",
    leaderboard: "Rankings", portfolio: "Account Value",
    news: "Market News", learn: "Learn",
  };
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F5F6F7" }}>
      <Sidebar activeSection={active} navigate={navigate} />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden" style={{ background: "#F5F6F7" }}>
        <TopHeader title={screenTitles[screen] ?? "Atlas"} />
        <TickerBar />
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {renderScreen()}
        </div>
        <BottomNav activeSection={active} navigate={navigate} />
      </main>
    </div>
  );
}

export default function App() {
  // Skip landing if the user already has an active Supabase session.
  const [showLanding, setShowLanding] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setShowLanding(!session);
    });
  }, []);

  // While we check the session, show the same loading screen AuthGate would show.
  if (showLanding === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F6F7" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#173B57" }}>
            <BarChart2 size={14} color="#fff" />
          </div>
          <span className="text-sm font-medium" style={{ color: "#1F2933" }}>Loading Atlas…</span>
        </div>
      </div>
    );
  }

  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  return (
    <AuthProvider>
      <AuthGate>
        <AtlasApp />
      </AuthGate>
    </AuthProvider>
  );
}