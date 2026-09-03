import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ArrowDownLeft, Check } from "phosphor-react";
import { useStore } from "../context/StoreContext";

interface PendingReturnsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PendingReturns({ isOpen, onClose }: PendingReturnsProps) {
  const { transactions } = useStore();

  // Debits given with love (money lent out)
  const givenWithLove = transactions
    .filter((tx) => tx.category === "with_love" && tx.type === "expense")
    .sort((a, b) => b.date.localeCompare(a.date));

  // Credits received back with love (money returned)
  const receivedBack = transactions
    .filter((tx) => tx.category === "with_love" && (tx.type === "income_salary" || tx.type === "income_topup"))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalGiven = givenWithLove.reduce((sum, tx) => sum + tx.amount, 0);
  const totalReceived = receivedBack.reduce((sum, tx) => sum + tx.amount, 0);
  const totalPending = Math.max(0, totalGiven - totalReceived);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
            <div className="bg-surface border-t border-stroke rounded-t-[28px] px-5 pt-4 pb-8 max-h-[70vh] overflow-y-auto">
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 rounded-full bg-textFaint/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display font-bold text-base text-text">To Receive</h3>
                  <p className="text-[11px] text-textDim/50 mt-0.5">
                    ₹ {totalPending.toLocaleString("en-IN")} pending
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-textFaint/10 flex items-center justify-center text-textDim hover:text-text transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Empty State */}
              {givenWithLove.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 flex items-center justify-center mx-auto mb-4">
                    <Heart size={28} weight="light" color="#F59E0B" />
                  </div>
                  <p className="text-[13px] font-semibold text-text">Nothing pending</p>
                  <p className="text-[11px] text-textDim/50 mt-1">No returnable amounts yet</p>
                </div>
              )}

              {/* Given With Love (Debits) */}
              {givenWithLove.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider mb-2">
                    Money Given
                  </p>
                  <div className="space-y-2">
                    {givenWithLove.map((tx, i) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3.5 bg-cardBg border border-stroke rounded-2xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#8B2252] flex items-center justify-center shrink-0">
                          <Heart size={18} weight="fill" color="white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-text truncate">
                            {tx.name}
                          </div>
                          <div className="text-[11px] text-textDim/50 mt-0.5">
                            {tx.date &&
                              new Date(tx.date + "T00:00:00").toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            {tx.note && ` · ${tx.note}`}
                          </div>
                        </div>
                        <div className="font-display font-bold text-[14px] text-[#F59E0B]">
                          ₹ {tx.amount.toLocaleString("en-IN")}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Received Back (Credits) */}
              {receivedBack.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-textDim/40 uppercase tracking-wider mb-2">
                    Money Received Back
                  </p>
                  <div className="space-y-2">
                    {receivedBack.map((tx, i) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3.5 bg-[#5CB010]/5 border border-[#5CB010]/10 rounded-2xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#5CB010]/20 flex items-center justify-center shrink-0">
                          <ArrowDownLeft size={18} weight="bold" color="#5CB010" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-text truncate">
                            {tx.name}
                          </div>
                          <div className="text-[11px] text-textDim/50 mt-0.5">
                            {tx.date &&
                              new Date(tx.date + "T00:00:00").toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                          </div>
                        </div>
                        <div className="font-display font-bold text-[14px] text-[#5CB010]">
                          +₹ {tx.amount.toLocaleString("en-IN")}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
