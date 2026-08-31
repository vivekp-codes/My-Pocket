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
  loading: boolean;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; isNewUser?: boolean }>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; isNewUser?: boolean }>;
  createProfile: (
    username: string,
    profileImage?: string
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

  // ── Load user data from Supabase ──────────────────────────────
  const loadUserData = async (supabaseUserId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, start_date, profile_image")
      .eq("id", supabaseUserId)
      .single();

    const profileComplete = !!(profile && profile.full_name);

    const userObj: User = {
      id: supabaseUserId,
      name: profile?.full_name ?? "",
      email: profile?.email ?? "",
      profileImage: profile?.profile_image ?? "/Image-assets/Profile-assets/p1.png",
      startDate: profile?.start_date ?? new Date().toISOString().split("T")[0],
      profileComplete,
    };

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

    const { data: txRows } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", supabaseUserId)
      .order("date", { ascending: false });

    setUser(userObj);
    setBalances(balanceObj);
    setTransactions(txRows ? txRows.map(rowToTransaction) : []);
  };

  // ── Auth state listener ───────────────────────────────────────
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setUser(null);
        setBalances(null);
        setTransactions([]);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Auth: Sign Up with email + password ───────────────────────
  const signUp = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      const isNewUser = !profile;
      return { success: true, isNewUser };
    }

    return { success: false, error: "Signup failed" };
  };

  // ── Auth: Login with email + password ──────────────────────────
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      const isNewUser = !profile;
      return { success: true, isNewUser };
    }

    return { success: false, error: "Login failed" };
  };

  // ── Auth: Create profile (new users) ──────────────────────────
  const createProfile = async (
    username: string,
    profileImage?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return { success: false, error: "No active session" };
    }

    const uid = authUser.id;
    const email = authUser.email ?? "";
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 5);
    const startDateStr = startDate.toISOString().split("T")[0];

    const { error: profileError } = await supabase.from("profiles").insert({
      id: uid,
      full_name: username,
      email,
      profile_image: profileImage ?? "/Image-assets/Profile-assets/p1.png",
      start_date: startDateStr,
    });

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    await supabase.from("balances").insert({
      user_id: uid,
      liquid_amount: 5850.40,
      account_amount: 225710.00,
    });

    const day2 = new Date(startDate);
    day2.setDate(day2.getDate() + 1);
    const day3 = new Date(startDate);
    day3.setDate(day3.getDate() + 2);
    const day4 = new Date(startDate);
    day4.setDate(day4.getDate() + 3);

    await supabase.from("transactions").insert([
      {
        user_id: uid,
        type: "income_salary",
        bucket: "account",
        amount: 225710.00,
        date: startDateStr,
        day_label: 1,
        name: "Salary Credit",
        icon: "💰",
        icon_bg: "#153a24",
        note: "Initial Month Salary",
      },
      {
        user_id: uid,
        type: "income_topup",
        bucket: "liquid",
        amount: 8000.00,
        date: startDateStr,
        day_label: 1,
        name: "Liquid Cash Setup",
        icon: "💵",
        icon_bg: "#1c2a20",
        note: "ATM Withdrawal",
      },
      {
        user_id: uid,
        type: "expense",
        bucket: "liquid",
        category: "food",
        amount: 340.00,
        date: day2.toISOString().split("T")[0],
        day_label: 2,
        name: "Swiggy Order",
        icon: "🍔",
        icon_bg: "#1c2a20",
        note: "Burger lunch",
      },
      {
        user_id: uid,
        type: "expense",
        bucket: "liquid",
        category: "entertainment",
        amount: 500.00,
        date: day3.toISOString().split("T")[0],
        day_label: 3,
        name: "Movie Tickets",
        icon: "🎬",
        icon_bg: "#1c2a20",
        note: "Split with Felix",
      },
      {
        user_id: uid,
        type: "expense",
        bucket: "liquid",
        category: "shopping",
        amount: 1309.60,
        date: day4.toISOString().split("T")[0],
        day_label: 4,
        name: "Marc Cucurella Store",
        icon: "👕",
        icon_bg: "#1c2a20",
        note: "Summer Tee",
      },
    ]);

    await loadUserData(uid);
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

    const dayLabel = getDayLabel(user.startDate, date);

    const { error: txError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "expense",
      bucket: "liquid",
      category,
      amount,
      date,
      day_label: dayLabel,
      note,
      name:
        category.charAt(0).toUpperCase() +
        category.slice(1) +
        (note ? ` (${note})` : ""),
      icon: getCategoryIcon(category),
      icon_bg: "#1c2a20",
    });

    if (txError) return;

    const newLiquid = Math.max(0, balances.liquidAmount - amount);
    await supabase
      .from("balances")
      .update({
        liquid_amount: newLiquid,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    setBalances({ ...balances, liquidAmount: newLiquid });

    setTransactions((prev) => [
      {
        id: crypto.randomUUID(),
        userId: user.id,
        type: "expense",
        bucket: "liquid",
        category,
        amount,
        date,
        dayLabel,
        note,
        name:
          category.charAt(0).toUpperCase() +
          category.slice(1) +
          (note ? ` (${note})` : ""),
        icon: getCategoryIcon(category),
        iconBg: "#1c2a20",
      },
      ...prev,
    ]);
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

    await supabase.from("transactions").insert({
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

    const updated = { ...balances };
    if (bucket === "liquid") updated.liquidAmount += amount;
    else updated.accountAmount += amount;

    await supabase
      .from("balances")
      .update({
        liquid_amount: updated.liquidAmount,
        account_amount: updated.accountAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    setBalances(updated);
    setTransactions((prev) => [
      {
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
      },
      ...prev,
    ]);
  };

  // ── DB: Transfer Money ─────────────────────────────────────────
  const transferMoney = async (
    amount: number,
    fromBucket: BucketType,
    note?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !balances)
      return { success: false, error: "No active session" };

    if (fromBucket === "liquid" && balances.liquidAmount < amount)
      return { success: false, error: "Insufficient liquid balance" };
    if (fromBucket === "account" && balances.accountAmount < amount)
      return { success: false, error: "Insufficient account balance" };

    const todayStr = new Date().toISOString().split("T")[0];
    const dayLabel = getDayLabel(user.startDate, todayStr);
    const toBucket = fromBucket === "liquid" ? "account" : "liquid";

    await supabase.from("transactions").insert({
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

    const updated = { ...balances };
    if (fromBucket === "liquid") {
      updated.liquidAmount -= amount;
      updated.accountAmount += amount;
    } else {
      updated.accountAmount -= amount;
      updated.liquidAmount += amount;
    }

    await supabase
      .from("balances")
      .update({
        liquid_amount: updated.liquidAmount,
        account_amount: updated.accountAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    setBalances(updated);
    setTransactions((prev) => [
      {
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
      },
      ...prev,
    ]);

    return { success: true };
  };

  // ── Theme toggle ───────────────────────────────────────────────
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        balances,
        transactions,
        theme,
        loading,
        signUp,
        login,
        createProfile,
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
