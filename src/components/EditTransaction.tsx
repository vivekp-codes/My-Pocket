import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CaretDown,
  Check,
  Wallet,
  CreditCard,
  Trash,
  Briefcase,
  Heart,
  CurrencyDollar,
  Car,
  ForkKnife,
  Receipt,
  ShoppingBag,
  FilmStrip,
} from "phosphor-react";
import { useStore, getCurrencyInfo } from "../context/StoreContext";
import type { UpdateTransactionInput } from "../context/StoreContext";
import type { Transaction, BucketType, ExpenseCategory } from "../types/transaction";

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

const EXPENSE_CAT_IDS = ["travel", "food", "bills", "shopping", "entertainment", "other"];
const INCOME_CAT_IDS = ["salary", "other", "with_love"];

interface EditTransactionProps {
  tx: Transaction;
  onClose: () => void;
}

export default function EditTransaction({ tx, onClose }: EditTransactionProps) {
  const { updateTransaction, deleteTransaction, currency } = useStore();
  const cur = getCurrencyInfo(currency);

  const isTransfer = tx.type === "transfer";
  const [txType, setTxType] = useState<"expense" | "income">(
    tx.type === "income_salary" || tx.type === "income_topup" ? "income" : "expense"
  );
  const [category, setCategory] = useState<ExpenseCategory | null>(
    (tx.category as ExpenseCategory) ?? null
  );
  const [amount, setAmount] = useState(String(tx.amount));
  const [date, setDate] = useState(tx.date);
  const [note, setNote] = useState(tx.note ?? "");
  const [bucket, setBucket] = useState<BucketType>(tx.bucket);
  const [showCategory, setShowCategory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const formatNumber = (val: string) => {
    const num = val.replace(/[^0-9]/g, "");
    if (!num) return "";
    return Number(num).toLocaleString(cur.locale);
  };

  const visibleCategories = txType === "expense"
    ? allCategories.filter((c) => EXPENSE_CAT_IDS.includes(c.id))
    : allCategories.filter((c) => INCOME_CAT_IDS.includes(c.id));

  const selectedCat = allCategories.find((c) => c.id === category);

  const handleTypeChange = (next: "expense" | "income") => {
    setTxType(next);
    setError("");
    const valid = next === "expense" ? EXPENSE_CAT_IDS : INCOME_CAT_IDS;
    if (!category || !valid.includes(category)) setCategory("other");
  };

  const handleSave = async () => {
    const value = parseFloat(amount.replace(/,/g, "")) || 0;
    if (value <= 0) {
      setError("Enter an amount greater than zero");
      return;
    }
    const updates: UpdateTransactionInput = {
      amount: value,
      date,
      note: note.trim(),
      bucket,
    };
    if (!isTransfer) {
      updates.type =
        txType === "income" ? (category === "salary" ? "income_salary" : "income_topup") : "expense";
      updates.category = category;
    }
    setSaving(true);
    setError("");
    const res = await updateTransaction(tx.id, updates);
    setSaving(false);
    if (res.success) onClose();
    else setError(res.error ?? "Something went wrong");
  };

  const handleDelete = async () => {
    setSaving(true);
    setError("");
    const res = await deleteTransaction(tx.id);
    setSaving(false);
    if (res.success) onClose();
    else setError(res.error ?? "Couldn't delete transaction");
  };

  const canSubmit = !saving && !!amount && !!date;
  const fromBucket: BucketType = bucket === "liquid" ? "account" : "liquid";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />

      <motion.div
        initial={{ opacity: 0, y: 120 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 120 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="fixed bottom-0 left-0 right-0 z-[60]"
      >
        <div className="bg-surface border-t border-stroke rounded-t-[28px] px-5 pt-3 pb-8 max-h-[88vh] overflow-y-auto">
          {/* Handle */}
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-textFaint/30" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-base text-text">Edit Transaction</h3>
              <p className="text-[11px] text-textDim/60 mt-0.5">
                {txType === "income" ? "Get Money" : isTransfer ? "Transfer" : "Spend"}
                {isTransfer && ` · ${fromBucket === "liquid" ? "Liquid" : "Account"} → ${bucket === "liquid" ? "Liquid" : "Account"}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-textFaint/10 flex items-center justify-center text-textDim hover:text-text transition-colors"
            >
              <X size={17} />
            </button>
          </div>

          {/* Type selector (not for transfers) */}
          {!isTransfer && (
            <div className="flex gap-2 mb-4">
              {(["expense", "income"] as ("expense" | "income")[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                    txType === type
                      ? type === "expense"
                        ? "bg-coral/10 border border-coral/30 text-coral"
                        : "bg-[#5CB010]/10 border border-[#5CB010]/30 text-[#5CB010]"
                      : "bg-cardBg border border-stroke text-textDim"
                  }`}
                >
                  {type === "expense" ? "Spend" : "Get Money"}
                </button>
              ))}
            </div>
          )}

          {/* Category (not for transfers) */}
          {!isTransfer && (
            <div className="mb-4">
              <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block mb-2">
                Category
              </label>
              <button
                onClick={() => setShowCategory(true)}
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
                    <span className="text-[13px] text-textDim/50">Select category</span>
                  )}
                </div>
                <CaretDown size={16} className={`text-textDim transition-transform ${showCategory ? "rotate-180" : ""}`} />
              </button>
            </div>
          )}

          {/* Amount */}
          <div className="bg-cardBg border border-stroke rounded-2xl p-4 mb-4">
            <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block mb-2">
              Amount
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xl font-display font-bold text-[#5CB010]">{cur.symbol}</span>
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => {
                  setAmount(formatNumber(e.target.value));
                  setError("");
                }}
                className="flex-1 bg-transparent text-xl font-display font-bold text-text focus:outline-none placeholder-textDim/20"
                placeholder="0"
              />
            </div>
          </div>

          {/* Date */}
          <div className="bg-cardBg border border-stroke rounded-2xl p-4 mb-4 [color-scheme:dark]">
            <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-[13px] text-text font-medium focus:outline-none"
            />
          </div>

          {/* Bucket (not for transfers) */}
          {!isTransfer && (
            <div className="flex gap-2 mb-4">
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
          )}

          {/* Note */}
          <div className="bg-cardBg border border-stroke rounded-2xl p-4 mb-4">
            <label className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider block mb-2">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-transparent text-[13px] text-text font-medium focus:outline-none placeholder-textDim/20"
              placeholder="What's this for?"
            />
          </div>

          {error && (
            <p className="text-[12px] font-semibold text-coral mb-4">{error}</p>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            className={`w-full h-[50px] rounded-[16px] font-display font-bold text-[13.5px] transition-all active:scale-[0.97] ${
              canSubmit
                ? "bg-gradient-to-br from-[#73DA14] via-[#5CB010] to-[#2E680A] text-[#050805] shadow-[0_8px_24px_-6px_rgba(92,176,16,0.45)]"
                : "bg-textFaint/15 text-textDim/50 cursor-not-allowed"
            }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {/* Delete */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              className="w-full mt-3 h-[46px] rounded-[14px] border border-coral/25 bg-coral/5 text-coral flex items-center justify-center gap-2 text-[12.5px] font-bold transition-all active:scale-[0.97] hover:bg-coral/10 disabled:opacity-50"
            >
              <Trash size={16} /> Delete transaction
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-2xl border border-coral/25 bg-coral/[0.06] p-4"
            >
              <p className="text-[12.5px] font-semibold text-text mb-3">
                Delete this transaction forever?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={saving}
                  className="flex-1 h-[44px] rounded-[12px] bg-cardBg border border-stroke text-textDim text-[12.5px] font-bold transition-all active:scale-[0.97] disabled:opacity-50"
                >
                  Keep it
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 h-[44px] rounded-[12px] bg-gradient-to-br from-[#EF4444] to-[#7f1d1d] text-white text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-50"
                >
                  <Trash size={15} /> Delete
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Category picker ─────────────────────────────────────── */}
      <AnimatePresence>
        {showCategory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCategory(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[80]"
            >
              <div className="bg-surface border-t border-stroke rounded-t-[28px] px-5 pt-4 pb-8">
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 rounded-full bg-textFaint/30" />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-base text-text">
                    {txType === "expense" ? "Select Category" : "Select Source"}
                  </h3>
                  <button
                    onClick={() => setShowCategory(false)}
                    className="w-8 h-8 rounded-full bg-textFaint/10 flex items-center justify-center text-textDim hover:text-text transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {visibleCategories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCategory(cat.id as ExpenseCategory);
                          setShowCategory(false);
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
                        {isSelected && <Check size={18} weight="bold" color="#5CB010" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Transfer hint icon (decorative) */}
    </AnimatePresence>
  );
}