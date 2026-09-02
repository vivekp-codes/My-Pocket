import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../context/StoreContext";

type AuthView = "login" | "signup1" | "signup2" | "signup3";

const PROFILE_IMAGES = [
  "/Image-assets/Profile-assets/p1.png",
  "/Image-assets/Profile-assets/p2.png",
  "/Image-assets/Profile-assets/p3.png",
  "/Image-assets/Profile-assets/p4.png",
  "/Image-assets/Profile-assets/p5.png",
  "/Image-assets/Profile-assets/p6.png",
  "/Image-assets/Profile-assets/p7.png",
];

// ── Color palette ────────────────────────────────────────────
const C = {
  bright:  "#9AFF45",   // lightest — glows, active highlights
  primary: "#73DA14",   // primary buttons, toggles, rings
  mid:     "#5CB010",   // hover states, secondary accents
  dark:    "#2E680A",   // borders, subtle accents
  bg:      "#050805",   // deepest dark
};

// ── Minimal fade + y transition ─────────────────────────────
const viewVariants = {
  enter: { opacity: 0, y: 6 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

// ── Minimal slide for step transitions ────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 20 : -20, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -20 : 20, opacity: 0 }),
};

export default function AuthScreen() {
  const { signUp, login, createProfile, user } = useStore();

  // Always start at login — user picks where to go
  const [view, setView] = useState<AuthView>("login");

  const [slideDir, setSlideDir] = useState(1);

  // Form fields
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState(PROFILE_IMAGES[0]);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Navigation helpers ──────────────────────────────────────
  const goTo = (next: AuthView) => {
    setSlideDir(1);
    setError(null);
    setView(next);
  };

  const goBack = (prev: AuthView) => {
    setSlideDir(-1);
    setError(null);
    setView(prev);
  };

  // ── Step 1: Validate username + email ───────────────────────
  const handleStep1 = () => {
    setError(null);
    if (!username || username.length < 2) {
      setError("Username must be at least 2 characters");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    goTo("signup2");
  };

  // ── Step 2: Validate password + create auth account ─────────
  const handleStep2 = async () => {
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const result = await signUp(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Failed to create account");
      return;
    }
    goTo("signup3");
  };

  // ── Step 3: Create profile + enter home ─────────────────────
  const handleStep3 = async () => {
    setError(null);
    setLoading(true);
    const result = await createProfile(username, selectedImage);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Failed to create profile");
      return;
    }
    // Auth state change will redirect to Home
  };

  // ── Login handler ───────────────────────────────────────────
  const handleLogin = async () => {
    setError(null);
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Login failed");
      return;
    }
  };

  // ── Shared button class ────────────────────────────────────
  const btnPrimary = `w-full h-[48px] sm:h-[54px] rounded-full flex items-center justify-center font-display font-bold text-[13px] sm:text-sm active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed`;
  const btnLabel = `${btnPrimary} bg-[#5CB010] hover:bg-[#5CB010]/90 text-[#050805] shadow-[0_8px_20px_-4px_rgba(92,176,16,0.35)]`;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg px-3 sm:px-4 relative overflow-hidden">
      {/* Ambient blobs — using new palette */}
      <div className="absolute top-[20%] left-[10%] w-[180px] sm:w-[250px] h-[180px] sm:h-[250px] rounded-full bg-[#73DA14]/10 blur-[60px] sm:blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] rounded-full bg-[#2E680A]/35 blur-[70px] sm:blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-md bg-cardBg/60 border border-white/[0.04] backdrop-blur-xl rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] z-10"
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-3 mb-3 text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#9AFF45]/20 via-[#73DA14]/15 to-[#2E680A]/10 backdrop-blur-md border border-[#73DA14]/20 flex items-center justify-center overflow-hidden">
              <img src="/Image-assets/MP-LOGO.png" alt="My Pocket Logo" className="w-9 h-9 sm:w-11 sm:h-11 object-contain" />
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-text leading-tight tracking-tight text-left">
              <span className="block">My</span><span className="block">Pocket</span>
            </h2>
          </div>
          <p className="text-[10px] sm:text-[11px] text-textDim/40 mt-1">
            Track smarter. Save better. Spend wisely.
          </p>
        </div>

        {/* ── Step indicator (signup only) ────────────────── */}
        {(view === "signup1" || view === "signup2" || view === "signup3") && (
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-5">
            {["signup1", "signup2", "signup3"].map((s, i) => {
              const active =
                (view === "signup1" && i === 0) ||
                (view === "signup2" && i === 1) ||
                (view === "signup3" && i === 2);
              const done =
                (view === "signup2" && i === 0) || (view === "signup3" && i <= 1);
              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                      active
                        ? `bg-[#5CB010] text-[#050805] shadow-[0_0_12px_rgba(115,218,20,0.4)]`
                        : done
                        ? `bg-[#5CB010]/20 text-[#5CB010]`
                        : "bg-surface border border-stroke text-textDim/40"
                    }`}
                  >
                    {done ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < 2 && (
                    <div
                      className={`w-8 h-[2px] rounded-full transition-all duration-300 ${
                        done ? "bg-[#5CB010]/40" : "bg-surface"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Error ───────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative bg-coral/[0.07] border border-coral/15 rounded-2xl px-4 py-3 mb-4 overflow-hidden"
            >
              {/* Subtle glow */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-coral/30 to-transparent" />
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-coral/15 flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="text-coral">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-coral/90 leading-snug">
                  {error}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Animated content ────────────────────────────── */}
        <AnimatePresence mode="wait" custom={slideDir}>
          {/* ────────────────────────────────────────────────
              LOGIN VIEW
              ──────────────────────────────────────────────── */}
          {view === "login" && (
            <motion.div
              key="login"
              variants={viewVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {/* Toggle */}
              <div className="relative flex bg-surface border border-stroke rounded-full p-1 mb-4 sm:mb-5">
                <div
                  className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#5CB010] shadow-sm transition-all duration-200 ease-out"
                  style={{ transform: "translateX(0)" }}
                />
                <button
                  className="relative z-10 flex-1 py-2 sm:py-2.5 rounded-full font-display font-bold text-[11px] sm:text-xs text-[#050805]"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setEmail("");
                    setPassword("");
                    setError(null);
                    goTo("signup1");
                  }}
                  className="relative z-10 flex-1 py-2 sm:py-2.5 rounded-full font-display font-bold text-[11px] sm:text-xs text-textDim hover:text-text transition-all"
                >
                  Sign Up
                </button>
              </div>

              <p className="text-[11px] sm:text-xs text-textDim/50 text-center mb-4 sm:mb-5">
                Enter your credentials to log in
              </p>

              {/* Email */}
              <div className="bg-surface border border-stroke rounded-[14px] sm:rounded-[18px] p-3 sm:p-3.5 focus-within:border-[#5CB010]/40 transition-colors mb-2.5 sm:mb-3">
                <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-text font-semibold text-sm mt-1 focus:outline-none placeholder-textDim/20"
                  placeholder="name@example.com"
                />
              </div>

              {/* Password */}
              <div className="bg-surface border border-stroke rounded-[14px] sm:rounded-[18px] p-3 sm:p-3.5 focus-within:border-[#5CB010]/40 transition-colors mb-4 sm:mb-6">
                <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block">
                  Password
                </label>
                <div className="flex items-center mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 bg-transparent text-text font-semibold text-sm focus:outline-none placeholder-textDim/20"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-textDim/40 hover:text-textDim transition-colors ml-2"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading || !email.includes("@") || password.length < 6}
                className={`${btnPrimary} bg-[#5CB010] hover:bg-[#5CB010]/90 text-[#050805] shadow-[0_8px_20px_-4px_rgba(92,176,16,0.35)]`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-[#050805]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : "Log In"}
              </button>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────
              SIGNUP STEP 1: Username + Email
              ──────────────────────────────────────────────── */}
          {view === "signup1" && (
            <motion.div
              key="signup1"
              custom={slideDir}
              variants={viewVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {/* Toggle */}
              <div className="relative flex bg-surface border border-stroke rounded-full p-1 mb-4 sm:mb-5">
                <div
                  className="absolute inset-y-1 left-[calc(50%+2px)] w-[calc(50%-4px)] rounded-full bg-[#5CB010] shadow-sm transition-all duration-200 ease-out"
                />
                <button
                  onClick={() => {
                    setPassword("");
                    setConfirmPassword("");
                    setError(null);
                    goBack("login");
                  }}
                  className="relative z-10 flex-1 py-2 sm:py-2.5 rounded-full font-display font-bold text-[11px] sm:text-xs text-textDim hover:text-text transition-all"
                >
                  Login
                </button>
                <button className="relative z-10 flex-1 py-2 sm:py-2.5 rounded-full font-display font-bold text-[11px] sm:text-xs text-[#050805]">
                  Sign Up
                </button>
              </div>

              <p className="text-[11px] sm:text-xs text-textDim/50 text-center mb-4 sm:mb-5">
                Step 1 of 3 — Choose a username and enter your email
              </p>

              {/* Username */}
              <div className="bg-surface border border-stroke rounded-[14px] sm:rounded-[18px] p-3 sm:p-3.5 focus-within:border-[#5CB010]/40 transition-colors mb-2.5 sm:mb-3">
                <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_ ]/g, ""))}
                  className="w-full bg-transparent text-text font-semibold text-sm mt-1 focus:outline-none placeholder-textDim/20"
                  placeholder="e.g. john_doe"
                  maxLength={20}
                />
              </div>

              {/* Email */}
              <div className="bg-surface border border-stroke rounded-[14px] sm:rounded-[18px] p-3 sm:p-3.5 focus-within:border-[#5CB010]/40 transition-colors mb-4 sm:mb-6">
                <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-text font-semibold text-sm mt-1 focus:outline-none placeholder-textDim/20"
                  placeholder="name@example.com"
                />
              </div>

              <button
                onClick={handleStep1}
                disabled={username.length < 2 || !email.includes("@")}
                className={`${btnPrimary} bg-[#5CB010] hover:bg-[#5CB010]/90 text-[#050805] shadow-[0_8px_20px_-4px_rgba(92,176,16,0.35)]`}
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────
              SIGNUP STEP 2: Password + Confirm Password
              ──────────────────────────────────────────────── */}
          {view === "signup2" && (
            <motion.div
              key="signup2"
              custom={slideDir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <button
                onClick={() => goBack("signup1")}
                className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-textDim hover:text-text mb-3 sm:mb-4 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>

              <p className="text-[11px] sm:text-xs text-textDim/50 text-center mb-4 sm:mb-5">
                Step 2 of 3 — Set a secure password
              </p>

              {/* Password */}
              <div className="bg-surface border border-stroke rounded-[14px] sm:rounded-[18px] p-3 sm:p-3.5 focus-within:border-[#5CB010]/40 transition-colors mb-2.5 sm:mb-3">
                <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block">
                  Password
                </label>
                <div className="flex items-center mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 bg-transparent text-text font-semibold text-sm focus:outline-none placeholder-textDim/20"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-textDim/40 hover:text-textDim transition-colors ml-2"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="bg-surface border border-stroke rounded-[14px] sm:rounded-[18px] p-3 sm:p-3.5 focus-within:border-[#5CB010]/40 transition-colors mb-1.5 sm:mb-2">
                <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block">
                  Confirm Password
                </label>
                <div className="flex items-center mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex-1 bg-transparent text-text font-semibold text-sm focus:outline-none placeholder-textDim/20"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              {/* Match indicator */}
              {confirmPassword.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`mb-5 mx-1 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all duration-300 ${
                    password === confirmPassword
                      ? "bg-[#5CB010]/10 border border-[#5CB010]/20 text-[#5CB010]"
                      : "bg-coral/10 border border-coral/20 text-coral"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    password === confirmPassword
                      ? "bg-[#5CB010]/20"
                      : "bg-coral/20"
                  }`}>
                    {password === confirmPassword ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </div>
                  {password === confirmPassword ? "Passwords match" : "Passwords don't match"}
                </motion.div>
              )}
              {confirmPassword.length === 0 && <div className="mb-5" />}

              <button
                onClick={handleStep2}
                disabled={loading || password.length < 6 || password !== confirmPassword}
                className={`${btnPrimary} bg-[#5CB010] hover:bg-[#5CB010]/90 text-[#050805] shadow-[0_8px_20px_-4px_rgba(92,176,16,0.35)]`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-[#050805]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : "Continue"}
              </button>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────
              SIGNUP STEP 3: Avatar Picker
              ──────────────────────────────────────────────── */}
          {view === "signup3" && (
            <motion.div
              key="signup3"
              custom={slideDir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <button
                onClick={() => goBack("signup2")}
                className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-textDim hover:text-text mb-3 sm:mb-4 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>

              <div className="text-center mb-3 sm:mb-4">
                <h3 className="font-display font-bold text-base sm:text-lg text-text">
                  Pick Your Avatar
                </h3>
                <p className="text-[11px] sm:text-xs text-textDim/50 mt-1">
                  Step 3 of 3 — Choose how you appear to others
                </p>
              </div>

              {/* Large preview with glow pulse */}
              <div className="flex justify-center mb-4 sm:mb-6">
                <motion.div
                  key={selectedImage}
                  initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="relative"
                >
                  {/* Glow ring */}
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.15, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-[-4px] sm:inset-[-6px] rounded-full bg-[#5CB010]/20 blur-md"
                  />
                  <div className="relative w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] rounded-full overflow-hidden border-[3px] border-[#5CB010] shadow-[0_0_40px_rgba(92,176,16,0.3)]">
                    <img
                      src={selectedImage}
                      alt="Selected avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Horizontal scrolling carousel */}
              <div className="mb-4 sm:mb-6">
                <div
                  ref={scrollRef}                    className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 px-2 sm:px-3 snap-x snap-mandatory scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {PROFILE_IMAGES.map((img, i) => {
                    const isSelected = selectedImage === img;
                    return (
                      <motion.button
                        key={img}
                        initial={{ opacity: 0, scale: 0.5, y: 30, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                        transition={{
                          delay: i * 0.07,
                          type: "spring",
                          stiffness: 350,
                          damping: 22,
                        }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedImage(img)}                          className="relative flex-shrink-0 snap-center flex flex-col items-center gap-2 transition-all duration-300"
                      >
                        <motion.div
                          animate={
                            isSelected
                              ? { scale: [1, 1.06, 1], y: [0, -4, 0] }
                              : { scale: 1, y: 0 }
                          }
                          transition={
                            isSelected
                              ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                              : { duration: 0.3 }
                          }
                          className={`relative w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] rounded-full overflow-visible flex items-center justify-center transition-all duration-300 ${
                            isSelected ? "" : "opacity-50 hover:opacity-90"
                          }`}
                        >
                          <div className={`w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] rounded-full overflow-hidden transition-all duration-300 ${
                            isSelected
                              ? "ring-[2.5px] ring-[#5CB010]"
                              : "ring-1 ring-white/[0.08] hover:ring-white/[0.2] shadow-none"
                          }`}>
                            <img
                              src={img}
                              alt={`Avatar ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 20 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <div className="w-4 h-4 rounded-full bg-[#5CB010] flex items-center justify-center shadow-lg">
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#050805" strokeWidth={4}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                        {/* Name label under selected */}
                        <motion.span
                          animate={isSelected ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
                          transition={{ duration: 0.25 }}
                          className="text-[10px] font-bold text-[#5CB010] h-3"
                        >
                          {`Avatar ${i + 1}`}
                        </motion.span>
                      </motion.button>
                    );
                  })}
                </div>
                {/* Scroll hint dots */}
                <div className="flex justify-center gap-2 mt-3">
                  {PROFILE_IMAGES.map((img) => (
                    <motion.div
                      key={img}
                      layout
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        selectedImage === img
                          ? "bg-[#5CB010] w-5"
                          : "bg-white/10 w-1.5"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleStep3}
                disabled={loading}
                className={`${btnPrimary} bg-[#5CB010] hover:bg-[#5CB010]/90 text-[#050805] shadow-[0_8px_20px_-4px_rgba(92,176,16,0.35)]`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-[#050805]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : "Create Account"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
