import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../context/StoreContext";

export default function AuthScreen() {
  const { login, signUp } = useStore();
  const [isLoginTab, setIsLoginTab] = useState(true);

  // Forms State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || (!isLoginTab && !name)) {
      setError("Please fill out all fields");
      return;
    }

    setLoading(true);

    let result;
    if (isLoginTab) {
      result = await login(email, password);
    } else {
      result = await signUp(email, password, name);
    }

    setLoading(false);
    if (!result.success) {
      setError(result.error || "An error occurred");
    }
  };

  const toggleTab = () => {
    setIsLoginTab((prev) => !prev);
    setError(null);
    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg px-4 relative overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute top-[20%] left-[10%] w-[250px] h-[250px] rounded-full bg-green/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-greenDeep/35 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-md bg-cardBg/60 border border-white/[0.04] backdrop-blur-xl rounded-[32px] p-6 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] z-10"
      >
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#bdff80]/10 border border-[#bdff80]/20 text-[#bdff80] text-xl font-bold mb-3">
            💸
          </div>
          <h2 className="font-display font-bold text-2xl text-text leading-none tracking-tight">
            Tracker
          </h2>
          <p className="text-xs text-textDim/50 mt-2">Manage your liquid and account money</p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-surface border border-stroke rounded-full p-1 mb-6">
          <button
            onClick={toggleTab}
            className={`flex-1 py-2.5 rounded-full font-display font-bold text-xs transition-all ${
              isLoginTab ? "bg-[#bdff80] text-bg shadow-sm" : "text-textDim hover:text-text"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={toggleTab}
            className={`flex-1 py-2.5 rounded-full font-display font-bold text-xs transition-all ${
              !isLoginTab ? "bg-[#bdff80] text-bg shadow-sm" : "text-textDim hover:text-text"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Dialog */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLoginTab && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-surface border border-stroke rounded-[18px] p-3.5 focus-within:border-[#bdff80]/40 transition-colors">
                  <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-text font-semibold text-sm mt-1 focus:outline-none placeholder-textDim/20"
                    placeholder="Enter your name"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-surface border border-stroke rounded-[18px] p-3.5 focus-within:border-[#bdff80]/40 transition-colors">
            <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-text font-semibold text-sm mt-1 focus:outline-none placeholder-textDim/20"
              placeholder="name@example.com"
            />
          </div>

          <div className="bg-surface border border-stroke rounded-[18px] p-3.5 focus-within:border-[#bdff80]/40 transition-colors">
            <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-text font-semibold text-sm mt-1 focus:outline-none placeholder-textDim/20"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[54px] bg-[#bdff80] hover:bg-[#bdff80]/90 text-bg rounded-full flex items-center justify-center font-display font-bold text-sm shadow-[0_8px_20px_-4px_rgba(189,255,128,0.25)] active:scale-95 transition-all mt-6"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-bg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : isLoginTab ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
