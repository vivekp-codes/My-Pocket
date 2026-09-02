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
    await transferMoney(amount, "liquid", `Transfer to ${_recipient}`);
  };

  const totalBalance =
    (balances?.liquidAmount ?? 0) + (balances?.accountAmount ?? 0);

  return (
    <div
      className="h-full w-full text-text relative"
      style={{ background: "linear-gradient(180deg, #121a15 0%, #0d130f 30%)" }}
    >
      {/* Scrollable content area — padded so last item doesn't hide behind nav */}
      <div className="h-full overflow-y-auto overflow-x-hidden max-w-xl mx-auto w-full pt-6 pb-[100px]">
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

      {/* Bottom Nav — absolute fixed at screen bottom, always visible */}
      <div className="absolute bottom-0 left-0 right-0 w-full px-3 pb-3 pt-1 z-40">
        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
      </div>
    </div>
  );
}
