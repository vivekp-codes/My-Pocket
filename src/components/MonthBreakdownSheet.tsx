import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ForkKnife,
  Car,
  Receipt,
  ShoppingBag,
  FilmStrip,
  CurrencyDollar,
  Heart,
  Briefcase,
  PlusCircle,
} from "phosphor-react";
import type { Icon } from "phosphor-react";
import { useStore, getCurrencyInfo } from "../context/StoreContext";

interface MonthBreakdownSheetProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number; // 0-based
}

const CATEGORY_META: Record<string, { label: string; icon: Icon; color: string }> = {
  food: { label: "Food", icon: ForkKnife, color: "#2E680A" },
  travel: { label: "Travel", icon: Car, color: "#1a3a24" },
  bills: { label: "Bills", icon: Receipt, color: "#1c2a20" },
  shopping: { label: "Shopping", icon: ShoppingBag, color: "#2E680A" },
  entertainment: { label: "Fun", icon: FilmStrip, color: "#153a24" },
  with_love: { label: "With Love", icon: Heart, color: "#8B2252" },
  other: { label: "Other", icon: CurrencyDollar, color: "#1c2a20" },
  salary: { label: "Salary", icon: Briefcase, color: "#2E680A" },
  topup: { label: "Top-up", icon: PlusCircle, color: "#1a3a24" },
};

function BreakdownRow({ row, total, positive }: { row: { key: string; amount: number }; total: number; positive: boolean }) {
  const { currency } = useStore();
  const cur = getCurrencyInfo(currency);
  const meta = CATEGORY_META[row.key] ?? CATEGORY_META.other;
  const pct = total > 0 ? Math.min(100, (row.amount / total) * 100) : 0;
  const Icon = meta.icon;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.color }}>
        <Icon size={18} weight="light" color="white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold text-text">{meta.label}</span>
          <span className="font-display font-bold text-[13px] whitespace-nowrap" style={{ color: positive ? "#5CB010" : "#EF4444" }}>
            {positive ? "+" : "-"}{cur.symbol} {row.amount.toLocaleString(cur.locale)}
          </span>
        </div>
        <div className="h-[4px] rounded-full bg-surface overflow-hidden mt-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="h-full rounded-full"
            style={{ background: positive ? "#5CB010" : "#EF4444" }}
          />
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, positive, rows, total, children }: { title: string; positive: boolean; rows: { key: string; amount: number }[]; total: number; children?: React.ReactNode }) {
  const { currency } = useStore();
  const cur = getCurrencyInfo(currency);
  return (
    <div
      className={`rounded-2xl border p-4 mb-4 ${
        positive ? "bg-[#5CB010]/[0.04] border-[#5CB010]/15" : "bg-[#EF4444]/[0.04] border-[#EF4444]/15"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${positive ? "text-[#5CB010]/70" : "text-[#EF4444]/70"}`}>
          {title}
        </span>
        <span className={`font-display font-bold text-[13px] ${positive ? "text-[#5CB010]" : "text-[#EF4444]"}`}>
          {positive ? "+" : "-"}{cur.symbol} {total.toLocaleString(cur.locale)}
        </span>
      </div>
      {rows.length > 0 ? (
        <div className="divide-y divide-white/[0.03]">
          {rows.map((row) => (
            <BreakdownRow key={row.key} row={row} total={total} positive={positive} />
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-textDim/40 py-3">{children}</p>
      )}
    </div>
  );
}

export default function MonthBreakdownSheet({ isOpen, onClose, year, month }: MonthBreakdownSheetProps) {
  const { transactions, currency } = useStore();
  const cur = getCurrencyInfo(currency);

  const { spendRows, creditRows, totalSpend, totalCredit, monthLabel, net } = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    const spends: Record<string, number> = {};
    const credits: Record<string, number> = {};
    let spendSum = 0;
    let creditSum = 0;

    transactions.forEach((tx) => {
      if (!tx.date.startsWith(prefix)) return;
      if (tx.type === "expense") {
        const key = tx.category || "other";
        spends[key] = (spends[key] ?? 0) + tx.amount;
        spendSum += tx.amount;
      } else if (tx.type === "income_salary" || tx.type === "income_topup") {
        const key = tx.type === "income_salary" ? "salary" : "topup";
        credits[key] = (credits[key] ?? 0) + tx.amount;
        creditSum += tx.amount;
      }
    });

    const sortDesc = ([, a]: [string, number], [, b]: [string, number]) => b - a;
    const spendRows = Object.entries(spends)
      .sort(sortDesc)
      .map(([key, amount]) => ({ key, amount }));
    const creditRows = Object.entries(credits)
      .sort(sortDesc)
      .map(([key, amount]) => ({ key, amount }));

    const label = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return { spendRows, creditRows, totalSpend: spendSum, totalCredit: creditSum, monthLabel: label, net: creditSum - spendSum };
  }, [transactions, year, month]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
            <div className="bg-surface border-t border-stroke rounded-t-[28px] px-5 pt-3 pb-8 max-h-[85vh] overflow-y-auto">
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-textFaint/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-base text-text">{monthLabel} Breakdown</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-textFaint/10 flex items-center justify-center text-textDim hover:text-text transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Month totals */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-[#5CB010]/8 border border-[#5CB010]/15 rounded-xl px-2.5 py-2.5 text-center">
                  <div className="text-[8px] font-bold text-[#5CB010]/60 uppercase tracking-wider">Credit</div>
                  <div className="font-display font-bold text-[14px] text-[#5CB010] mt-0.5">
                    {cur.symbol} {totalCredit.toLocaleString(cur.locale)}
                  </div>
                </div>
                <div className="bg-[#EF4444]/8 border border-[#EF4444]/15 rounded-xl px-2.5 py-2.5 text-center">
                  <div className="text-[8px] font-bold text-[#EF4444]/60 uppercase tracking-wider">Spend</div>
                  <div className="font-display font-bold text-[14px] text-[#EF4444] mt-0.5">
                    {cur.symbol} {totalSpend.toLocaleString(cur.locale)}
                  </div>
                </div>
                <div className="bg-cardBg border border-stroke rounded-xl px-2.5 py-2.5 text-center">
                  <div className="text-[8px] font-bold text-textDim/40 uppercase tracking-wider">Net</div>
                  <div className="font-display font-bold text-[14px] mt-0.5" style={{ color: net >= 0 ? "#5CB010" : "#EF4444" }}>
                    {cur.symbol} {net.toLocaleString(cur.locale)}
                  </div>
                </div>
              </div>

              {/* Spend breakdown */}
              <SectionCard title="Spent by category" positive={false} rows={spendRows} total={totalSpend}>
                No spends recorded this month
              </SectionCard>

              {/* Credit breakdown */}
              <SectionCard title="Credits by source" positive rows={creditRows} total={totalCredit}>
                No credits recorded this month
              </SectionCard>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}