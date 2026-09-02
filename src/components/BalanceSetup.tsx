import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, CreditCard, CurrencyCircleDollar, ArrowRight, Check, X } from "phosphor-react";
import { useStore } from "../context/StoreContext";

type SetupStep = "choose" | "liquid" | "account" | "confirm";

interface BalanceSetupProps {
  onComplete: () => void;
}

export default function BalanceSetup({ onComplete }: BalanceSetupProps) {
  const { saveBalance } = useStore();
  const [step, setStep] = useState<SetupStep>("choose");
  const [hasLiquid, setHasLiquid] = useState<boolean | null>(null);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [liquidAmount, setLiquidAmount] = useState("");
  const [accountAmount, setAccountAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const formatNumber = (val: string) => {
    const num = val.replace(/[^0-9]/g, "");
    if (!num) return "";
    return Number(num).toLocaleString("en-IN");
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
      onComplete();
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
                  <span className="text-xl font-display font-bold text-[#5CB010]">₹</span>
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
                  <span className="text-xl font-display font-bold text-[#F59E0B]">₹</span>
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
          )}

          {/* ── Step: Confirm ─────────────────────────────── */}
          {step === "confirm" && (
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
                      ₹{parseFloat(liquidAmount.replace(/,/g, "") || "0").toLocaleString("en-IN")}
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
                      ₹{parseFloat(accountAmount.replace(/,/g, "") || "0").toLocaleString("en-IN")}
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
                    ₹{(
                      parseFloat(liquidAmount.replace(/,/g, "") || "0") +
                      parseFloat(accountAmount.replace(/,/g, "") || "0")
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full h-[56px] bg-cardBg border border-stroke rounded-full p-1.5 flex items-center justify-between mt-2 group hover:border-[#5CB010]/30 transition-all relative overflow-hidden"
              >
                <motion.div
                  className="w-[44px] h-[44px] rounded-full bg-[#5CB010] flex items-center justify-center text-[#050805] shadow-md"
                  animate={!loading ? { x: [0, 4, 0] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
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
                <span className="font-display font-bold text-[14px] text-text/80 pr-2 select-none">
                  {loading ? "Saving..." : "Get Started"}
                </span>
                <div className="flex gap-0.5 text-textFaint/40 group-hover:text-[#5CB010]/50 pr-4 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="-ml-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
