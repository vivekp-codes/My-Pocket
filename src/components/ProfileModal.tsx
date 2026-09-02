import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../context/StoreContext";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onSetupWallet?: () => void;
}

export default function ProfileModal({ isOpen, onClose, anchorRef, onSetupWallet }: ProfileModalProps) {
  const { user, balances, logout, updateUsername } = useStore();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);

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

  // No outside click — modal only closes via X button

  // Reset editing when modal closes
  useEffect(() => {
    if (!isOpen) setEditing(false);
  }, [isOpen]);

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNewName(user?.name || "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSave = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === (user?.name || "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const result = await updateUsername(trimmed);
    setSaving(false);
    setEditing(false);
    if (!result.success) {
      console.error("Failed to update username:", result.error);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setNewName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <>
      {/* ── Edit Username Floating Modal ── */}
      <AnimatePresence>
        {isOpen && editing && (
          <motion.div
            ref={editModalRef}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-[260px] left-4 w-[260px] bg-[#050805]/95 backdrop-blur-2xl border border-[#5CB010]/20 rounded-[16px] p-3 shadow-[0_16px_40px_-8px_rgba(92,176,16,0.15)] z-[60]"
          >
            {/* Arrow pointing down */}
            <div className="absolute -bottom-[5px] left-8 w-2.5 h-2.5 bg-[#050805]/95 border-r border-b border-[#5CB010]/20 rotate-45" />

            <p className="text-[11px] text-[#73DA14]/70 font-semibold mb-2 px-0.5">
              Edit Username
            </p>
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className="w-full h-[36px] px-3 rounded-[10px] bg-white/[0.06] border border-white/[0.1] text-white text-[13px] font-semibold outline-none focus:border-[#5CB010]/50 placeholder:text-white/20 transition-colors mb-2.5"
              placeholder="Enter new name"
            />
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleSave(); }}
                disabled={saving || !newName.trim()}
                className="flex-1 h-[34px] rounded-[10px] bg-[#5CB010] hover:bg-[#5CB010]/90 text-[#050805] text-[12px] font-bold active:scale-[0.97] transition-all disabled:opacity-40"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving
                  </span>
                ) : "Save"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                disabled={saving}
                className="flex-1 h-[34px] rounded-[10px] bg-white/[0.06] border border-white/[0.08] text-white/50 text-[12px] font-bold active:scale-[0.97] transition-all hover:bg-white/[0.1]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              onClick={(e) => { e.stopPropagation(); onClose(); setEditing(false); }}
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
                Do you want to edit your username?
              </p>
            </div>

            {/* Buttons */}
            <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
              {/* Edit Username — primary */}
              <button
                onClick={handleEditStart}
                className="w-full flex items-center justify-center gap-2 h-[38px] rounded-[12px] bg-[#5CB010] hover:bg-[#5CB010]/90 text-[#050805] font-semibold text-[12px] active:scale-[0.98] transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Username
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
