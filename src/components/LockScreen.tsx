import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../context/StoreContext";
import { PinDots, PinKeypad } from "./PinPad";

export default function LockScreen() {
  const { verifyAppPin, unlockApp, logout, user } = useStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const checkingRef = useRef(false);

  // Auto-submit once 4 digits are entered
  useEffect(() => {
    if (pin.length === 4 && !checkingRef.current) {
      checkingRef.current = true;
      const timer = setTimeout(() => {
        const ok = verifyAppPin(pin);
        if (ok) {
          unlockApp();
        } else {
          setError("Incorrect PIN. Try again.");
          setAttempt((a) => a + 1);
          setPin("");
          checkingRef.current = false;
        }
      }, 180);
      return () => {
        clearTimeout(timer);
        checkingRef.current = false;
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleDigit = (d: string) => {
    if (checkingRef.current || pin.length >= 4) return;
    setError(null);
    setPin((prev) => prev + d);
  };

  const handleDelete = () => {
    if (checkingRef.current || pin.length === 0) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleLogout = async () => {
    await logout();
  };

  const displayName = user?.name
    ? user.name
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    : "";

  return (
    <div className="relative h-full w-full bg-bg overflow-hidden flex flex-col">
      {/* Ambient glow */}
      <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[220px] h-[220px] rounded-full bg-[#73DA14]/10 blur-[70px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[180px] h-[180px] rounded-full bg-[#2E680A]/30 blur-[60px] pointer-events-none" />

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo + brand — same row, My Pocket stacked in two lines */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex items-center justify-center gap-3.5 mb-6"
        >
          <div className="w-[62px] h-[62px] rounded-[18px] bg-gradient-to-br from-[#9AFF45]/20 via-[#73DA14]/15 to-[#2E680A]/10 backdrop-blur-md border border-[#73DA14]/20 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(115,218,20,0.15)]">
            <img
              src="/Image-assets/MP-LOGO.png"
              alt="My Pocket Logo"
              className="w-9 h-9 object-contain"
            />
          </div>
          <h2 className="font-display font-bold text-[26px] text-text leading-[0.95] tracking-tight text-left">
            <span className="block">My</span>
            <span className="block">Pocket</span>
          </h2>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-display font-bold text-[20px] text-text tracking-tight mb-1"
        >
          {displayName ? `Hi, ${displayName.split(" ")[0]}` : "Welcome back"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-[12px] text-textDim/60 mb-7 text-center"
        >
          Enter your 4-digit PIN to unlock
        </motion.p>

        {/* Error banner */}
        <div className="h-8 mb-4 flex items-center justify-center">
          <AnimatePresence>
            {error && (
              <motion.div
                key={attempt}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-coral/10 border border-coral/20"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  className="text-coral"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-[11px] font-semibold text-coral">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dots with shake on error */}
        <motion.div
          key={attempt}
          animate={error ? { x: [0, -10, 10, -7, 7, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-9"
        >
          <PinDots value={pin} error={!!error} />
        </motion.div>

        {/* Keypad */}
        <PinKeypad onDigit={handleDigit} onDelete={handleDelete} />
      </div>

      {/* Log out */}
      <div className="relative pb-6 flex justify-center">
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-textDim/40 hover:text-coral transition-colors py-1 px-2"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </button>
      </div>
    </div>
  );
}
