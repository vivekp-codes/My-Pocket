import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ForkKnife,
  Car,
  Receipt,
  ShoppingBag,
  FilmStrip,
  CurrencyDollar,
  PlusCircle,
  ArrowsLeftRight,
  Briefcase,
  Heart,
  ArrowLeft,
  CaretLeft,
  CaretRight,
} from "phosphor-react";
import type { Icon } from "phosphor-react";
import { useStore, getCurrencyInfo } from "../context/StoreContext";
import type { Transaction } from "../types/transaction";

// ── Phosphor Icons ─────────────────────────────────────────
const iconMap: Record<string, Icon> = {
  food: ForkKnife,
  travel: Car,
  bills: Receipt,
  shopping: ShoppingBag,
  entertainment: FilmStrip,
  other: CurrencyDollar,
  salary: Briefcase,
  with_love: Heart,
  topup: PlusCircle,
  transfer: ArrowsLeftRight,
};

const iconBgColors: Record<string, string> = {
  food: "#2E680A",
  travel: "#1a3a24",
  bills: "#1c2a20",
  shopping: "#2E680A",
  entertainment: "#153a24",
  other: "#1c2a20",
  salary: "#2E680A",
  with_love: "#8B2252",
  topup: "#1a3a24",
  transfer: "#1c2a20",
};

function getIcon(tx: Transaction) {
  if (tx.icon && iconMap[tx.icon]) return iconMap[tx.icon];
  if (tx.type === "income_salary") return iconMap.salary;
  if (tx.type === "income_topup") return iconMap.topup;
  return iconMap[tx.category || "other"] || iconMap.other;
}

function getIconBg(tx: Transaction) {
  if (tx.icon && iconBgColors[tx.icon]) return iconBgColors[tx.icon];
  if (tx.type === "income_salary") return iconBgColors.salary;
  if (tx.type === "income_topup") return iconBgColors.topup;
  return iconBgColors[tx.category || "other"] || "#1c2a20";
}

interface StatisticsCardProps {
  onBack?: () => void;
}

// ── Helpers ────────────────────────────────────────────────
function getWeekRange(date: Date): { start: Date; end: Date; label: string } {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  const fmt = (dt: Date) =>
    dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { start, end, label: `${fmt(start)} – ${fmt(end)}` };
}

function getMonthRange(date: Date): { start: Date; end: Date; label: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return { start, end, label };
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Local YYYY-MM-DD — safe for comparing against tx.date (also local).
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function StatisticsCard({ onBack }: StatisticsCardProps) {
  const { transactions, currency } = useStore();
  const cur = getCurrencyInfo(currency);
  const [activeToggle, setActiveToggle] = useState<"income" | "spend">("income");
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekRange = useMemo(() => getWeekRange(currentDate), [currentDate]);
  const monthRange = useMemo(() => getMonthRange(currentDate), [currentDate]);

  // ── Monthly totals ──────────────────────────────────────
  const monthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  const monthlyCredits = useMemo(
    () =>
      transactions
        .filter(
          (tx) =>
            (tx.type === "income_salary" || tx.type === "income_topup") &&
            tx.date.startsWith(monthPrefix)
        )
        .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions, monthPrefix]
  );

  const monthlyDebits = useMemo(
    () =>
      transactions
        .filter(
          (tx) => tx.type === "expense" && tx.date.startsWith(monthPrefix)
        )
        .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions, monthPrefix]
  );

  // ── Weekly daily data ───────────────────────────────────
  const weekDailyData = useMemo(() => {
    const days: { label: string; dateStr: string; credit: number; debit: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekRange.start);
      d.setDate(weekRange.start.getDate() + i);
      const dateStr = toDateStr(d);
      const credit = transactions
        .filter(
          (tx) =>
            (tx.type === "income_salary" || tx.type === "income_topup") && tx.date === dateStr
        )
        .reduce((s, tx) => s + tx.amount, 0);
      const debit = transactions
        .filter((tx) => tx.type === "expense" && tx.date === dateStr)
        .reduce((s, tx) => s + tx.amount, 0);
      days.push({ label: DAY_NAMES[i], dateStr, credit, debit });
    }
    return days;
  }, [transactions, weekRange]);

  const maxDayVal = Math.max(...weekDailyData.map((d) => Math.max(d.credit, d.debit)), 1);

  // ── Filtered transaction list ───────────────────────────
  const filteredTxs = useMemo(
    () =>
      transactions
        .filter((tx) => {
          if (activeToggle === "income") return tx.type === "income_salary" || tx.type === "income_topup";
          return tx.type === "expense";
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, activeToggle]
  );

  const navigateWeek = (dir: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + dir * 7);
    setCurrentDate(next);
  };

  const totalBalance = monthlyCredits - monthlyDebits;

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
        <span className="font-display font-bold text-lg text-text">Weekly Report</span>
        <div className="w-11" />
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between bg-cardBg border border-stroke rounded-full p-1.5 mb-5 max-w-xs mx-auto">
        <button
          onClick={() => navigateWeek(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-textDim hover:text-text hover:bg-surface transition-all"
        >
          <CaretLeft size={14} />
        </button>
        <span className="text-[12px] font-semibold text-text">{weekRange.label}</span>
        <button
          onClick={() => navigateWeek(1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-textDim hover:text-text hover:bg-surface transition-all"
        >
          <CaretRight size={14} />
        </button>
      </div>

      {/* Month Label */}
      <div className="text-center mb-4">
        <div className="text-[11px] font-bold text-textDim/40 uppercase tracking-wider">
          {monthRange.label}
        </div>
      </div>

      {/* Monthly Totals */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="bg-[#5CB010]/8 border border-[#5CB010]/15 rounded-[18px] px-3 py-3 text-center">
          <div className="text-[10px] font-bold text-[#5CB010]/70 uppercase tracking-wider">Credit</div>
          <div className="font-display font-bold text-[16px] text-[#5CB010] mt-1">
            {cur.symbol} {monthlyCredits.toLocaleString(cur.locale)}
          </div>
        </div>
        <div className="bg-[#EF4444]/8 border border-[#EF4444]/15 rounded-[18px] px-3 py-3 text-center">
          <div className="text-[10px] font-bold text-[#EF4444]/70 uppercase tracking-wider">Debit</div>
          <div className="font-display font-bold text-[16px] text-[#EF4444] mt-1">
            {cur.symbol} {monthlyDebits.toLocaleString(cur.locale)}
          </div>
        </div>
        <div className="bg-cardBg border border-stroke rounded-[18px] px-3 py-3 text-center">
          <div className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider">Net</div>
          <div
            className="font-display font-bold text-[16px] mt-1"
            style={{ color: totalBalance >= 0 ? "#5CB010" : "#EF4444" }}
          >
            {cur.symbol} {totalBalance.toLocaleString(cur.locale)}
          </div>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="bg-cardBg border border-stroke rounded-[20px] p-4 mb-5">
        <div className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider mb-3">
          This Week
        </div>
        <div className="flex items-end justify-between gap-1.5 h-[120px]">
          {weekDailyData.map((day, i) => {
            const creditH = maxDayVal > 0 ? (day.credit / maxDayVal) * 100 : 0;
            const debitH = maxDayVal > 0 ? (day.debit / maxDayVal) * 100 : 0;
            const isToday = day.dateStr === toDateStr(new Date());
            return (
              <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                {/* Bars */}
                <div className="flex items-end gap-[2px] h-[90px] w-full justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(creditH, 2)}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="w-[45%] max-w-[14px] rounded-t-md bg-[#5CB010]"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(debitH, 2)}%` }}
                    transition={{ delay: i * 0.05 + 0.1, duration: 0.4 }}
                    className="w-[45%] max-w-[14px] rounded-t-md bg-[#EF4444]"
                  />
                </div>
                {/* Label */}
                <span
                  className={`text-[9px] font-bold ${isToday ? "text-[#5CB010]" : "text-textDim/50"}`}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#5CB010]" />
            <span className="text-[9px] font-semibold text-textDim/50">Credit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <span className="text-[9px] font-semibold text-textDim/50">Debit</span>
          </div>
        </div>
      </div>

      {/* Toggle: Credit / Debit */}
      <div className="flex bg-cardBg border border-stroke rounded-full p-1 mb-5">
        <button
          onClick={() => setActiveToggle("income")}
          className={`flex-1 py-2.5 rounded-full font-display font-bold text-[13px] transition-all ${
            activeToggle === "income"
              ? "bg-[#5CB010] text-[#050805] shadow-sm"
              : "text-textDim hover:text-text"
          }`}
        >
          Credit
        </button>
        <button
          onClick={() => setActiveToggle("spend")}
          className={`flex-1 py-2.5 rounded-full font-display font-bold text-[13px] transition-all ${
            activeToggle === "spend"
              ? "bg-[#EF4444] text-white shadow-sm"
              : "text-textDim hover:text-text"
          }`}
        >
          Debit
        </button>
      </div>

      {/* Transaction List */}
      <div className="pb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display font-bold text-[15px] text-text">
            {activeToggle === "income" ? "Credit History" : "Debit History"}
          </span>
          <span className="text-[11px] font-semibold text-textDim/40">
            {filteredTxs.length} items
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {filteredTxs.length > 0 ? (
            filteredTxs.map((tx, i) => {
              const Icon = getIcon(tx);
              const isIncome = tx.type === "income_salary" || tx.type === "income_topup";
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-3.5 py-3 bg-cardBg border border-stroke rounded-[18px]"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: getIconBg(tx) }}
                  >
                    <Icon size={16} weight="light" color="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-text truncate">{tx.name}</div>
                    <div className="text-[10px] text-textDim/50 mt-0.5">
                      {tx.date &&
                        new Date(tx.date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                    </div>
                  </div>
                  <div
                    className="font-display font-bold text-[13px]"
                    style={{ color: isIncome ? "#5CB010" : "#EF4444" }}
                  >
                    {isIncome ? "+" : "-"}{cur.symbol} {tx.amount.toLocaleString(cur.locale)}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-8 text-[12px] text-textDim/40">No entries yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
