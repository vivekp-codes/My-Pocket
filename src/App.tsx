import { StoreProvider, useStore } from "./context/StoreContext";
import AuthScreen from "./screens/AuthScreen";
import Home from "./screens/Home";
import PhoneFrame from "./components/PhoneFrame";

function AppContent() {
  const { user, loading } = useStore();

  // Show nothing (or a spinner) while checking auth session
  if (loading) {
    return (
      <PhoneFrame>
        <div className="min-h-screen w-full flex items-center justify-center bg-bg">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-[#5CB010]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm text-textDim font-semibold">Loading...</span>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  // No user → auth screen. User exists but profile incomplete → also auth screen (avatar step)
  const needsProfile = user && !user.profileComplete;
  return (
    <PhoneFrame>
      {user && !needsProfile ? <Home /> : <AuthScreen />}
    </PhoneFrame>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
