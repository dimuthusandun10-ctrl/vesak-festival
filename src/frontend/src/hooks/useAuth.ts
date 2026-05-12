import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMemo } from "react";

export interface AuthState {
  isAuthenticated: boolean;
  principal: string | null;
  login: () => void;
  logout: () => void;
}

/**
 * Convenience hook that surfaces identity / principal from Internet Identity.
 * Returns a stable object — consumers do not need to destructure manually.
 */
export function useAuth(): AuthState {
  const { identity, login, clear, isAuthenticated } = useInternetIdentity();

  const principal = useMemo(() => {
    if (!identity || !isAuthenticated) return null;
    try {
      const p = identity.getPrincipal();
      return p.isAnonymous() ? null : p.toText();
    } catch {
      return null;
    }
  }, [identity, isAuthenticated]);

  return {
    isAuthenticated: isAuthenticated && principal !== null,
    principal,
    login,
    logout: clear,
  };
}
