import { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { Wallet, CreditCard, CurrencyCircleDollar, ArrowRight, Check, X } from "phosphor-react";
import { useStore, getCurrencyInfo } from "../context/StoreContext";

type SetupStep = "choose" | "liquid" | "account" | "confirm";

interface BalanceSetupProps {
  onComplete: () => void;
}

export default function BalanceSetup({ onComplete }: BalanceSetupProps) {
  const { saveBalance, currency } = useStore();
  const cur = getCurrencyInfo(currency);
  const [step, setStep] = useState<SetupStep>("choose");
  const [hasLiquid, setHasLiquid] = useState<boolean | null>(null);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [liquidAmount, setLiquidAmount] = useState("");
  const [accountAmount, setAccountAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const sliderX = useMotionValue(0);
  const sliderLabelOpacity = useTransform(sliderX, [0, 80], [1, 0]);

  const formatNumber = (val: string) => {
    const num = val.replace(/[^0-9]/g, "");
    if (!num) return "";
    return Number(num).toLocaleString(cur.locale);
  };

  const handleChoose = (liquid: boolean, account: boolean) => {
    setHasLiquid(liquid);
    setHasAccount(account);
    if (liquid && account) {
      setStep("liquid");
    } else {
      setStep("account");
    }
  };

  const handleNext = () => {
    if (step === "liquid" && hasAccount) {
      setStep("account");
    } else {
      setStep("confirm");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const liquid = hasLiquid ? parseFloat(liquidAmount.replace(/,/g, "")) || 0 : 0;
    const account = hasAccount ? parseFloat(accountAmount.replace(/,/g, "")) || 0 : 0;
    const result = await saveBalance(liquid, account);
    setLoading(false);
    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => onComplete(), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute bottom-0 left-0 right-0 h-[75vh] z-30 flex flex-col"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm -z-10" />

      {/* Sheet */}
      <div className="flex-1 bg-surface border-t border-stroke rounded-t-[28px] px-5 pt-4 pb-20 overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-textFaint/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9AFF45]/20 via-[#73DA14]/15 to-[#2E680A]/10 border border-[#73DA14]/20 flex items-center justify-center overflow-hidden">
              <img src="/Image-assets/MP-LOGO.png" alt="MP" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-text">Set Up Wallet</h2>
              <p className="text-[11px] text-textDim/50">Add your current balances</p>
            </div>
          </div>
          <button onClick={onComplete} className="w-8 h-8 rounded-full bg-textFaint/10 flex items-center justify-center text-textDim hover:text-text transition-colors">
            <X size={16} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step: Choose ──────────────────────────────── */}
          {step === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5"
            >
              <button
                onClick={() => handleChoose(true, true)}
                className="w-full flex items-center gap-3 p-3.5 bg-white/[0.04] border border-white/[0.06] rounded-2xl hover:border-[#5CB010]/30 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#5CB010]/10 flex items-center justify-center">
                  <CurrencyCircleDollar size={18} weight="light" color="#5CB010" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-[13px] font-semibold text-text">Both</p>
                  <p className="text-[10px] text-textDim/50">Liquid + Account</p>
                </div>
                <ArrowRight size={16} color="#5CB010" />
              </button>

              <button
                onClick={() => handleChoose(true, false)}
                className="w-full flex items-center gap-3 p-3.5 bg-cardBg border border-stroke rounded-2xl hover:border-[#5CB010]/30 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#5CB010]/10 flex items-center justify-center">
                  <Wallet size={18} weight="light" color="#5CB010" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-[13px] font-semibold text-text">Liquid Only</p>
                  <p className="text-[10px] text-textDim/50">Cash in hand</p>
                </div>
                <ArrowRight size={16} color="#5CB010" />
              </button>

              <button
                onClick={() => handleChoose(false, true)}
                className="w-full flex items-center gap-3 p-3.5 bg-white/[0.04] border border-white/[0.06] rounded-2xl hover:border-[#F59E0B]/30 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
                  <CreditCard size={18} weight="light" color="#F59E0B" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-[13px] font-semibold text-text">Account Only</p>
                  <p className="text-[10px] text-textDim/50">Bank balance</p>
                </div>
                <ArrowRight size={16} color="#F59E0B" />
              </button>
            </motion.div>
          )}

          {/* ── Step: Liquid Amount ───────────────────────── */}
          {step === "liquid" && (
            <motion.div
              key="liquid"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-cardBg border border-stroke rounded-2xl p-4 mb-4">
                <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block mb-2">
                  Liquid Amount
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-display font-bold text-[#5CB010]">{cur.symbol}</span>
                  <input
                    type="text"
                    value={liquidAmount}
                    onChange={(e) => setLiquidAmount(formatNumber(e.target.value))}
                    className="flex-1 bg-transparent text-xl font-display font-bold text-text focus:outline-none placeholder-textDim/20"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={!liquidAmount}
                className="w-full h-[46px] bg-[#5CB010] hover:bg-[#5CB010]/90 text-[#050805] rounded-full flex items-center justify-center font-display font-bold text-[13px] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {hasAccount ? "Next" : "Continue"}
              </button>
            </motion.div>
          )}

          {/* ── Step: Account Amount ──────────────────────── */}
          {step === "account" && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-cardBg border border-stroke rounded-2xl p-4 mb-4">
                <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block mb-2">
                  Account Balance
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-display font-bold text-[#F59E0B]">{cur.symbol}</span>
                  <input
                    type="text"
                    value={accountAmount}
                    onChange={(e) => setAccountAmount(formatNumber(e.target.value))}
                    className="flex-1 bg-transparent text-xl font-display font-bold text-text focus:outline-none placeholder-textDim/20"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={!accountAmount}
                className="w-full h-[46px] bg-[#5CB010] hover:bg-[#5CB010]/90 text-[#050805] rounded-full flex items-center justify-center font-display font-bold text-[13px] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </motion.div>
          )}            {/* ── Success State ──────────────────────────── */}
          {showSuccess && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="flex flex-col items-center justify-center py-10 relative"
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 2.5], opacity: [0.3, 0] }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute w-24 h-24 rounded-full border-2 border-[#5CB010]/30"
              />
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 3.5], opacity: [0.2, 0] }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 }}
                className="absolute w-24 h-24 rounded-full border border-[#5CB010]/20"
              />
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-[#73DA14] via-[#5CB010] to-[#2E680A] flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(92,176,16,0.3)]"
              >
                <motion.div
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <Check size={36} weight="bold" color="#050805" />
                </motion.div>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-display font-bold text-xl text-text"
              >
                Wallet Ready!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="text-[13px] text-textDim/60 mt-1.5"
              >
                Your balances have been saved
              </motion.p>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 0.6, 0],
                    x: [0, (i % 2 === 0 ? 1 : -1) * (30 + i * 15)],
                    y: [0, -20 - i * 12],
                  }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.8 }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: i % 3 === 0 ? "#73DA14" : i % 3 === 1 ? "#F59E0B" : "#5CB010",
                    top: "40%",
                    left: "50%",
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* ── Step: Confirm ─────────────────────────────── */}
          {!showSuccess && step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-2.5 mb-4">
                {hasLiquid && (
                  <div className="flex items-center justify-between p-3 bg-cardBg border border-stroke rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#5CB010]/10 flex items-center justify-center">
                        <Wallet size={16} weight="light" color="#5CB010" />
                      </div>
                      <p className="text-[13px] font-semibold text-text">Liquid</p>
                    </div>
                    <p className="font-display font-bold text-[15px] text-[#5CB010]">
                      {cur.symbol}{parseFloat(liquidAmount.replace(/,/g, "") || "0").toLocaleString(cur.locale)}
                    </p>
                  </div>
                )}

                {hasAccount && (
                  <div className="flex items-center justify-between p-3 bg-cardBg border border-stroke rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                        <CreditCard size={16} weight="light" color="#F59E0B" />
                      </div>
                      <p className="text-[13px] font-semibold text-text">Account</p>
                    </div>
                    <p className="font-display font-bold text-[15px] text-[#F59E0B]">
                      {cur.symbol}{parseFloat(accountAmount.replace(/,/g, "") || "0").toLocaleString(cur.locale)}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-[#5CB010]/10 border border-[#5CB010]/20 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#5CB010]/20 flex items-center justify-center">
                      <Check size={16} weight="bold" color="#5CB010" />
                    </div>
                    <p className="text-[13px] font-bold text-[#5CB010]">Total</p>
                  </div>
                  <p className="font-display font-bold text-lg text-[#5CB010]">
                    {cur.symbol}{(
                      parseFloat(liquidAmount.replace(/,/g, "") || "0") +
                      parseFloat(accountAmount.replace(/,/g, "") || "0")
                    ).toLocaleString(cur.locale)}
                  </p>
                </div>
              </div>

              <div className="w-full h-[62px] bg-cardBg border border-stroke rounded-full p-1.5 relative mt-2 overflow-hidden flex items-center">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.span
                    className="font-display font-bold text-[14px] select-none"
                    style={{ opacity: sliderLabelOpacity, color: "var(--text)" }}
                  >
                    {loading ? "Saving..." : "Slide to Confirm"}
                  </motion.span>
                </div>
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 200 }}
                  dragElastic={0.05}
                  onDragEnd={(_e, info) => {
                    if (info.offset.x > 140) {
                      animate(sliderX, 220, { duration: 0.2 });
                      handleSave();
                    } else {
                      animate(sliderX, 0, { type: "spring", stiffness: 400, damping: 30 });
                    }
                  }}
                  style={{ x: sliderX }}
                  className="w-[50px] h-[50px] rounded-full bg-gradient-to-br from-[#73DA14] via-[#5CB010] to-[#2E680A] flex items-center justify-center text-[#050805] shadow-[0_2px_12px_rgba(92,176,16,0.35)] cursor-grab active:cursor-grabbing relative z-10 shrink-0"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <ArrowRight size={20} weight="bold" />
                  )}
                </motion.div>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex gap-0.5 pointer-events-none">
                  <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 1.2, repeat: Infinity }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--textFaint)" strokeWidth={2.5} className="opacity-30">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                  <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.15 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--textFaint)" strokeWidth={2.5} className="opacity-30 -ml-1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
