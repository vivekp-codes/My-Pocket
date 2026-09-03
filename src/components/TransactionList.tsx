import { useState } from "react";
import { motion } from "framer-motion";
import {
  ForkKnife,
  Car,
  Receipt,
  ShoppingBag,
  FilmStrip,
  CurrencyDollar,
  CreditCard,
  PlusCircle,
  ArrowsLeftRight,
  Briefcase,
  Heart,
} from "phosphor-react";
import type { Transaction } from "../types/transaction";
import type { ComponentType } from "react";

// ── Phosphor Icons by category ────────────────────────────────
const iconMap: Record<string, ComponentType<{ size?: number; weight?: string }>> = {
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

// ── Icon background colors ────────────────────────────────────
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

// ── Icon weights by category ──────────────────────────────────
const iconWeights: Record<string, "thin" | "light" | "regular" | "bold" | "fill" | "duotone"> = {
  food: "light",
  travel: "regular",
  bills: "light",
  shopping: "bold",
  entertainment: "duotone",
  other: "light",
  salary: "regular",
  with_love: "fill",
  topup: "fill",
  transfer: "light",
};

function getIconComponent(tx: Transaction): ComponentType<{ size?: number; weight?: string }> {
  if (tx.icon && iconMap[tx.icon]) return iconMap[tx.icon];
  if (tx.type === "income_salary") return iconMap.salary;
  if (tx.type === "income_topup") return iconMap.topup;
  if (tx.type === "transfer") return iconMap.transfer;
  return iconMap[tx.category || "other"] || iconMap.other;
}

function getIconWeight(tx: Transaction): string {
  if (tx.icon && iconWeights[tx.icon]) return iconWeights[tx.icon];
  if (tx.type === "income_salary") return iconWeights.salary;
  if (tx.type === "income_topup") return iconWeights.topup;
  if (tx.type === "transfer") return iconWeights.transfer;
  return iconWeights[tx.category || "other"] || iconWeights.other;
}

function getIconBg(tx: Transaction): string {
  if (tx.icon && iconBgColors[tx.icon]) return iconBgColors[tx.icon];
  if (tx.type === "income_salary") return iconBgColors.salary;
  if (tx.type === "income_topup") return iconBgColors.topup;
  if (tx.type === "transfer") return iconBgColors.transfer;
  return iconBgColors[tx.category || "other"] || "#1c2a20";
}

function TransactionRow({ tx, delay }: { tx: Transaction; delay: number }) {
  const positive = tx.type === "income_salary" || tx.type === "income_topup";
  const isReturnable = tx.category === "with_love";
  const IconComponent = getIconComponent(tx);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3.5 px-4 py-3.5 border border-white/[0.03] rounded-[22px] mb-2.5 last:mb-0 shadow-[0_4px_12px_rgba(0,0,0,0.1)] cursor-pointer"
      style={{
        background: positive
          ? "linear-gradient(135deg, rgba(92,176,16,0.06) 0%, transparent 60%)"
          : "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, transparent 60%)",
      }}
    >
      <div
        className="relative w-[44px] h-[44px] rounded-full flex items-center justify-center flex-shrink-0 text-white"
        style={{ background: getIconBg(tx) }}
      >
        <IconComponent size={20} weight={getIconWeight(tx)} color="white" />
        <span
          className="absolute -bottom-0.5 -right-0.5 w-[16px] h-[16px] rounded-full flex items-center justify-center border-2 border-cardBg"
          style={{ background: positive ? "#5CB010" : "#EF4444" }}
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke={positive ? "#050805" : "#ffffff"}
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
        <div className="text-xs text-textDim/65 mt-0.5 flex items-center gap-1.5">
          {tx.date && (
            <span className="capitalize">{new Date(tx.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          )}
          {tx.meta && <span>· {tx.meta}</span>}
          {tx.note && <span className="opacity-60">· {tx.note}</span>}
        </div>
      </div>

      <div
        className="font-display font-bold text-[14.5px] whitespace-nowrap"
        style={{ color: positive ? "#5CB010" : "#EF4444" }}
      >
        {positive ? "+" : "-"}₹ {Math.abs(tx.amount).toLocaleString("en-IN")}
      </div>
    </motion.div>
  );
}

const INITIAL_LIMIT = 10;

export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const [showAll, setShowAll] = useState(false);

  // Check if there's a wallet setup transaction
  const hasSetupTx = transactions.some((tx) => tx.name === "Wallet Setup Completed");
  const setupTx = transactions.find((tx) => tx.name === "Wallet Setup Completed");
  const otherTx = transactions.filter((tx) => tx.name !== "Wallet Setup Completed");

  const visibleTx = showAll ? otherTx : otherTx.slice(0, INITIAL_LIMIT);
  const hasMore = otherTx.length > INITIAL_LIMIT;

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="font-display font-bold text-lg text-text">History</div>
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-semibold text-[#5CB010] hover:underline cursor-pointer"
          >
            {showAll ? "Show less" : `See all (${otherTx.length})`}
          </button>
        )}
      </div>

      {/* Initial Wallet Setup Card */}
      {hasSetupTx && setupTx && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
          className="mb-3 p-4 bg-gradient-to-r from-[#5CB010]/10 via-[#2E680A]/10 to-transparent border border-[#5CB010]/20 rounded-[20px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5CB010]/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5CB010" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12V7H5a2 2 0 010-4h14v4" />
                <path d="M3 5v14a2 2 0 002 2h16v-5" />
                <path d="M18 12a2 2 0 000 4h4v-4h-4z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-text">Wallet Setup Completed</p>
              <p className="text-[11px] text-textDim/50">Initial balance added</p>
            </div>
            <p className="font-display font-bold text-[15px] text-[#5CB010]">
              +₹{setupTx.amount.toLocaleString("en-IN")}
            </p>
          </div>
        </motion.div>
      )}

      {/* Other Transactions */}
      <div className="flex flex-col">
        {visibleTx.map((tx, i) => (
          <TransactionRow key={tx.id} tx={tx} delay={0.22 + i * 0.05} />
        ))}
      </div>
    </div>
  );
}
