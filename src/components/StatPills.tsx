import { motion } from "framer-motion";

const stats = [
  { label: "Income", value: "₹42,000", color: "#3fe07e" },
  { label: "Spent", value: "₹9,845", color: "#ff7a6b" },
  { label: "Saved", value: "₹32,155", color: "#ffcf6b" },
];

export default function StatPills() {
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
