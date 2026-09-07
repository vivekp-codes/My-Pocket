import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarBlank,
  TrendDown,
  Wallet,
  Receipt,
  ChartBar,
  Trophy,
  Medal,
} from "phosphor-react";
import { useStore, getCurrencyInfo } from "../context/StoreContext";

interface ReportsProps {
  onBack?: () => void;
}

// ── Helpers ────────────────────────────────────────────────
function getWeekRange(date: Date): { start: Date; end: Date; label: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  const fmt = (dt: Date) => dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { start, end, label: `${fmt(start)} – ${fmt(end)}` };
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  color: string;
  delay?: number;
}

function StatCard({ icon, label, value, sublabel, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className="bg-cardBg border border-stroke rounded-[20px] p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          {icon}
        </div>
        <span className="text-[11px] font-bold text-textDim/60 uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-display font-bold text-[19px] text-text" style={{ color }}>
        {value}
      </div>
      {sublabel && <div className="text-[10.5px] text-textDim/45 mt-1">{sublabel}</div>}
    </motion.div>
  );
}

export default function Reports({ onBack }: ReportsProps) {
  const { transactions, currency } = useStore();
  const cur = getCurrencyInfo(currency);
  const now = new Date();

  // ── Current week ───────────────────────────────────────
  const weekRange = useMemo(() => getWeekRange(now), []);
  const weekStartStr = weekRange.start.toISOString().split("T")[0];
  const weekEndStr = weekRange.end.toISOString().split("T")[0];

  // ── This month range ──────────────────────────────────
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthStartStr = monthStart.toISOString().split("T")[0];
  const monthEndStr = monthEnd.toISOString().split("T")[0];
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const todayStr = now.toISOString().split("T")[0];

  // ── Spending = expenses (debits) ──────────────────────
  const expenses = useMemo(
    () => transactions.filter((tx) => tx.type === "expense"),
    [transactions]
  );

  // Daily spending (today)
  const dailySpend = expenses
    .filter((tx) => tx.date === todayStr)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Weekly spending (current week — stays until month ends)
  const weeklySpend = expenses
    .filter((tx) => tx.date >= weekStartStr && tx.date <= weekEndStr)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Monthly spending
  const monthlySpend = expenses
    .filter((tx) => tx.date >= monthStartStr && tx.date <= monthEndStr)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // ── Per-day spending for highest/lowest day ───────────
  const daySpendingMap = useMemo(() => {
    const map: Record<string, number> = {};
    expenses
      .filter((tx) => tx.date >= monthStartStr && tx.date <= monthEndStr)
      .forEach((tx) => {
        map[tx.date] = (map[tx.date] || 0) + tx.amount;
      });
    return map;
  }, [expenses, monthStartStr, monthEndStr]);

  const dayEntries = Object.entries(daySpendingMap).sort((a, b) => b[1] - a[1]);
  const highestDay = dayEntries[0];
  const lowestDay = dayEntries[dayEntries.length - 1];

  const fmtDay = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  // ── Per-week spending for highest/lowest week ─────────
  const weekSpendingMap = useMemo(() => {
    const map: Record<string, number> = {};
    // Build all weeks in the month
    const weeks: { start: Date; label: string }[] = [];
    let cursor = new Date(monthStart);
    while (cursor <= monthEnd) {
      const wr = getWeekRange(cursor);
      weeks.push({ start: new Date(wr.start), label: wr.label });
      cursor = new Date(wr.start);
      cursor.setDate(cursor.getDate() + 7);
    }
    weeks.forEach((w) => {
      const s = w.start.toISOString().split("T")[0];
      const e = new Date(w.start);
      e.setDate(e.getDate() + 6);
      const eStr = e.toISOString().split("T")[0];
      const total = expenses
        .filter((tx) => tx.date >= s && tx.date <= eStr)
        .reduce((sum, tx) => sum + tx.amount, 0);
      map[w.label] = total;
    });
    return map;
  }, [expenses, monthStart, monthEnd]);

  const weekEntries = Object.entries(weekSpendingMap).sort((a, b) => b[1] - a[1]);
  const highestWeek = weekEntries[0];
  const lowestWeek = weekEntries[weekEntries.length - 1];

  const fmtAmount = (n: number) => `${cur.symbol} ${n.toLocaleString(cur.locale)}`;

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
        <span className="font-display font-bold text-lg text-text">Reports</span>
        <div className="w-11" />
      </div>

      {/* Current Week Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 p-4 rounded-[22px] relative overflow-hidden border border-[#5CB010]/20"
        style={{
          background:
            "linear-gradient(135deg, rgba(92,176,16,0.12) 0%, rgba(46,104,10,0.06) 60%, transparent 100%)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#5CB010]/20 flex items-center justify-center">
            <CalendarBlank size={16} weight="light" color="#5CB010" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-[#5CB010]">Current Week</div>
            <div className="text-[10.5px] text-textDim/50">{weekRange.label}</div>
          </div>
        </div>
        <div className="flex items-end justify-between mt-2">
          <div>
            <div className="text-[10px] font-bold text-textDim/50 uppercase tracking-wider mb-1">
              Spent This Week
            </div>
            <div className="font-display font-bold text-[26px] text-[#EF4444] leading-none">
              {fmtAmount(weeklySpend)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-textDim/50 uppercase tracking-wider mb-1">
              Monthly Total
            </div>
            <div className="font-display font-bold text-[17px] text-text leading-none">
              {fmtAmount(monthlySpend)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Daily / Weekly / Monthly Cards */}
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <StatCard
          delay={0.05}
          icon={<TrendDown size={15} weight="light" color="#EF4444" />}
          label="Daily Spending"
          value={fmtAmount(dailySpend)}
          sublabel={new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          color="#EF4444"
        />
        <StatCard
          delay={0.1}
          icon={<ChartBar size={15} weight="light" color="#F59E0B" />}
          label="Weekly Spending"
          value={fmtAmount(weeklySpend)}
          sublabel={weekRange.label}
          color="#F59E0B"
        />
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <StatCard
          delay={0.15}
          icon={<Wallet size={15} weight="light" color="#5CB010" />}
          label="Monthly Spending"
          value={fmtAmount(monthlySpend)}
          sublabel={monthLabel}
          color="#5CB010"
        />
        <StatCard
          delay={0.2}
          icon={<Receipt size={15} weight="light" color="#8B2252" />}
          label="Calendar Data"
          value={`${Object.keys(daySpendingMap).length} days`}
          sublabel={`Active days in ${monthLabel}`}
          color="#8B2252"
        />
      </div>

      {/* Highest / Lowest Day */}
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <StatCard
          delay={0.25}
          icon={<Trophy size={15} weight="light" color="#F59E0B" />}
          label="Highest Day"
          value={highestDay ? fmtAmount(highestDay[1]) : "—"}
          sublabel={highestDay ? fmtDay(highestDay[0]) : "No data this month"}
          color="#F59E0B"
        />
        <StatCard
          delay={0.3}
          icon={<Medal size={15} weight="light" color="#5CB010" />}
          label="Lowest Day"
          value={lowestDay ? fmtAmount(lowestDay[1]) : "—"}
          sublabel={lowestDay ? fmtDay(lowestDay[0]) : "No data this month"}
          color="#5CB010"
        />
      </div>

      {/* Highest / Lowest Week */}
      <div className="grid grid-cols-2 gap-2.5 pb-6">
        <StatCard
          delay={0.35}
          icon={<Trophy size={15} weight="light" color="#F59E0B" />}
          label="Highest Week"
          value={highestWeek ? fmtAmount(highestWeek[1]) : "—"}
          sublabel={highestWeek ? highestWeek[0] : "No data this month"}
          color="#F59E0B"
        />
        <StatCard
          delay={0.4}
          icon={<Medal size={15} weight="light" color="#5CB010" />}
          label="Lowest Week"
          value={lowestWeek ? fmtAmount(lowestWeek[1]) : "—"}
          sublabel={lowestWeek ? lowestWeek[0] : "No data this month"}
          color="#5CB010"
        />
      </div>
    </div>
  );
}