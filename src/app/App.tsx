import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { AuthContainer } from './components/auth/AuthContainer';
import { AppLayout } from './components/layout/AppLayout';
import { SettingsModal } from './components/common/SettingsModal';
import { useSocketEffects, useKeyboardShortcuts } from './hooks/useAppEffects';
import { initializeSocket, disconnectSocket } from './services/socket';
import { Toaster } from 'sonner';

function App() {
  const { isAuthenticated, checkAuth } = useStore();

  // Check for existing auth token on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Initialize Socket.IO when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializeSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated]);

  // Set up real-time listeners and keyboard shortcuts
  useSocketEffects();
  useKeyboardShortcuts();

  return (
    <>
      {isAuthenticated ? <AppLayout /> : <AuthContainer />}
      <SettingsModal />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ duration: 3000 }}
      />
    </>
  );
}

export default App;