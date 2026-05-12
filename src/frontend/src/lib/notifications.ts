/**
 * Thin wrapper around the browser Notifications API.
 * All functions degrade gracefully when the API is unavailable.
 */

/** Returns true when the browser supports the Notifications API. */
export function isSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Request notification permission.
 * Returns true if permission was granted, false otherwise.
 */
export async function requestPermission(): Promise<boolean> {
  if (!isSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * Fire a browser notification.
 * Silently no-ops when permission is not granted or API is unavailable.
 */
export function sendNotification(
  title: string,
  body: string,
  icon?: string,
): void {
  if (!isSupported() || Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    icon: icon ?? "/favicon.ico",
    badge: "/favicon.ico",
  });
}
