import { requestPermission } from "@/lib/notifications";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "vesak_notification_settings";

export interface NotificationSettings {
  enabled: boolean;
  radiusKm: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  radiusKm: 5,
};

function loadSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as NotificationSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable — silently ignore
  }
}

export interface NotificationState {
  permission: NotificationPermission | "unsupported";
  isEnabled: boolean;
  settings: NotificationSettings;
  toggleNotifications: () => Promise<void>;
  setRadius: (km: number) => void;
}

/**
 * Manages proximity-notification settings with localStorage persistence.
 * Requesting permission happens automatically when the user enables notifications.
 */
export function useNotifications(): NotificationState {
  const [settings, setSettingsState] =
    useState<NotificationSettings>(loadSettings);
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (typeof window === "undefined" || !("Notification" in window))
      return "unsupported";
    return Notification.permission;
  });

  // Keep permission state in sync with changes made outside React
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
  }, []);

  const updateSettings = useCallback((patch: Partial<NotificationSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const toggleNotifications = useCallback(async () => {
    if (settings.enabled) {
      updateSettings({ enabled: false });
      return;
    }
    const granted = await requestPermission();
    if (granted) {
      setPermission("granted");
      updateSettings({ enabled: true });
    } else {
      setPermission(
        typeof window !== "undefined" && "Notification" in window
          ? Notification.permission
          : "unsupported",
      );
    }
  }, [settings.enabled, updateSettings]);

  const setRadius = useCallback(
    (km: number) => {
      updateSettings({ radiusKm: km });
    },
    [updateSettings],
  );

  return {
    permission,
    isEnabled: settings.enabled,
    settings,
    toggleNotifications,
    setRadius,
  };
}
