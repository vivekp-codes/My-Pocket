import { motion } from "framer-motion";

const EASE = [0.2, 0.8, 0.2, 1] as const;

interface SkeletonBlockProps {
  className?: string;
  style?: React.CSSProperties;
  breathe?: boolean;
}

function SkeletonBlock({ className = "", style, breathe = true }: SkeletonBlockProps) {
  return (
    <div
      className={`sk-block ${breathe ? "sk-breathe" : ""} ${className}`}
      style={style}
    />
  );
}

function Fade({
  children,
  delay,
  className = "",
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── App boot skeleton — mirrors the Home overview layout ─────────
export default function AppOverviewSkeleton() {
  return (
    <div className="h-full w-full text-text relative bg-bg overflow-hidden">
      <div className="h-full overflow-hidden overflow-y-auto no-scrollbar max-w-xl mx-auto w-full pt-6 pb-[100px]">
        {/* TopBar */}
        <Fade delay={0.02}>
          <div className="flex items-center justify-between px-5 pt-2 pb-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-12 h-12 rounded-full" />
              <div className="flex flex-col gap-2">
                <SkeletonBlock className="w-28 h-3.5 rounded-full" />
                <SkeletonBlock className="w-20 h-2.5 rounded-full" />
              </div>
            </div>
            <SkeletonBlock className="w-11 h-11 rounded-[14px]" />
          </div>
        </Fade>

        {/* Overview heading */}
        <Fade delay={0.05}>
          <div className="px-5 pb-5">
            <SkeletonBlock className="w-32 h-[34px] rounded-lg" />
          </div>
        </Fade>

        {/* WalletCard */}
        <Fade delay={0.1} className="px-5">
          <div className="relative h-[196px] overflow-hidden rounded-[28px] sk-breathe">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 85% 15%, rgba(154,255,69,0.16) 0%, transparent 60%)" +
                  ",radial-gradient(circle at 10% 25%, rgba(115,218,20,0.12) 0%, transparent 55%)" +
                  ",radial-gradient(circle at 45% 90%, rgba(46,104,10,0.2) 0%, transparent 70%)" +
                  ",linear-gradient(155deg, rgba(92,176,16,0.18) 0%, rgba(10,26,6,0.5) 100%)",
              }}
            />
            <div className="relative z-10 h-full flex flex-col justify-between p-5">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="w-24 h-7 rounded-full" breathe={false} />
                <div className="flex gap-0.5 opacity-60">
                  <span className="w-[26px] h-[26px] rounded-full bg-white/10" />
                  <span className="-ml-3 w-[26px] h-[26px] rounded-full bg-white/15" />
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <SkeletonBlock className="w-52 h-8 rounded-lg" breathe={false} />
                <SkeletonBlock className="w-20 h-3 rounded-md" breathe={false} />
              </div>
            </div>
          </div>
        </Fade>

        {/* BalanceCards */}
        <div className="flex gap-2.5 px-5 pt-3">
          <Fade delay={0.12} className="flex-1">
            <SkeletonBlock className="w-full h-[66px] rounded-[16px]" />
          </Fade>
          <Fade delay={0.18} className="flex-1">
            <SkeletonBlock className="w-full h-[66px] rounded-[16px]" />
          </Fade>
        </div>

        {/* StatPills */}
        <div className="flex gap-2.5 px-5 pt-4">
          {[0.16, 0.2, 0.24].map((d, i) => (
            <Fade key={i} delay={d} className="flex-1">
              <SkeletonBlock className="w-full h-[58px] rounded-[18px]" />
            </Fade>
          ))}
        </div>

        {/* History */}
        <Fade delay={0.26} className="px-5 pt-7">
          <SkeletonBlock className="w-20 h-5 mb-4 rounded-md" />
          <div className="flex flex-col gap-2.5">
            {[0.28, 0.33, 0.38, 0.43, 0.48].map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: d, ease: EASE }}
                className="flex items-center gap-3.5 px-4 py-3.5 rounded-[22px] border border-white/[0.03]"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <SkeletonBlock className="w-[44px] h-[44px] rounded-full flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <SkeletonBlock className="w-32 h-3 rounded-full" />
                  <SkeletonBlock className="w-20 h-2.5 rounded-full" />
                </div>
                <SkeletonBlock className="w-16 h-3.5 rounded-md" />
              </motion.div>
            ))}
          </div>
        </Fade>
      </div>

      {/* Bottom nav placeholder */}
      <Fade delay={0.5} className="absolute bottom-0 left-0 right-0 w-full px-3 pb-3 pt-1 z-40">
        <SkeletonBlock className="w-full h-[70px] rounded-[24px]" breathe={false} />
      </Fade>
    </div>
  );
}