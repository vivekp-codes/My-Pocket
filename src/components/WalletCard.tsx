import { motion } from "framer-motion";
import CountUp from "./CountUp";

interface WalletCardProps {
  balance?: number;
}

export default function WalletCard({ balance = 231560.40 }: WalletCardProps) {
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
        {/* fluid organic texture */}
        <div
          className="absolute inset-0 scale-[1.1] saturate-[1.3] brightness-[1.05]"
          style={{
            background:
              "radial-gradient(circle at 85% 15%, #bdff80 0%, transparent 60%)," +
              "radial-gradient(circle at 10% 25%, #a8ff9e 0%, transparent 55%)," +
              "radial-gradient(circle at 45% 90%, #0d5d36 0%, transparent 70%)," +
              "radial-gradient(circle at 5% 95%, #052614 0%, transparent 60%)," +
              "linear-gradient(155deg, #1c7c47 0%, #082d1b 65%, #041b0f 100%)",
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
          wallet
        </div>

        {/* shade for text contrast */}
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(180deg, rgba(3,10,6,0) 30%, rgba(3,10,6,0.4) 100%)" }} />

        <div className="relative z-10 h-full flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 bg-[#aeff6b]/20 border border-white/10 backdrop-blur-md rounded-full py-1 px-3 text-[11px] font-bold text-[#eafff0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#bdff80]" />
              Main Wallet (USD)
            </div>
            
            {/* Golden Chip */}
            <svg width="34" height="26" viewBox="0 0 24 18" fill="none" className="opacity-90">
              <rect width="24" height="18" rx="3.5" fill="url(#chip-grad)" />
              <rect x="3" y="2" width="18" height="14" rx="2" stroke="#4f3807" strokeWidth="0.8" opacity="0.4" />
              <path d="M7 2v14M17 2v14M3 6h18M3 12h18" stroke="#4f3807" strokeWidth="0.8" opacity="0.4" />
              <defs>
                <linearGradient id="chip-grad" x1="0" y1="0" x2="24" y2="18" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ffe17d" />
                  <stop offset="0.5" stopColor="#dca434" />
                  <stop offset="1" stopColor="#a37415" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div>
            <div className="font-display font-bold text-[32px] text-white tracking-tight leading-none">
              <CountUp target={integerPart} prefix="" />
              <span className="text-white/80">{decimalPart}</span>
            </div>
            <div className="text-[12px] font-semibold text-[#bdff80] tracking-wide uppercase mt-1.5">
              US Dollar
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
