import { motion } from "framer-motion";
import { useStore, getCurrencyInfo } from "../context/StoreContext";

interface StatPillsProps {
  onToReceiveClick?: () => void;
}

export default function StatPills({ onToReceiveClick }: StatPillsProps) {
  const { transactions, currency } = useStore();
  const cur = getCurrencyInfo(currency);

  // Calculate stats from actual transactions
  const credited = transactions
    .filter((tx) => tx.type === "income_salary" || tx.type === "income_topup")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const debited = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // To Receive = (money given away with love) - (money received back with love)
  const givenWithLove = transactions
    .filter((tx) => tx.category === "with_love" && tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const receivedBack = transactions
    .filter((tx) => tx.category === "with_love" && (tx.type === "income_salary" || tx.type === "income_topup"))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const toReceive = Math.max(0, givenWithLove - receivedBack);

  const stats = [
    { label: "Credited", value: `${cur.symbol} ${credited.toLocaleString(cur.locale)}`, color: "#5CB010", actionable: false },
    { label: "Debited", value: `${cur.symbol} ${debited.toLocaleString(cur.locale)}`, color: "#ff7a6b", actionable: false },
    { label: "To Receive", value: `${cur.symbol} ${toReceive.toLocaleString(cur.locale)}`, color: "#F59E0B", actionable: toReceive > 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex gap-2.5 px-5 pt-4"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          onClick={s.actionable ? onToReceiveClick : undefined}
          className={`flex-1 bg-surface border border-stroke rounded-[18px] px-3.5 py-3 ${
            s.actionable ? "cursor-pointer active:scale-95 transition-all hover:border-[#F59E0B]/30" : ""
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-textDim">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </div>
          <div className="font-display font-bold text-[17px] mt-1.5 text-text">{s.value}</div>
        </div>
      ))}
    </motion.div>
  );
}
