import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  PencilSimple,
  Sun,
  Moon,
  CurrencyCircleDollar,
  SignOut,
  ShieldCheck,
  Info,
  CaretRight,
  Check,
  X,
} from "phosphor-react";
import { useStore, CURRENCIES, getCurrencyInfo } from "../context/StoreContext";
import { useProfilePhotoUpload } from "../hooks/useProfilePhotoUpload";
import AvatarCropModal from "./AvatarCropModal";
import PinSheet from "./PinSheet";
import { sendContactMessage, WEB3FORMS_ACCESS_KEY } from "../lib/contact";

interface SettingsProps {
  onBack?: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const { user, theme, toggleTheme, logout, updateUsername, currency, setCurrency, appPinEnabled } = useStore();
  const cur = getCurrencyInfo(currency);
  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const [pinMode, setPinMode] = useState<"enable" | "disable">("enable");
  const [contactType, setContactType] = useState<"Suggestion" | "Issue" | "Other">("Suggestion");
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const { inputRef: photoInputRef, uploading: photoUploading, error: photoError, openPicker: openPhotoPicker, handleFile: handlePhotoFile, cropSource, closeCrop, uploadCropped } = useProfilePhotoUpload();

  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = user?.name
    ? user.name
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    : "User";

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "US";

  const handleEditStart = () => {
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
  };

  const handlePinToggle = () => {
    // Enabling → PIN creation sheet. Disabling → verify current PIN sheet.
    if (appPinEnabled) {
      setPinMode("disable");
    } else {
      setPinMode("enable");
    }
    setPinSheetOpen(true);
  };

  const openPinSheet = (mode: "enable" | "disable") => {
    setPinMode(mode);
    setPinSheetOpen(true);
  };

  const handleSendContact = async () => {
    if (!contactMessage.trim()) return;
    if (WEB3FORMS_ACCESS_KEY === "YOUR_ACCESS_KEY_HERE") {
      setContactError("Contact email isn't configured yet by the developer.");
      return;
    }
    setSendingContact(true);
    setContactError(null);
    try {
      await sendContactMessage({
        name: user?.name || "My Pocket user",
        email: user?.email || "",
        type: contactType,
        message: contactMessage.trim(),
      });
      setContactSent(true);
      setContactMessage("");
      setTimeout(() => setContactSent(false), 4000);
    } catch (err: any) {
      setContactError(err?.message || "Failed to send. Please try again.");
    } finally {
      setSendingContact(false);
    }
  };

  return (
    <div className="px-5 pt-4 h-full overflow-y-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-full bg-surface border border-stroke flex items-center justify-center text-text hover:bg-stroke active:scale-95 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-display font-bold text-lg text-text">Settings</span>
        <div className="w-11" />
      </div>

      {/* Profile Card */}
      <div className="bg-cardBg border border-stroke rounded-[22px] p-5 mb-4 relative overflow-hidden">
        {/* subtle green gradient glow */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 90% 0%, rgba(115,218,20,0.12) 0%, transparent 50%), radial-gradient(circle at 10% 100%, rgba(46,104,10,0.1) 0%, transparent 50%)",
          }}
        />
        <div className="relative flex items-center gap-4">
          {/* Avatar with camera upload overlay */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoFile}
            className="hidden"
          />
          <div className="relative shrink-0">
            <div className="w-[68px] h-[68px] rounded-full p-[2px] bg-gradient-to-br from-white/40 via-[#73DA14]/40 to-[#2E680A]/30 shadow-[0_0_16px_rgba(115,218,20,0.2)]">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#050805] flex items-center justify-center">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-white">{initials}</span>
                )}
              </div>
            </div>
            <button
              onClick={openPhotoPicker}
              disabled={photoUploading}
              className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#5CB010] border-2 border-cardBg flex items-center justify-center text-[#050805] active:scale-90 transition-all disabled:opacity-50"
            >
              {photoUploading ? (
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              )}
            </button>
          </div>

          {/* Name + Email */}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-text leading-tight truncate">{displayName}</p>
            <p className="text-[11px] text-textDim/50 mt-1 truncate">{user?.email || ""}</p>
            <p className="text-[10px] text-[#5CB010] font-semibold mt-1.5">
              Member since{" "}
              {user?.startDate
                ? new Date(user.startDate + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>

          {/* Edit pencil */}
          <button
            onClick={handleEditStart}
            className="w-9 h-9 rounded-full bg-[#5CB010]/10 border border-[#5CB010]/25 flex items-center justify-center text-[#5CB010] hover:bg-[#5CB010]/20 active:scale-90 transition-all shrink-0"
          >
            <PencilSimple size={15} weight="bold" />
          </button>
        </div>

        {/* Inline edit */}
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="relative mt-4 overflow-hidden"
          >
            <p className="text-[10px] font-bold text-[#73DA14]/70 uppercase tracking-wider mb-1.5">
              Edit Username
            </p>
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className="w-full h-[40px] px-3 rounded-[12px] bg-white/[0.06] border border-white/[0.1] text-text text-[13px] font-semibold outline-none focus:border-[#5CB010]/50 placeholder:text-textDim/30 transition-colors mb-2"
              placeholder="Enter new name"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !newName.trim()}
                className="flex-1 h-[36px] rounded-[11px] bg-[#5CB010] hover:bg-[#5CB010]/90 text-[#050805] text-[12px] font-bold active:scale-[0.97] transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving
                  </>
                ) : (
                  "Save"
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 h-[36px] rounded-[11px] bg-white/[0.06] border border-white/[0.08] text-textDim text-[12px] font-bold active:scale-[0.97] transition-all hover:bg-white/[0.1]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {photoError && (
          <p className="relative text-[10px] text-[#EF4444] text-center mt-3">{photoError}</p>
        )}
      </div>

      {/* Appearance */}
      <div className="bg-cardBg border border-stroke rounded-[22px] mb-4 overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <p className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider">Appearance</p>
        </div>

        {/* Theme toggle */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-[#5CB010]/10 border border-[#5CB010]/25 flex items-center justify-center text-[#5CB010]">
              {theme === "dark" ? <Moon size={16} weight="bold" /> : <Sun size={16} weight="bold" />}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-text">Dark Mode</p>
              <p className="text-[10px] text-textDim/50 mt-0.5">
                {theme === "dark" ? "Currently dark" : "Currently light"}
              </p>
            </div>
          </div>

          {/* Switch */}
          <button
            onClick={toggleTheme}
            className={`relative w-[46px] h-[26px] rounded-full transition-colors duration-300 ${
              theme === "dark"
                ? "bg-gradient-to-r from-[#5CB010] to-[#73DA14]"
                : "bg-stroke"
            }`}
          >
            <span
              className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow-md transition-all duration-300 ${
                theme === "dark" ? "left-[23px]" : "left-[3px]"
              }`}
            />
          </button>
        </div>

        {/* Currency */}
        <button
          onClick={() => setShowCurrencyPicker(true)}
          className="w-full flex items-center justify-between px-5 py-3.5 border-t border-stroke hover:bg-white/[0.02] transition-colors active:scale-[0.995]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-[#5CB010]/10 border border-[#5CB010]/25 flex items-center justify-center text-[#5CB010]">
              <CurrencyCircleDollar size={16} weight="bold" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-semibold text-text">Currency</p>
              <p className="text-[10px] text-textDim/50 mt-0.5">
                {cur.name} ({cur.symbol})
              </p>
            </div>
          </div>
          <CaretRight size={14} className="text-textDim/40" />
        </button>
      </div>

      {/* Security */}
      <div className="bg-cardBg border border-stroke rounded-[22px] mb-4 overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <p className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider">Security</p>
        </div>

        {/* App Lock toggle row */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[12px] bg-[#5CB010]/10 border border-[#5CB010]/25 flex items-center justify-center text-[#5CB010] shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-text truncate">App Lock</p>
              <p className="text-[10px] text-textDim/50 mt-0.5 truncate">
                {appPinEnabled
                  ? "Locked · requires PIN on open"
                  : "Lock disabled · opens freely"}
              </p>
            </div>
          </div>

          {/* Switch — opens the PIN sheet rather than flipping instantly */}
          <button
            onClick={handlePinToggle}
            className={`relative w-[46px] h-[26px] rounded-full transition-colors duration-300 shrink-0 ${
              appPinEnabled
                ? "bg-gradient-to-r from-[#5CB010] to-[#73DA14]"
                : "bg-stroke"
            }`}
          >
            <span
              className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow-md transition-all duration-300 ${
                appPinEnabled ? "left-[23px]" : "left-[3px]"
              }`}
            />
          </button>
        </div>

        {/* Change PIN row — only shown when lock is on */}
        {appPinEnabled && (
          <button
            onClick={() => openPinSheet("enable")}
            className="w-full flex items-center justify-between px-5 py-3 border-t border-stroke hover:bg-white/[0.02] transition-colors active:scale-[0.995]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-white/[0.04] border border-stroke flex items-center justify-center text-[#5CB010]">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 2l-2 2m-5.61 5.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-text">Change PIN</p>
                <p className="text-[10px] text-textDim/50 mt-0.5">Set a new 4-digit passcode</p>
              </div>
            </div>
            <CaretRight size={14} className="text-textDim/40 shrink-0" />
          </button>
        )}
      </div>

      {/* Connect — send feedback / issues to the developer */}
      <div className="bg-cardBg border border-stroke rounded-[22px] mb-4 overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <p className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider">Connect</p>
        </div>

        <div className="px-5 pb-5">
          {/* Heading */}
          <p className="text-[13px] font-semibold text-text">Share feedback</p>
          <p className="text-[10px] text-textDim/50 mt-0.5 mb-4">
            Found a bug or have an idea? Send it straight to the developer.
          </p>

          {/* Type chips */}
          <div className="flex gap-2 mb-3">
            {(["Suggestion", "Issue", "Other"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setContactType(t)}
                className={`flex-1 py-2 rounded-[10px] text-[11px] font-bold transition-all ${
                  contactType === t
                    ? t === "Issue"
                      ? "bg-coral/10 border border-coral/25 text-coral"
                      : "bg-[#5CB010]/10 border border-[#5CB010]/25 text-[#5CB010]"
                    : "bg-white/[0.03] border border-stroke text-textDim hover:text-text"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Message input */}
          <textarea
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            maxLength={600}
            rows={4}
            placeholder="Write your message…"
            className="w-full resize-none bg-white/[0.04] border border-stroke focus:border-[#5CB010]/40 rounded-[14px] px-3.5 py-3 text-[12.5px] text-text font-medium outline-none transition-colors placeholder:text-textDim/25 mb-2"
          />

          {/* Character count + note */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9.5px] text-textDim/30">Sent as {user?.email || "your account"}</p>
            <span className="text-[9.5px] text-textDim/30">{contactMessage.length}/600</span>
          </div>

          {/* Success / Error feedback */}
          {contactSent && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-[#5CB010]/10 border border-[#5CB010]/25 mb-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5CB010" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-[11px] font-semibold text-[#5CB010]">Message sent — thanks for reaching out!</p>
            </div>
          )}
          {contactError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-coral/10 border border-coral/20 mb-3">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-coral">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-[11px] font-semibold text-coral">{contactError}</p>
            </div>
          )}

          {/* Send button */}
          <button
            onClick={handleSendContact}
            disabled={sendingContact || !contactMessage.trim()}
            className="w-full flex items-center justify-center gap-2 h-[42px] rounded-[13px] bg-gradient-to-br from-[#73DA14] via-[#5CB010] to-[#2E680A] text-[#050805] font-display font-bold text-[12.5px] active:scale-[0.97] transition-all disabled:opacity-35 disabled:cursor-not-allowed shadow-[0_6px_18px_-4px_rgba(92,176,16,0.35)]"
          >
            {sendingContact ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send Message
              </>
            )}
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-cardBg border border-stroke rounded-[22px] mb-4 overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <p className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider">About</p>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-white/[0.04] border border-stroke flex items-center justify-center text-textDim">
              <ShieldCheck size={16} weight="bold" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-text">Secure Data</p>
              <p className="text-[10px] text-textDim/50 mt-0.5">Stored in your private Firebase account</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-stroke">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-white/[0.04] border border-stroke flex items-center justify-center text-textDim">
              <Info size={16} weight="bold" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-text">My Pocket</p>
              <p className="text-[10px] text-textDim/50 mt-0.5">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 h-[46px] rounded-[14px] bg-[#EF4444]/8 border border-[#EF4444]/20 text-[#EF4444] font-bold text-[13px] hover:bg-[#EF4444]/15 active:scale-[0.98] transition-all"
      >
        <SignOut size={16} weight="bold" />
        Log Out
      </button>

      {/* ── Currency Picker Modal ─────────────────────────── */}
      <AnimatePresence>
        {showCurrencyPicker && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCurrencyPicker(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50"
            >
              <div className="bg-surface border-t border-stroke rounded-t-[28px] px-5 pt-4 pb-8">
                {/* Handle */}
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 rounded-full bg-textFaint/30" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-base text-text">Select Currency</h3>
                  <button
                    onClick={() => setShowCurrencyPicker(false)}
                    className="w-8 h-8 rounded-full bg-textFaint/10 flex items-center justify-center text-textDim hover:text-text transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Currency List */}
                <div className="space-y-2">
                  {CURRENCIES.map((c) => {
                    const isSelected = c.code === currency;
                    return (
                      <button
                        key={c.code}
                        onClick={() => {
                          setCurrency(c.code);
                          setShowCurrencyPicker(false);
                        }}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                          isSelected
                            ? "bg-[#5CB010]/10 border border-[#5CB010]/30"
                            : "bg-cardBg border border-stroke hover:border-[#5CB010]/20"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-[16px] ${
                            isSelected ? "bg-[#5CB010]/20 text-[#5CB010]" : "bg-white/[0.05] text-textDim"
                          }`}
                        >
                          {c.symbol}
                        </div>
                        <div className="flex-1 text-left">
                          <span className={`block text-[13px] font-semibold ${isSelected ? "text-[#5CB010]" : "text-text"}`}>
                            {c.name}
                          </span>
                          <span className="block text-[10px] text-textDim/50 mt-0.5">{c.code}</span>
                        </div>
                        {isSelected && <Check size={18} weight="bold" color="#5CB010" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Photo crop modal */}
      <AvatarCropModal
        src={cropSource}
        onCancel={closeCrop}
        onConfirm={uploadCropped}
        uploading={photoUploading}
      />

      {/* App Lock PIN sheet */}
      <PinSheet
        open={pinSheetOpen}
        mode={pinMode}
        onClose={() => setPinSheetOpen(false)}
      />
    </div>
  );
}