# My Pocket

A mobile-first personal expense tracker with a polished, phone-frame UI. Track spending and income
across two money buckets ("In Hand" and "Account"), view history, weekly stats and a calendar, lock
the app with a PIN, and sync everything to Firebase.

## Tech Stack

- **React 19 + TypeScript** — UI
- **Vite 8** — dev server & build
- **Tailwind CSS 3.4** — styling; custom dark/light theme tokens in `tailwind.config.js` and
  light-mode overrides in `src/index.css`
- **Framer Motion** — page transitions, entrance animations, success states
- **Firebase** — email/password **Authentication** + **Cloud Firestore** (profiles, balances, transactions)
- **Cloudinary** — unsigned profile-photo uploads
- **EmailJS** (`@emailjs/browser`) — in-app feedback/contact form
- **Phosphor React** — icon set
- **Oxlint** — linting

> Node 22 (see `.nvmrc`), npm 10.

## Features

- **Auth** — sign up (3-step: username + email → password → avatar picker) and login, with friendly
  error messages. Profile is created in Firestore on first signup.
- **Wallet setup** — first-time users pick their wallet style (Liquid / Account / both) and enter
  starting balances. Creates a "Wallet Setup Completed" transaction.
- **Two buckets** — "In Hand" (liquid) and "Account" (bank), each tracked independently.
- **Add transaction** — Spend / Get Money / Returnable, with category picker, amount, note and bucket
  selection; guards against spending more than the selected bucket holds; animated success state.
- **Edit & delete** — tap any transaction to edit its type, category, amount, date, note or bucket, or
  delete it. Balances are automatically reconciled on edit/delete.
- **History** — newest-first transaction list with "See all" expansion, category icons and
  money-direction badges.
- **Weekly report** — weekly bar chart with monthly totals and week navigation.
- **Calendar view** — month grid with per-day totals, day detail, weekly breakdown and a monthly
  breakdown sheet.
- **Pending returns ("To Receive")** — track money given with love that should come back.
- **App Lock** — optional 4-digit PIN (hashed, stored per-user in `localStorage`); auto-locks when a
  session is restored, with a lock screen and change-PIN flow.
- **Appearance** — dark/light theme toggle, persisted locally.
- **Multi-currency** — INR, USD, EUR, GBP, JPY with correct symbols and locales.
- **Profile** — edit username, change avatar (crop + upload to Cloudinary).
- **Resilience** — online/offline detection, layout-matched loading skeletons, and an error boundary.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`). The app renders inside a fixed
phone-frame (390×844) centered on the page.

### Environment variables

Copy `.env.example` to `.env` and fill in your values:

```
# Firebase (web app config)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Cloudinary (profile photo uploads)
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_CLOUDINARY_FOLDER=

# EmailJS (contact / feedback)
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

Firebase is initialized in `src/lib/firebase.ts` and will throw a clear error if any required value
is missing.

## Project structure

```
src/
  components/
    PhoneFrame.tsx            # device frame wrapper
    TopBar.tsx                # avatar, name/email, theme toggle, opens profile
    WalletCard.tsx            # textured total-balance card + animated count-up
    BalanceCards.tsx          # "In Hand" / "Account" bucket tiles
    StatPills.tsx             # income / spent / saved row + "To Receive"
    TransactionList.tsx       # history list (see-all, edit on tap)
    SendMoney.tsx             # add-transaction form (spend / get / returnable)
    EditTransaction.tsx       # edit / delete a transaction
    StatisticsCard.tsx        # weekly report with bar chart
    CalendarView.tsx          # month calendar + day detail
    MonthlyBreakdownSheet.tsx # monthly breakdown
    PendingReturns.tsx        # "To Receive" list
    Settings.tsx              # theme, currency, app lock, profile, feedback
    ProfileModal.tsx          # profile sheet
    AvatarCropModal.tsx       # avatar crop step
    ConnectSheet.tsx          # feedback form (EmailJS)
    LockScreen.tsx            # PIN lock screen
    PinSheet.tsx              # set / verify / change PIN sheet
    PinPad.tsx                # PIN dots + keypad
    BalanceSetup.tsx          # first-time wallet setup sheet
    BottomNav.tsx             # floating pill nav with raised add button
    ConfirmModal.tsx          # themed confirm dialog
    ErrorPage.tsx             # offline / error screens
    AppErrorBoundary.tsx      # React error boundary
    Skeleton.tsx              # loading skeletons
    CountUp.tsx               # reusable animated number
  context/
    StoreContext.tsx          # global state + all Firebase/Firestore operations
  hooks/
    useProfilePhotoUpload.ts  # avatar pick/crop/upload orchestration
  lib/
    firebase.ts               # Firebase app init (auth + firestore)
    cloudinary.ts             # unsigned image upload
    contact.ts                # EmailJS contact helper
  screens/
    Home.tsx                  # main screen + tab switching
    AuthScreen.tsx            # login / multi-step signup
  types/
    transaction.ts            # User, Balance, Transaction, enums
  App.tsx                     # providers + auth/loading/lock/offline gating
  main.tsx
  index.css                   # Tailwind directives, fonts, light-mode overrides
firestore.rules               # security rules
firestore.indexes.json        # composite indexes
firebase.json / vercel.json   # hosting config
```

## Data model

Defined in `src/types/transaction.ts`. Firestore collections mirror these:

- **`profiles/{uid}`** — `full_name`, `email`, `profile_image`, `start_date`, `created_at`
- **`balances/{uid}`** — `liquid_amount`, `account_amount`, `updated_at`
- **`transactions/{txId}`** — `user_id`, `type`, `bucket`, `category`, `amount`, `date`, `day_label`,
  `note`, `name`, `icon`, `icon_bg`, `currency`, `created_at`

`TransactionType` = `expense | income_salary | income_topup | transfer`.
`BucketType` = `liquid | account`.
Amounts are always stored positive; the sign is inferred from `type`.

## Security rules

`firestore.rules` restricts all reads/writes to the authenticated owner — profiles and balances by
document id, transactions by their `user_id` field.

```bash
firebase deploy --only firestore:rules
```

## Scripts

```bash
npm run dev        # start dev server
npm run build      # type-check (tsc -b) + production build to dist/
npm run preview    # preview the production build
npm run lint       # oxlint
```

## Deployment

The app is a static SPA. `vercel.json` builds with `npm run build` and serves `dist/`.
Firebase Hosting is also configured via `firebase.json`.
