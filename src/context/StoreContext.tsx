import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type {
  User,
  Balance,
  Transaction,
  BucketType,
  ExpenseCategory,
} from "../types/transaction";

// ── Context Shape ──────────────────────────────────────────────────
interface StoreContextType {
  user: User | null;
  balances: Balance | null;
  transactions: Transaction[];
  theme: "dark" | "light";
  loading: boolean; // true while checking initial auth session
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  addExpense: (
    amount: number,
    category: ExpenseCategory,
    date: string,
    note?: string
  ) => Promise<void>;
  addIncome: (
    amount: number,
    type: "income_salary" | "income_topup",
    bucket: BucketType,
    note?: string
  ) => Promise<void>;
  transferMoney: (
    amount: number,
    fromBucket: BucketType,
    note?: string
  ) => Promise<{ success: boolean; error?: string }>;
  toggleTheme: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// ── Helpers ────────────────────────────────────────────────────────
const getDayLabel = (startDateStr: string, currentDateStr: string): number => {
  const start = new Date(startDateStr);
  const current = new Date(currentDateStr);
  start.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  const diffTime = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
};

/** Map a Supabase row → our Transaction type */
const rowToTransaction = (row: any): Transaction => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  bucket: row.bucket,
  category: row.category,
  amount: Number(row.amount),
  date: row.date,
  dayLabel: row.day_label,
  note: row.note,
  recipient: row.recipient,
  name: row.name,
  icon: row.icon,
  iconBg: row.icon_bg,
  meta: row.meta,
  currency: row.currency,
});

// ── Provider ───────────────────────────────────────────────────────
export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [balances, setBalances] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("expense_tracker_theme");
    return (saved as "dark" | "light") || "dark";
  });

  // ── Theme sync ─────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("expense_tracker_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // ── Load user profile, balances, transactions from Supabase ──
  const loadUserData = async (supabaseUserId: string) => {
    // 1. Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, start_date")
      .eq("id", supabaseUserId)
      .single();

    const userObj: User = {
      id: supabaseUserId,
      name: profile?.full_name ?? "",
      email: "", // will be set from auth session
      startDate: profile?.start_date ?? new Date().toISOString().split("T")[0],
    };

    // 2. Fetch balance
    const { data: balRow } = await supabase
      .from("balances")
      .select("liquid_amount, account_amount")
      .eq("user_id", supabaseUserId)
      .single();

    const balanceObj: Balance = {
      userId: supabaseUserId,
      liquidAmount: Number(balRow?.liquid_amount ?? 5850.40),
      accountAmount: Number(balRow?.account_amount ?? 225710.00),
    };

    // 3. Fetch transactions (newest first)
    const { data: txRows } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", supabaseUserId)
      .order("date", { ascending: false });

    setUser(userObj);
    setBalances(balanceObj);
    setTransactions(txRows ? txRows.map(rowToTransaction) : []);
  };

  // ── Listen for Supabase auth state changes ─────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setUser(null);
          setBalances(null);
          setTransactions([]);
        }
        setLoading(false);
      }
    );

    // Also check the current session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Auth: Sign Up ──────────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      await loadUserData(data.user.id);
    }

    return { success: true };
  };

  // ── Auth: Login ────────────────────────────────────────────────
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      await loadUserData(data.user.id);
    }

    return { success: true };
  };

  // ── Auth: Logout ───────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBalances(null);
    setTransactions([]);
  };

  // ── DB: Add Expense ────────────────────────────────────────────
  const addExpense = async (
    amount: number,
    category: ExpenseCategory,
    date: string,
    note?: string
  ) => {
    if (!user || !balances) return;

    const todayStr = date;
    const dayLabel = getDayLabel(user.startDate, todayStr);

    // 1. Insert transaction
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "expense",
      bucket: "liquid",
      category,
      amount,
      date: todayStr,
      day_label: dayLabel,
      note,
      name:
        category.charAt(0).toUpperCase() +
        category.slice(1) +
        (note ? ` (${note})` : ""),
      icon: getCategoryIcon(category),
      icon_bg: "#1c2a20",
    });

    if (txError) {
      console.error("Failed to insert expense:", txError);
      return;
    }

    // 2. Deduct from liquid balance
    const newLiquid = Math.max(0, balances.liquidAmount - amount);
    const { error: balError } = await supabase
      .from("balances")
      .update({ liquid_amount: newLiquid, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (balError) {
      console.error("Failed to update balance:", balError);
      return;
    }

    // 3. Update local state
    setBalances({ ...balances, liquidAmount: newLiquid });

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      userId: user.id,
      type: "expense",
      bucket: "liquid",
      category,
      amount,
      date: todayStr,
      dayLabel,
      note,
      name:
        category.charAt(0).toUpperCase() +
        category.slice(1) +
        (note ? ` (${note})` : ""),
      icon: getCategoryIcon(category),
      iconBg: "#1c2a20",
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // ── DB: Add Income ─────────────────────────────────────────────
  const addIncome = async (
    amount: number,
    type: "income_salary" | "income_topup",
    bucket: BucketType,
    note?: string
  ) => {
    if (!user || !balances) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const dayLabel = getDayLabel(user.startDate, todayStr);

    // 1. Insert transaction
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type,
      bucket,
      amount,
      date: todayStr,
      day_label: dayLabel,
      note,
      name: type === "income_salary" ? "Salary Received" : "Top-up Wallet",
      icon: type === "income_salary" ? "💰" : "💵",
      icon_bg: type === "income_salary" ? "#153a24" : "#192a20",
    });

    if (txError) {
      console.error("Failed to insert income:", txError);
      return;
    }

    // 2. Credit the bucket
    const updatedBalances = { ...balances };
    if (bucket === "liquid") {
      updatedBalances.liquidAmount += amount;
    } else {
      updatedBalances.accountAmount += amount;
    }

    const { error: balError } = await supabase
      .from("balances")
      .update({
        liquid_amount: updatedBalances.liquidAmount,
        account_amount: updatedBalances.accountAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (balError) {
      console.error("Failed to update balance:", balError);
      return;
    }

    // 3. Update local state
    setBalances(updatedBalances);

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      userId: user.id,
      type,
      bucket,
      amount,
      date: todayStr,
      dayLabel,
      note,
      name: type === "income_salary" ? "Salary Received" : "Top-up Wallet",
      icon: type === "income_salary" ? "💰" : "💵",
      iconBg: type === "income_salary" ? "#153a24" : "#192a20",
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // ── DB: Transfer Money ─────────────────────────────────────────
  const transferMoney = async (
    amount: number,
    fromBucket: BucketType,
    note?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !balances) return { success: false, error: "No active session" };

    if (fromBucket === "liquid" && balances.liquidAmount < amount) {
      return { success: false, error: "Insufficient liquid balance" };
    }
    if (fromBucket === "account" && balances.accountAmount < amount) {
      return { success: false, error: "Insufficient account balance" };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const dayLabel = getDayLabel(user.startDate, todayStr);
    const toBucket = fromBucket === "liquid" ? "account" : "liquid";

    // 1. Insert transaction
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "transfer",
      bucket: toBucket,
      amount,
      date: todayStr,
      day_label: dayLabel,
      note: note || `Transfer ${fromBucket} → ${toBucket}`,
      name: `Transfer: ${fromBucket === "liquid" ? "Liquid → Account" : "Account → Liquid"}`,
      icon: "🔄",
      icon_bg: "#122a1f",
    });

    if (txError) {
      console.error("Failed to insert transfer:", txError);
      return { success: false, error: "Failed to record transfer" };
    }

    // 2. Update balances
    const updatedBalances = { ...balances };
    if (fromBucket === "liquid") {
      updatedBalances.liquidAmount -= amount;
      updatedBalances.accountAmount += amount;
    } else {
      updatedBalances.accountAmount -= amount;
      updatedBalances.liquidAmount += amount;
    }

    const { error: balError } = await supabase
      .from("balances")
      .update({
        liquid_amount: updatedBalances.liquidAmount,
        account_amount: updatedBalances.accountAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (balError) {
      console.error("Failed to update balance:", balError);
      return { success: false, error: "Failed to update balance" };
    }

    // 3. Update local state
    setBalances(updatedBalances);

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      userId: user.id,
      type: "transfer",
      bucket: toBucket,
      amount,
      date: todayStr,
      dayLabel,
      note: note || `Transfer ${fromBucket} → ${toBucket}`,
      name: `Transfer: ${fromBucket === "liquid" ? "Liquid → Account" : "Account → Liquid"}`,
      icon: "🔄",
      iconBg: "#122a1f",
    };
    setTransactions((prev) => [newTx, ...prev]);

    return { success: true };
  };

  // ── Theme toggle ───────────────────────────────────────────────
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <StoreContext.Provider
      value={{
        user,
        balances,
        transactions,
        theme,
        loading,
        login,
        signUp,
        logout,
        addExpense,
        addIncome,
        transferMoney,
        toggleTheme,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

// ── Helpers ────────────────────────────────────────────────────────
function getCategoryIcon(category: ExpenseCategory): string {
  const icons: Record<ExpenseCategory, string> = {
    travel: "🚗",
    food: "🍔",
    bills: "💡",
    shopping: "🛍️",
    entertainment: "🎬",
    other: "💸",
  };
  return icons[category] || "💸";
}
