import { useState, useEffect, useRef, useCallback } from "react";
import { BarChart2, ArrowRight, ChevronDown, X, Menu, TrendingUp, BookOpen, Trophy, Bot, Newspaper, Briefcase, Star, Zap, CheckCircle, ArrowUpRight, TrendingDown, Users, Clock, Target, Layers, BarChart, PieChart, MessageSquare, Activity } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface LandingPageProps {
  onEnterApp: () => void;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useScrolled(threshold = 60) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return scrolled;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#0B0E11",
  card: "#111418",
  card2: "#161B22",
  blue: "#2962FF",
  blueHover: "#1a4fd6",
  blueDim: "rgba(41,98,255,0.12)",
  blueBorder: "rgba(41,98,255,0.3)",
  text: "#F1F3F5",
  muted: "#7D8794",
  dim: "#4A5568",
  border: "#252A31",
  green: "#089981",
  red: "#F23645",
  greenDim: "rgba(8,153,129,0.12)",
  redDim: "rgba(242,54,69,0.1)",
} as const;

// ── Reveal wrapper ─────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, inView] = useInView(0.1);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Label chip ─────────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
      style={{ background: C.blueDim, border: `1px solid ${C.blueBorder}`, color: C.blue }}>
      {children}
    </div>
  );
}

// ── Ticker tape ───────────────────────────────────────────────────────────────
const TICKERS = [
  { s: "AAPL", p: "$189.25", c: "+1.2%" }, { s: "NVDA", p: "$142.65", c: "+3.8%" },
  { s: "MSFT", p: "$402.15", c: "+0.9%" }, { s: "TSLA", p: "$248.50", c: "+2.1%" },
  { s: "AMZN", p: "$185.80", c: "+1.4%" }, { s: "META", p: "$512.30", c: "+2.7%" },
  { s: "SPY",  p: "$487.60", c: "+0.6%" }, { s: "QQQ",  p: "$421.30", c: "+1.1%" },
  { s: "GOOGL",p: "$178.40", c: "+1.8%" }, { s: "JPM",  p: "$215.60", c: "-0.3%" },
  { s: "V",    p: "$277.90", c: "+0.7%" }, { s: "BRK.B",p: "$388.10", c: "+0.4%" },
];

function TickerTape() {
  const items = [...TICKERS, ...TICKERS];
  return (
    <div className="overflow-hidden py-2 border-y" style={{ borderColor: C.border, background: "rgba(17,20,24,0.8)" }}>
      <div className="flex gap-6 w-max" style={{ animation: "ticker 40s linear infinite" }}>
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-1 whitespace-nowrap">
            <span className="text-xs font-bold" style={{ color: C.text }}>{t.s}</span>
            <span className="text-xs" style={{ color: C.muted }}>{t.p}</span>
            <span className="text-xs font-semibold" style={{ color: t.c.startsWith("+") ? C.green : C.red }}>
              {t.c}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────
function Nav({ onEnterApp }: { onEnterApp: () => void }) {
  const scrolled = useScrolled(60);
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(11,14,17,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
      }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.blue }}>
            <BarChart2 size={15} color="#fff" />
          </div>
          <span className="text-base font-bold tracking-tight" style={{ color: C.text }}>Atlas</span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 mx-auto">
          {[["Product", "product"], ["How It Works", "how-it-works"], ["Challenges", "challenges"], ["Learn", "learn-section"], ["Atlas AI", "atlas-ai-section"], ["FAQ", "faq"]].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="text-sm transition-colors"
              style={{ color: C.muted }}
              onMouseEnter={e => (e.currentTarget.style.color = C.text)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
              {label}
            </button>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <button onClick={onEnterApp} className="text-sm font-medium transition-colors px-3 py-1.5 rounded-lg"
            style={{ color: C.muted }}
            onMouseEnter={e => (e.currentTarget.style.color = C.text)}
            onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
            Log In
          </button>
          <button onClick={() => scrollTo("waitlist")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: C.blue }}
            onMouseEnter={e => (e.currentTarget.style.background = C.blueHover)}
            onMouseLeave={e => (e.currentTarget.style.background = C.blue)}>
            Join Early Access
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden ml-auto p-2 rounded-lg" style={{ color: C.muted }}
          onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 border-t" style={{ borderColor: C.border, background: "rgba(11,14,17,0.97)" }}>
          <div className="flex flex-col gap-1 pt-3">
            {[["Product", "product"], ["How It Works", "how-it-works"], ["Challenges", "challenges"], ["Learn", "learn-section"], ["Atlas AI", "atlas-ai-section"], ["FAQ", "faq"]].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-sm py-2.5 text-left transition-colors"
                style={{ color: C.muted }}>
                {label}
              </button>
            ))}
            <div className="flex gap-3 pt-3 border-t mt-2" style={{ borderColor: C.border }}>
              <button onClick={onEnterApp} className="flex-1 h-11 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: C.text }}>
                Log In
              </button>
              <button onClick={() => scrollTo("waitlist")}
                className="flex-1 h-11 rounded-lg text-sm font-semibold text-white"
                style={{ background: C.blue }}>
                Join Early Access
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ── Mini product preview components ──────────────────────────────────────────

function MiniChart({ green = true, height = 48 }: { green?: boolean; height?: number }) {
  const color = green ? C.green : C.red;
  const points = green
    ? "0,42 20,38 40,32 60,35 80,28 100,22 120,18 140,14 160,10 180,8 200,4"
    : "0,8 20,12 40,16 60,14 80,20 100,24 120,28 140,26 160,32 180,35 200,40";
  return (
    <svg width="100%" height={height} viewBox={`0 0 200 ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`cg-${green}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      <polygon points={`0,${height} ${points} 200,${height}`} fill={`url(#cg-${green})`} />
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="w-full rounded-xl overflow-hidden text-left" style={{ background: C.card, border: `1px solid ${C.border}`, fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: C.blue }}>
            <BarChart2 size={10} color="#fff" />
          </div>
          <span className="text-xs font-bold" style={{ color: C.text }}>Atlas</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-5 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="w-5 h-5 rounded-full" style={{ background: "rgba(41,98,255,0.2)" }} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Greeting */}
        <div>
          <div className="text-[11px]" style={{ color: C.muted }}>Good morning, Alex</div>
          <div className="text-sm font-bold" style={{ color: C.text }}>Your portfolio is up today</div>
        </div>

        {/* Portfolio value */}
        <div className="rounded-lg p-3" style={{ background: "rgba(41,98,255,0.08)", border: `1px solid ${C.blueBorder}` }}>
          <div className="text-[10px]" style={{ color: C.muted }}>PORTFOLIO VALUE</div>
          <div className="text-xl font-bold mt-0.5" style={{ color: C.text }}>$12,483.20</div>
          <div className="flex items-center gap-1 mt-0.5">
            <ArrowUpRight size={11} color={C.green} />
            <span className="text-xs font-semibold" style={{ color: C.green }}>+$284.50 (+2.34%)</span>
          </div>
          <div className="mt-2">
            <MiniChart green height={36} />
          </div>
        </div>

        {/* Market tiles */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { s: "NVDA", p: "$142.65", c: "+3.8%", g: true },
            { s: "AAPL", p: "$189.25", c: "+1.2%", g: true },
            { s: "TSLA", p: "$248.50", c: "-0.8%", g: false },
          ].map(t => (
            <div key={t.s} className="rounded-lg p-2" style={{ background: C.card2, border: `1px solid ${C.border}` }}>
              <div className="text-[10px] font-bold" style={{ color: C.text }}>{t.s}</div>
              <div className="text-[10px]" style={{ color: C.muted }}>{t.p}</div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: t.g ? C.green : C.red }}>{t.c}</div>
            </div>
          ))}
        </div>

        {/* Watchlist row */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold" style={{ color: C.muted }}>WATCHLIST</div>
          {[
            { s: "MSFT", n: "Microsoft", p: "$402.15", c: "+0.9%", g: true },
            { s: "META", n: "Meta Platforms", p: "$512.30", c: "+2.7%", g: true },
          ].map(t => (
            <div key={t.s} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: C.card2 }}>
              <div>
                <div className="text-[10px] font-bold" style={{ color: C.text }}>{t.s}</div>
                <div className="text-[9px]" style={{ color: C.muted }}>{t.n}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold" style={{ color: C.text }}>{t.p}</div>
                <div className="text-[9px] font-semibold" style={{ color: t.g ? C.green : C.red }}>{t.c}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartPreview() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
        <div>
          <span className="text-xs font-bold" style={{ color: C.text }}>NVDA</span>
          <span className="text-xs ml-2 font-semibold" style={{ color: C.green }}>$142.65 +3.8%</span>
        </div>
        <div className="flex gap-1">
          {["1D","1W","1M"].map((r, i) => (
            <span key={r} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: i === 2 ? C.blue : "transparent", color: i === 2 ? "#fff" : C.muted }}>{r}</span>
          ))}
        </div>
      </div>
      <div className="p-2">
        <MiniChart green height={60} />
      </div>
      <div className="grid grid-cols-4 gap-px" style={{ borderTop: `1px solid ${C.border}` }}>
        {[["Open","138.20"],["High","143.90"],["Low","137.80"],["Vol","42.1M"]].map(([l,v]) => (
          <div key={l} className="px-2 py-1.5 text-center">
            <div className="text-[9px]" style={{ color: C.muted }}>{l}</div>
            <div className="text-[9px] font-semibold" style={{ color: C.text }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIPreview() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="px-3 py-2.5 border-b flex items-center gap-2" style={{ borderColor: C.border }}>
        <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: C.blueDim, border: `1px solid ${C.blueBorder}` }}>
          <Bot size={10} color={C.blue} />
        </div>
        <span className="text-xs font-semibold" style={{ color: C.text }}>Atlas AI</span>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex justify-end">
          <div className="px-2.5 py-1.5 rounded-xl rounded-tr-sm text-[10px] max-w-[80%]" style={{ background: C.blue, color: "#fff" }}>
            Why did NVDA move today?
          </div>
        </div>
        <div className="flex gap-1.5">
          <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: C.blueDim, border: `1px solid ${C.blueBorder}` }}>
            <Bot size={8} color={C.blue} />
          </div>
          <div className="px-2.5 py-1.5 rounded-xl rounded-tl-sm text-[10px] leading-relaxed" style={{ background: C.card2, color: C.muted }}>
            NVIDIA surged after strong earnings data exceeded analyst expectations, driven by continued AI chip demand...
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioPreview() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="px-3 py-2.5 border-b" style={{ borderColor: C.border }}>
        <div className="text-[10px]" style={{ color: C.muted }}>PORTFOLIO VALUE</div>
        <div className="text-base font-bold" style={{ color: C.text }}>$12,483.20</div>
        <div className="text-[10px] font-semibold" style={{ color: C.green }}>+2.34% today</div>
      </div>
      <div className="p-3 space-y-1.5">
        {[
          { s: "NVDA", shares: "10 shares", val: "$1,426.50", alloc: 45, g: true },
          { s: "AAPL", shares: "8 shares",  val: "$1,514.00", alloc: 32, g: true },
          { s: "TSLA", shares: "5 shares",  val: "$1,242.50", alloc: 23, g: false },
        ].map(h => (
          <div key={h.s}>
            <div className="flex justify-between mb-0.5">
              <span className="text-[9px] font-bold" style={{ color: C.text }}>{h.s}</span>
              <span className="text-[9px] font-semibold" style={{ color: h.g ? C.green : C.red }}>{h.val}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: `${h.alloc}%`, background: h.g ? C.green : C.red }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsPreview() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="px-3 py-2.5 border-b flex items-center gap-2" style={{ borderColor: C.border }}>
        <Newspaper size={12} color={C.blue} />
        <span className="text-xs font-semibold" style={{ color: C.text }}>Market Intelligence</span>
      </div>
      <div className="p-3 space-y-2.5">
        {[
          { tag: "AI", title: "NVIDIA tops earnings estimates on AI chip demand", impact: true },
          { tag: "FED", title: "Fed signals rates hold through Q3", impact: false },
          { tag: "TECH", title: "Apple Vision Pro adoption accelerates in enterprise", impact: true },
        ].map((n, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 h-fit mt-0.5"
              style={{ background: C.blueDim, color: C.blue }}>{n.tag}</span>
            <p className="text-[9px] leading-relaxed" style={{ color: C.muted }}>{n.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TournamentsPreview() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
        <div className="flex items-center gap-2">
          <Trophy size={12} color="#F5A623" />
          <span className="text-xs font-semibold" style={{ color: C.text }}>Tech Stock Challenge</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623" }}>LIVE</span>
      </div>
      <div className="p-3 space-y-2">
        {[
          { rank: 1, name: "Alex M.", ret: "+18.4%", you: false },
          { rank: 2, name: "Jordan K.", ret: "+15.7%", you: false },
          { rank: 3, name: "You", ret: "+13.9%", you: true },
          { rank: 4, name: "Sam R.", ret: "+11.2%", you: false },
        ].map(p => (
          <div key={p.rank} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
            style={{ background: p.you ? "rgba(41,98,255,0.12)" : "transparent", border: p.you ? `1px solid ${C.blueBorder}` : "1px solid transparent" }}>
            <span className="text-[9px] w-4 font-bold" style={{ color: p.rank <= 1 ? "#F5A623" : C.muted }}>#{p.rank}</span>
            <span className="text-[9px] flex-1 font-semibold" style={{ color: p.you ? C.blue : C.text }}>{p.name}</span>
            <span className="text-[9px] font-bold" style={{ color: C.green }}>{p.ret}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LearnPreview() {
  const modules = [
    { title: "What is a Stock?", done: true, prog: 100 },
    { title: "How Markets Work", done: true, prog: 100 },
    { title: "Reading a Chart", done: false, prog: 60 },
    { title: "Risk & Reward", done: false, prog: 0 },
  ];
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="px-3 py-2.5 border-b flex items-center gap-2" style={{ borderColor: C.border }}>
        <BookOpen size={12} color={C.blue} />
        <span className="text-xs font-semibold" style={{ color: C.text }}>Learn</span>
      </div>
      <div className="p-3 space-y-2">
        {modules.map(m => (
          <div key={m.title} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: m.done ? C.greenDim : C.card2, border: `1px solid ${m.done ? C.green : C.border}` }}>
              {m.done && <CheckCircle size={9} color={C.green} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-semibold truncate" style={{ color: m.done ? C.muted : C.text }}>{m.title}</div>
              {m.prog > 0 && m.prog < 100 && (
                <div className="h-0.5 rounded-full mt-1" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${m.prog}%`, background: C.blue }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JournalPreview() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
        <span className="text-xs font-semibold" style={{ color: C.text }}>Trade Journal</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: C.greenDim, color: C.green }}>BUY • NVDA</span>
      </div>
      <div className="p-3 space-y-2">
        <div>
          <div className="text-[9px] font-semibold mb-1" style={{ color: C.muted }}>Why I entered this trade</div>
          <div className="text-[9px] leading-relaxed" style={{ color: C.text }}>Strong earnings beat + AI tailwind. Broke resistance at $138. RSI not overbought.</div>
        </div>
        <div>
          <div className="text-[9px] font-semibold mb-1" style={{ color: C.muted }}>What happened</div>
          <div className="text-[9px] leading-relaxed" style={{ color: C.text }}>+$42.50 gain in 3 days. Took profit at $142.65.</div>
        </div>
        <div className="flex gap-2 pt-1">
          <div className="flex-1 text-center py-1 rounded" style={{ background: C.greenDim }}>
            <div className="text-[8px]" style={{ color: C.muted }}>P&L</div>
            <div className="text-[9px] font-bold" style={{ color: C.green }}>+$42.50</div>
          </div>
          <div className="flex-1 text-center py-1 rounded" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="text-[8px]" style={{ color: C.muted }}>Entry</div>
            <div className="text-[9px] font-bold" style={{ color: C.text }}>$138.20</div>
          </div>
          <div className="flex-1 text-center py-1 rounded" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="text-[8px]" style={{ color: C.muted }}>Exit</div>
            <div className="text-[9px] font-bold" style={{ color: C.text }}>$142.65</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TradePreview() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
        <span className="text-xs font-semibold" style={{ color: C.text }}>Buy NVDA</span>
        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold tracking-wide"
          style={{ background: "rgba(41,98,255,0.15)", color: C.blue, border: `1px solid ${C.blueBorder}` }}>
          SIMULATED TRADING
        </span>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[9px]" style={{ color: C.muted }}>Market Price</span>
          <span className="text-xs font-bold" style={{ color: C.text }}>$142.65</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px]" style={{ color: C.muted }}>Shares</span>
          <span className="text-xs font-bold" style={{ color: C.text }}>10</span>
        </div>
        <div className="h-px" style={{ background: C.border }} />
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-semibold" style={{ color: C.muted }}>Order Total</span>
          <span className="text-xs font-bold" style={{ color: C.text }}>$1,426.50</span>
        </div>
        <button className="w-full py-2 rounded-lg text-xs font-bold text-white" style={{ background: C.green }}>
          Place Simulated Order
        </button>
      </div>
    </div>
  );
}

// ── Hero section ──────────────────────────────────────────────────────────────
function HeroSection({ onEnterApp }: { onEnterApp: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const fade = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(24px)",
    transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
  });

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 px-4 overflow-hidden"
      style={{ background: C.bg }}>
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        opacity: 0.3,
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)",
      }} />

      {/* Blue ambient glow */}
      <div className="absolute pointer-events-none" style={{
        width: 700, height: 400, top: "30%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(ellipse, rgba(41,98,255,0.12) 0%, transparent 70%)",
      }} />

      <div className="relative w-full max-w-6xl mx-auto text-center">
        {/* Label */}
        <div style={fade(0)} className="flex justify-center">
          <Label><Zap size={10} />Early Access Now Open</Label>
        </div>

        {/* Headline */}
        <h1 className="font-bold tracking-tight leading-none mb-6" style={{
          ...fade(100),
          fontSize: "clamp(2.5rem, 6vw, 5rem)",
          color: C.text,
          letterSpacing: "-0.02em",
        }}>
          Learn the market.<br />
          <span style={{ color: C.blue }}>Before risking a dollar.</span>
        </h1>

        {/* Sub */}
        <p className="mx-auto mb-8 leading-relaxed max-w-xl" style={{
          ...fade(200),
          fontSize: "clamp(0.95rem, 1.5vw, 1.125rem)",
          color: C.muted,
        }}>
          Atlas turns investing education into a live experience. Explore real markets, practice with simulated money, understand your trades, and compete with other investors.
        </p>

        {/* CTAs */}
        <div style={fade(300)} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
          <button onClick={() => scrollTo("waitlist")}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-all"
            style={{ background: C.blue, fontSize: "0.95rem" }}
            onMouseEnter={e => { e.currentTarget.style.background = C.blueHover; e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.blue; e.currentTarget.style.transform = "scale(1)"; }}>
            Join Early Access
            <ArrowRight size={16} />
          </button>
          <button onClick={onEnterApp}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text, fontSize: "0.95rem" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}>
            See Atlas in Action
          </button>
        </div>

        <p className="text-xs mb-12" style={{ ...fade(380), color: C.dim }}>
          <span style={{ color: C.dim }}>Free early access · No credit card</span>
        </p>

        {/* Product hero frame */}
        <div style={{ ...fade(450), position: "relative" }}>
          {/* Glow under frame */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 pointer-events-none" style={{
            width: "60%", height: 60,
            background: "radial-gradient(ellipse, rgba(41,98,255,0.35) 0%, transparent 70%)",
            filter: "blur(20px)",
          }} />

          {/* Browser chrome */}
          <div className="relative mx-auto rounded-2xl overflow-hidden shadow-2xl"
            style={{
              maxWidth: 900,
              border: `1px solid ${C.border}`,
              boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
            }}>
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ background: "#0D1117", borderBottom: `1px solid ${C.border}` }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "#FF5F57" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#FEBC2E" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#28C840" }} />
              </div>
              <div className="flex-1 mx-4">
                <div className="mx-auto max-w-xs h-6 rounded-md flex items-center px-3 gap-2" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: C.green }} />
                  <span className="text-[10px]" style={{ color: C.dim }}>atlas.app</span>
                </div>
              </div>
            </div>

            {/* App content — faithful Dashboard preview */}
            <div className="flex" style={{ background: C.bg, minHeight: 420 }}>
              {/* Sidebar */}
              <div className="hidden sm:flex flex-col py-4 px-2 gap-1" style={{ width: 56, background: "#0D1117", borderRight: `1px solid ${C.border}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-3" style={{ background: C.blue }}>
                  <BarChart2 size={13} color="#fff" />
                </div>
                {[BarChart2, TrendingUp, Briefcase, BookOpen, Bot, Trophy, Newspaper].map((Icon, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
                    style={{ background: i === 0 ? C.blueDim : "transparent" }}>
                    <Icon size={14} color={i === 0 ? C.blue : C.dim} />
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 overflow-hidden p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold" style={{ color: C.text }}>Good morning, Alex</div>
                    <div className="text-xs" style={{ color: C.muted }}>Markets open · Tue, Oct 28</div>
                  </div>
                  <div className="flex gap-2">
                    {["AAPL +1.2%","NVDA +3.8%","SPY +0.6%"].map(t => (
                      <span key={t} className="hidden lg:block text-[10px] px-2 py-1 rounded-md font-semibold" style={{ background: C.greenDim, color: C.green }}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* Portfolio card + chart */}
                <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs" style={{ color: C.muted }}>Portfolio Value</div>
                      <div className="text-2xl font-bold mt-0.5" style={{ color: C.text }}>$12,483.20</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <ArrowUpRight size={13} color={C.green} />
                        <span className="text-xs font-semibold" style={{ color: C.green }}>+$284.50 (+2.34%)</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {["1D","1W","1M","1Y"].map((r, i) => (
                        <span key={r} className="text-[9px] px-2 py-1 rounded-md"
                          style={{ background: i === 2 ? C.blue : "rgba(255,255,255,0.05)", color: i === 2 ? "#fff" : C.dim }}>{r}</span>
                      ))}
                    </div>
                  </div>
                  <MiniChart green height={64} />
                </div>

                {/* Holdings row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { s: "NVDA", p: "$142.65", c: "+3.8%", g: true },
                    { s: "AAPL", p: "$189.25", c: "+1.2%", g: true },
                    { s: "TSLA", p: "$248.50", c: "-0.8%", g: false },
                  ].map(h => (
                    <div key={h.s} className="rounded-lg p-2.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                      <div className="font-bold text-xs" style={{ color: C.text }}>{h.s}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>{h.p}</div>
                      <div className="text-[10px] font-semibold" style={{ color: h.g ? C.green : C.red }}>{h.c}</div>
                      <MiniChart green={h.g} height={24} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <div className="hidden lg:block absolute -right-4 top-16 w-52" style={{ animation: "float1 4s ease-in-out infinite" }}>
            <ChartPreview />
          </div>
          <div className="hidden lg:block absolute -left-4 top-24 w-48" style={{ animation: "float2 5s ease-in-out infinite" }}>
            <AIPreview />
          </div>
          <div className="hidden lg:block absolute -left-2 bottom-12 w-44" style={{ animation: "float3 4.5s ease-in-out infinite" }}>
            <TournamentsPreview />
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        style={{ animation: "float1 2s ease-in-out infinite", color: C.dim }}>
        <span className="text-[10px] tracking-widest uppercase">Scroll</span>
        <ChevronDown size={14} />
      </div>
    </section>
  );
}

// ── Social hook ───────────────────────────────────────────────────────────────
function SocialHookSection() {
  return (
    <section id="how-it-works" className="py-24 px-4" style={{ background: "#0D1117" }}>
      <div className="max-w-4xl mx-auto text-center">
        <Reveal>
          <p className="text-sm font-medium mb-4" style={{ color: C.muted }}>Investing shouldn't feel like homework.</p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="font-bold mb-6" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", color: C.text, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            School teaches you definitions.<br />
            <span style={{ color: C.blue }}>Atlas lets you use them.</span>
          </h2>
        </Reveal>

        {/* Step flow */}
        <Reveal delay={200}>
          <div className="flex flex-wrap justify-center gap-0 mt-12">
            {[
              { step: "Learn", icon: BookOpen, desc: "Understand concepts" },
              { step: "Research", icon: TrendingUp, desc: "Explore real stocks" },
              { step: "Trade", icon: Activity, desc: "Practice decisions" },
              { step: "Track", icon: BarChart, desc: "Follow performance" },
              { step: "Review", icon: Target, desc: "Journal every move" },
              { step: "Improve", icon: Zap, desc: "Build better habits" },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center">
                <div className="flex flex-col items-center px-4 py-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-2"
                    style={{ background: C.blueDim, border: `1px solid ${C.blueBorder}` }}>
                    <s.icon size={18} color={C.blue} />
                  </div>
                  <div className="text-xs font-bold" style={{ color: C.text }}>{s.step}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>{s.desc}</div>
                </div>
                {i < 5 && <ArrowRight size={14} color={C.dim} className="flex-shrink-0" />}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Feature row ───────────────────────────────────────────────────────────────
function FeatureRow({
  label, headline, body, badge, preview, reverse = false, id,
}: {
  label: string; headline: React.ReactNode; body: string;
  badge?: string; preview: React.ReactNode; reverse?: boolean; id?: string;
}) {
  return (
    <div id={id} className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 py-16`}>
      <Reveal delay={0} className="flex-1 min-w-0">
        <Label>{label}</Label>
        <h3 className="font-bold mb-4 leading-tight" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: C.text, letterSpacing: "-0.02em" }}>
          {headline}
        </h3>
        <p className="leading-relaxed mb-4" style={{ color: C.muted, fontSize: "1rem" }}>{body}</p>
        {badge && (
          <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: C.blueDim, border: `1px solid ${C.blueBorder}`, color: C.blue }}>
            {badge}
          </span>
        )}
      </Reveal>
      <Reveal delay={150} className="flex-1 min-w-0 w-full">
        <div style={{ maxWidth: 480, margin: reverse ? "0 0 0 auto" : "0 auto 0 0" }}>
          {preview}
        </div>
      </Reveal>
    </div>
  );
}

// ── Product section ───────────────────────────────────────────────────────────
function ProductSection() {
  return (
    <section id="product" className="py-16 px-4" style={{ background: C.bg }}>
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <Label><Layers size={10} />The Platform</Label>
          <h2 className="font-bold mt-2" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", color: C.text, letterSpacing: "-0.02em" }}>
            Everything you need to learn the market.<br />One place.
          </h2>
        </Reveal>

        <FeatureRow
          label="Markets"
          headline={<>See what's<br />moving.</>}
          body="Explore stocks, market activity, charts and the stories behind price moves — without jumping between five different apps."
          preview={
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              <div className="p-1" style={{ background: "#0D1117" }}>
                <div className="flex items-center gap-1.5 px-3 py-2">
                  <TrendingUp size={12} color={C.blue} />
                  <span className="text-xs font-semibold" style={{ color: C.text }}>Markets</span>
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded" style={{ background: C.greenDim, color: C.green }}>Open</span>
                </div>
              </div>
              <div className="p-3 space-y-2" style={{ background: C.card }}>
                <ChartPreview />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { name: "S&P 500", val: "4,783.45", c: "+0.6%", g: true },
                    { name: "Nasdaq", val: "16,920.79", c: "+1.1%", g: true },
                    { name: "Dow Jones", val: "37,861.21", c: "+0.3%", g: true },
                    { name: "Russell 2K", val: "2,012.38", c: "-0.2%", g: false },
                  ].map(idx => (
                    <div key={idx.name} className="px-3 py-2 rounded-lg" style={{ background: C.card2, border: `1px solid ${C.border}` }}>
                      <div className="text-[9px]" style={{ color: C.muted }}>{idx.name}</div>
                      <div className="text-xs font-bold" style={{ color: C.text }}>{idx.val}</div>
                      <div className="text-[9px] font-semibold" style={{ color: idx.g ? C.green : C.red }}>{idx.c}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        />

        <FeatureRow
          reverse
          label="Paper Trading"
          headline={<>Make the trade.<br />Without risking<br />the money.</>}
          body="Practice buying and selling with simulated funds so mistakes become lessons instead of losses."
          badge="Simulated Trading Only"
          preview={
            <div className="space-y-3">
              <TradePreview />
              <div className="rounded-xl p-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: C.text }}>Order Confirmed</span>
                  <CheckCircle size={14} color={C.green} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[["Symbol","NVDA"],["Shares","10"],["Cost","$1,426.50"]].map(([l,v]) => (
                    <div key={l}>
                      <div className="text-[9px]" style={{ color: C.muted }}>{l}</div>
                      <div className="text-xs font-bold" style={{ color: C.text }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        />

        <FeatureRow
          label="Portfolio"
          headline={<>See the result.</>}
          body="Track simulated holdings, performance and the decisions behind your portfolio over time."
          preview={<PortfolioPreview />}
        />

        <FeatureRow
          reverse
          label="Trade Journal"
          headline={<>Don't just remember<br />the trade.<br />Understand it.</>}
          body="Record why you entered a trade, review what happened and build better decision-making habits with every position."
          preview={<JournalPreview />}
        />
      </div>
    </section>
  );
}

// ── Atlas AI section ──────────────────────────────────────────────────────────
function AtlasAISection() {
  const prompts = [
    "Why did NVDA move today?",
    "What does a P/E ratio actually mean?",
    "Explain this chart like I'm new to investing.",
    "What's the difference between an ETF and a stock?",
    "Why did my trade go wrong?",
    "Is the market going up or down?",
  ];

  return (
    <section id="atlas-ai-section" className="py-24 px-4" style={{ background: "#0D1117" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <Reveal delay={0} className="flex-1">
            <Label><Bot size={10} />Atlas AI</Label>
            <h2 className="font-bold mb-5 leading-tight" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", color: C.text, letterSpacing: "-0.02em" }}>
              Ask the question you were too embarrassed to ask.
            </h2>
            <p className="mb-8 leading-relaxed" style={{ color: C.muted, fontSize: "1rem" }}>
              Markets are complicated. Atlas AI breaks concepts, companies and market events into language you can actually understand.
            </p>
            <div className="flex flex-wrap gap-2">
              {prompts.map(p => (
                <div key={p} className="px-3 py-2 rounded-xl text-xs font-medium"
                  style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted }}>
                  "{p}"
                </div>
              ))}
            </div>
            <p className="text-xs mt-5" style={{ color: C.dim }}>
              Atlas AI is an educational tool. It does not provide personalized investment advice.
            </p>
          </Reveal>

          <Reveal delay={150} className="flex-1 w-full">
            <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, maxWidth: 480, margin: "0 auto 0 0" }}>
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: C.border }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: C.blueDim, border: `1px solid ${C.blueBorder}` }}>
                  <Bot size={12} color={C.blue} />
                </div>
                <span className="text-sm font-semibold" style={{ color: C.text }}>Atlas AI</span>
                <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full" style={{ background: C.greenDim, color: C.green }}>Active</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-end">
                  <div className="px-3 py-2 rounded-2xl rounded-tr-sm text-sm max-w-[80%]" style={{ background: C.blue, color: "#fff" }}>
                    What does a P/E ratio actually mean?
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-1" style={{ background: C.blueDim, border: `1px solid ${C.blueBorder}` }}>
                    <Bot size={11} color={C.blue} />
                  </div>
                  <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed" style={{ background: C.card2, color: C.muted }}>
                    The P/E ratio (Price-to-Earnings) tells you how much investors are paying for each dollar of profit a company makes. A P/E of 25 means investors pay $25 for every $1 of earnings. Higher P/E can signal growth expectations — or that a stock is expensive. Compare it within the same sector for context.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="px-3 py-2 rounded-2xl rounded-tr-sm text-sm max-w-[80%]" style={{ background: C.blue, color: "#fff" }}>
                    Is NVDA's P/E high right now?
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-1" style={{ background: C.blueDim, border: `1px solid ${C.blueBorder}` }}>
                    <Bot size={11} color={C.blue} />
                  </div>
                  <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed" style={{ background: C.card2, color: C.muted }}>
                    NVIDIA's P/E is elevated relative to the broader market, which often reflects high growth expectations tied to AI infrastructure spending. Whether it's "too high" depends on whether that growth materializes...
                  </div>
                </div>
                {/* Input */}
                <div className="flex gap-2 pt-2">
                  <div className="flex-1 h-10 rounded-xl px-3 flex items-center text-sm" style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.dim }}>
                    Ask Atlas anything...
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.blue }}>
                    <ArrowRight size={14} color="#fff" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── News section ──────────────────────────────────────────────────────────────
function NewsSection() {
  return (
    <section className="py-24 px-4" style={{ background: C.bg }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <Reveal delay={150} className="flex-1 w-full order-1 lg:order-none">
            <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, maxWidth: 520 }}>
              {/* Featured story */}
              <div className="p-5 border-b" style={{ borderColor: C.border, background: "rgba(41,98,255,0.05)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: C.blue, color: "#fff" }}>FEATURED</span>
                  <span className="text-[9px]" style={{ color: C.dim }}>2 hours ago</span>
                </div>
                <h4 className="text-sm font-bold mb-2" style={{ color: C.text }}>Fed holds rates steady as inflation cools to 2.8%</h4>
                <p className="text-xs leading-relaxed mb-4" style={{ color: C.muted }}>The Federal Reserve voted unanimously to keep interest rates unchanged at 5.25-5.50%, citing progress on inflation while maintaining caution about cutting too soon.</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["What happened", "Fed kept rates unchanged for the 3rd consecutive meeting"],
                    ["Why it matters", "Lower rates in the future could boost stock valuations"],
                    ["What to watch", "Next CPI data release and Q4 earnings season"],
                  ].map(([title, val]) => (
                    <div key={title} className="p-2 rounded-lg" style={{ background: C.card2 }}>
                      <div className="text-[8px] font-bold mb-1" style={{ color: C.blue }}>{title}</div>
                      <div className="text-[9px] leading-relaxed" style={{ color: C.muted }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <NewsPreview />
            </div>
          </Reveal>

          <Reveal delay={0} className="flex-1">
            <Label><Newspaper size={10} />Market Intelligence</Label>
            <h2 className="font-bold mb-5 leading-tight" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", color: C.text, letterSpacing: "-0.02em" }}>
              News that tells you why you should care.
            </h2>
            <p className="mb-6 leading-relaxed" style={{ color: C.muted, fontSize: "1rem" }}>
              Financial news shouldn't require a finance degree to understand. Atlas breaks every story into what happened, why it matters, and what it could affect.
            </p>
            <div className="space-y-3">
              {[
                { icon: MessageSquare, label: "What happened", desc: "A plain-language summary of the event" },
                { icon: Target, label: "Why it matters", desc: "The real-world impact on markets and sectors" },
                { icon: TrendingUp, label: "What to watch", desc: "What could happen next and what to monitor" },
              ].map(f => (
                <div key={f.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: C.blueDim, border: `1px solid ${C.blueBorder}` }}>
                    <f.icon size={14} color={C.blue} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: C.text }}>{f.label}</div>
                    <div className="text-xs" style={{ color: C.muted }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Challenges ────────────────────────────────────────────────────────────────
function ChallengesSection() {
  return (
    <section id="challenges" className="py-24 px-4" style={{ background: "#0D1117" }}>
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <Label><Trophy size={10} />Atlas Challenges</Label>
          <h2 className="font-bold mt-2" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", color: C.text, letterSpacing: "-0.02em" }}>
            Think you're good?<br /><span style={{ color: C.blue }}>Prove it.</span>
          </h2>
          <p className="mt-4 max-w-lg mx-auto" style={{ color: C.muted }}>
            Join simulated investing challenges, build a portfolio and see how your decisions stack up against everyone else.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <Reveal delay={0}>
            <TournamentsPreview />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { icon: Users, label: "Active Players", val: "1,240" },
                { icon: Clock, label: "Time Left", val: "3d 14h" },
                { icon: Trophy, label: "Prize", val: "Atlas Badge" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <s.icon size={16} color={C.blue} className="mx-auto mb-1" />
                  <div className="text-xs font-bold" style={{ color: C.text }}>{s.val}</div>
                  <div className="text-[9px]" style={{ color: C.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="space-y-4">
              {[
                { name: "Tech Stock Challenge", prize: "Open", players: "1,240", status: "LIVE", days: "3 days left" },
                { name: "S&P 500 Showdown", prize: "Starting soon", players: "842", status: "UPCOMING", days: "Starts Nov 1" },
                { name: "Energy Sector Cup", prize: "Completed", players: "520", status: "ENDED", days: "View results" },
              ].map(c => (
                <div key={c.name} className="rounded-xl p-4 flex items-center gap-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: c.status === "LIVE" ? "rgba(245,166,35,0.15)" : C.card2, border: `1px solid ${c.status === "LIVE" ? "rgba(245,166,35,0.3)" : C.border}` }}>
                    <Trophy size={16} color={c.status === "LIVE" ? "#F5A623" : C.dim} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate" style={{ color: C.text }}>{c.name}</div>
                    <div className="text-xs" style={{ color: C.muted }}>{c.players} participants · {c.days}</div>
                  </div>
                  <span className="text-[9px] px-2 py-1 rounded-full font-bold flex-shrink-0"
                    style={{
                      background: c.status === "LIVE" ? "rgba(245,166,35,0.15)" : c.status === "UPCOMING" ? C.blueDim : "rgba(255,255,255,0.05)",
                      color: c.status === "LIVE" ? "#F5A623" : c.status === "UPCOMING" ? C.blue : C.dim,
                    }}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Learn section ─────────────────────────────────────────────────────────────
function LearnSection() {
  const modules = [
    { title: "Stock Market Basics", lessons: 6, done: true },
    { title: "Reading Charts", lessons: 8, done: true },
    { title: "Risk Management", lessons: 5, done: false, prog: 60 },
    { title: "ETFs & Index Funds", lessons: 4, done: false, prog: 0 },
    { title: "Fundamental Analysis", lessons: 7, done: false, prog: 0 },
    { title: "Technical Analysis", lessons: 9, done: false, prog: 0 },
  ];

  return (
    <section id="learn-section" className="py-24 px-4" style={{ background: C.bg }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <Reveal delay={0} className="flex-1">
            <Label><BookOpen size={10} />Learn</Label>
            <h2 className="font-bold mb-5 leading-tight" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", color: C.text, letterSpacing: "-0.02em" }}>
              Learn because you want to.<br /><span style={{ color: C.blue }}>Not because there's a test.</span>
            </h2>
            <p className="mb-6 leading-relaxed" style={{ color: C.muted }}>
              Build real knowledge, one concept at a time. Atlas learning is designed around doing — each lesson connects directly to something you can practice in the market.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Stocks","ETFs","Market Orders","Limit Orders","Risk","Diversification","Valuation","Market News"].map(t => (
                <span key={t} className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted }}>{t}</span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150} className="flex-1 w-full">
            <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, maxWidth: 480, margin: "0 auto 0 0" }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
                <span className="text-sm font-semibold" style={{ color: C.text }}>Your Learning Path</span>
                <span className="text-xs font-semibold" style={{ color: C.blue }}>2 / 6 complete</span>
              </div>
              <div className="p-4 space-y-3">
                {modules.map((m, i) => (
                  <div key={m.title} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                    style={{ background: i === 2 ? C.blueDim : "transparent", border: `1px solid ${i === 2 ? C.blueBorder : "transparent"}` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: m.done ? C.greenDim : C.card2, border: `1px solid ${m.done ? C.green : C.border}` }}>
                      {m.done ? <CheckCircle size={14} color={C.green} /> : <BookOpen size={14} color={i === 2 ? C.blue : C.dim} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold" style={{ color: m.done ? C.muted : C.text }}>{m.title}</div>
                      <div className="text-[10px]" style={{ color: C.dim }}>{m.lessons} lessons</div>
                      {"prog" in m && typeof m.prog === "number" && m.prog > 0 && (
                        <div className="h-1 rounded-full mt-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full" style={{ width: `${m.prog}%`, background: C.blue }} />
                        </div>
                      )}
                    </div>
                    {m.done && <CheckCircle size={14} color={C.green} />}
                    {!m.done && i === 2 && <ArrowRight size={14} color={C.blue} />}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── The Loop ──────────────────────────────────────────────────────────────────
function TheLoopSection() {
  const steps = [
    { label: "Learn", icon: BookOpen, color: C.blue },
    { label: "Research", icon: TrendingUp, color: "#7C3AED" },
    { label: "Practice", icon: Activity, color: "#0891B2" },
    { label: "Compete", icon: Trophy, color: "#F5A623" },
    { label: "Review", icon: Target, color: C.green },
    { label: "Improve", icon: Zap, color: "#E11D48" },
  ];

  return (
    <section className="py-24 px-4 text-center" style={{ background: "#0D1117" }}>
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <Label><Activity size={10} />The Atlas Loop</Label>
          <h2 className="font-bold mt-2 mb-6" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", color: C.text, letterSpacing: "-0.02em" }}>
            The Atlas Loop
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <div className="flex flex-wrap justify-center gap-0 mb-12">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center px-5 py-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: `${s.color}18`, border: `1px solid ${s.color}40` }}>
                    <s.icon size={22} color={s.color} />
                  </div>
                  <div className="text-sm font-bold" style={{ color: C.text }}>{s.label}</div>
                </div>
                {i < steps.length - 1 && <ArrowRight size={16} color={C.dim} />}
                {i === steps.length - 1 && (
                  <div className="flex items-center text-xs font-semibold ml-2" style={{ color: C.blue }}>
                    ↺ repeat
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="max-w-xl mx-auto leading-relaxed" style={{ color: C.muted }}>
            Reading about investing is useful. Actually making decisions, seeing the outcome and reviewing why it happened is how knowledge starts becoming experience.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ── Why Atlas ─────────────────────────────────────────────────────────────────
function WhyAtlasSection() {
  return (
    <section className="py-24 px-4" style={{ background: C.bg }}>
      <div className="max-w-5xl mx-auto text-center">
        <Reveal>
          <h2 className="font-bold mb-16" style={{ fontSize: "clamp(2rem, 5vw, 4rem)", color: C.text, letterSpacing: "-0.03em" }}>
            Built for the generation<br />that wants to{" "}
            <span style={{ color: C.blue }}>start now.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          {[
            {
              icon: BookOpen, label: "Understand",
              headline: "Turn complicated into clear.",
              body: "Financial concepts explained the way you'd actually want them explained — with context, examples and real market connections.",
              color: C.blue,
            },
            {
              icon: Activity, label: "Practice",
              headline: "Make real decisions. Risk nothing.",
              body: "Simulated trading gives you the experience of the market without any of the financial consequences of getting it wrong.",
              color: "#7C3AED",
            },
            {
              icon: Trophy, label: "Compete",
              headline: "Test what you know.",
              body: "Atlas Challenges put your strategy up against other investors. See how your decisions stack up against the field.",
              color: "#F5A623",
            },
          ].map((p, i) => (
            <Reveal key={p.label} delay={i * 120}>
              <div className="p-8 rounded-2xl h-full text-left" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: `${p.color}18`, border: `1px solid ${p.color}30` }}>
                  <p.icon size={22} color={p.color} />
                </div>
                <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: p.color }}>{p.label}</div>
                <h3 className="text-xl font-bold mb-3 leading-tight" style={{ color: C.text }}>{p.headline}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Parents section ───────────────────────────────────────────────────────────
function ParentsSection({ onEnterApp }: { onEnterApp: () => void }) {
  return (
    <section className="py-24 px-4" style={{ background: "#0D1117" }}>
      <div className="max-w-4xl mx-auto">
        <Reveal className="text-center mb-12">
          <h2 className="font-bold mb-4" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", color: C.text, letterSpacing: "-0.02em" }}>
            They're going to learn about money somewhere.
          </h2>
          <p className="text-lg" style={{ color: C.muted }}>Give them a better place to start.</p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Reveal delay={0}>
            <div className="space-y-4">
              {[
                { icon: BookOpen, title: "Educational content", body: "Structured lessons that build real understanding of markets, investing and financial decision-making." },
                { icon: Activity, title: "Simulated trading only", body: "All trading on Atlas uses simulated money. No real funds are ever involved in the current product." },
                { icon: Target, title: "Decision reflection", body: "The journal and review features encourage young investors to understand the why behind every move." },
                { icon: CheckCircle, title: "Clear explanations", body: "Atlas AI and educational content are designed to explain concepts accessibly — not to give financial advice." },
              ].map(f => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: C.greenDim, border: `1px solid ${C.green}30` }}>
                    <f.icon size={14} color={C.green} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: C.text }}>{f.title}</div>
                    <div className="text-xs leading-relaxed mt-0.5" style={{ color: C.muted }}>{f.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="rounded-2xl p-8 h-full flex flex-col justify-between" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div>
                <div className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: C.blue }}>For Parents</div>
                <h3 className="text-2xl font-bold mb-4 leading-tight" style={{ color: C.text }}>
                  Designed around education, not speculation.
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                  Atlas is built as a learning environment first. The competitive elements are designed to encourage engagement with the material — not gambling behaviour. There is no real money, no real risk.
                </p>
              </div>
              <button onClick={onEnterApp}
                className="mt-8 w-full h-12 rounded-xl font-semibold text-sm text-white transition-all"
                style={{ background: C.blue }}
                onMouseEnter={e => (e.currentTarget.style.background = C.blueHover)}
                onMouseLeave={e => (e.currentTarget.style.background = C.blue)}>
                Explore Atlas
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Screen wall ───────────────────────────────────────────────────────────────
function ScreenWallSection() {
  const screens = [
    { label: "Dashboard", preview: <DashboardPreview /> },
    { label: "Charts", preview: <ChartPreview /> },
    { label: "Portfolio", preview: <PortfolioPreview /> },
    { label: "Atlas AI", preview: <AIPreview /> },
    { label: "News", preview: <NewsPreview /> },
    { label: "Challenges", preview: <TournamentsPreview /> },
    { label: "Learn", preview: <LearnPreview /> },
    { label: "Journal", preview: <JournalPreview /> },
    { label: "Trading", preview: <TradePreview /> },
  ];

  return (
    <section className="py-24 px-4 overflow-hidden" style={{ background: C.bg }}>
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <h2 className="font-bold" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", color: C.text, letterSpacing: "-0.02em" }}>
            One platform.<br /><span style={{ color: C.blue }}>A whole investing world.</span>
          </h2>
        </Reveal>

        {/* Mobile: horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-4 md:hidden" style={{ scrollbarWidth: "none" }}>
          {screens.map((s, i) => (
            <div key={s.label} className="flex-shrink-0 w-56">
              <div className="mb-2 text-xs font-semibold text-center" style={{ color: C.muted }}>{s.label}</div>
              {s.preview}
            </div>
          ))}
        </div>

        {/* Desktop: masonry grid */}
        <div className="hidden md:grid grid-cols-3 gap-4">
          {screens.map((s, i) => (
            <Reveal key={s.label} delay={i * 60}>
              <div>
                <div className="mb-2 text-xs font-semibold" style={{ color: C.dim }}>{s.label}</div>
                {s.preview}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Waitlist ──────────────────────────────────────────────────────────────────
function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrMsg("Enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    // TODO: connect to Supabase waitlist_entries table once approved
    await new Promise(r => setTimeout(r, 800));
    setStatus("success");
  };

  return (
    <section id="waitlist" className="py-28 px-4" style={{ background: "#0D1117" }}>
      <div className="max-w-xl mx-auto text-center">
        <Reveal>
          <Label><Zap size={10} />Atlas Early Access</Label>
          <h2 className="font-bold mt-2 mb-4" style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", color: C.text, letterSpacing: "-0.02em" }}>
            Get in before everyone else.
          </h2>
          <p className="mb-10 leading-relaxed" style={{ color: C.muted }}>
            Atlas is being built for the next generation of investors. Join early access and be one of the first to experience it.
          </p>

          {status === "success" ? (
            <div className="rounded-2xl p-10" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: C.greenDim, border: `1px solid ${C.green}50` }}>
                <CheckCircle size={24} color={C.green} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: C.text }}>You're in.</h3>
              <p className="text-sm mb-6" style={{ color: C.muted }}>We'll reach out when Atlas early access opens.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => { if (navigator.share) { navigator.share({ title: "Atlas", text: "Join Atlas early access — learn investing with simulated trading.", url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); } }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.text }}>
                  Share Atlas
                </button>
              </div>
              <p className="text-xs mt-5" style={{ color: C.dim }}>
                {/* TODO: referral link requires waitlist_entries table in Supabase */}
                Referral links coming soon — move up the waitlist by sharing.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                  placeholder="you@example.com"
                  className="w-full h-13 px-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: C.card, border: `1px solid ${status === "error" ? C.red : C.border}`,
                    color: C.text, height: 52,
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = C.blue; }}
                  onBlur={e => { e.currentTarget.style.borderColor = status === "error" ? C.red : C.border; }}
                />
                {status === "error" && (
                  <p className="text-xs mt-1.5 text-left" style={{ color: C.red }}>{errMsg}</p>
                )}
              </div>
              <button type="submit" disabled={status === "loading"}
                className="px-6 rounded-xl font-semibold text-white transition-all flex-shrink-0"
                style={{ background: C.blue, height: 52, opacity: status === "loading" ? 0.7 : 1 }}
                onMouseEnter={e => (e.currentTarget.style.background = C.blueHover)}
                onMouseLeave={e => (e.currentTarget.style.background = C.blue)}>
                {status === "loading" ? "Joining…" : "Join the Waitlist"}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// ── FAQ ────────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "What is Atlas?",
    a: "Atlas is a financial education and simulated trading platform designed for teenagers and young adults. It lets you explore real markets, practice investing with simulated money, complete educational lessons, and compete in challenges — all without risking real capital.",
  },
  {
    q: "Is Atlas a brokerage?",
    a: "No. Atlas is not a registered broker-dealer and does not execute real securities transactions. Atlas is an educational platform that uses simulated trading to help users learn about investing.",
  },
  {
    q: "Does Atlas use real money?",
    a: "No. All trading on Atlas uses simulated funds. No real money is deposited, invested or put at risk. Simulated returns on Atlas do not reflect or predict real investment performance.",
  },
  {
    q: "What is paper trading?",
    a: "Paper trading means practicing trades with virtual money instead of real capital. It lets you experience the decision-making process of investing — choosing when to buy, sell and hold — without any financial risk. The term comes from traders who would write down hypothetical trades on paper before risking real money.",
  },
  {
    q: "Who is Atlas built for?",
    a: "Atlas is built primarily for teenagers and young adults who want to learn about investing in an engaging, hands-on way. It's also useful for anyone who wants to practice investing concepts before putting real money to work.",
  },
  {
    q: "What can I learn on Atlas?",
    a: "Atlas covers the fundamentals of investing: what stocks and ETFs are, how markets work, how to read charts, risk management, how to evaluate companies, and how market news affects prices. Lessons are connected to real market activity so you can apply what you learn immediately.",
  },
  {
    q: "What are Atlas Challenges?",
    a: "Atlas Challenges are time-limited simulated investing competitions. Participants build portfolios within the challenge period and compete based on performance. Challenges are purely educational and do not involve real money, prizes, or any gambling element.",
  },
  {
    q: "What is Atlas AI?",
    a: "Atlas AI is an educational assistant that answers questions about markets, investing concepts, and what's happening in financial news. It's designed to explain things clearly — not to provide personalized financial advice or investment recommendations.",
  },
  {
    q: "When does Atlas launch?",
    a: "Atlas is currently in early access development. Join the waitlist to be notified when access opens.",
  },
  {
    q: "Is early access free?",
    a: "Yes. Early access to Atlas is free.",
  },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-4" style={{ background: C.bg }}>
      <div className="max-w-3xl mx-auto">
        <Reveal className="text-center mb-12">
          <h2 className="font-bold" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", color: C.text, letterSpacing: "-0.02em" }}>
            Frequently asked questions
          </h2>
        </Reveal>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <Reveal key={i} delay={i * 30}>
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${open === i ? C.blueBorder : C.border}` }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                  style={{ background: open === i ? "rgba(41,98,255,0.05)" : C.card }}>
                  <span className="text-sm font-semibold pr-4" style={{ color: C.text }}>{item.q}</span>
                  <ChevronDown size={16} color={C.muted} style={{ transform: open === i ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }} />
                </button>
                {open === i && (
                  <div className="px-5 pb-5 pt-1" style={{ background: open === i ? "rgba(41,98,255,0.03)" : C.card }}>
                    <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{item.a}</p>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function FinalCTASection({ onEnterApp }: { onEnterApp: () => void }) {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="py-32 px-4 relative overflow-hidden" style={{ background: "#0D1117" }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(41,98,255,0.1) 0%, transparent 70%)",
      }} />
      <div className="relative max-w-3xl mx-auto text-center">
        <Reveal>
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: C.blue, boxShadow: "0 0 40px rgba(41,98,255,0.4)" }}>
              <BarChart2 size={22} color="#fff" />
            </div>
            <span className="text-2xl font-bold tracking-tight" style={{ color: C.text }}>Atlas</span>
          </div>

          <h2 className="font-bold mb-6 leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 4rem)", color: C.text, letterSpacing: "-0.03em" }}>
            Your first trade shouldn't be<br />your first lesson.
          </h2>

          <p className="mb-10 leading-relaxed" style={{ color: C.muted, fontSize: "1.1rem" }}>
            Learn the market. Practice the decisions. Build the knowledge.
          </p>

          <button onClick={() => scrollTo("waitlist")}
            className="px-10 py-4 rounded-2xl font-bold text-white text-lg transition-all"
            style={{ background: C.blue, boxShadow: "0 8px 32px rgba(41,98,255,0.35)" }}
            onMouseEnter={e => { e.currentTarget.style.background = C.blueHover; e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.blue; e.currentTarget.style.transform = "scale(1)"; }}>
            Join Atlas Early Access
          </button>

          <p className="mt-4 text-sm" style={{ color: C.dim }}>Free early access · No credit card</p>
        </Reveal>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer({ onEnterApp }: { onEnterApp: () => void }) {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <footer className="px-4 py-12 border-t" style={{ borderColor: C.border, background: C.bg }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-10 justify-between mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.blue }}>
                <BarChart2 size={12} color="#fff" />
              </div>
              <span className="font-bold" style={{ color: C.text }}>Atlas</span>
            </div>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: C.dim }}>
              Financial education and simulated investing for the next generation.
            </p>
          </div>

          <div className="flex flex-wrap gap-8">
            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: C.dim }}>Product</div>
              {[["Markets", "product"], ["Learn", "learn-section"], ["Challenges", "challenges"], ["Atlas AI", "atlas-ai-section"]].map(([l, id]) => (
                <button key={l} onClick={() => scrollTo(id)} className="block text-sm transition-colors" style={{ color: C.muted }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>{l}</button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: C.dim }}>Company</div>
              {["About", "FAQ", "Privacy", "Terms"].map(l => (
                <button key={l} onClick={l === "FAQ" ? () => scrollTo("faq") : undefined} className="block text-sm transition-colors" style={{ color: C.muted }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>{l}</button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: C.dim }}>Access</div>
              <button onClick={onEnterApp} className="block text-sm transition-colors" style={{ color: C.muted }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>Log In</button>
              <button onClick={() => scrollTo("waitlist")} className="block text-sm font-semibold" style={{ color: C.blue }}>Join Early Access</button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t" style={{ borderColor: C.border }}>
          <p className="text-xs leading-relaxed mb-2" style={{ color: C.dim }}>
            Atlas provides educational tools and simulated trading experiences. Simulated performance does not represent actual trading results. Atlas does not provide investment advice.
          </p>
          <p className="text-xs" style={{ color: "#2D3748" }}>
            © {new Date().getFullYear()} Atlas. All rights reserved. [Legal copy pending review]
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function LandingPage({ onEnterApp }: LandingPageProps) {
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "var(--font-sans)", minHeight: "100vh" }}>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition-duration: 0.01ms !important; }
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #252A31; border-radius: 3px; }
      `}</style>

      <Nav onEnterApp={onEnterApp} />
      <HeroSection onEnterApp={onEnterApp} />
      <TickerTape />
      <SocialHookSection />
      <ProductSection />
      <AtlasAISection />
      <NewsSection />
      <ChallengesSection />
      <LearnSection />
      <TheLoopSection />
      <WhyAtlasSection />
      <ParentsSection onEnterApp={onEnterApp} />
      <ScreenWallSection />
      <WaitlistSection />
      <FAQSection />
      <FinalCTASection onEnterApp={onEnterApp} />
      <Footer onEnterApp={onEnterApp} />
    </div>
  );
}
