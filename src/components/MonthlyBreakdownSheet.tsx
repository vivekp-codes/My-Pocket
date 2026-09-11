import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChartPieSlice,
  TrendDown,
  TrendUp,
  Receipt,
  Briefcase,
  PlusCircle,
  Fire,
  CaretRight,
  Airplane,
  ForkKnife,
  Lightning,
  ShoppingBag,
  FilmStrip,
  Coins,
  Heart,
  type Icon,
} from "phosphor-react";
import { useStore, getCurrencyInfo } from "../context/StoreContext";
import type { Transaction } from "../types/transaction";

interface CategoryMeta {
  label: string;
  icon: Icon;
  color: string;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  travel: { label: "Travel", icon: Airplane, color: "#F97316" },
  food: { label: "Food", icon: ForkKnife, color: "#EF4444" },
  bills: { label: "Bills", icon: Lightning, color: "#F59E0B" },
  shopping: { label: "Shopping", icon: ShoppingBag, color: "#FB7185" },
  entertainment: { label: "Entertainment", icon: FilmStrip, color: "#F87171" },
  salary: { label: "Salary", icon: Briefcase, color: "#F59E0B" },
  other: { label: "Other", icon: Coins, color: "#FCA5A5" },
  with_love: { label: "With Love", icon: Heart, color: "#DC2626" },
};

interface MonthlyBreakdownSheetProps {
  open: boolean;
  onClose: () => void;
  year: number;
  month: number; // 0-based
}

export default function MonthlyBreakdownSheet({
  open,
  onClose,
  year,
  month,
}: MonthlyBreakdownSheetProps) {
  const { transactions, currency } = useStore();
  const cur = getCurrencyInfo(currency);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // ── Spend by category ──────────────────────────────────────
  const categorySpend = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type === "expense" && tx.date.startsWith(monthPrefix) && tx.category) {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
      }
    });
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, monthPrefix]);

  const totalSpend = categorySpend.reduce((s, c) => s + c.amount, 0);

  // ── Donut segments (red/amber palette) ─────────────────────
  const donutStops = useMemo(() => {
    const shareTotal = totalSpend || 1;
    const built = categorySpend.reduce<{ stops: string[]; running: number }>(
      (acc, c) => {
        const start = acc.running;
        const end = start + (c.amount / shareTotal) * 100;
        const color = CATEGORY_META[c.category]?.color ?? "#FCA5A5";
        acc.stops.push(`${color} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
        acc.running = end;
        return acc;
      },
      { stops: [], running: 0 }
    );
    return built.stops;
  }, [categorySpend, totalSpend]);

  // ── Highest single expense ─────────────────────────────────
  const highestExpense = useMemo(
    () =>
      transactions.reduce<Transaction | null>((best, tx) => {
        if (tx.type === "expense" && tx.date.startsWith(monthPrefix)) {
          if (!best || tx.amount > best.amount) return tx;
        }
        return best;
      }, null),
    [transactions, monthPrefix]
  );

  // ── Monthly income entries ─────────────────────────────────
  const monthIncomes = useMemo(
    () =>
      transactions
        .filter(
          (tx) =>
            (tx.type === "income_salary" || tx.type === "income_topup") &&
            tx.date.startsWith(monthPrefix)
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, monthPrefix]
  );

  const totalCredited = monthIncomes.reduce((s, tx) => s + tx.amount, 0);
  const salaryTotal = monthIncomes
    .filter((tx) => tx.type === "income_salary")
    .reduce((s, tx) => s + tx.amount, 0);
  const salaryPct = (salaryTotal / (totalCredited || 1)) * 100;

  const highestMeta =
    (highestExpense?.category && CATEGORY_META[highestExpense.category]) || null;

  const fmt = (n: number) => `${cur.symbol}${n.toLocaleString(cur.locale)}`;
  const fmtDay = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[80]"
          >
            <div className="bg-surface border-t border-stroke rounded-t-[28px] px-5 pt-4 pb-8 overflow-hidden relative max-h-[85vh] flex flex-col">
              {/* soft brand glow */}
              <div
                className="absolute inset-x-0 -top-16 h-40 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(60% 100% at 50% 0%, rgba(115,218,20,0.13) 0%, transparent 70%)",
                }}
              />

              {/* Handle */}
              <div className="flex justify-center mb-3 relative shrink-0">
                <div className="w-10 h-1 rounded-full bg-textFaint/30" />
              </div>

              {/* Header */}
              <div className="relative flex items-center justify-between mb-4 shrink-0">
                <div>
                  <h3 className="font-display font-bold text-base text-text">Monthly Breakdown</h3>
                  <p className="text-[11px] text-textDim/50 mt-0.5">{monthLabel}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-textFaint/10 flex items-center justify-center text-textDim hover:text-text transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="relative flex-1 overflow-y-auto -mx-5 px-5 pb-2">
                {/* ── Summary strip ─────────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.4, ease: "easeOut" }}
                  className="grid grid-cols-2 gap-2.5 mb-4"
                >
                  <div className="bg-[#EF4444]/8 border border-[#EF4444]/15 rounded-2xl px-3.5 py-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TrendDown size={13} weight="bold" className="text-[#EF4444]" />
                      <span className="text-[9px] font-bold text-[#EF4444]/70 uppercase tracking-wider">Debit</span>
                    </div>
                    <div className="font-display font-bold text-[16px] text-[#EF4444] leading-none">
                      -{fmt(totalSpend)}
                    </div>
                    <div className="text-[9.5px] text-textDim/45 mt-1">{categorySpend.length} categor{categorySpend.length === 1 ? "y" : "ies"} spent</div>
                  </div>
                  <div className="bg-[#5CB010]/8 border border-[#5CB010]/15 rounded-2xl px-3.5 py-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TrendUp size={13} weight="bold" className="text-[#5CB010]" />
                      <span className="text-[9px] font-bold text-[#5CB010]/70 uppercase tracking-wider">Credit</span>
                    </div>
                    <div className="font-display font-bold text-[16px] text-[#5CB010] leading-none">
                      +{fmt(totalCredited)}
                    </div>
                    <div className="text-[9.5px] text-textDim/45 mt-1">{monthIncomes.length} entr{monthIncomes.length === 1 ? "y" : "ies"} added</div>
                  </div>
                </motion.div>

                {/* ── Debit: Spend by Category ──────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="mb-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ChartPieSlice size={13} weight="bold" className="text-[#EF4444]" />
                    <span className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider">
                      Spend by Category
                    </span>
                    <span className="text-[9px] font-semibold text-[#EF4444]/60 ml-auto uppercase tracking-wider">
                      Debit
                    </span>
                  </div>

                  {categorySpend.length > 0 ? (
                    <>
                      {/* Donut chart */}
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ type: "spring", stiffness: 260, damping: 24 }}
                        className="flex items-center justify-center mb-4"
                      >
                        <div className="relative w-[150px] h-[150px]">
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: `conic-gradient(${donutStops.join(", ")})`,
                              boxShadow: "0 0 0 1px rgba(255,255,255,0.03)",
                            }}
                          />
                          <div className="absolute inset-[17px] rounded-full bg-surface flex flex-col items-center justify-center shadow-inner">
                            <span className="text-[8.5px] font-bold text-textDim/40 uppercase tracking-wider">
                              Total Spent
                            </span>
                            <span className="font-display font-bold text-[15px] text-[#EF4444] leading-tight mt-0.5">
                              -{fmt(totalSpend)}
                            </span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Legend — horizontal cards, 1 per row */}
                      <div className="flex flex-col gap-2.5">
                        {categorySpend.map((c, i) => {
                          const meta = CATEGORY_META[c.category] || {
                            label: c.category,
                            icon: Coins,
                            color: "#FCA5A5",
                          };
                          const Icon = meta.icon;
                          const share = (c.amount / (totalSpend || 1)) * 100;
                          const ringRadius = 23;
                          const ringCircumference = 2 * Math.PI * ringRadius;
                          return (
                            <motion.div
                              key={c.category}
                              initial={{ opacity: 0, x: -18 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true, margin: "-20px" }}
                              transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
                              className="relative flex items-center gap-3 bg-cardBg border border-stroke rounded-[18px] px-3.5 py-3 overflow-hidden"
                            >
                              {/* corner tint */}
                              <div
                                className="absolute inset-0 rounded-[18px] pointer-events-none"
                                style={{
                                  background: `radial-gradient(circle at 0% 0%, ${meta.color}0E 0%, transparent 50%)`,
                                }}
                              />

                              {/* circular progress ring with category icon */}
                              <div className="relative w-[54px] h-[54px] shrink-0 z-10">
                                <svg width="54" height="54" viewBox="0 0 54 54">
                                  <circle
                                    cx="27"
                                    cy="27"
                                    r={ringRadius}
                                    fill="none"
                                    stroke={`${meta.color}16`}
                                    strokeWidth="4"
                                  />
                                  <motion.circle
                                    cx="27"
                                    cy="27"
                                    r={ringRadius}
                                    fill="none"
                                    stroke={meta.color}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeDasharray={ringCircumference}
                                    initial={{ strokeDashoffset: ringCircumference }}
                                    animate={{ strokeDashoffset: ringCircumference * (1 - share / 100) }}
                                    transition={{ delay: 0.1 + i * 0.07, duration: 0.6, ease: "easeOut" }}
                                    transform="rotate(-90 27 27)"
                                  />
                                </svg>
                                <div
                                  className="absolute inset-[10px] rounded-full flex items-center justify-center"
                                  style={{ background: `${meta.color}14` }}
                                >
                                  <Icon size={15} weight="bold" color={meta.color} />
                                </div>
                              </div>

                              {/* middle: rank + name + share */}
                              <div className="flex-1 min-w-0 z-10">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-[15px] h-[15px] rounded-full flex items-center justify-center text-[7.5px] font-bold text-white shrink-0"
                                    style={{ background: meta.color }}
                                  >
                                    {i + 1}
                                  </span>
                                  <div className="text-[12.5px] font-bold text-text truncate">
                                    {meta.label}
                                  </div>
                                </div>
                                <div className="text-[9px] text-textDim/45 mt-1 tabular-nums">
                                  {Math.round(share)}% of monthly spend
                                </div>
                              </div>

                              {/* right: amount */}
                              <div className="flex flex-col items-end shrink-0 z-10 gap-1">
                                <div className="font-display font-bold text-[13px] text-[#EF4444] leading-none">
                                  -{fmt(c.amount)}
                                </div>
                                <div className="flex items-center gap-0.5 text-[8px] font-bold text-textDim/30 uppercase tracking-wider">
                                  Spent
                                  <CaretRight size={8} />
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-textDim/40 py-4 text-center bg-cardBg border border-stroke rounded-2xl">
                      No expenses this month
                    </div>
                  )}
                </motion.div>

                {/* ── Debit: Highest single spend ────────────── */}
                {highestExpense && (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="mb-4"
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <Fire size={13} weight="bold" className="text-[#EF4444]" />
                      <span className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider">
                        Highest Spend
                      </span>
                      <span className="text-[9px] font-semibold text-[#EF4444]/60 ml-auto uppercase tracking-wider">
                        Debit
                      </span>
                    </div>
                    <div className="bg-gradient-to-br from-[#EF4444]/12 via-[#EF4444]/6 to-transparent border border-[#EF4444]/25 rounded-2xl p-3.5 flex items-center gap-3">
                      <div
                        className="relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
                        style={{ background: highestMeta ? highestMeta.color : "#EF4444" }}
                      >
                        {highestMeta ? (
                          <highestMeta.icon size={18} weight="bold" color="white" />
                        ) : (
                          <Fire size={18} weight="bold" color="white" />
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-[15px] h-[15px] rounded-full flex items-center justify-center border-2 border-surface bg-[#EF4444]">
                          <svg
                            width="7"
                            height="7"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={4.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 5v14M5 12l7 7 7-7" />
                          </svg>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-bold text-text truncate">{highestExpense.name}</div>
                        <div className="text-[10px] text-textDim/50 mt-0.5">{fmtDay(highestExpense.date)}</div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <div className="font-display font-bold text-[14px] text-[#EF4444]">
                          -{fmt(highestExpense.amount)}
                        </div>
                        <div className="text-[8.5px] font-semibold text-textDim/40 uppercase tracking-wider mt-0.5">
                          Single spend
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Credit details ─────────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="mb-2"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Receipt size={13} weight="bold" className="text-[#5CB010]" />
                      <span className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider">
                        Credit Details
                      </span>
                    </div>
                    <span className="text-[9px] font-semibold text-[#5CB010]/60 uppercase tracking-wider">
                      Credit
                    </span>
                  </div>

                  {monthIncomes.length > 0 ? (
                    <>
                      {/* Income composition bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-semibold text-textDim/50">
                            Salary {fmt(salaryTotal)}
                          </span>
                          <span className="text-[9px] font-semibold text-textDim/50">
                            Top-up {fmt(totalCredited - salaryTotal)}
                          </span>
                        </div>
                        <div className="flex h-[7px] rounded-full overflow-hidden bg-surface">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${salaryPct}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-[#3f8f10] to-[#5CB010]"
                          />
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${100 - salaryPct}%` }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="h-full bg-[#73DA14]/50"
                          />
                        </div>
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className="flex items-center gap-1 text-[8.5px] font-semibold text-textDim/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5CB010]" /> Salary
                          </span>
                          <span className="flex items-center gap-1 text-[8.5px] font-semibold text-textDim/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#73DA14]/60" /> Top-up
                          </span>
                        </div>
                      </div>

                      {/* Income list — square cards, 4 per row */}
                      <div className="grid grid-cols-4 gap-2">
                        {monthIncomes.map((tx, i) => {
                          const isSalary = tx.type === "income_salary";
                          return (
                            <motion.div
                              key={tx.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.04, type: "spring", stiffness: 260, damping: 20 }}
                              className="relative aspect-square flex flex-col items-center justify-center gap-1 px-1 py-2 bg-[#5CB010]/5 border border-[#5CB010]/12 rounded-[14px] overflow-hidden"
                            >
                              <div className="w-8 h-8 rounded-[10px] bg-[#5CB010]/12 flex items-center justify-center shrink-0 mt-1">
                                {isSalary ? (
                                  <Briefcase size={14} weight="bold" className="text-[#5CB010]" />
                                ) : (
                                  <PlusCircle size={14} weight="bold" className="text-[#5CB010]" />
                                )}
                              </div>
                              <div className="w-full min-w-0 text-center leading-tight">
                                <div className="text-[9px] font-bold text-text truncate px-0.5">{tx.name}</div>
                                <div className="text-[8px] text-textDim/50 truncate">{fmtDay(tx.date)}</div>
                              </div>
                              <div className="flex flex-col items-center leading-none">
                                <div className="text-[10px] font-display font-bold text-[#5CB010] truncate">
                                  +{fmt(tx.amount)}
                                </div>
                                <div className="text-[6.5px] font-bold text-[#5CB010]/50 uppercase tracking-wider mt-0.5">
                                  {isSalary ? "Salary" : "Top-up"}
                                </div>
                              </div>
                              {/* corner accent */}
                              <div className="absolute top-0 right-0 w-5 h-5 rounded-bl-[14px] bg-gradient-to-bl from-[#5CB010]/20 to-transparent" />
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-textDim/40 py-4 text-center bg-cardBg border border-stroke rounded-2xl">
                      No income this month
                    </div>
                  )}
                </motion.div>

                <div className="flex items-center justify-center gap-1 mt-3 text-[9.5px] text-textDim/35">
                  <span>Breakdown of {monthLabel}</span>
                  <CaretRight size={10} className="-rotate-90" />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}