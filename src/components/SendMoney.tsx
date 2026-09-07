import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Wallet,
  CaretDown,
  X,
  Car,
  ForkKnife,
  Receipt,
  ShoppingBag,
  FilmStrip,
  CurrencyDollar,
  Briefcase,
  Heart,
} from "phosphor-react";
import { useStore, getCurrencyInfo } from "../context/StoreContext";

interface SendMoneyProps {
  onBack?: () => void;
  onSendSuccess: (amount: number, recipient: string) => void;
}

// ── All categories ──────────────────────────────────────
const allCategories = [
  { id: "salary", name: "Salary", icon: Briefcase, color: "#2E680A" },
  { id: "travel", name: "Travel", icon: Car, color: "#1a3a24" },
  { id: "food", name: "Food", icon: ForkKnife, color: "#2E680A" },
  { id: "bills", name: "Bills", icon: Receipt, color: "#1c2a20" },
  { id: "shopping", name: "Shopping", icon: ShoppingBag, color: "#2E680A" },
  { id: "entertainment", name: "Fun", icon: FilmStrip, color: "#153a24" },
  { id: "with_love", name: "With Love", icon: Heart, color: "#8B2252" },
  { id: "other", name: "Other", icon: CurrencyDollar, color: "#1c2a20" },
];

type TransactionType = "expense" | "income" | "returnable";

export default function SendMoney({ onBack, onSendSuccess }: SendMoneyProps) {
  const { addExpense, addIncome, currency, balances } = useStore();
  const cur = getCurrencyInfo(currency);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [txType, setTxType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [bucket, setBucket] = useState<"liquid" | "account">("liquid");
  const [noFunds, setNoFunds] = useState<{ bucket: "liquid" | "account"; available: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const sliderX = useMotionValue(0);
  const sliderLabelOpacity = useTransform(sliderX, [0, 80], [1, 0]);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Filter categories based on transaction type ──────────
  const categories = useMemo(() => {
    if (txType === "expense") {
      // Spend: all except salary and with_love
      return allCategories.filter((c) => c.id !== "salary" && c.id !== "with_love");
    }
    if (txType === "income") {
      // Get Money: salary + other + with_love (return received)
      return allCategories.filter((c) => c.id === "salary" || c.id === "other" || c.id === "with_love");
    }
    // Returnable: only With Love
    return allCategories.filter((c) => c.id === "with_love");
  }, [txType]);

  const formatNumber = (val: string) => {
    const num = val.replace(/[^0-9]/g, "");
    if (!num) return "";
    return Number(num).toLocaleString(cur.locale);
  };

  const handleSave = async () => {
    if (!selectedCategory || !amount) return;

    const parsedAmount = parseFloat(amount.replace(/,/g, "")) || 0;
    if (parsedAmount <= 0) return;

    // Guard: debits (spend / returnable) need money in the selected bucket
    if (txType !== "income" && balances) {
      const available =
        bucket === "liquid" ? balances.liquidAmount : balances.accountAmount;
      if (available < parsedAmount) {
        // Slide the thumb back and explain the shortfall
        animate(sliderX, 0, { type: "spring", stiffness: 400, damping: 30 });
        setNoFunds({ bucket, available });
        return;
      }
    }

    setLoading(true);
    const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

    try {
      if (txType === "expense") {
        await addExpense(parsedAmount, (selectedCategory as any) || "other", today, note || undefined, bucket);
      } else if (txType === "income") {
        const incomeType = selectedCategory === "salary" ? "income_salary" : "income_topup";
        await addIncome(parsedAmount, incomeType, bucket, note || undefined, selectedCategory);
      } else {
        await addExpense(parsedAmount, (selectedCategory as any) || "with_love", today, note || undefined, bucket);
      }
    } catch (err) {
      console.error("Failed to save transaction:", err);
    }

    setLoading(false);
    setShowSuccess(true);
  };

  // Find selected cat from ALL categories (not filtered)
  const selectedCat = allCategories.find((c) => c.id === selectedCategory);
  const canSubmit = selectedCategory && amount;

  // ── Helpers for the insufficient-funds modal ────────────────
  const bucketLabel = bucket === "liquid" ? "In Hand" : "Account";
  const otherBucket: "liquid" | "account" = bucket === "liquid" ? "account" : "liquid";
  const otherLabel = otherBucket === "liquid" ? "In Hand" : "Account";
  const parsedAmount = parseFloat(amount.replace(/,/g, "")) || 0;
  const otherAvailable = balances
    ? otherBucket === "liquid"
      ? balances.liquidAmount
      : balances.accountAmount
    : 0;
  const otherHasFunds = balances ? otherAvailable >= parsedAmount : false;
  const fmtAmt = (n: number) => `${cur.symbol}${n.toLocaleString(cur.locale)}`;
  const actionVerb = txType === "returnable" ? "give" : "spend";

  return (
    <div className="px-5 pt-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-full bg-surface border border-stroke flex items-center justify-center text-text hover:bg-stroke active:scale-95 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-display font-bold text-lg text-text">Add Transaction</span>
        <div className="w-11" />
      </div>

      <AnimatePresence mode="wait">            {showSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="flex flex-col items-center justify-center py-14 relative"
          >

            {/* Checkmark circle */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-[#73DA14] via-[#5CB010] to-[#2E680A] flex items-center justify-center mb-5"
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
              Added Successfully!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="text-[13px] text-textDim/60 mt-1.5"
            >
              {cur.symbol}{parseFloat(amount.replace(/,/g, "") || "0").toLocaleString(cur.locale)} has been recorded
            </motion.p>
            {/* Animated confetti dots */}
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
                  top: "42%",
                  left: "50%",
                }}
              />
            ))}
            {/* Done Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onClick={() => {
                if (onBack) onBack();
              }}
              className="mt-4 w-[70%] h-[44px] bg-gradient-to-r from-[#5CB010] to-[#2E680A] hover:from-[#5CB010]/90 hover:to-[#2E680A]/90 text-white rounded-full flex items-center justify-center font-display font-bold text-[13px] active:scale-95 transition-all shadow-[0_4px_16px_rgba(92,176,16,0.3)]"
            >
              Done
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Transaction Type */}
            <div className="flex gap-2">
              {(["expense", "income", "returnable"] as TransactionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setTxType(type);
                    setSelectedCategory(null); // reset when type changes
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                    txType === type
                      ? type === "expense"
                        ? "bg-coral/10 border border-coral/30 text-coral"
                        : type === "income"
                        ? "bg-[#5CB010]/10 border border-[#5CB010]/30 text-[#5CB010]"
                        : "bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B]"
                      : "bg-cardBg border border-stroke text-textDim"
                  }`}
                >
                  {type === "expense" ? "Spend" : type === "income" ? "Get Money" : "Returnable"}
                </button>
              ))}
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block mb-2">
                Category
              </label>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="w-full flex items-center justify-between p-4 bg-cardBg border border-stroke rounded-2xl hover:border-[#5CB010]/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  {selectedCat ? (
                    <>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: selectedCat.color }}>
                        <selectedCat.icon size={18} weight="light" color="white" />
                      </div>
                      <span className="text-[13px] font-semibold text-text">{selectedCat.name}</span>
                    </>
                  ) : (
                    <span className="text-[13px] text-textDim/50">
                      {txType === "returnable" ? "With Love" : "Select category"}
                    </span>
                  )}
                </div>
                <CaretDown size={16} className={`text-textDim transition-transform ${showCategoryModal ? "rotate-180" : ""}`} />
              </button>
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
                placeholder="What's this for?"
              />
            </div>

            {/* Bucket Selection */}
            <div className="flex gap-2">
              <button
                onClick={() => setBucket("liquid")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-semibold transition-all ${
                  bucket === "liquid"
                    ? "bg-[#5CB010]/10 border border-[#5CB010]/30 text-[#5CB010]"
                    : "bg-cardBg border border-stroke text-textDim"
                }`}
              >
                <Wallet size={16} /> In Hand
              </button>
              <button
                onClick={() => setBucket("account")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-semibold transition-all ${
                  bucket === "account"
                    ? "bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B]"
                    : "bg-cardBg border border-stroke text-textDim"
                }`}
              >
                <CreditCard size={16} /> Account
              </button>
            </div>

            {/* Swipe to Confirm */}
            <div
              ref={sliderContainerRef}
              className={`w-full h-[62px] border rounded-full p-1.5 relative mt-2 overflow-hidden flex items-center transition-all ${
                canSubmit && !loading
                  ? "bg-cardBg border-stroke"
                  : "bg-textFaint/5 border-textFaint/10 opacity-50"
              }`}
            >
              {/* Track label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.span
                  className="font-display font-bold text-[14px] select-none"
                  style={{ opacity: sliderLabelOpacity, color: "var(--textDim)" }}
                >
                  {loading ? "Saving..." : !canSubmit ? "Fill details above" : "Slide to Confirm"}
                </motion.span>
              </div>
              {/* Draggable thumb */}
              <motion.div
                drag={canSubmit && !loading ? "x" : false}
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
                className={`w-[50px] h-[50px] rounded-full flex items-center justify-center relative z-10 shrink-0 transition-all ${
                  canSubmit && !loading
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
                  <ArrowRight size={20} weight="bold" />
                )}
              </motion.div>
              {/* Chevrons hint */}
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex gap-0.5 pointer-events-none">
                <motion.div
                  animate={canSubmit && !loading ? { opacity: [0.2, 0.5, 0.2] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--textFaint)" strokeWidth={2.5} className="opacity-30">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </motion.div>
                <motion.div
                  animate={canSubmit && !loading ? { opacity: [0.2, 0.5, 0.2] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.15 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--textFaint)" strokeWidth={2.5} className="opacity-30 -ml-1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Category Modal ──────────────────────────────── */}
      <AnimatePresence>
        {showCategoryModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCategoryModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50"
            >
              <div className="bg-surface border-t border-stroke rounded-t-[28px] px-5 pt-4 pb-8">
                {/* Handle */}
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 rounded-full bg-textFaint/30" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-base text-text">
                    {txType === "expense"
                      ? "Select Category"
                      : txType === "income"
                      ? "Select Source"
                      : "Select Type"}
                  </h3>
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="w-8 h-8 rounded-full bg-textFaint/10 flex items-center justify-center text-textDim hover:text-text transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Category List */}
                <div className="space-y-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setShowCategoryModal(false);
                        }}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                          isSelected
                            ? "bg-[#5CB010]/10 border border-[#5CB010]/30"
                            : "bg-cardBg border border-stroke hover:border-[#5CB010]/20"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cat.color }}>
                          <Icon size={18} weight="light" color="white" />
                        </div>
                        <span className={`flex-1 text-left text-[13px] font-semibold ${isSelected ? "text-[#5CB010]" : "text-text"}`}>
                          {cat.name}
                        </span>
                        {isSelected && (
                          <Check size={18} weight="bold" color="#5CB010" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Insufficient Funds Modal ─────────────────────── */}
      <AnimatePresence>
        {noFunds && (() => {
          const shortfall = parsedAmount - noFunds.available;
          const filledPct = Math.min(100, Math.max(4, (noFunds.available / parsedAmount) * 100));
          return (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setNoFunds(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
              />

              {/* Card */}
              <div className="fixed inset-0 z-[70] flex items-center justify-center px-7 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 16 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className="w-full max-w-[330px] bg-surface/95 backdrop-blur-xl border border-white/[0.06] rounded-[28px] overflow-hidden pointer-events-auto shadow-[0_30px_80px_-16px_rgba(0,0,0,0.7)]"
                >
                  {/* ── Top amber gradient band ─────────────── */}
                  <div className="relative overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(245,158,11,0.28) 0%, rgba(234,88,12,0.16) 55%, rgba(46,104,10,0.12) 100%)",
                      }}
                    />
                    <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-[#F59E0B]/15 blur-2xl" />
                    <div className="absolute -bottom-10 -left-6 w-24 h-24 rounded-full bg-[#73DA14]/10 blur-2xl" />

                    <div className="relative flex flex-col items-center pt-6 pb-7 px-6">
                      {/* Icon badge */}
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.08 }}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F59E0B]/25 to-[#F59E0B]/5 border border-[#F59E0B]/30 flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(245,158,11,0.4)] mb-3.5"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </motion.div>

                      <h3 className="font-display font-bold text-[19px] text-text tracking-tight">
                        {actionVerb === "give" ? "Can't give" : "Can't spend"} from {bucketLabel}
                      </h3>
                      <p className="text-[11.5px] text-textDim/60 mt-1 text-center">
                        You're short of the full amount
                      </p>
                    </div>
                  </div>

                  {/* ── Body ─────────────────────────────────── */}
                  <div className="px-6 pt-1 pb-6">
                    {/* Shortfall hero */}
                    <div className="flex items-end justify-center gap-1.5 mb-6">
                      <span className="font-display font-bold text-[30px] leading-none tracking-tight bg-gradient-to-br from-[#F59E0B] to-[#EF4444] bg-clip-text text-transparent">
                        {fmtAmt(shortfall)}
                      </span>
                      <span className="text-[12px] text-textDim/60 pb-0.5 font-medium">more needed</span>
                    </div>

                    {/* Available vs Needed chips */}
                    <div className="flex items-stretch gap-2.5 mb-4">
                      <div className="flex-1 rounded-2xl border border-stroke bg-cardBg/60 px-3.5 py-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-textDim/50">
                            {bucketLabel}
                          </span>
                        </div>
                        <p className="font-display font-bold text-[16px] text-[#F59E0B]">
                          {fmtAmt(noFunds.available)}
                        </p>
                      </div>

                      <div className="w-8 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5f6d64" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="M13 6l6 6-6 6" />
                        </svg>
                      </div>

                      <div className="flex-1 rounded-2xl border border-stroke bg-cardBg/60 px-3.5 py-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#73DA14]" />
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-textDim/50">
                            Amount
                          </span>
                        </div>
                        <p className="font-display font-bold text-[16px] text-[#73DA14]">
                          {fmtAmt(parsedAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Progress fill */}
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${filledPct}%` }}
                          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 }}
                          className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#EF4444]"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[9.5px] font-semibold text-textDim/40 uppercase tracking-wider">
                        Covered
                      </span>
                      <span className="text-[9.5px] font-semibold text-[#F59E0B]/80">
                        {Math.min(100, Math.round((noFunds.available / parsedAmount) * 100))}%
                      </span>
                    </div>

                    {/* Suggestion box */}
                    <div className="flex items-start gap-2.5 bg-cardBg/70 border border-[#5CB010]/15 rounded-2xl px-4 py-3.5 mb-5">
                      <div className="w-7 h-7 rounded-full bg-[#5CB010]/15 flex items-center justify-center shrink-0 mt-0.5">
                        {otherHasFunds ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5CB010" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14" />
                            <path d="M19 12l-7 7-7-7" />
                          </svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5CB010" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M12 8v4" />
                            <path d="M12 16h.01" />
                          </svg>
                        )}
                      </div>
                      <p className="text-[11.5px] text-textDim/80 leading-relaxed">
                        {otherHasFunds
                          ? `Your ${otherLabel} has enough for this. Switch buckets to continue.`
                          : txType === "returnable"
                          ? `Top up your ${bucketLabel} (or ${otherLabel}) first, then give this amount.`
                          : `Top up your ${bucketLabel} (or ${otherLabel}) first, then try again.`}
                      </p>
                    </div>

                    {/* Actions */}
                    {otherHasFunds ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setBucket(otherBucket);
                            setNoFunds(null);
                          }}
                          className="w-full h-[48px] rounded-[16px] bg-gradient-to-br from-[#73DA14] via-[#5CB010] to-[#2E680A] text-[#050805] font-display font-bold text-[13.5px] flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-[0_8px_24px_-6px_rgba(92,176,16,0.45)]"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="6" width="20" height="12" rx="2" />
                            <circle cx="12" cy="12" r="2.5" />
                          </svg>
                          Use {otherLabel} instead
                        </button>
                        <button
                          onClick={() => setNoFunds(null)}
                          className="w-full h-[42px] rounded-[14px] text-[12px] font-bold text-textDim/60 hover:text-text transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNoFunds(null)}
                        className="w-full h-[48px] rounded-[16px] bg-gradient-to-br from-[#73DA14] via-[#5CB010] to-[#2E680A] text-[#050805] font-display font-bold text-[13.5px] active:scale-[0.97] transition-all shadow-[0_8px_24px_-6px_rgba(92,176,16,0.45)]"
                      >
                        Got it
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
