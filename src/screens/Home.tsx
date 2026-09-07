import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "../components/TopBar";
import WalletCard from "../components/WalletCard";
import BalanceCards from "../components/BalanceCards";
import StatPills from "../components/StatPills";
import TransactionList from "../components/TransactionList";
import BottomNav from "../components/BottomNav";
import SendMoney from "../components/SendMoney";
import StatisticsCard from "../components/StatisticsCard";
import BalanceSetup from "../components/BalanceSetup";
import PendingReturns from "../components/PendingReturns";
import CalendarView from "../components/CalendarView";
import Settings from "../components/Settings";
import { useStore } from "../context/StoreContext";

export default function Home() {
  const { balances, transactions, transferMoney, setShowProfile } = useStore();
  const [activeTab, setActiveTab] = useState<string>("home");
  const [showSetup, setShowSetup] = useState(!balances);
  const [showReturns, setShowReturns] = useState(false);

  const goToSettings = () => {
    setShowProfile(false);
    setActiveTab("settings");
  };

  const handleSendSuccess = async (amount: number, _recipient: string) => {
    await transferMoney(amount, "liquid", `Transfer to ${_recipient}`);
  };

  const totalBalance =
    (balances?.liquidAmount ?? 0) + (balances?.accountAmount ?? 0);

  return (
    <div
      className="h-full w-full text-text relative bg-bg"
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
              <TopBar
                onSetupWallet={() => setShowSetup(true)}
                onGoToSettings={goToSettings}
              />
              <div className="font-display font-bold text-[34px] leading-none tracking-tight px-5 pb-5 text-text">
                Overview
              </div>
              <WalletCard balance={totalBalance} />
              <BalanceCards
                liquidAmount={balances?.liquidAmount ?? 0}
                accountAmount={balances?.accountAmount ?? 0}
              />
              <StatPills onToReceiveClick={() => setShowReturns(true)} />
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

          {activeTab === "calendar" && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.3 }}
            >
              <CalendarView onBack={() => setActiveTab("home")} />
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.3 }}
            >
              <Settings onBack={() => setActiveTab("home")} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Nav — absolute fixed at screen bottom, always visible */}
      <div className="absolute bottom-0 left-0 right-0 w-full px-3 pb-3 pt-1 z-40">
        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
      </div>

      {/* Balance Setup — bottom sheet overlay for new users */}
      <AnimatePresence>
        {showSetup && !balances && (
          <BalanceSetup onComplete={() => setShowSetup(false)} />
        )}
      </AnimatePresence>

      {/* Pending Returns Modal */}
      <PendingReturns isOpen={showReturns} onClose={() => setShowReturns(false)} />
    </div>
  );
}
