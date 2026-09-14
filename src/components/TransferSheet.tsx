import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowsLeftRight, Check, X, Wallet, CreditCard } from "phosphor-react";
import { useStore, getCurrencyInfo } from "../context/StoreContext";

interface TransferSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferSheet({ isOpen, onClose }: TransferSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && <TransferSheetContent onClose={onClose} />}
    </AnimatePresence>
  );
}

// Mounted fresh each time the sheet opens, so all state resets naturally.
function TransferSheetContent({ onClose }: { onClose: () => void }) {
  const { balances, transferMoney, currency } = useStore();
  const cur = getCurrencyInfo(currency);

  const [fromBucket, setFromBucket] = useState<"liquid" | "account">("liquid");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const sliderX = useMotionValue(0);
  const sliderLabelOpacity = useTransform(sliderX, [0, 80], [1, 0]);

  const formatNumber = (val: string) => {
    const num = val.replace(/[^0-9]/g, "");
    if (!num) return "";
    return Number(num).toLocaleString(cur.locale);
  };

  const toBucket = fromBucket === "liquid" ? "account" : "liquid";
  const srcLabel = fromBucket === "liquid" ? "In Hand" : "Account";
  const destLabel = toBucket === "liquid" ? "In Hand" : "Account";
  const parsedAmount = parseFloat(amount.replace(/,/g, "")) || 0;
  const available = balances
    ? fromBucket === "liquid"
      ? balances.liquidAmount
      : balances.accountAmount
    : 0;
  const canSubmit =
    parsedAmount > 0 && balances && available >= parsedAmount && !loading;

  const handleTransfer = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    const result = await transferMoney(parsedAmount, fromBucket, note.trim() || undefined);
    setLoading(false);
    if (result.success) {
      setDone(true);
    } else {
      setError(result.error || "Transfer failed");
      animate(sliderX, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !done && !loading && onClose()}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      />

      {/* Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <div className="bg-surface border-t border-stroke rounded-t-[28px] px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto">
          {/* Handle */}
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-textFaint/30" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-base text-text">Transfer</h3>
              <p className="text-[11px] text-textDim/50 mt-0.5">
                Move money between your buckets
              </p>
            </div>
            <button
              onClick={() => !done && !loading && onClose()}
              className="w-8 h-8 rounded-full bg-textFaint/10 flex items-center justify-center text-textDim hover:text-text transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-[#73DA14] via-[#5CB010] to-[#2E680A] flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(92,176,16,0.3)]"
                >
                  <Check size={36} weight="bold" color="#050805" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-display font-bold text-xl text-text"
                >
                  Transfer Complete!
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-[13px] text-textDim/60 mt-1.5"
                >
                  {cur.symbol}{parsedAmount.toLocaleString(cur.locale)} moved {srcLabel} → {destLabel}
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={onClose}
                  className="mt-5 w-[70%] h-[44px] bg-gradient-to-r from-[#5CB010] to-[#2E680A] hover:from-[#5CB010]/90 hover:to-[#2E680A]/90 text-white rounded-full flex items-center justify-center font-display font-bold text-[13px] active:scale-95 transition-all shadow-[0_4px_16px_rgba(92,176,16,0.3)]"
                >
                  Done
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Direction preview */}
                <div className="flex items-center gap-2.5 p-3.5 bg-cardBg border border-stroke rounded-2xl">
                  <div className="flex-1">
                    <p className="text-[9.5px] font-bold uppercase tracking-wider text-textDim/40">From</p>
                    <p className="text-[14px] font-bold text-text">{srcLabel}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#5CB010]/10 border border-[#5CB010]/20 flex items-center justify-center shrink-0">
                    <ArrowsLeftRight size={15} weight="bold" color="#5CB010" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[9.5px] font-bold uppercase tracking-wider text-textDim/40">To</p>
                    <p className="text-[14px] font-bold text-text">{destLabel}</p>
                  </div>
                </div>

                {/* Source bucket */}
                <div>
                  <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block mb-2">
                    Transfer From
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFromBucket("liquid")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-semibold transition-all ${
                        fromBucket === "liquid"
                          ? "bg-[#5CB010]/10 border border-[#5CB010]/30 text-[#5CB010]"
                          : "bg-cardBg border border-stroke text-textDim"
                      }`}
                    >
                      <Wallet size={16} /> In Hand
                    </button>
                    <button
                      onClick={() => setFromBucket("account")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-semibold transition-all ${
                        fromBucket === "account"
                          ? "bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B]"
                          : "bg-cardBg border border-stroke text-textDim"
                      }`}
                    >
                      <CreditCard size={16} /> Account
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div className="bg-cardBg border border-stroke rounded-2xl p-4">
                  <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block mb-2">
                    Amount
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-display font-bold text-[#5CB010]">{cur.symbol}</span>
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(formatNumber(e.target.value))}
                      className="flex-1 bg-transparent text-xl font-display font-bold text-text focus:outline-none placeholder-textDim/20"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-[10px] text-textDim/50 mt-2">
                    Available: {cur.symbol}{(available ?? 0).toLocaleString(cur.locale)} in {srcLabel}
                  </p>
                </div>

                {/* Note */}
                <div className="bg-cardBg border border-stroke rounded-2xl p-4">
                  <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block mb-2">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-transparent text-[13px] text-text font-medium focus:outline-none placeholder-textDim/20"
                    placeholder="What's this transfer for?"
                  />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-coral/10 border border-coral/20"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-coral">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span className="text-[11px] font-semibold text-coral">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Swipe to Confirm */}
                <div
                  className={`w-full h-[62px] border rounded-full p-1.5 relative mt-2 overflow-hidden flex items-center transition-all ${
                    canSubmit ? "bg-cardBg border-stroke" : "bg-textFaint/5 border-textFaint/10 opacity-50"
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.span
                      className="font-display font-bold text-[14px] select-none"
                      style={{ opacity: sliderLabelOpacity, color: "var(--textDim)" }}
                    >
                      {parsedAmount > 0 && balances && available < parsedAmount
                        ? "Not enough balance"
                        : !parsedAmount
                        ? "Enter an amount"
                        : loading
                        ? "Transferring..."
                        : "Slide to Transfer"}
                    </motion.span>
                  </div>
                  <motion.div
                    drag={canSubmit ? "x" : false}
                    dragConstraints={{ left: 0, right: 200 }}
                    dragElastic={0.05}
                    onDragEnd={(_e, info) => {
                      if (info.offset.x > 140) {
                        animate(sliderX, 220, { duration: 0.2 });
                        handleTransfer();
                      } else {
                        animate(sliderX, 0, { type: "spring", stiffness: 400, damping: 30 });
                      }
                    }}
                    style={{ x: sliderX }}
                    className={`w-[50px] h-[50px] rounded-full flex items-center justify-center relative z-10 shrink-0 transition-all ${
                      canSubmit
                        ? "bg-gradient-to-br from-[#73DA14] via-[#5CB010] to-[#2E680A] text-[#050805] shadow-[0_2px_12px_rgba(92,176,16,0.35)] cursor-grab active:cursor-grabbing"
                        : "bg-textFaint/20 text-textDim/40 cursor-not-allowed"
                    }`}
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <ArrowsLeftRight size={20} weight="bold" />
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}