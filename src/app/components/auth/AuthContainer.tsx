import { useState } from 'react';
import { LoginView } from './LoginView';
import { SignupView } from './SignupView';

export function AuthContainer() {
  const [view, setView] = useState<'login' | 'signup'>('login');

  return (
    <>
      {view === 'login' && (
        <LoginView onSwitchToSignup={() => setView('signup')} />
      )}
      {view === 'signup' && (
        <SignupView onSwitchToLogin={() => setView('login')} />
      )}
    </>
  );
}
