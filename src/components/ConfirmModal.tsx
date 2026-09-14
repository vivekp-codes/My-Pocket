import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SignOut, X } from "phosphor-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: ReactNode;
  tone?: "danger" | "primary";
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  icon,
  tone = "danger",
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const Icon = icon ?? <SignOut size={22} weight="bold" color="white" />;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70]"
          />

          {/* Card */}
          <div className="fixed inset-0 z-[80] flex items-center justify-center px-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="w-full max-w-[330px] bg-surface/95 backdrop-blur-xl border border-white/[0.06] rounded-[28px] overflow-hidden pointer-events-auto shadow-[0_30px_80px_-16px_rgba(0,0,0,0.7)]"
            >
              {/* ── Top themed band ─────────────────────────── */}
              <div className="relative overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      tone === "danger"
                        ? "linear-gradient(135deg, rgba(239,68,68,0.28) 0%, rgba(185,28,28,0.16) 55%, rgba(46,104,10,0.12) 100%)"
                        : "linear-gradient(135deg, rgba(115,218,20,0.28) 0%, rgba(92,176,16,0.16) 55%, rgba(46,104,10,0.12) 100%)",
                  }}
                />
                <div
                  className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl"
                  style={{ background: tone === "danger" ? "rgba(239,68,68,0.15)" : "rgba(115,218,20,0.15)" }}
                />
                <div className="absolute -bottom-10 -left-6 w-24 h-24 rounded-full bg-[#73DA14]/10 blur-2xl" />

                {/* Close */}
                <button
                  onClick={onCancel}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/25 backdrop-blur-sm border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-black/40 active:scale-90 transition-all z-10"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>

                <div className="relative flex flex-col items-center pt-6 pb-7 px-6">
                  {/* Icon badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.08 }}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-[0_8px_24px_-6px_rgba(239,68,68,0.4)]"
                    style={
                      tone === "danger"
                        ? { background: "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(185,28,28,0.08))", border: "1px solid rgba(239,68,68,0.3)" }
                        : { background: "linear-gradient(135deg, rgba(115,218,20,0.25), rgba(46,104,10,0.08))", border: "1px solid rgba(92,176,16,0.3)" }
                    }
                  >
                    {Icon}
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="font-display font-bold text-[19px] text-text tracking-tight text-center"
                  >
                    {title}
                  </motion.h3>
                  {description && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 }}
                      className="text-[11.5px] text-textDim/60 mt-1 text-center leading-relaxed"
                    >
                      {description}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* ── Actions ─────────────────────────────────── */}
              <div className="px-6 pb-6 pt-1">
                <div className="flex gap-2.5">
                  <button
                    onClick={onCancel}
                    className="flex-1 h-[46px] rounded-[14px] bg-white/[0.06] border border-white/[0.08] text-textDim font-bold text-[12px] hover:bg-white/[0.1] hover:text-text active:scale-[0.97] transition-all"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    onClick={onConfirm}
                    className="flex-1 h-[46px] rounded-[14px] text-white font-bold text-[12px] active:scale-[0.97] transition-all shadow-[0_8px_24px_-6px_rgba(239,68,68,0.45)]"
                    style={
                      tone === "danger"
                        ? { background: "linear-gradient(135deg, #EF4444, #B91C1C)" }
                        : { background: "linear-gradient(135deg, #73DA14, #2E680A)" }
                    }
                  >
                    {confirmLabel}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}