import { motion } from "framer-motion";
import CountUp from "./CountUp";
import { useStore, getCurrencyInfo } from "../context/StoreContext";

interface WalletCardProps {
  balance?: number;
}

export default function WalletCard({ balance = 0 }: WalletCardProps) {
  const { currency } = useStore();
  const cur = getCurrencyInfo(currency);
  const integerPart = Math.floor(balance);
  // Get decimals (up to 2 places)
  const decimalPart = (balance % 1).toFixed(2).substring(1); // e.g. ".40"

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
      className="px-5"
    >
      <div className="relative h-[196px] overflow-hidden rounded-[28px] isolate shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        {/* fluid organic texture — new palette */}
        <div
          className="absolute inset-0 scale-[1.1] saturate-[1.3] brightness-[1.05]"
          style={{
            background:
              "radial-gradient(circle at 85% 15%, #9AFF45 0%, transparent 60%)," +
              "radial-gradient(circle at 10% 25%, #73DA14 0%, transparent 55%)," +
              "radial-gradient(circle at 45% 90%, #2E680A 0%, transparent 70%)," +
              "radial-gradient(circle at 5% 95%, #0a1a06 0%, transparent 60%)," +
              "linear-gradient(155deg, #5CB010 0%, #2E680A 65%, #0a1a06 100%)",
          }}
        />
        {/* grain */}
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          }}
        />
        
        {/* Watermarked text */}
        <div className="absolute top-[20px] left-[10px] text-[75px] font-bold text-white/[0.03] select-none font-display pointer-events-none tracking-tighter leading-none">
          MY POCKET
        </div>

        {/* shade for text contrast */}
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(180deg, rgba(5,8,5,0) 30%, rgba(5,8,5,0.4) 100%)" }} />

        <div className="relative z-10 h-full flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 bg-[#9AFF45]/20 border border-white/10 backdrop-blur-md rounded-full py-1 px-3 text-[11px] font-bold text-[#eafff0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              Main Wallet
            </div>
            
            {/* Card circles — Visa/Mastercard style */}
            <div className="relative w-[42px] h-[26px]">
              <div className="absolute left-0 top-0 w-[26px] h-[26px] rounded-full bg-[#F59E0B]/80 mix-blend-screen" />
              <div className="absolute right-0 top-0 w-[26px] h-[26px] rounded-full bg-[#EF4444]/70 mix-blend-screen" />
            </div>
          </div>

          <div>
            <div className="font-display font-bold text-[32px] text-white tracking-tight leading-none">
              <span className="text-white/60 mr-1.5">{cur.symbol}</span><CountUp target={integerPart} prefix="" locale={cur.locale} />
              <span className="text-white/80">{decimalPart}</span>
            </div>
            <div className="text-[12px] font-semibold text-[#9AFF45] tracking-wide mt-1.5">
              {cur.name.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
