# Expense Tracker — Home Screen

A mobile-first personal expense tracker UI, built with React + Vite + TypeScript + Tailwind CSS + Framer Motion.

## Stack

- **React 19 + Vite + TypeScript**
- **Tailwind CSS** — design tokens (black/green theme) in `tailwind.config.js`
- **Framer Motion** — entrance animations
- Mock transaction data in `src/data/transactions.ts` — swap this for a real API/Supabase call when ready

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`). It's a fixed phone-frame mockup (390×844) centered on the page.

## Project structure

```
src/
  components/
    PhoneFrame.tsx        # device frame wrapper
    TopBar.tsx             # avatar + notification icon
    WalletCard.tsx         # textured balance card + animated count-up
    StatPills.tsx          # income / spent / saved row
    TransactionList.tsx    # transaction rows
    BottomNav.tsx           # floating pill nav with raised add button
    CountUp.tsx             # reusable animated number
  data/
    transactions.ts        # mock transaction data — replace with real data
  types/
    transaction.ts          # Transaction type definition
  screens/
    Home.tsx                # assembles the home screen
  App.tsx
  index.css                 # Tailwind directives + font imports
```

## Next steps

- Wire `transactions.ts` up to a real backend (Supabase recommended)
- Add React Router for Stats / Add Expense / History / Profile screens
- Add Zustand for global balance/transaction state
- Add TanStack Query once a real API is connected
- `vite-plugin-pwa` to make it installable on phones as a home-screen app

## Build for production

```bash
npm run build
npm run preview
```
