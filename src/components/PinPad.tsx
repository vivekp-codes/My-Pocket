import { motion } from "framer-motion";

interface PinDotsProps {
  value: string;
  error?: boolean;
}

// Four round slots showing how many digits have been entered
export function PinDots({ value, error }: PinDotsProps) {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-5">
      {[0, 1, 2, 3].map((i) => {
        const filled = i < value.length;
        return (
          <motion.div
            key={i}
            animate={
              error
                ? { scale: [1, 1.15, 1] }
                : filled
                ? { scale: [1, 1.25, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.25 }}
            className={`w-4 h-4 rounded-full transition-colors duration-200 ${
              error
                ? "bg-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                : filled
                ? "bg-gradient-to-br from-[#73DA14] to-[#2E680A] shadow-[0_0_12px_rgba(115,218,20,0.45)]"
                : "border-2 border-stroke bg-transparent"
            }`}
          />
        );
      })}
    </div>
  );
}

interface PinKeypadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}

// Numeric keypad (1–9, 0, backspace)
export function PinKeypad({ onDigit, onDelete, disabled }: PinKeypadProps) {
  const rows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ];

  return (
    <div className="w-full max-w-[260px] mx-auto">
      {rows.map((row, r) => (
        <div key={r} className="flex justify-center gap-3 sm:gap-4 mb-3">
          {row.map((d) => (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => onDigit(d)}
              className="w-[70px] h-[54px] sm:w-[74px] sm:h-[58px] rounded-2xl bg-white/[0.04] border border-white/[0.06] text-text font-display font-bold text-lg active:bg-[#73DA14]/15 active:border-[#73DA14]/30 active:scale-95 disabled:opacity-40 transition-all select-none"
            >
              {d}
            </button>
          ))}
        </div>
      ))}

      {/* Bottom row: empty spacer, 0, backspace */}
      <div className="flex justify-center gap-3 sm:gap-4">
        <div className="w-[70px] h-[54px] sm:w-[74px] sm:h-[58px]" />
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDigit("0")}
          className="w-[70px] h-[54px] sm:w-[74px] sm:h-[58px] rounded-2xl bg-white/[0.04] border border-white/[0.06] text-text font-display font-bold text-lg active:bg-[#73DA14]/15 active:border-[#73DA14]/30 active:scale-95 disabled:opacity-40 transition-all select-none"
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="w-[70px] h-[54px] sm:w-[74px] sm:h-[58px] rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-textDim active:bg-coral/10 active:border-coral/20 active:scale-95 disabled:opacity-40 transition-all"
          aria-label="Delete digit"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
            <line x1="18" y1="9" x2="12" y2="15" />
            <line x1="12" y1="9" x2="18" y2="15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
