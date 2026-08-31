-- ============================================
-- Expense Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Profiles table (extends Supabase auth.users)
-- Stores extra user data beyond what auth provides
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, start_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CURRENT_DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: call handle_new_user on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- 4. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);

-- 5. Row Level Security (RLS) — users can only see their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Balances: users can read/update their own balance
CREATE POLICY "Users can view own balance"
  ON balances FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own balance"
  ON balances FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balance"
  ON balances FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions: users can CRUD their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE USING (auth.uid() = user_id);

-- 6. Seed function: creates starting balance + seed transactions for new users
CREATE OR REPLACE FUNCTION public.seed_user_data(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  start_date DATE := CURRENT_DATE - INTERVAL '5 days';
BEGIN
  -- Insert starting balances
  INSERT INTO balances (user_id, liquid_amount, account_amount)
  VALUES (p_user_id, 5850.40, 225710.00)
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert seed transactions
  INSERT INTO transactions (user_id, type, bucket, category, amount, date, day_label, name, icon, icon_bg, note) VALUES
    (p_user_id, 'income_salary', 'account', NULL, 225710.00, start_date, 1, 'Salary Credit', '💰', '#153a24', 'Initial Month Salary'),
    (p_user_id, 'income_topup', 'liquid', NULL, 8000.00, start_date, 1, 'Liquid Cash Setup', '💵', '#1c2a20', 'ATM Withdrawal'),
    (p_user_id, 'expense', 'liquid', 'food', 340.00, start_date + INTERVAL '1 day', 2, 'Swiggy Order', '🍔', '#1c2a20', 'Burger lunch'),
    (p_user_id, 'expense', 'liquid', 'entertainment', 500.00, start_date + INTERVAL '2 days', 3, 'Movie Tickets', '🎬', '#1c2a20', 'Split with Felix'),
    (p_user_id, 'expense', 'liquid', 'shopping', 1309.60, start_date + INTERVAL '3 days', 4, 'Marc Cucurella Store', '👕', '#1c2a20', 'Summer Tee');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Auto-seed on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_seed()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.seed_user_data(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_seed();
