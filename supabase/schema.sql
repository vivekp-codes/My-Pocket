-- ============================================
-- Expense Tracker — Supabase Schema (v2)
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  profile_image TEXT NOT NULL DEFAULT '/Image-assets/Profile-assets/p1.png',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Balances table (one row per user)
CREATE TABLE IF NOT EXISTS balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  liquid_amount NUMERIC(12,2) NOT NULL DEFAULT 5850.40,
  account_amount NUMERIC(12,2) NOT NULL DEFAULT 225710.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income_salary', 'income_topup', 'transfer')),
  bucket TEXT NOT NULL CHECK (bucket IN ('liquid', 'account')),
  category TEXT CHECK (category IN ('travel', 'food', 'bills', 'shopping', 'entertainment', 'other')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  day_label INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  recipient TEXT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '💸',
  icon_bg TEXT NOT NULL DEFAULT '#1c2a20',
  meta TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);

-- 5. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Balances policies
CREATE POLICY "Users can view own balance"
  ON balances FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balance"
  ON balances FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own balance"
  ON balances FOR UPDATE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE USING (auth.uid() = user_id);
