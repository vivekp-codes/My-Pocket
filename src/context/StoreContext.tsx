import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type {
  User,
  Balance,
  Transaction,
  BucketType,
  ExpenseCategory,
} from "../types/transaction";

// ── Currencies ──────────────────────────────────────────────────
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "en-IE" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
];

export function getCurrencyInfo(code: string): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

// ── App Lock (4-digit PIN) ──────────────────────────────────────
const pinKeyFor = (uid: string) => `expense_tracker_apppin_${uid}`;

// Light, non-cryptographic hash — PIN is never stored in plain text.
function hashPin(pin: string): string {
  let h1 = 0xdeadbeef ^ pin.length;
  let h2 = 0x41c6ce57 ^ pin.length;
  for (let i = 0; i < pin.length; i++) {
    const ch = pin.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36);
}

function readPin(uid: string): string | null {
  try {
    return localStorage.getItem(pinKeyFor(uid));
  } catch {
    return null;
  }
}

// ── Context Shape ──────────────────────────────────────────────────
interface StoreContextType {
  user: User | null;
  balances: Balance | null;
  transactions: Transaction[];
  theme: "dark" | "light";
  loading: boolean;
  showProfile: boolean;
  setShowProfile: (v: boolean) => void;
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
  updateUsername: (newName: string) => Promise<{ success: boolean; error?: string }>;
  updateProfileImage: (imageUrl: string) => Promise<{ success: boolean; error?: string }>;
  saveBalance: (liquidAmount: number, accountAmount: number) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  addExpense: (
    amount: number,
    category: ExpenseCategory,
    date: string,
    note?: string,
    bucket?: BucketType
  ) => Promise<void>;
  addIncome: (
    amount: number,
    type: "income_salary" | "income_topup",
    bucket: BucketType,
    note?: string,
    category?: string
  ) => Promise<void>;
  transferMoney: (
    amount: number,
    fromBucket: BucketType,
    note?: string
  ) => Promise<{ success: boolean; error?: string }>;
  toggleTheme: () => void;
  currency: string;
  setCurrency: (code: string) => void;
  appPinEnabled: boolean;
  locked: boolean;
  enableAppPin: (pin: string) => void;
  verifyAppPin: (pin: string) => boolean;
  disableAppPin: () => void;
  unlockApp: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// ── Helpers ────────────────────────────────────────────────────────
// Local YYYY-MM-DD — transaction dates must match the user's local day
// (comparing against toISOString/UTC would shift by one in +ve offsets).
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const getDayLabel = (startDateStr: string, currentDateStr: string): number => {
  const start = new Date(startDateStr);
  const current = new Date(currentDateStr);
  start.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  const diffTime = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
};

// ── Provider ───────────────────────────────────────────────────────
export function StoreProvider({ children }: { children: ReactNode }) {
  // True when the user signed in manually in this JS session (login/signup).
  // When a session is merely *restored* on app open, we auto-lock if a PIN exists.
  const manualAuthRef = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [balances, setBalances] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("expense_tracker_theme");
    return (saved as "dark" | "light") || "dark";
  });
  const [currency, setCurrencyState] = useState<string>(() => {
    const saved = localStorage.getItem("expense_tracker_currency");
    return saved && CURRENCIES.some((c) => c.code === saved) ? saved : "INR";
  });
  const [showProfile, setShowProfile] = useState(false);
  const [appPinEnabled, setAppPinEnabled] = useState(false);
  const [locked, setLocked] = useState(false);

  // ── App Lock helpers ──────────────────────────────────────
  const currentUid = () => auth.currentUser?.uid ?? user?.id ?? "";

  const enableAppPin = (pin: string) => {
    const uid = currentUid();
    if (!uid || !/^\d{4}$/.test(pin)) return;
    try {
      localStorage.setItem(pinKeyFor(uid), hashPin(pin));
    } catch {
      return;
    }
    setAppPinEnabled(true);
  };

  const verifyAppPin = (pin: string): boolean => {
    const uid = currentUid();
    if (!uid) return false;
    return readPin(uid) === hashPin(pin);
  };

  const disableAppPin = () => {
    const uid = currentUid();
    if (!uid) return;
    try {
      localStorage.removeItem(pinKeyFor(uid));
    } catch {
      return;
    }
    setAppPinEnabled(false);
    setLocked(false);
  };

  const unlockApp = () => {
    setLocked(false);
  };

  // ── Theme + currency sync ─────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("expense_tracker_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("expense_tracker_currency", currency);
  }, [currency]);

  // ── Load user data from Firestore ─────────────────────────────
  const loadUserData = async (firebaseUser: FirebaseUser) => {
    const uid = firebaseUser.uid;

    // Profile
    const profileDoc = await getDoc(doc(db, "profiles", uid));
    const profileData = profileDoc.exists() ? profileDoc.data() : null;
    const profileComplete = !!(profileData && profileData.full_name);

    const userObj: User = {
      id: uid,
      name: profileData?.full_name ?? "",
      email: profileData?.email ?? firebaseUser.email ?? "",
      profileImage: profileData?.profile_image ?? "/Image-assets/Profile-assets/p1.png",
      startDate: profileData?.start_date ?? toLocalDateStr(new Date()),
      profileComplete,
    };

    // Balance
    const balanceDoc = await getDoc(doc(db, "balances", uid));
    const balanceData = balanceDoc.exists() ? balanceDoc.data() : null;

    // If no balance document exists, user needs to set up their wallet
    const balanceObj: Balance | null = balanceData ? {
      userId: uid,
      liquidAmount: Number(balanceData.liquid_amount ?? 0),
      accountAmount: Number(balanceData.account_amount ?? 0),
    } : null;

    // Transactions — try with orderBy first, fallback to simple query if index missing
    let txList: Transaction[] = [];
    try {
      const txQuery = query(
        collection(db, "transactions"),
        where("user_id", "==", uid),
        orderBy("date", "desc")
      );
      const txSnapshot = await getDocs(txQuery);
      txList = txSnapshot.docs.map((d) => {
        const data = d.data();
        const bucketLabel = data.bucket === "liquid" ? "In Hand" : data.bucket === "account" ? "Account" : "";
        return {
          id: d.id,
          userId: data.user_id,
          type: data.type,
          bucket: data.bucket,
          category: data.category,
          amount: Number(data.amount),
          date: data.date,
          dayLabel: data.day_label,
          note: data.note,
          recipient: data.recipient,
          name: data.name,
          icon: data.icon,
          iconBg: data.icon_bg,
          meta: data.bucket_label || bucketLabel || data.meta || "",
          currency: data.currency,
        };
      });
    } catch (indexError) {
      // Fallback: query without orderBy (no index needed)
      console.warn("Index missing, using fallback query:", indexError);
      const txQuerySimple = query(
        collection(db, "transactions"),
        where("user_id", "==", uid)
      );
      const txSnapshot = await getDocs(txQuerySimple);
      txList = txSnapshot.docs.map((d) => {
        const data = d.data();
        const bucketLabel = data.bucket === "liquid" ? "In Hand" : data.bucket === "account" ? "Account" : "";
        return {
          id: d.id,
          userId: data.user_id,
          type: data.type,
          bucket: data.bucket,
          category: data.category,
          amount: Number(data.amount),
          date: data.date,
          dayLabel: data.day_label,
          note: data.note,
          recipient: data.recipient,
          name: data.name,
          icon: data.icon,
          iconBg: data.icon_bg,
          meta: data.bucket_label || bucketLabel || data.meta || "",
          currency: data.currency,
        };
      });
      // Sort manually
      txList.sort((a, b) => b.date.localeCompare(a.date));
    }

    setUser(userObj);
    setBalances(balanceObj);
    setTransactions(txList);
    setAppPinEnabled(readPin(uid) !== null);
  };

  // ── Auth state listener ───────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserData(firebaseUser);
        // Only auto-lock when the session was restored (app opened again),
        // never right after an explicit login/signup in this session.
        if (!manualAuthRef.current && readPin(firebaseUser.uid) !== null) {
          setLocked(true);
        }
      } else {
        setUser(null);
        setBalances(null);
        setTransactions([]);
        setAppPinEnabled(false);
        setLocked(false);
        manualAuthRef.current = false;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Auth: Sign Up ─────────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const fbUser = userCredential.user;

      manualAuthRef.current = true;

      // Check if profile already exists
      const profileDoc = await getDoc(doc(db, "profiles", fbUser.uid));
      const isNewUser = !profileDoc.exists();

      return { success: true, isNewUser };
    } catch (err: any) {
      let message = "Signup failed";
      if (err.code === "auth/email-already-in-use") {
        message = "An account with this email already exists";
      } else if (err.code === "auth/weak-password") {
        message = "Password must be at least 6 characters";
      } else if (err.code === "auth/invalid-email") {
        message = "Invalid email address";
      }
      return { success: false, error: message };
    }
  };

  // ── Auth: Login ───────────────────────────────────────────────
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const fbUser = userCredential.user;

      manualAuthRef.current = true;

      const profileDoc = await getDoc(doc(db, "profiles", fbUser.uid));
      const isNewUser = !profileDoc.exists();

      return { success: true, isNewUser };
    } catch (err: any) {
      let message = "Login failed";
      if (err.code === "auth/user-not-found") {
        message = "No account found with this email";
      } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        message = "Invalid email or password";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many attempts. Please try again later";
      }
      return { success: false, error: message };
    }
  };

  // ── Auth: Create Profile ──────────────────────────────────────
  const createProfile = async (
    username: string,
    profileImage?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      return { success: false, error: "No active session — please log in again" };
    }

    const uid = fbUser.uid;
    const email = fbUser.email ?? "";
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 5);
    const startDateStr = toLocalDateStr(startDate);

    try {
      // Save profile
      await setDoc(doc(db, "profiles", uid), {
        full_name: username,
        email,
        profile_image: profileImage ?? "/Image-assets/Profile-assets/p1.png",
        start_date: startDateStr,
        created_at: serverTimestamp(),
      });

      // Reload data
      await loadUserData(fbUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: `Profile save failed: ${err.message}` };
    }
  };

  // ── Auth: Update Profile Image ────────────────────────────────
  const updateProfileImage = async (
    imageUrl: string
  ): Promise<{ success: boolean; error?: string }> => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      return { success: false, error: "No active session" };
    }

    try {
      await updateDoc(doc(db, "profiles", fbUser.uid), {
        profile_image: imageUrl,
      });
      setUser((prev) => (prev ? { ...prev, profileImage: imageUrl } : prev));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // ── Auth: Update Username ─────────────────────────────────────
  const updateUsername = async (
    newName: string
  ): Promise<{ success: boolean; error?: string }> => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      return { success: false, error: "No active session" };
    }

    try {
      await updateDoc(doc(db, "profiles", fbUser.uid), {
        full_name: newName,
      });
      setUser((prev) => (prev ? { ...prev, name: newName } : prev));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // ── Save Balance (first-time setup) ──────────────────────────
  const saveBalance = async (
    liquidAmount: number,
    accountAmount: number
  ): Promise<{ success: boolean; error?: string }> => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      return { success: false, error: "No active session" };
    }

    const totalAmount = liquidAmount + accountAmount;

    try {
      await setDoc(doc(db, "balances", fbUser.uid), {
        liquid_amount: liquidAmount,
        account_amount: accountAmount,
        updated_at: serverTimestamp(),
      });

      // Create initial wallet setup transaction
      const todayStr = toLocalDateStr(new Date());
      const txRef = doc(collection(db, "transactions"));
      await setDoc(txRef, {
        user_id: fbUser.uid,
        type: "income_topup",
        bucket: "liquid",
        amount: totalAmount,
        date: todayStr,
        day_label: 1,
        name: "Wallet Setup Completed",
        icon: "wallet",
        icon_bg: "#2E680A",
        note: "Initial balance setup",
        currency: getCurrencyInfo(currency).symbol,
        created_at: serverTimestamp(),
      });

      setBalances({
        userId: fbUser.uid,
        liquidAmount,
        accountAmount,
      });

      // Reload data from Firestore to get fresh transactions
      await loadUserData(fbUser);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // ── Auth: Logout ───────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setBalances(null);
    setTransactions([]);
    setAppPinEnabled(false);
    setLocked(false);
    manualAuthRef.current = false;
  };

  // ── DB: Add Expense ────────────────────────────────────────────
  const addExpense = async (
    amount: number,
    category: ExpenseCategory,
    date: string,
    note?: string,
    bucket: BucketType = "liquid"
  ) => {
    if (!user) return;

    const dayLabel = getDayLabel(user.startDate, date);
    const bucketLabel = bucket === "liquid" ? "In Hand" : "Account";
    const baseName = category
      .charAt(0)
      .toUpperCase()
      .concat(category.slice(1).replace(/_/g, " "));

    const txData: Record<string, any> = {
      user_id: user.id,
      type: "expense",
      bucket,
      bucket_label: bucketLabel,
      category,
      amount,
      date,
      day_label: dayLabel,
      name: note ? `${baseName} (${note})` : baseName,
      icon: getCategoryIcon(category),
      icon_bg: "#1c2a20",
      currency: getCurrencyInfo(currency).symbol,
      created_at: serverTimestamp(),
    };
    if (note) txData.note = note;

    const txRef = doc(collection(db, "transactions"));
    await setDoc(txRef, txData);

    // Update balance if it exists — deduct from the selected bucket
    if (balances) {
      const updated = { ...balances };
      if (bucket === "liquid") {
        updated.liquidAmount = Math.max(0, updated.liquidAmount - amount);
      } else {
        updated.accountAmount = Math.max(0, updated.accountAmount - amount);
      }

      await setDoc(
        doc(db, "balances", user.id),
        {
          liquid_amount: updated.liquidAmount,
          account_amount: updated.accountAmount,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      setBalances(updated);
    }

    setTransactions((prev) => [
      {
        id: txRef.id,
        userId: user.id,
        type: "expense",
        bucket,
        category,
        amount,
        date,
        dayLabel,
        note,
        name: note ? `${baseName} (${note})` : baseName,
        icon: getCategoryIcon(category),
        iconBg: "#1c2a20",
        meta: bucketLabel,
      },
      ...prev,
    ]);
  };

  // ── DB: Add Income ─────────────────────────────────────────────
  const addIncome = async (
    amount: number,
    type: "income_salary" | "income_topup",
    bucket: BucketType,
    note?: string,
    category?: string
  ) => {
    if (!user) return;

    const todayStr = toLocalDateStr(new Date());
    const dayLabel = getDayLabel(user.startDate, todayStr);

    const categoryName = category
      ? category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, " ")
      : type === "income_salary"
      ? "Salary"
      : "Top-up Wallet";
    const bucketLabel = bucket === "liquid" ? "In Hand" : "Account";

    const txData: Record<string, any> = {
      user_id: user.id,
      type,
      bucket,
      category: category || null,
      amount,
      date: todayStr,
      day_label: dayLabel,
      name: categoryName,
      icon: category === "with_love" ? "with_love" : type === "income_salary" ? "salary" : "topup",
      icon_bg: category === "with_love" ? "#8B2252" : type === "income_salary" ? "#2E680A" : "#1a3a24",
      currency: getCurrencyInfo(currency).symbol,
      bucket_label: bucketLabel,
      created_at: serverTimestamp(),
    };
    if (note) txData.note = note;

    const txRef = doc(collection(db, "transactions"));
    await setDoc(txRef, txData);

    // Update balance if it exists
    if (balances) {
      const updated = { ...balances };
      if (bucket === "liquid") updated.liquidAmount += amount;
      else updated.accountAmount += amount;

      await setDoc(
        doc(db, "balances", user.id),
        {
          liquid_amount: updated.liquidAmount,
          account_amount: updated.accountAmount,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      setBalances(updated);
    }
    setTransactions((prev) => [
      {
        id: txRef.id,
        userId: user.id,
        type,
        bucket,
        category: category as ExpenseCategory | undefined,
        amount,
        date: todayStr,
        dayLabel,
        note,
        name: categoryName,
        icon: category === "with_love" ? "with_love" : type === "income_salary" ? "salary" : "topup",
        iconBg: category === "with_love" ? "#8B2252" : type === "income_salary" ? "#2E680A" : "#1a3a24",
        meta: bucketLabel,
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

    const todayStr = toLocalDateStr(new Date());
    const dayLabel = getDayLabel(user.startDate, todayStr);
    const toBucket = fromBucket === "liquid" ? "account" : "liquid";

    const txData = {
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
      currency: getCurrencyInfo(currency).symbol,
      created_at: serverTimestamp(),
    };

    const txRef = doc(collection(db, "transactions"));
    await setDoc(txRef, txData);

    const updated = { ...balances };
    if (fromBucket === "liquid") {
      updated.liquidAmount -= amount;
      updated.accountAmount += amount;
    } else {
      updated.accountAmount -= amount;
      updated.liquidAmount += amount;
    }

    await setDoc(
      doc(db, "balances", user.id),
      {
        liquid_amount: updated.liquidAmount,
        account_amount: updated.accountAmount,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );

    setBalances(updated);
    setTransactions((prev) => [
      {
        id: txRef.id,
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

  // ── Currency setter ────────────────────────────────────────────
  const setCurrency = (code: string) => {
    if (CURRENCIES.some((c) => c.code === code)) setCurrencyState(code);
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        balances,
        transactions,
        theme,
        loading,
        showProfile,
        setShowProfile,
        signUp,
        login,
        createProfile,
        updateUsername,
        updateProfileImage,
        saveBalance,
        logout,
        addExpense,
        addIncome,
        transferMoney,
        toggleTheme,
        currency,
        setCurrency,
        appPinEnabled,
        locked,
        enableAppPin,
        verifyAppPin,
        disableAppPin,
        unlockApp,
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
    salary: "💼",
    other: "💸",
    with_love: "💝",
  };
  return icons[category] || "💸";
}
