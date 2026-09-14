import { useState, useEffect } from "react";
import { StoreProvider, useStore } from "./context/StoreContext";
import AuthScreen from "./screens/AuthScreen";
import Home from "./screens/Home";
import PhoneFrame from "./components/PhoneFrame";
import LockScreen from "./components/LockScreen";
import AppOverviewSkeleton from "./components/Skeleton";
import ErrorPage from "./components/ErrorPage";
import AppErrorBoundary from "./components/AppErrorBoundary";

function AppContent() {
  const { user, loading, locked } = useStore();
  const [online, setOnline] = useState(() => navigator.onLine);

  // Track connectivity — show the themed offline screen when the network drops.
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!online) {
    return (
      <PhoneFrame>
        <ErrorPage kind="offline" />
      </PhoneFrame>
    );
  }

  // Layout-matched skeleton while restoring the auth session
  if (loading) {
    return (
      <PhoneFrame>
        <AppOverviewSkeleton />
      </PhoneFrame>
    );
  }

  // No user → auth screen. User exists but profile incomplete → also auth screen (avatar step)
  const needsProfile = user && !user.profileComplete;
  const ready = user && !needsProfile;
  return (
    <PhoneFrame>
      <AppErrorBoundary>
        {ready && locked ? <LockScreen /> : ready ? <Home /> : <AuthScreen />}
      </AppErrorBoundary>
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