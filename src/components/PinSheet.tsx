import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../context/StoreContext";
import { PinDots, PinKeypad } from "./PinPad";

type PinSheetMode = "enable" | "disable";

interface PinSheetProps {
  open: boolean;
  mode: PinSheetMode;
  onClose: () => void;
}

export default function PinSheet({ open, mode, onClose }: PinSheetProps) {
  const { enableAppPin, verifyAppPin, disableAppPin, appPinEnabled } = useStore();

  // enable mode: stage 1 = create PIN, stage 2 = confirm it
  const [stage, setStage] = useState<1 | 2>(1);
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [done, setDone] = useState(false);
  const checkingRef = useRef(false);

  // Reset whenever the sheet opens / mode changes
  useEffect(() => {
    if (open) {
      setStage(1);
      setPin("");
      setFirstPin("");
      setError(null);
      setDone(false);
      checkingRef.current = false;
    }
  }, [open, mode]);

  // Auto-submit once 4 digits are entered
  useEffect(() => {
    if (!open || pin.length !== 4 || checkingRef.current) return;
    checkingRef.current = true;

    const timer = setTimeout(() => {
      if (mode === "disable") {
        // Verify current PIN → disable
        if (verifyAppPin(pin)) {
          disableAppPin();
          setDone(true);
          setTimeout(() => {
            onClose();
          }, 700);
        } else {
          setError("Incorrect PIN. Try again.");
          setAttempt((a) => a + 1);
          setPin("");
          checkingRef.current = false;
        }
        return;
      }

      // enable mode
      if (stage === 1) {
        setFirstPin(pin);
        setPin("");
        setStage(2);
        checkingRef.current = false;
      } else {
        if (pin === firstPin) {
          enableAppPin(pin);
          setDone(true);
          setTimeout(() => {
            onClose();
          }, 700);
        } else {
          setError("PINs don't match. Try again.");
          setAttempt((a) => a + 1);
          setPin("");
          setStage(1);
          setFirstPin("");
          checkingRef.current = false;
        }
      }
    }, 180);

    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, open, stage, mode, firstPin]);

  const handleDigit = (d: string) => {
    if (checkingRef.current || pin.length >= 4 || done) return;
    setError(null);
    setPin((prev) => prev + d);
  };

  const handleDelete = () => {
    if (checkingRef.current || pin.length === 0 || done) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const title =
    mode === "disable"
      ? "Turn Off App Lock"
      : stage === 1
      ? appPinEnabled
        ? "Change PIN"
        : "Set Up App Lock"
      : "Confirm Your PIN";

  const subtitle =
    mode === "disable"
      ? "Enter your current PIN to turn off the lock"
      : stage === 1
      ? "Choose a 4-digit PIN to lock your app"
      : "Re-enter the PIN to confirm it";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !done && onClose()}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 120 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 120 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[80]"
          >
            <div className="bg-surface border-t border-stroke rounded-t-[28px] px-5 pt-4 pb-8">
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-textFaint/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-bold text-base text-text">{title}</h3>
                <button
                  onClick={() => !done && onClose()}
                  className="w-8 h-8 rounded-full bg-textFaint/10 flex items-center justify-center text-textDim hover:text-text transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <p className="text-[11px] text-textDim/50 mb-6">{subtitle}</p>

              {/* Success state */}
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex flex-col items-center py-10"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#73DA14] to-[#2E680A] flex items-center justify-center shadow-[0_0_30px_rgba(115,218,20,0.4)] mb-4">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#050805" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-text font-display font-bold text-base">
                      {mode === "disable" ? "App Lock Turned Off" : "App Lock Enabled"}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="entry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Error */}
                    <div className="h-8 mb-3 flex items-center justify-center">
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral/10 border border-coral/20"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-coral">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span className="text-[11px] font-semibold text-coral">{error}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Dots */}
                    <motion.div
                      key={`${attempt}-${stage}`}
                      animate={error ? { x: [0, -10, 10, -7, 7, -3, 3, 0] } : { x: 0 }}
                      transition={{ duration: 0.4 }}
                      className="mb-7"
                    >
                      <PinDots value={pin} error={!!error} />
                    </motion.div>

                    {/* Keypad */}
                    <PinKeypad onDigit={handleDigit} onDelete={handleDelete} disabled={done} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
