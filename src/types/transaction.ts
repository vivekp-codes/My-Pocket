export interface User {
  id: string;
  name: string;
  email: string;
  profileImage: string; // e.g. "/Image-assets/Profile-assets/p1.png"
  startDate: string; // ISO format or YYYY-MM-DD
  profileComplete: boolean;
}

export type TransactionType = "expense" | "income_salary" | "income_topup" | "transfer";

export type BucketType = "liquid" | "account";

export type ExpenseCategory = "travel" | "food" | "bills" | "shopping" | "entertainment" | "other";

export interface Balance {
  userId: string;
  liquidAmount: number;
  accountAmount: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  bucket: BucketType;
  category?: ExpenseCategory; // optional/nullable for income/transfer types
  amount: number; // always positive in store; sign is inferred by type (expense / income)
  date: string; // YYYY-MM-DD
  dayLabel: number; // Day N (running count from user's startDate)
  note?: string; // optional note
  recipient?: string; // used for transfer or custom transactions
  name: string; // descriptive title shown in lists
  icon: string; // emoji or initials
  iconBg: string; // bg color for circular badge
  meta?: string;
  currency?: string;
}
