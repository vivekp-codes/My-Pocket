import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../context/StoreContext";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupWallet?: () => void;
  onGoToSettings?: () => void;
}

export default function ProfileModal({ isOpen, onClose, onSetupWallet, onGoToSettings }: ProfileModalProps) {
  const { user, balances, logout } = useStore();
  const popoverRef = useRef<HTMLDivElement>(null);

  const displayName = user?.name
    ? user.name.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
    : "User";

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "US";

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <>
      {/* ── Profile Modal ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="absolute top-[52px] left-4 w-[260px] bg-[#050805]/80 backdrop-blur-2xl border border-white/[0.08] rounded-[22px] overflow-visible shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] z-50"
          >
            {/* Arrow */}
            <div className="absolute -top-[6px] left-5 w-3 h-3 bg-[#5CB010]/30 border-l border-t border-[#9AFF45]/40 rotate-45" />

            {/* Close button — top right */}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="absolute top-3 right-3 w-[26px] h-[26px] rounded-full bg-black/30 backdrop-blur-sm border border-white/[0.1] flex items-center justify-center text-white/60 hover:text-white hover:bg-black/50 active:scale-90 transition-all z-20"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Green gradient banner — new palette */}
            <div className="relative h-[80px] rounded-t-[22px] overflow-hidden">
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
            </div>

            {/* Profile image — overlapping banner, left-aligned */}
            <div className="relative flex justify-start pl-4 -mt-[34px] z-10">
              <div className="w-[78px] h-[78px] rounded-full p-[2px] bg-gradient-to-br from-white/40 via-[#73DA14]/40 to-[#2E680A]/30 shadow-[0_0_16px_rgba(115,218,20,0.2)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#050805] flex items-center justify-center">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-white">{initials}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile info */}
            <div className="text-left px-5 pt-2 pb-1">
              <p className="text-[15px] font-bold text-white leading-tight">
                {displayName}
              </p>
              <p className="text-[11px] text-white/40 mt-1 leading-snug truncate">
                {user?.email || ""}
              </p>
              <p className="text-[10px] text-white/30 mt-1.5 leading-snug">
                Manage your profile & preferences here
              </p>
            </div>

            {/* Buttons */}
            <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
              {/* Go to Settings — primary */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  onGoToSettings?.();
                }}
                className="w-full flex items-center justify-center gap-2 h-[40px] rounded-[12px] bg-gradient-to-br from-[#73DA14] via-[#5CB010] to-[#2E680A] text-[#050805] font-semibold text-[12.5px] active:scale-[0.98] transition-all shadow-[0_6px_18px_-4px_rgba(92,176,16,0.4)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                Go to Settings
              </button>

              {/* Set Up Wallet — only show if no balance set up yet */}
              {onSetupWallet && !balances && (
                <button
                  onClick={() => { onSetupWallet(); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 h-[38px] rounded-[12px] bg-white/[0.04] border border-white/[0.06] text-[#5CB010] font-semibold text-[12px] hover:bg-[#5CB010]/10 hover:border-[#5CB010]/20 active:scale-[0.98] transition-all"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Set Up Wallet
                </button>
              )}

              {/* Log Out — secondary */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 h-[38px] rounded-[12px] bg-white/[0.04] border border-white/[0.06] text-coral font-semibold text-[12px] hover:bg-coral/10 hover:border-coral/20 active:scale-[0.98] transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
