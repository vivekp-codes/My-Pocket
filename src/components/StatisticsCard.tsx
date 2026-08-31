import { useState } from "react";
import { transactions } from "../data/transactions";

interface StatisticsCardProps {
  onBack?: () => void;
}

export default function StatisticsCard({ onBack }: StatisticsCardProps) {
  const [activeToggle, setActiveToggle] = useState<"income" | "spend">("income");
  const currentDate = "Thu, 13 April 2023";

  // Filter transactions based on toggle
  const filteredTxs = transactions.filter((tx) => {
    if (activeToggle === "income") {
      return tx.type === "income_salary" || tx.type === "income_topup";
    } else {
      return tx.type === "expense";
    }
  });

  return (
    <div className="px-5 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-full bg-surface border border-stroke flex items-center justify-center text-text hover:bg-stroke active:scale-95 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <span className="font-display font-bold text-lg text-text">Statistic</span>
        <div className="w-11" /> {/* spacer */}
      </div>

      {/* Date Switcher */}
      <div className="flex items-center justify-between bg-cardBg border border-white/[0.03] rounded-full p-1.5 mb-6 max-w-xs mx-auto">
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-textFaint hover:text-text hover:bg-surface">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[12.5px] font-semibold text-text">{currentDate}</span>
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-textFaint hover:text-text hover:bg-surface">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Current Balance Overview */}
      <div className="text-center mb-6">
        <div className="font-display font-bold text-[34px] text-text leading-none tracking-tight">
          $ 231,560.00
        </div>
        <div className="text-xs text-textDim/50 mt-1 font-semibold uppercase tracking-wider">Current Balance</div>
      </div>

      {/* Chart Area */}
      <div className="relative w-full h-[180px] bg-cardBg/30 border border-white/[0.02] rounded-[24px] p-4 mb-6 select-none overflow-hidden">
        {/* Tooltip Overlay */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: "70.3%", // aligned with Thursday point x=225 on 320 width viewbox
            top: "22%", // aligned with y=30
            transform: "translate(-50%, -100%) translateY(-10px)",
          }}
        >
          <div className="bg-[#bdff80] text-bg text-[10.5px] font-bold px-2 py-1 rounded-lg shadow-lg relative whitespace-nowrap">
            +$3,212 Thu, Apr 2023
            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#bdff80] rotate-45" />
          </div>
        </div>

        {/* SVG Bezier Chart */}
        <svg viewBox="0 0 320 160" width="100%" height="100%" className="overflow-visible">
          <defs>
            {/* Horizontal Grid lines */}
            <pattern id="grid" width="320" height="30" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="320" y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
            </pattern>
            {/* Shaded Area Under Line */}
            <linearGradient id="chart-fill-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bdff80" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#bdff80" stopOpacity="0.0" />
            </linearGradient>
            {/* Thursday Column Highlight Gradient */}
            <linearGradient id="col-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bdff80" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#bdff80" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <rect width="320" height="150" fill="url(#grid)" opacity="0.8" />

          {/* Thursday Highlight Column */}
          <rect x="210" y="15" width="30" height="135" fill="url(#col-grad)" rx="6" />

          {/* Gradient Fill under Line */}
          <path
            d="M 30 120 C 62.5 95, 62.5 70, 95 70 C 127.5 70, 127.5 95, 160 95 C 192.5 95, 192.5 30, 225 30 C 257.5 30, 257.5 85, 290 85 L 290 150 L 30 150 Z"
            fill="url(#chart-fill-grad)"
          />

          {/* Smooth Bezier Curve Line */}
          <path
            d="M 30 120 C 62.5 95, 62.5 70, 95 70 C 127.5 70, 127.5 95, 160 95 C 192.5 95, 192.5 30, 225 30 C 257.5 30, 257.5 85, 290 85"
            fill="none"
            stroke="#bdff80"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Active Highlight Points */}
          <circle cx="225" cy="30" r="5" fill="#bdff80" />
          <circle cx="225" cy="30" r="9" stroke="#bdff80" strokeWidth="2" fill="none" className="animate-ping origin-center" style={{ animationDuration: '3s' }} />

          {/* Other Data Points */}
          <circle cx="30" cy="120" r="3.5" fill="#182a20" stroke="#bdff80" strokeWidth="2" />
          <circle cx="95" cy="70" r="3.5" fill="#182a20" stroke="#bdff80" strokeWidth="2" />
          <circle cx="160" cy="95" r="3.5" fill="#182a20" stroke="#bdff80" strokeWidth="2" />
          <circle cx="290" cy="85" r="3.5" fill="#182a20" stroke="#bdff80" strokeWidth="2" />
        </svg>

        {/* X-Axis Labels */}
        <div className="flex justify-between px-3 text-[10px] font-bold text-textDim/50 mt-1">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span className="text-[#bdff80]">Thu</span>
          <span>Fri</span>
        </div>
      </div>

      {/* Switcher Toggle Pill */}
      <div className="flex bg-cardBg border border-white/[0.03] rounded-full p-1 mb-6">
        <button
          onClick={() => setActiveToggle("income")}
          className={`flex-1 py-2.5 rounded-full font-display font-bold text-sm transition-all ${
            activeToggle === "income" ? "bg-[#bdff80] text-bg shadow-sm" : "text-textDim hover:text-text"
          }`}
        >
          Income
        </button>
        <button
          onClick={() => setActiveToggle("spend")}
          className={`flex-1 py-2.5 rounded-full font-display font-bold text-sm transition-all ${
            activeToggle === "spend" ? "bg-[#bdff80] text-bg shadow-sm" : "text-textDim hover:text-text"
          }`}
        >
          Spend
        </button>
      </div>

      {/* Dynamic Filtered List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="font-display font-bold text-base text-text">
            {activeToggle === "income" ? "Income History" : "Spend History"}
          </span>
          <span className="text-xs font-semibold text-[#bdff80] cursor-pointer hover:underline">See all</span>
        </div>

        <div className="flex flex-col gap-2.5 pb-6">
          {filteredTxs.length > 0 ? (
            filteredTxs.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3.5 px-4 py-3 bg-cardBg border border-white/[0.03] rounded-[22px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-xs text-[#eafff0]"
                  style={{ background: tx.iconBg || "#1c2a20" }}
                >
                  {tx.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text tracking-wide">{tx.name}</div>
                  <div className="text-[11px] text-textDim/60 mt-0.5">{tx.meta}</div>
                </div>
                <div className="font-display font-bold text-sm text-text">
                  {Math.abs(tx.amount).toLocaleString("en-US")} {tx.currency || "USD"}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-textDim/40">No entries recorded</div>
          )}
        </div>
      </div>
    </div>
  );
}
