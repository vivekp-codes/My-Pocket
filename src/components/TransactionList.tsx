import { motion } from "framer-motion";
import type { Transaction } from "../types/transaction";

function TransactionRow({ tx, delay }: { tx: Transaction; delay: number }) {
  const positive = tx.type === "income_salary" || tx.type === "income_topup";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}
      whileTap={{ scale: 0.98, backgroundColor: "#1c2c22" }}
      className="flex items-center gap-3.5 px-4 py-3.5 bg-cardBg border border-white/[0.03] rounded-[22px] mb-2.5 last:mb-0 shadow-[0_4px_12px_rgba(0,0,0,0.1)] cursor-pointer"
    >
      <div
        className="relative w-[44px] h-[44px] rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0 text-[#eafff0]"
        style={{ background: tx.iconBg || "#1c2a20" }}
      >
        {tx.icon}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-[16px] h-[16px] rounded-full flex items-center justify-center border-2 border-[#131f18]"
          style={{ background: positive ? "#bdff80" : "#242f28" }}
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke={positive ? "#06150d" : "#8fa39a"}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {positive ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
          </svg>
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[14.5px] font-semibold text-text tracking-wide">{tx.name}</div>
        <div className="text-xs text-textDim/65 mt-0.5">{tx.meta}</div>
      </div>

      <div
        className="font-display font-bold text-[14.5px] whitespace-nowrap"
        style={{ color: positive ? "#bdff80" : "#f4f7f3" }}
      >
        {Math.abs(tx.amount).toLocaleString("en-US")} {tx.currency || "USD"}
      </div>
    </motion.div>
  );
}

export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="font-display font-bold text-lg text-text">Transactions</div>
        <div className="text-xs font-semibold text-[#bdff80] hover:underline cursor-pointer">See all</div>
      </div>
      <div className="flex flex-col">
        {transactions.map((tx, i) => (
          <TransactionRow key={tx.id} tx={tx} delay={0.22 + i * 0.05} />
        ))}
      </div>
    </div>
  );
}
