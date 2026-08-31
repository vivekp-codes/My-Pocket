import { motion } from "framer-motion";
import { useStore } from "../context/StoreContext";

export default function TopBar() {
  const { user, logout, theme, toggleTheme } = useStore();
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "US";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.02, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex items-center justify-between px-5 pt-2 pb-5"
    >
      <button
        onClick={() => {
          if (window.confirm("Are you sure you want to log out?")) {
            logout();
          }
        }}
        title="Click to logout"
        className="w-11 h-11 rounded-[14px] bg-surface border border-stroke flex items-center justify-center font-display font-bold text-sm text-text hover:border-coral/40 transition-colors"
      >
        {initials}
      </button>
      
      <button
        onClick={toggleTheme}
        className="w-11 h-11 rounded-[14px] bg-surface border border-stroke flex items-center justify-center text-text hover:bg-stroke transition-colors"
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </button>
    </motion.div>
  );
}
