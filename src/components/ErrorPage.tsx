import { motion } from "framer-motion";
import { WifiSlash, Bug, WarningCircle, ArrowClockwise } from "phosphor-react";

const EASE = [0.2, 0.8, 0.2, 1] as const;

export type ErrorPageKind = "offline" | "crash" | "error";

interface ErrorPageProps {
  kind?: ErrorPageKind;
  title?: string;
  message?: string;
  hint?: string;
  onRetry?: () => void;
}

const CONTENT: Record<
  ErrorPageKind,
  { icon: typeof WifiSlash; title: string; message: string; hint: string }
> = {
  offline: {
    icon: WifiSlash,
    title: "You're offline",
    message:
      "No internet connection detected. Check your network — My Pocket will pick up right where you left off.",
    hint: "The app reconnects automatically once you're back online.",
  },
  crash: {
    icon: Bug,
    title: "Something went wrong",
    message:
      "My Pocket hit an unexpected issue while rendering this page.",
    hint: "Reloading usually fixes it right away.",
  },
  error: {
    icon: WarningCircle,
    title: "Oops, something broke",
    message:
      "We couldn't complete this action at the moment. Please try again.",
    hint: "If it keeps happening, send feedback from the settings screen.",
  },
};

export default function ErrorPage({
  kind = "error",
  title,
  message,
  hint,
  onRetry,
}: ErrorPageProps) {
  const cfg = CONTENT[kind];
  const Icon = cfg.icon;
  const retry = () => {
    if (onRetry) onRetry();
    else window.location.reload();
  };

  return (
    <div className="h-full w-full text-text relative bg-bg overflow-hidden">
      {/* Ambient organic blobs */}
      <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full opacity-40 blur-[90px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(115,218,20,0.35) 0%, transparent 70%)" }} />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-30 blur-[90px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(46,104,10,0.5) 0%, transparent 70%)" }} />
      <div className="absolute top-1/3 right-0 w-40 h-40 rounded-full opacity-20 blur-[70px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)" }} />

      <div className="relative h-full flex flex-col items-center justify-center px-8 text-center">
        {/* Icon tile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative mb-7 flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-[26px] bg-surface border border-stroke flex items-center justify-center shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)]">
            <Icon size={36} weight="duotone" color="#9AFF45" />
          </div>
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-2 w-16 h-2 rounded-full bg-[#5CB010]/30 blur-md"
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
          className="font-display font-bold text-[24px] leading-tight tracking-tight text-text"
        >
          {title ?? cfg.title}
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
          className="mt-3 text-[13.5px] leading-relaxed text-textDim max-w-[260px]"
        >
          {message ?? cfg.message}
        </motion.p>

        {/* Hint */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
          className="mt-5 flex items-start gap-2 rounded-[16px] bg-surface border border-stroke px-4 py-3 max-w-[280px]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-1.5 flex-shrink-0" />
          <p className="text-[11.5px] leading-snug text-textDim/80 text-left">
            {hint ?? cfg.hint}
          </p>
        </motion.div>

        {/* Retry */}
        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
          onClick={retry}
          whileTap={{ scale: 0.96 }}
          className="mt-7 inline-flex items-center gap-2 px-7 h-12 rounded-[16px] bg-[#5CB010] text-[#050805] font-bold text-[14px] shadow-[0_10px_24px_-8px_rgba(92,176,16,0.6)] active:scale-95 transition-transform"
        >
          <ArrowClockwise size={18} weight="bold" />
          {kind === "offline" ? "Try Again" : "Reload App"}
        </motion.button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 inset-x-0 text-center">
        <span className="text-[10px] font-bold tracking-[0.2em] text-textDim/40 uppercase">
          My Pocket
        </span>
      </div>
    </div>
  );
}