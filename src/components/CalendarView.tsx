import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CaretLeft, CaretRight, CaretDown, X } from "phosphor-react";
import { useStore, getCurrencyInfo } from "../context/StoreContext";
import type { Transaction } from "../types/transaction";

interface CalendarViewProps {
  onBack?: () => void;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Local YYYY-MM-DD — safe for comparing against tx.date (also local).
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarView({ onBack }: CalendarViewProps) {
  const { transactions, currency } = useStore();
  const cur = getCurrencyInfo(currency);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    toDateStr(new Date())
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // ── Calendar grid ──────────────────────────────────────
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon=0
    const totalDays = lastDay.getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  }, [year, month]);

  // ── Transaction map by date ────────────────────────────
  const txByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
      if (!map[tx.date]) map[tx.date] = [];
      map[tx.date].push(tx);
    });
    return map;
  }, [transactions]);

  // ── Selected day transactions ──────────────────────────
  const selectedTxs = selectedDate ? txByDate[selectedDate] || [] : [];
  const selectedCredits = selectedTxs
    .filter((tx) => tx.type === "income_salary" || tx.type === "income_topup")
    .reduce((s, tx) => s + tx.amount, 0);
  const selectedDebits = selectedTxs
    .filter((tx) => tx.type === "expense")
    .reduce((s, tx) => s + tx.amount, 0);

  const navigateMonth = (dir: number) => {
    const next = new Date(year, month + dir, 1);
    setCurrentDate(next);
    setSelectedDate(null);
  };

  const today = toDateStr(new Date());
  const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // ── Month totals for current month ────────────────────
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthCredits = transactions
    .filter((tx) => tx.date.startsWith(monthPrefix) && (tx.type === "income_salary" || tx.type === "income_topup"))
    .reduce((s, tx) => s + tx.amount, 0);
  const monthDebits = transactions
    .filter((tx) => tx.date.startsWith(monthPrefix) && tx.type === "expense")
    .reduce((s, tx) => s + tx.amount, 0);
  const monthNet = monthCredits - monthDebits;

  // ── Weekly breakdown of the selected month (real Mon–Sun weeks) ──
  const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fmtDay = (d: Date) => `${DAY_ABBR[d.getDay()]} ${d.getDate()}`;

  const monthWeeks = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    // Monday of the week containing the 1st of the month
    const dow = firstOfMonth.getDay(); // 0 = Sun
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(firstOfMonth);
    monday.setDate(firstOfMonth.getDate() + diffToMonday);

    const result: { week: number; startStr: string; endStr: string; startLabel: string; endLabel: string; credits: number; debits: number }[] = [];
    let cursor = new Date(monday);
    let week = 1;

    while (cursor <= lastOfMonth) {
      const sunday = new Date(cursor);
      sunday.setDate(cursor.getDate() + 6);

      // Clamp to the month
      const start = cursor < firstOfMonth ? new Date(firstOfMonth) : new Date(cursor);
      const end = sunday > lastOfMonth ? new Date(lastOfMonth) : new Date(sunday);

      const startStr = toDateStr(start);
      const endStr = toDateStr(end);

      const credits = transactions
        .filter((tx) => tx.date >= startStr && tx.date <= endStr && (tx.type === "income_salary" || tx.type === "income_topup"))
        .reduce((s, tx) => s + tx.amount, 0);
      const debits = transactions
        .filter((tx) => tx.date >= startStr && tx.date <= endStr && tx.type === "expense")
        .reduce((s, tx) => s + tx.amount, 0);

      result.push({ week, startStr, endStr, startLabel: fmtDay(start), endLabel: fmtDay(end), credits, debits });

      // Next Monday
      cursor = new Date(sunday);
      cursor.setDate(cursor.getDate() + 1);
      week++;
    }
    return result;
  }, [year, month, transactions]);

  const maxWeekVal = Math.max(...monthWeeks.map((w) => Math.max(w.credits, w.debits)), 1);

  // ── Month picker modal state ──────────────────────────
  const [showMonthPicker, setShowMonthPicker] = useState(false);

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
        <span className="font-display font-bold text-lg text-text">Calendar</span>
        <div className="w-11" />
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-cardBg border border-stroke rounded-full p-1.5 mb-4 max-w-xs mx-auto">
        <button
          onClick={() => navigateMonth(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-textDim hover:text-text hover:bg-surface transition-all"
        >
          <CaretLeft size={14} />
        </button>
        <span className="text-[12.5px] font-semibold text-text">{monthLabel}</span>
        <button
          onClick={() => navigateMonth(1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-textDim hover:text-text hover:bg-surface transition-all"
        >
          <CaretRight size={14} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-cardBg border border-stroke rounded-[20px] p-3 mb-5">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[9px] font-bold text-textDim/40 uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayTxs = txByDate[dateStr] || [];
            const hasCredit = dayTxs.some((tx) => tx.type === "income_salary" || tx.type === "income_topup");
            const hasDebit = dayTxs.some((tx) => tx.type === "expense");
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                  isSelected
                    ? "bg-[#5CB010]/15 border border-[#5CB010]/30"
                    : isToday
                    ? "border border-[#5CB010]/40"
                    : "hover:bg-surface"
                }`}
              >
                <span
                  className={`text-[12px] font-semibold ${
                    isToday ? "text-[#5CB010] font-bold" : isSelected ? "text-[#5CB010]" : "text-text"
                  }`}
                >
                  {day}
                </span>
                {/* Dots */}
                {(hasCredit || hasDebit) && (
                  <div className="flex gap-[3px] mt-1">
                    {hasCredit && <div className="w-[4px] h-[4px] rounded-full bg-[#5CB010]" />}
                    {hasDebit && <div className="w-[4px] h-[4px] rounded-full bg-[#EF4444]" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-5"
          >
            {/* Day Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[13px] font-bold text-text">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="text-[10px] text-textDim/40 mt-0.5">
                  {selectedTxs.length} transaction{selectedTxs.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Day Totals */}
            {(selectedCredits > 0 || selectedDebits > 0) && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {selectedCredits > 0 && (
                  <div className="bg-[#5CB010]/8 border border-[#5CB010]/15 rounded-xl px-2.5 py-2 text-center">
                    <div className="text-[8px] font-bold text-[#5CB010]/60 uppercase">Credit</div>
                    <div className="font-display font-bold text-[13px] text-[#5CB010] mt-0.5">
                      {cur.symbol} {selectedCredits.toLocaleString(cur.locale)}
                    </div>
                  </div>
                )}
                {selectedDebits > 0 && (
                  <div className="bg-[#EF4444]/8 border border-[#EF4444]/15 rounded-xl px-2.5 py-2 text-center">
                    <div className="text-[8px] font-bold text-[#EF4444]/60 uppercase">Debit</div>
                    <div className="font-display font-bold text-[13px] text-[#EF4444] mt-0.5">
                      {cur.symbol} {selectedDebits.toLocaleString(cur.locale)}
                    </div>
                  </div>
                )}
                <div className="bg-cardBg border border-stroke rounded-xl px-2.5 py-2 text-center">
                  <div className="text-[8px] font-bold text-textDim/40 uppercase">Net</div>
                  <div
                    className="font-display font-bold text-[13px] mt-0.5"
                    style={{ color: selectedCredits - selectedDebits >= 0 ? "#5CB010" : "#EF4444" }}
                  >
                    {cur.symbol} {(selectedCredits - selectedDebits).toLocaleString(cur.locale)}
                  </div>
                </div>
              </div>
            )}          </motion.div>
        )}
      </AnimatePresence>

      {/* Month Summary Card */}
      <div className="bg-cardBg border border-stroke rounded-[20px] p-4 mb-5">
        {/* Month selector button */}
        <button
          onClick={() => setShowMonthPicker(true)}
          className="w-full flex items-center justify-between mb-3"
        >
          <span className="text-[11px] font-bold text-text">{monthLabel}</span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#5CB010]">
            Change <CaretDown size={12} />
          </span>
        </button>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#5CB010]/8 border border-[#5CB010]/15 rounded-xl px-2.5 py-2.5 text-center">
            <div className="text-[8px] font-bold text-[#5CB010]/60 uppercase tracking-wider">Credit</div>
            <div className="font-display font-bold text-[14px] text-[#5CB010] mt-0.5">
              {cur.symbol} {monthCredits.toLocaleString(cur.locale)}
            </div>
          </div>
          <div className="bg-[#EF4444]/8 border border-[#EF4444]/15 rounded-xl px-2.5 py-2.5 text-center">
            <div className="text-[8px] font-bold text-[#EF4444]/60 uppercase tracking-wider">Spend</div>
            <div className="font-display font-bold text-[14px] text-[#EF4444] mt-0.5">
              {cur.symbol} {monthDebits.toLocaleString(cur.locale)}
            </div>
          </div>
          <div className="bg-cardBg border border-stroke rounded-xl px-2.5 py-2.5 text-center">
            <div className="text-[8px] font-bold text-textDim/40 uppercase tracking-wider">Net</div>
            <div
              className="font-display font-bold text-[14px] mt-0.5"
              style={{ color: monthNet >= 0 ? "#5CB010" : "#EF4444" }}
            >
              {cur.symbol} {monthNet.toLocaleString(cur.locale)}
            </div>
          </div>
        </div>

        {/* Weekly breakdown */}
        <div className="mt-4 pt-3 border-t border-stroke">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[9px] font-bold text-textDim/40 uppercase tracking-wider">
              Weekly Breakdown
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5CB010]" />
                <span className="text-[8px] font-semibold text-textDim/40">Credit</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                <span className="text-[8px] font-semibold text-textDim/40">Spend</span>
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {monthWeeks.map((w, i) => {
              const creditPct = (w.credits / maxWeekVal) * 100;
              const debitPct = (w.debits / maxWeekVal) * 100;
              return (
                <div key={w.week}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-textDim/60">
                      Week {w.week} · {w.startLabel} – {w.endLabel}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[9.5px] font-display font-bold text-[#5CB010]">
                        +{cur.symbol}{w.credits.toLocaleString(cur.locale)}
                      </span>
                      <span className="text-[9.5px] font-display font-bold text-[#EF4444]">
                        -{cur.symbol}{w.debits.toLocaleString(cur.locale)}
                      </span>
                    </span>
                  </div>
                  <div className="flex gap-[2px] h-[6px] rounded-full overflow-hidden bg-surface">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${creditPct}%` }}
                      transition={{ delay: i * 0.06, duration: 0.5 }}
                      className="h-full bg-[#5CB010] rounded-l-full"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${debitPct}%` }}
                      transition={{ delay: i * 0.06 + 0.1, duration: 0.5 }}
                      className="h-full bg-[#EF4444]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Month Picker Modal */}
      <AnimatePresence>
        {showMonthPicker && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMonthPicker(false)}
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
                  <h3 className="font-display font-bold text-base text-text">Select Month</h3>
                  <button
                    onClick={() => setShowMonthPicker(false)}
                    className="w-8 h-8 rounded-full bg-textFaint/10 flex items-center justify-center text-textDim hover:text-text transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Month grid */}
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = new Date(currentDate.getFullYear(), i, 1);
                    const mLabel = m.toLocaleDateString("en-US", { month: "short" });
                    const isCurrent = i === month;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentDate(new Date(year, i, 1));
                          setSelectedDate(null);
                          setShowMonthPicker(false);
                        }}
                        className={`py-3 rounded-xl border text-[12px] font-semibold transition-all ${
                          isCurrent
                            ? "bg-[#5CB010]/10 border-[#5CB010]/30 text-[#5CB010]"
                            : "bg-cardBg border-stroke text-textDim hover:border-[#5CB010]/20"
                        }`}
                      >
                        {mLabel}
                        <div className={`text-[9px] font-normal ${isCurrent ? "text-[#5CB010]/70" : "text-textDim/40"}`}>
                          {m.getFullYear()}
                        </div>
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
