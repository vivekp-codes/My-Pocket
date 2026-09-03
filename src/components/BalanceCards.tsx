import { motion } from "framer-motion";
import CountUp from "./CountUp";

interface BalanceCardsProps {
  liquidAmount: number;
  accountAmount: number;
}

function PulsingDot({ color }: { color: string }) {
  return <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />;
}

export default function BalanceCards({ liquidAmount, accountAmount }: BalanceCardsProps) {
  return (
    <div className="flex gap-2.5 px-5 pt-3">
      {/* In Hand */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.12, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex-1 bg-cardBg border border-stroke rounded-[16px] p-3"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <PulsingDot color="#5CB010" />
          <span className="text-[10px] font-bold text-textDim/60 uppercase tracking-wider">
            In Hand
          </span>
        </div>
        <div className="font-display font-bold text-[16px] text-text leading-none">
          <span className="text-textDim/40 mr-1">₹</span>
          <CountUp target={liquidAmount} prefix="" />
        </div>
      </motion.div>

      {/* Account */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
        className="flex-1 bg-cardBg border border-stroke rounded-[16px] p-3"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <PulsingDot color="#F59E0B" />
          <span className="text-[10px] font-bold text-textDim/60 uppercase tracking-wider">
            Account
          </span>
        </div>
        <div className="font-display font-bold text-[16px] text-text leading-none">
          <span className="text-textDim/40 mr-1">₹</span>
          <CountUp target={accountAmount} prefix="" />
        </div>
      </motion.div>
    </div>
  );
}