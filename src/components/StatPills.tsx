import { motion } from "framer-motion";
import { useStore } from "../context/StoreContext";

export default function StatPills() {
  const { transactions } = useStore();

  // Calculate stats from actual transactions
  const credited = transactions
    .filter((tx) => tx.type === "income_salary" || tx.type === "income_topup")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const debited = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const toReceive = transactions
    .filter((tx) => tx.type === "transfer" && tx.bucket === "account")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const stats = [
    { label: "Credited", value: `₹${credited.toLocaleString("en-IN")}`, color: "#5CB010" },
    { label: "Debited", value: `₹${debited.toLocaleString("en-IN")}`, color: "#ff7a6b" },
    { label: "To Receive", value: `₹${toReceive.toLocaleString("en-IN")}`, color: "#F59E0B" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex gap-2.5 px-5 pt-4"
    >
      {stats.map((s) => (
        <div key={s.label} className="flex-1 bg-surface border border-stroke rounded-[18px] px-3.5 py-3">
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
