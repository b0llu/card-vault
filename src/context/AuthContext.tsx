/**
 * AuthContext.tsx
 *
 * Provides app-wide authentication state:
 *  - isUnlocked: whether the vault is currently accessible
 *  - lock() / unlock(): manually lock or unlock
 *
 * Auto-lock: if the app goes to background for > 30 seconds, the vault
 * is automatically locked and the user must re-authenticate.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';

const AUTO_LOCK_TIMEOUT_MS = 30_000; // 30 seconds

interface AuthContextValue {
  isUnlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isUnlocked: false,
  unlock: () => {},
  lock: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const backgroundTimestamp = useRef<number | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const unlock = useCallback(() => setIsUnlocked(true), []);
  const lock = useCallback(() => setIsUnlocked(false), []);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (
          appState.current === 'active' &&
          (nextState === 'background' || nextState === 'inactive')
        ) {
          // App moved to background — start the auto-lock timer
          backgroundTimestamp.current = Date.now();
        } else if (
          nextState === 'active' &&
          appState.current !== 'active'
        ) {
          // App returned to foreground
          if (backgroundTimestamp.current !== null) {
            const elapsed = Date.now() - backgroundTimestamp.current;
            if (elapsed >= AUTO_LOCK_TIMEOUT_MS) {
              // 30 seconds exceeded — lock the vault
              setIsUnlocked(false);
            }
            backgroundTimestamp.current = null;
          }
        }
        appState.current = nextState;
      },
    );

    return () => subscription.remove();
  }, []);

  return (
    <AuthContext.Provider value={{ isUnlocked, unlock, lock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
