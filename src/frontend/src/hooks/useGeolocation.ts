import { useCallback, useState } from "react";

export interface Coords {
  lat: number;
  lon: number;
}

export interface GeolocationState {
  coords: Coords | null;
  error: string | null;
  isLoading: boolean;
  requestLocation: () => void;
}

/**
 * Wraps navigator.geolocation.getCurrentPosition in a React hook.
 * Calling requestLocation() triggers a fresh position request.
 */
export function useGeolocation(): GeolocationState {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("ස්ථාන සේවාව නොමැත / Geolocation supported නොවේ");
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "ස්ථාන අවසරය ප්‍රතික්ෂේප විය",
          2: "ස්ථාන සේවාව නොමැත",
          3: "ස්ථාන සෙවීම කල් ඉකුත් විය",
        };
        setError(messages[err.code] ?? "ස්ථාන දෝෂයක් සිදු විය");
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  return { coords, error, isLoading, requestLocation };
}
