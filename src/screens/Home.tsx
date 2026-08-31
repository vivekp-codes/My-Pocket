import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "../components/TopBar";
import WalletCard from "../components/WalletCard";
import StatPills from "../components/StatPills";
import TransactionList from "../components/TransactionList";
import BottomNav from "../components/BottomNav";
import SendMoney from "../components/SendMoney";
import StatisticsCard from "../components/StatisticsCard";
import { useStore } from "../context/StoreContext";

export default function Home() {
  const { balances, transactions, transferMoney } = useStore();
  const [activeTab, setActiveTab] = useState<string>("home");

  const handleSendSuccess = async (amount: number, _recipient: string) => {
    // Transfer from liquid balance (simulates sending money)
    await transferMoney(amount, "liquid", `Transfer to ${_recipient}`);
  };

  const totalBalance =
    (balances?.liquidAmount ?? 0) + (balances?.accountAmount ?? 0);

  return (
    <div
      className="min-h-screen w-full text-text relative pb-[120px] md:pb-12"
      style={{ background: "linear-gradient(180deg, #121a15 0%, #0d130f 30%)" }}
    >
      {/* Desktop Layout: 3 Columns Grid */}
      <div className="hidden md:grid grid-cols-3 gap-8 max-w-7xl mx-auto pt-8 px-6">
        {/* Column 1: Account Overview */}
        <div className="bg-[#090d0b]/80 border border-white/[0.02] rounded-[32px] py-6 shadow-2xl">
          <TopBar />
          <div className="font-display font-bold text-[34px] leading-none tracking-tight px-5 pb-5 text-text">
            Overview
          </div>
          <WalletCard balance={totalBalance} />
          <StatPills />
          <TransactionList transactions={transactions} />
        </div>

        {/* Column 2: Send Money */}
        <div className="bg-[#090d0b]/80 border border-white/[0.02] rounded-[32px] py-6 shadow-2xl">
          <SendMoney onSendSuccess={handleSendSuccess} />
        </div>

        {/* Column 3: Statistics */}
        <div className="bg-[#090d0b]/80 border border-white/[0.02] rounded-[32px] py-6 shadow-2xl">
          <StatisticsCard />
        </div>
      </div>

      {/* Mobile Layout: Single Tab Column */}
      <div className="block md:hidden max-w-xl mx-auto w-full pt-6">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.3 }}
            >
              <TopBar />
              <div className="font-display font-bold text-[34px] leading-none tracking-tight px-5 pb-5 text-text">
                Overview
              </div>
              <WalletCard balance={totalBalance} />
              <StatPills />
              <TransactionList transactions={transactions} />
            </motion.div>
          )}

          {activeTab === "add" && (
            <motion.div
              key="send-money"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.3 }}
            >
              <SendMoney
                onBack={() => setActiveTab("home")}
                onSendSuccess={handleSendSuccess}
              />
            </motion.div>
          )}

          {activeTab === "wallet" && (
            <motion.div
              key="statistics"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.3 }}
            >
              <StatisticsCard onBack={() => setActiveTab("home")} />
            </motion.div>
          )}

          {(activeTab === "people" || activeTab === "grid") && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.3 }}
              className="px-5 text-center py-20 bg-cardBg border border-stroke rounded-[28px] m-5"
            >
              <div className="text-4xl mb-4">🛠️</div>
              <h3 className="font-display font-bold text-lg text-text">
                Under Construction
              </h3>
              <p className="text-xs text-textDim/70 mt-1">
                This section is coming soon.
              </p>
              <button
                onClick={() => setActiveTab("home")}
                className="mt-6 bg-[#bdff80] text-bg font-bold px-5 py-2 rounded-full text-xs hover:bg-opacity-80 transition-all"
              >
                Go Back Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Bottom Nav for Mobile */}
      <div className="fixed bottom-[22px] left-1/2 -translate-x-1/2 w-[calc(100%-44px)] max-w-sm z-40 md:hidden">
        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
      </div>
    </div>
  );
}
