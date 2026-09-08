import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Bug, ChatCircleText, X } from "phosphor-react";
import { useStore } from "../context/StoreContext";
import { sendContactMessage, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY } from "../lib/contact";

const TYPES = [
  { key: "Suggestion", icon: Lightbulb, label: "Suggestion", desc: "Share an idea", active: "bg-[#5CB010]/12 border-[#5CB010]/30 text-[#5CB010]", iconDim: "text-textDim" },
  { key: "Issue", icon: Bug, label: "Issue", desc: "Report a bug", active: "bg-coral/10 border-coral/30 text-coral", iconDim: "text-textDim" },
  { key: "Other", icon: ChatCircleText, label: "Other", desc: "Just say hi", active: "bg-white/[0.06] border-stroke text-text", iconDim: "text-textDim" },
] as const;

interface ConnectSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function ConnectSheet({ open, onClose }: ConnectSheetProps) {
  const { user } = useStore();
  const [type, setType] = useState<"Suggestion" | "Issue" | "Other">("Suggestion");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setType("Suggestion");
      setMessage("");
      setSending(false);
      setSent(false);
      setError(null);
      setTimeout(() => textareaRef.current?.focus(), 250);
    }
  }, [open]);

  const configReady =
    EMAILJS_SERVICE_ID !== "YOUR_SERVICE_ID" &&
    EMAILJS_TEMPLATE_ID !== "YOUR_TEMPLATE_ID" &&
    EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY";

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    if (!configReady) {
      setError("Contact email isn't configured yet by the developer.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await sendContactMessage({
        name: user?.name || "My Pocket user",
        email: user?.email || "",
        type,
        message: message.trim(),
      });
      setSent(true);
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setError(err?.message || "Failed to send. Please try again.");
      setSending(false);
    }
  };

  const progress = Math.min(message.length / 600, 1);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !sending && onClose()}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 120 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 120 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[80]"
          >
            <div className="bg-surface border-t border-stroke rounded-t-[28px] px-5 pt-4 pb-8 overflow-hidden relative">
              {/* soft brand glow */}
              <div
                className="absolute inset-x-0 -top-16 h-40 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(60% 100% at 50% 0%, rgba(115,218,20,0.13) 0%, transparent 70%)",
                }}
              />

              {/* Handle */}
              <div className="flex justify-center mb-4 relative">
                <div className="w-10 h-1 rounded-full bg-textFaint/30" />
              </div>

              {/* Header */}
              <div className="relative flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display font-bold text-base text-text">Send Feedback</h3>
                  <p className="text-[11px] text-textDim/50 mt-0.5">Found a bug or have an idea? Let the developer know.</p>
                </div>
                <button
                  onClick={() => !sending && onClose()}
                  className="w-8 h-8 rounded-full bg-textFaint/10 flex items-center justify-center text-textDim hover:text-text transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {sent ? (
                /* ── Success state ── */
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  className="flex flex-col items-center py-10"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#73DA14] to-[#2E680A] flex items-center justify-center shadow-[0_0_30px_rgba(115,218,20,0.4)] mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#050805" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-text font-display font-bold text-base">Message Sent</p>
                  <p className="text-[11px] text-textDim/50 mt-1">Thanks for reaching out!</p>
                </motion.div>
              ) : (
                <motion.div key="entry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
                  {/* Type chips */}
                  <p className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider mb-2.5">What kind of feedback?</p>
                  <div className="flex gap-2 mb-5">
                    {TYPES.map((t) => {
                      const selected = type === t.key;
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setType(t.key)}
                          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all active:scale-[0.97] ${
                            selected ? t.active : "bg-white/[0.03] border-stroke text-textDim hover:text-text"
                          }`}
                        >
                          <Icon size={17} weight={selected ? "fill" : "regular"} />
                          <span className="text-[10.5px] font-bold">{t.label}</span>
                          <span className={`text-[8.5px] ${selected ? "opacity-60" : "opacity-40"}`}>{t.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Message textarea */}
                  <div className="relative mb-2">
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={600}
                      rows={4}
                      placeholder="Write your message…"
                      className="w-full resize-none bg-white/[0.04] border border-stroke focus:border-[#5CB010]/40 rounded-[16px] px-4 py-3.5 text-[13px] text-text font-medium outline-none transition-colors placeholder:text-textDim/25"
                    />
                  </div>

                  {/* Footer meta */}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] text-textDim/40 truncate mr-3">Sent as {user?.email || "your account"}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-14 h-[3px] rounded-full bg-textFaint/20 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#73DA14] to-[#5CB010] transition-all"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-textDim/40 tabular-nums">{message.length}/600</span>
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-coral/10 border border-coral/20 mb-3"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-coral">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p className="text-[11px] font-semibold text-coral">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Send button */}
                  <button
                    onClick={handleSend}
                    disabled={sending || !message.trim()}
                    className="w-full flex items-center justify-center gap-2 h-[46px] rounded-[14px] bg-gradient-to-br from-[#73DA14] via-[#5CB010] to-[#2E680A] text-[#050805] font-display font-bold text-[13px] active:scale-[0.97] transition-all disabled:opacity-35 disabled:cursor-not-allowed shadow-[0_6px_18px_-4px_rgba(92,176,16,0.35)]"
                  >
                    {sending ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        Send Message
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}