import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // ── Filter categories based on transaction type ──────────
  const categories = useMemo(() => {
    if (txType === "expense") {
      // Spend: all except salary and with_love
      return allCategories.filter((c) => c.id !== "salary" && c.id !== "with_love");
    }
    if (txType === "income") {
      // Get Money: salary + other
      return allCategories.filter((c) => c.id === "salary" || c.id === "other");
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
        // Returnable
        await addExpense(parsedAmount, (selectedCategory as any) || "with_love", today, note || undefined);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (onBack) onBack();
      }, 1500);
    } catch (err) {
      console.error("Failed to save transaction:", err);
    }
    setLoading(false);
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

      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 bg-cardBg border border-stroke rounded-[28px]"
          >
            <div className="w-16 h-16 rounded-full bg-[#5CB010]/15 flex items-center justify-center mb-4">
              <Check size={32} weight="bold" color="#5CB010" />
            </div>
            <h3 className="font-display font-bold text-lg text-text">Added!</h3>
            <p className="text-xs text-textDim/70 mt-1">
              ₹{parseFloat(amount.replace(/,/g, "") || "0").toLocaleString("en-IN")} saved
            </p>
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

            {/* Confirm Button */}
            <button
              onClick={handleSave}
              disabled={!canSubmit || loading}
              className="w-full h-[56px] bg-cardBg border border-stroke rounded-full p-1.5 flex items-center justify-between mt-2 group hover:border-[#5CB010]/30 transition-all relative overflow-hidden disabled:opacity-40"
            >
              <motion.div
                className="w-[44px] h-[44px] rounded-full bg-[#5CB010] flex items-center justify-center text-[#050805] shadow-md"
                animate={canSubmit && !loading ? { x: [0, 4, 0] } : {}}
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
                {loading ? "Saving..." : "Add Transaction"}
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
