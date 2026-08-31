import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SendMoneyProps {
  onBack?: () => void;
  onSendSuccess: (amount: number, recipient: string) => void;
}

export default function SendMoney({ onBack, onSendSuccess }: SendMoneyProps) {
  const [sendAmount, setSendAmount] = useState<string>("1560");
  const [recipientName, setRecipientName] = useState<string>("Marc Cucurella");
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const parsedAmount = parseFloat(sendAmount) || 0;
  const conversionRate = 14841.66;
  const recipientGets = parsedAmount * conversionRate;
  
  const fee = parsedAmount > 0 ? 10.83 : 0;
  const totalConvert = Math.max(0, parsedAmount - fee);

  const handleSend = () => {
    if (parsedAmount <= 0) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setShowSuccess(true);
      onSendSuccess(parsedAmount, recipientName);
      setTimeout(() => {
        setShowSuccess(false);
        if (onBack) onBack();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="px-5 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-full bg-surface border border-stroke flex items-center justify-center text-text hover:bg-stroke active:scale-95 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <span className="font-display font-bold text-lg text-text">Sending Money</span>
        <div className="w-11" /> {/* spacer */}
      </div>

      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 bg-cardBg border border-stroke rounded-[28px]"
          >
            <div className="w-16 h-16 rounded-full bg-[#bdff80]/15 flex items-center justify-center text-[#bdff80] mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-lg text-text">Transfer Success!</h3>
            <p className="text-xs text-textDim/70 mt-1">Sent ${parsedAmount.toLocaleString()} to {recipientName}</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Recipient Input */}
            <div className="bg-cardBg border border-white/[0.03] rounded-[22px] p-4">
              <label className="text-[11px] font-bold text-textDim/50 uppercase tracking-wider">Recipient Name</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-transparent text-text font-semibold text-base mt-1.5 focus:outline-none placeholder-textDim/30 border-b border-stroke pb-1"
                placeholder="Enter recipient"
              />
            </div>

            {/* You Send Card */}
            <div className="bg-cardBg border border-white/[0.03] rounded-[22px] p-5">
              <span className="text-[11px] font-bold text-textDim/50 uppercase tracking-wider">You send</span>
              <div className="flex items-center justify-between mt-2">
                <input
                  type="number"
                  pattern="[0-9]*"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="bg-transparent text-text font-display font-bold text-[28px] focus:outline-none w-2/3"
                />
                <div className="inline-flex items-center gap-1 bg-surface border border-stroke rounded-full px-3 py-1.5 text-xs font-bold text-text cursor-pointer hover:bg-stroke">
                  USD
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Recipient Gets Card */}
            <div className="bg-[#bdff80] text-bg rounded-[22px] p-5 shadow-[0_12px_24px_rgba(189,255,128,0.15)] relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-20px] text-[110px] font-bold text-bg/[0.02] select-none font-display pointer-events-none tracking-tighter leading-none">
                get
              </div>
              <span className="text-[11px] font-bold text-bg/60 uppercase tracking-wider">Recipient gets</span>
              <div className="flex items-center justify-between mt-2">
                <div className="font-display font-bold text-[26px] tracking-tight text-bg">
                  {recipientGets.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </div>
                <span className="text-xs font-bold bg-bg/10 rounded-full px-3 py-1.5 text-bg">IDR</span>
              </div>
            </div>

            {/* Conversion Details */}
            <div className="px-2.5 py-1 space-y-2 text-xs">
              <div className="flex justify-between text-textDim/70">
                <span>Fee</span>
                <span className="font-medium text-text">{fee.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-textDim/70">
                <span>Total convert</span>
                <span className="font-medium text-text">{totalConvert.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-textDim/70">
                <span>Guaranteed exchange</span>
                <span className="font-medium text-text">1 USD = {conversionRate.toLocaleString()} IDR</span>
              </div>

              {/* Badges */}
              <div className="flex gap-2 pt-2">
                <div className="bg-[#bdff80]/10 border border-[#bdff80]/20 text-[#bdff80] rounded-lg px-2.5 py-1 text-[11px] font-bold">
                  Save up to 23.93 USD
                </div>
                <div className="bg-surface border border-stroke text-textDim rounded-lg px-2.5 py-1 text-[11px] font-bold">
                  Arrive in 6 hours
                </div>
              </div>
            </div>

            {/* CTA Continue Button */}
            <button
              onClick={handleSend}
              disabled={isSending || parsedAmount <= 0}
              className="w-full h-[62px] bg-cardBg border border-white/[0.03] rounded-full p-1.5 flex items-center justify-between mt-6 group hover:border-[#bdff80]/20 transition-all shadow-md relative overflow-hidden"
            >
              <div className="w-[50px] h-[50px] rounded-full bg-[#bdff80] flex items-center justify-center text-bg group-hover:translate-x-2 transition-transform duration-350 shadow-md">
                {isSending ? (
                  <svg className="animate-spin h-5 w-5 text-bg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </div>
              <span className="font-display font-bold text-[15px] text-text/90 pr-2 select-none">
                {isSending ? "Processing..." : "Continue"}
              </span>
              <div className="flex gap-0.5 text-textDim/30 group-hover:text-[#bdff80]/50 pr-4 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="-ml-1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
