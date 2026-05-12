import type { GeolocationState } from "@/hooks/useGeolocation";
import { useGeolocation } from "@/hooks/useGeolocation";
import { type ReactNode, createContext, useContext } from "react";

const GeolocationContext = createContext<GeolocationState | null>(null);

export function GeolocationProvider({ children }: { children: ReactNode }) {
  const geo = useGeolocation();
  return (
    <GeolocationContext.Provider value={geo}>
      {children}
    </GeolocationContext.Provider>
  );
}

/**
 * Consumes shared geolocation state. Must be used inside <GeolocationProvider>.
 */
export function useGeolocationContext(): GeolocationState {
  const ctx = useContext(GeolocationContext);
  if (!ctx) {
    throw new Error(
      "useGeolocationContext must be used inside GeolocationProvider",
    );
  }
  return ctx;
}
