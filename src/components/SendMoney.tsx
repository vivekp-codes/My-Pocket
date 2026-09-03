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
import { useStore } from "../context/StoreContext";

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
  const { addExpense, addIncome } = useStore();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [txType, setTxType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [bucket, setBucket] = useState<"liquid" | "account">("liquid");
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
    return Number(num).toLocaleString("en-IN");
  };

  const handleSave = async () => {
    if (!selectedCategory || !amount) return;
    setLoading(true);
    const parsedAmount = parseFloat(amount.replace(/,/g, "")) || 0;
    const today = new Date().toISOString().split("T")[0];

    try {
      if (txType === "expense") {
        await addExpense(parsedAmount, (selectedCategory as any) || "other", today, note || undefined);
      } else if (txType === "income") {
        const incomeType = selectedCategory === "salary" ? "income_salary" : "income_topup";
        await addIncome(parsedAmount, incomeType, bucket, note || undefined, selectedCategory);
      } else {
        await addExpense(parsedAmount, (selectedCategory as any) || "with_love", today, note || undefined);
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
              ₹{parseFloat(amount.replace(/,/g, "") || "0").toLocaleString("en-IN")} has been recorded
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
                <span className="text-xl font-display font-bold text-[#5CB010]">₹</span>
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
    </div>
  );
}
