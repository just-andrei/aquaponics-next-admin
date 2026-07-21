"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAdminAccess, type AdminAccess } from "@/lib/auth";
import {
  initializeFirebaseClientServices,
  isFirebaseConfigured,
} from "@/lib/firebase";

type AuthState = {
  user: User | null;
  adminAccess: AdminAccess | null;
  isLoading: boolean;
  accessError: string | null;
};

type AuthContextValue = AuthState & {
  isActiveAdmin: boolean;
  clearAccessError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getInitialState(): AuthState {
  if (!isFirebaseConfigured) {
    return {
      user: null,
      adminAccess: null,
      isLoading: false,
      accessError:
        "Firebase is not configured. Add the Firebase values to .env.local and restart the app.",
    };
  }

  return {
    user: null,
    adminAccess: null,
    isLoading: true,
    accessError: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(getInitialState);

  useEffect(() => {
    let isMounted = true;
    let requestId = 0;
    const { auth: firebaseAuth } = initializeFirebaseClientServices();

    if (!firebaseAuth) {
      void Promise.resolve().then(() => {
        if (isMounted) {
          setState({
            user: null,
            adminAccess: null,
            isLoading: false,
            accessError:
              "Firebase Authentication is unavailable. Check .env.local and restart the app.",
          });
        }
      });

      return () => {
        isMounted = false;
      };
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      const currentRequestId = ++requestId;

      if (!user) {
        if (isMounted) {
          setState((current) => ({
            user: null,
            adminAccess: null,
            isLoading: false,
            accessError: current.accessError,
          }));
        }
        return;
      }

      if (isMounted) {
        setState({
          user,
          adminAccess: null,
          isLoading: true,
          accessError: null,
        });
      }

      const adminAccess = await getAdminAccess(user);
      if (!isMounted || currentRequestId !== requestId) {
        return;
      }

      if (!adminAccess.isActiveAdmin) {
        setState({
          user: null,
          adminAccess,
          isLoading: false,
          accessError: adminAccess.reason,
        });
        await signOut(firebaseAuth).catch(() => undefined);
        return;
      }

      setState({
        user,
        adminAccess,
        isLoading: false,
        accessError: null,
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const clearAccessError = useCallback(() => {
    setState((current) => ({ ...current, accessError: null }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isActiveAdmin: state.adminAccess?.isActiveAdmin ?? false,
      clearAccessError,
    }),
    [clearAccessError, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
