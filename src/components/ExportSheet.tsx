import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FilePdf, X, DownloadSimple, CalendarBlank } from "phosphor-react";
import { useStore, getCurrencyInfo } from "../context/StoreContext";
import {
  resolvePeriod,
  buildReportData,
  buildReportPdf,
} from "../lib/exportReport";
import type { ExportPeriodKey } from "../lib/exportReport";

const PRESETS: { key: ExportPeriodKey; label: string }[] = [
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_year", label: "This Year" },
  { key: "all", label: "All Time" },
];

interface ExportSheetProps {
  open: boolean;
  onClose: () => void;
}

function fmtPrice(n: number, symbol: string, locale: string) {
  return `${symbol} ${Math.abs(n).toLocaleString(locale)}`;
}

export default function ExportSheet({ open, onClose }: ExportSheetProps) {
  const { transactions, user, currency } = useStore();
  const cur = getCurrencyInfo(currency);
  const [periodKey, setPeriodKey] = useState<ExportPeriodKey>("this_month");
  const [customMonth, setCustomMonth] = useState("2026-09");
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogo(img);
    img.src = "/Image-assets/MP-ICON.png";
  }, []);

  useEffect(() => {
    if (open) {
      const now = new Date();
      const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      setPeriodKey("this_month");
      setCustomMonth(m);
      setDownloading(false);
      setDone(false);
    }
  }, [open]);

  const period = useMemo(() => resolvePeriod(periodKey, customMonth), [periodKey, customMonth]);

  const data = useMemo(() => buildReportData(transactions, period), [transactions, period]);

  const canDownload = data.transactions.length > 0;

  const handleDownload = () => {
    if (!canDownload || downloading) return;
    setDownloading(true);
    try {
      const doc = buildReportPdf({
        data,
        periodLabel: period.label,
        currencySymbol: cur.symbol,
        currencyName: cur.name,
        locale: cur.locale,
        userName: user?.name || "My Pocket user",
        generatedAt: new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        logo,
      });
      const slug = period.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      doc.save(`My-Pocket-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`);
      setDone(true);
      setTimeout(() => onClose(), 1100);
    } catch {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !downloading && onClose()}
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
                  <h3 className="font-display font-bold text-base text-text">Export Report</h3>
                  <p className="text-[11px] text-textDim/50 mt-0.5">Download a PDF summary of your money.</p>
                </div>
                <button
                  onClick={() => !downloading && onClose()}
                  className="w-8 h-8 rounded-full bg-textFaint/10 flex items-center justify-center text-textDim hover:text-text transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {done ? (
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
                  <p className="text-text font-display font-bold text-base">Report Downloaded</p>
                  <p className="text-[11px] text-textDim/50 mt-1">Saved to your downloads folder.</p>
                </motion.div>
              ) : (
                <motion.div key="entry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
                  {/* Period presets */}
                  <p className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider mb-2.5">Period</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {PRESETS.map((p) => {
                      const selected = periodKey === p.key;
                      return (
                        <button
                          key={p.key}
                          onClick={() => setPeriodKey(p.key)}
                          className={`px-3.5 h-8 rounded-full border text-[11px] font-bold transition-all active:scale-[0.96] ${
                            selected
                              ? "bg-[#5CB010]/12 border-[#5CB010]/30 text-[#5CB010]"
                              : "bg-white/[0.03] border-stroke text-textDim hover:text-text"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPeriodKey("custom")}
                      className={`px-3.5 h-8 rounded-full border text-[11px] font-bold transition-all active:scale-[0.96] ${
                        periodKey === "custom"
                          ? "bg-[#5CB010]/12 border-[#5CB010]/30 text-[#5CB010]"
                          : "bg-white/[0.03] border-stroke text-textDim hover:text-text"
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {periodKey === "custom" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden mb-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-[10px] bg-[#5CB010]/10 border border-[#5CB010]/25 flex items-center justify-center text-[#5CB010] shrink-0">
                          <CalendarBlank size={16} weight="bold" />
                        </div>
                        <input
                          type="month"
                          value={customMonth}
                          min="2020-01"
                          max="2030-12"
                          onChange={(e) => setCustomMonth(e.target.value)}
                          className="flex-1 h-[42px] px-3 rounded-[12px] bg-white/[0.05] border border-stroke text-text text-[13px] font-semibold outline-none focus:border-[#5CB010]/50 transition-colors"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Summary preview */}
                  <div className="rounded-[18px] bg-cardBg border border-stroke p-4 mb-4 mt-4">
                    <div className="flex items-baseline justify-between mb-3">
                      <p className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider">Report Preview</p>
                      <p className="text-[11px] font-semibold text-[#5CB010]">{period.label}</p>
                    </div>
                    {canDownload ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[9px] text-textDim/40 font-bold uppercase tracking-wider mb-1">Transactions</p>
                          <p className="text-[15px] font-display font-bold text-text">{data.transactions.length}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-textDim/40 font-bold uppercase tracking-wider mb-1">Credit</p>
                          <p className="text-[15px] font-display font-bold text-[#5CB010]">{fmtPrice(data.totalCredit, cur.symbol, cur.locale)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-textDim/40 font-bold uppercase tracking-wider mb-1">Spend</p>
                          <p className="text-[15px] font-display font-bold text-coral">{fmtPrice(data.totalSpend, cur.symbol, cur.locale)}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-textDim/50">No transactions recorded for this period.</p>
                    )}
                  </div>

                  {/* Download button */}
                  <button
                    onClick={handleDownload}
                    disabled={!canDownload || downloading}
                    className="w-full flex items-center justify-center gap-2 h-[46px] rounded-[14px] bg-gradient-to-br from-[#73DA14] via-[#5CB010] to-[#2E680A] text-[#050805] font-display font-bold text-[13px] active:scale-[0.97] transition-all disabled:opacity-35 disabled:cursor-not-allowed shadow-[0_6px_18px_-4px_rgba(92,176,16,0.35)]"
                  >
                    {downloading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating…
                      </>
                    ) : (
                      <>
                        <DownloadSimple size={17} weight="bold" />
                        Download PDF
                        <span className="text-[9px] font-semibold opacity-50 ml-1">
                          <FilePdf size={13} weight="bold" className="inline -mt-0.5" />
                        </span>
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