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

// ── Slide direction for animations ────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export default function AuthScreen() {
  const { signUp, login, createProfile, user } = useStore();

  // If user exists but profile is incomplete, jump straight to avatar step
  const initialView: AuthView = user && !user.profileComplete ? "signup3" : "login";
  const [view, setView] = useState<AuthView>(initialView);
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg px-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-[20%] left-[10%] w-[250px] h-[250px] rounded-full bg-green/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-greenDeep/35 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-md bg-cardBg/60 border border-white/[0.04] backdrop-blur-xl rounded-[32px] p-6 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] z-10"
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#bdff80]/10 border border-[#bdff80]/20 text-[#bdff80] text-xl font-bold mb-3">
            💸
          </div>
          <h2 className="font-display font-bold text-2xl text-text leading-none tracking-tight">
            Tracker
          </h2>
          <p className="text-xs text-textDim/50 mt-2">
            Manage your liquid and account money
          </p>
        </div>

        {/* ── Step indicator (signup only) ────────────────── */}
        {(view === "signup1" || view === "signup2" || view === "signup3") && (
          <div className="flex items-center justify-center gap-2 mb-5">
            {["signup1", "signup2", "signup3"].map((s, i) => {
              const active =
                (view === "signup1" && i === 0) ||
                (view === "signup2" && i === 1) ||
                (view === "signup3" && i === 2);
              const done =
                (view === "signup2" && i === 0) ||
                (view === "signup3" && i <= 1);
              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                      active
                        ? "bg-[#bdff80] text-bg shadow-[0_0_12px_rgba(189,255,128,0.4)]"
                        : done
                        ? "bg-[#bdff80]/20 text-[#bdff80]"
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
                        done ? "bg-[#bdff80]/40" : "bg-surface"
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
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-coral/10 border border-coral/20 rounded-xl px-4 py-2.5 mb-4 text-xs font-semibold text-coral flex items-center gap-2 overflow-hidden"
            >
              <span>⚠️</span>
              {error}
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
              custom={slideDir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {/* Toggle */}
              <div className="flex bg-surface border border-stroke rounded-full p-1 mb-5">
                <button
                  className="flex-1 py-2.5 rounded-full font-display font-bold text-xs bg-[#bdff80] text-bg shadow-sm"
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
                  className="flex-1 py-2.5 rounded-full font-display font-bold text-xs text-textDim hover:text-text transition-all"
                >
                  Sign Up
                </button>
              </div>

              <p className="text-xs text-textDim/50 text-center mb-5">
                Enter your credentials to log in
              </p>

              {/* Email */}
              <div className="bg-surface border border-stroke rounded-[18px] p-3.5 focus-within:border-[#bdff80]/40 transition-colors mb-3">
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
              <div className="bg-surface border border-stroke rounded-[18px] p-3.5 focus-within:border-[#bdff80]/40 transition-colors mb-6">
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
                className="w-full h-[54px] bg-[#bdff80] hover:bg-[#bdff80]/90 text-bg rounded-full flex items-center justify-center font-display font-bold text-sm shadow-[0_8px_20px_-4px_rgba(189,255,128,0.25)] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-bg" fill="none" viewBox="0 0 24 24">
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
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {/* Toggle */}
              <div className="flex bg-surface border border-stroke rounded-full p-1 mb-5">
                <button
                  onClick={() => {
                    setPassword("");
                    setConfirmPassword("");
                    setError(null);
                    goBack("login");
                  }}
                  className="flex-1 py-2.5 rounded-full font-display font-bold text-xs text-textDim hover:text-text transition-all"
                >
                  Login
                </button>
                <button className="flex-1 py-2.5 rounded-full font-display font-bold text-xs bg-[#bdff80] text-bg shadow-sm">
                  Sign Up
                </button>
              </div>

              <p className="text-xs text-textDim/50 text-center mb-5">
                Step 1 of 3 — Choose a username and enter your email
              </p>

              {/* Username */}
              <div className="bg-surface border border-stroke rounded-[18px] p-3.5 focus-within:border-[#bdff80]/40 transition-colors mb-3">
                <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  className="w-full bg-transparent text-text font-semibold text-sm mt-1 focus:outline-none placeholder-textDim/20"
                  placeholder="e.g. john_doe"
                  maxLength={20}
                />
              </div>

              {/* Email */}
              <div className="bg-surface border border-stroke rounded-[18px] p-3.5 focus-within:border-[#bdff80]/40 transition-colors mb-6">
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
                className="w-full h-[54px] bg-[#bdff80] hover:bg-[#bdff80]/90 text-bg rounded-full flex items-center justify-center font-display font-bold text-sm shadow-[0_8px_20px_-4px_rgba(189,255,128,0.25)] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <button
                onClick={() => goBack("signup1")}
                className="flex items-center gap-2 text-xs text-textDim hover:text-text mb-4 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>

              <p className="text-xs text-textDim/50 text-center mb-5">
                Step 2 of 3 — Set a secure password
              </p>

              {/* Password */}
              <div className="bg-surface border border-stroke rounded-[18px] p-3.5 focus-within:border-[#bdff80]/40 transition-colors mb-3">
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
              <div className="bg-surface border border-stroke rounded-[18px] p-3.5 focus-within:border-[#bdff80]/40 transition-colors mb-2">
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
                <div className={`text-[10px] font-semibold mb-5 px-1 transition-colors ${
                  password === confirmPassword ? "text-[#3fe07e]" : "text-coral"
                }`}>
                  {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords don't match"}
                </div>
              )}
              {confirmPassword.length === 0 && <div className="mb-5" />}

              <button
                onClick={handleStep2}
                disabled={loading || password.length < 6 || password !== confirmPassword}
                className="w-full h-[54px] bg-[#bdff80] hover:bg-[#bdff80]/90 text-bg rounded-full flex items-center justify-center font-display font-bold text-sm shadow-[0_8px_20px_-4px_rgba(189,255,128,0.25)] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-bg" fill="none" viewBox="0 0 24 24">
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
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <button
                onClick={() => goBack("signup2")}
                className="flex items-center gap-2 text-xs text-textDim hover:text-text mb-4 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>

              <div className="text-center mb-4">
                <h3 className="font-display font-bold text-lg text-text">
                  Pick Your Avatar
                </h3>
                <p className="text-xs text-textDim/50 mt-1">
                  Step 3 of 3 — Choose how you appear to others
                </p>
              </div>

              {/* Large preview with glow pulse */}
              <div className="flex justify-center mb-6">
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
                    className="absolute inset-[-6px] rounded-full bg-[#bdff80]/20 blur-md"
                  />
                  <div className="relative w-[110px] h-[110px] rounded-full overflow-hidden border-[3px] border-[#bdff80] shadow-[0_0_40px_rgba(189,255,128,0.3)]">
                    <img
                      src={selectedImage}
                      alt="Selected avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Horizontal scrolling carousel — tall */}
              <div className="mb-6">
                <div
                  ref={scrollRef}
                  className="flex gap-4 overflow-x-auto pb-3 pt-1 px-3 snap-x snap-mandatory scrollbar-hide"
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
                        onClick={() => setSelectedImage(img)}
                        className={`relative flex-shrink-0 snap-center flex flex-col items-center gap-2.5 transition-all duration-300 ${
                          isSelected ? "" : ""
                        }`}
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
                          className={`relative w-[80px] h-[80px] rounded-full overflow-visible flex items-center justify-center transition-all duration-300 ${
                            isSelected
                              ? ""
                              : "opacity-50 hover:opacity-90"
                          }`}
                        >
                          <div className={`w-[70px] h-[70px] rounded-full overflow-hidden transition-all duration-300 ${
                            isSelected
                              ? "ring-[2.5px] ring-[#bdff80]"
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
                              <div className="w-4 h-4 rounded-full bg-[#bdff80] flex items-center justify-center shadow-lg">
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#06150d" strokeWidth={4}>
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
                          className="text-[10px] font-bold text-[#bdff80] h-3"
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
                          ? "bg-[#bdff80] w-5"
                          : "bg-white/10 w-1.5"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleStep3}
                disabled={loading}
                className="w-full h-[54px] bg-[#bdff80] hover:bg-[#bdff80]/90 text-bg rounded-full flex items-center justify-center font-display font-bold text-sm shadow-[0_8px_20px_-4px_rgba(189,255,128,0.25)] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-bg" fill="none" viewBox="0 0 24 24">
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
