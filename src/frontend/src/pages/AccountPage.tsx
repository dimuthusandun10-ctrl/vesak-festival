import { ApprovalStatus } from "@/backend";
import type { Dansal, DansalAnalytics } from "@/backend";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  useGetApprovalNotifications,
  useGetMyProfile,
  useMarkNotificationSeen,
  useRegisterUser,
  useUpdateOrganizerBio,
} from "@/hooks/useAdminData";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocationContext } from "@/hooks/useGeolocationContext";
import { useNotifications } from "@/hooks/useNotifications";
import {
  useDeleteDansal,
  useGetDansals,
  useGetMyDansalAnalytics,
  useGetMyDansals,
  useGetMyFavorites,
  useToggleFavorite,
} from "@/hooks/useVesakData";
import { calculateDistance, formatDistance } from "@/lib/geo";
import { sendNotification } from "@/lib/notifications";
import {
  BarChart2,
  Bell,
  BellOff,
  Clock,
  Eye,
  Heart,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  Save,
  Settings,
  Star,
  ThumbsUp,
  Trash2,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────
const RADIUS_OPTIONS = [
  { km: 5, label: "5 km" },
  { km: 10, label: "10 km" },
  { km: 25, label: "25 km" },
];

const NOTIFIED_KEY = "notified-dansals";
const HISTORY_KEY = "vesak_notif_history";
const HISTORY_MAX = 5;
const NOTIF_DEDUP_MS = 24 * 60 * 60 * 1000;
const POLL_INTERVAL_MS = 60_000;

type AccountTab = "dansals" | "analytics" | "favorites" | "bio";

// ────────────────────────────────────────────────────────────
// Notification history helpers
// ────────────────────────────────────────────────────────────
export interface NotifHistoryItem {
  id: string;
  title: string;
  body: string;
  ts: number;
}

function loadHistory(): NotifHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as NotifHistoryItem[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: NotifHistoryItem[]): void {
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(items.slice(0, HISTORY_MAX)),
    );
  } catch {}
}

function loadNotified(): Record<string, number> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveNotified(map: Record<string, number>): void {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
  } catch {}
}

function pruneNotified(map: Record<string, number>): Record<string, number> {
  const now = Date.now();
  const fresh: Record<string, number> = {};
  for (const [k, v] of Object.entries(map)) {
    if (now - v < NOTIF_DEDUP_MS) fresh[k] = v;
  }
  return fresh;
}

function parseDansalDateTime(date: string, time: string): Date | null {
  try {
    let iso = date;
    if (date.includes("/")) {
      const [d, m, y] = date.split("/");
      iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    const dt = new Date(`${iso}T${time}:00`);
    return Number.isNaN(dt.getTime()) ? null : dt;
  } catch {
    return null;
  }
}

function formatSinhalaDate(ts: bigint | number): string {
  const ms = typeof ts === "bigint" ? Number(ts) / 1_000_000 : ts;
  return new Date(ms).toLocaleDateString("si-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ────────────────────────────────────────────────────────────
// Bio Editor
// ────────────────────────────────────────────────────────────
function BioEditor({ currentBio }: { currentBio: string }) {
  const [bio, setBio] = useState(currentBio);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const updateBio = useUpdateOrganizerBio();
  const MAX = 250;

  async function handleSave() {
    setError("");
    if (bio.trim().length > MAX) {
      setError(`Bio ${MAX} characters ඉක්මවිය නොහැක`);
      return;
    }
    const result = await updateBio.mutateAsync(bio.trim());
    if (result.__kind__ === "ok") {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(result.err);
    }
  }

  return (
    <div className="space-y-3" data-ocid="account.bio_editor.section">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          ඔබේ Bio
        </p>
        <span
          className={`text-xs ${
            bio.length > MAX
              ? "text-red-500 font-semibold"
              : "text-muted-foreground"
          }`}
        >
          {bio.length}/{MAX}
        </span>
      </div>
      <textarea
        rows={4}
        value={bio}
        onChange={(e) => {
          setBio(e.target.value);
          setSaved(false);
        }}
        placeholder="ඔබ ගැන ලියන්න... / Write about yourself..."
        maxLength={MAX + 10}
        data-ocid="account.bio_editor.textarea"
        className="w-full px-3 py-2.5 rounded-xl bg-background border border-amber-200/60 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/60 resize-none"
      />
      {error && (
        <p
          className="text-xs text-red-500"
          data-ocid="account.bio_editor.error_state"
        >
          ⚠ {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={updateBio.isPending || bio.length > MAX}
        data-ocid="account.bio_editor.save_button"
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-smooth disabled:opacity-50 active:scale-95"
      >
        <Save className="h-3.5 w-3.5" />
        {updateBio.isPending
          ? "Saving..."
          : saved
            ? "Saved ✓"
            : "Bio Save කරන්න"}
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Status badge
// ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ApprovalStatus }) {
  if (status === ApprovalStatus.approved) {
    return <span className="badge-approved">✓ අනුමත</span>;
  }
  if (status === ApprovalStatus.rejected) {
    return <span className="badge-rejected">✗ ප්‍රතික්ෂේප</span>;
  }
  return <span className="badge-pending">⏳ බලාපොරොත්තු</span>;
}

// ────────────────────────────────────────────────────────────
// Login Section
// ────────────────────────────────────────────────────────────
function LoginSection({ onLogin }: { onLogin: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-14 px-6 gap-5"
      data-ocid="account.login_section"
    >
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center shadow-sm">
        <User className="h-10 w-10 text-amber-500" />
      </div>
      <div className="text-center">
        <h2 className="font-display font-bold text-foreground text-xl mb-1">
          ගිණුමට ඇතුල් වන්න
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in to manage your Dansal listings
        </p>
      </div>
      <button
        type="button"
        onClick={onLogin}
        data-ocid="account.login_button"
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-smooth active:scale-95 shadow-sm"
      >
        <LogIn className="h-4 w-4" />
        Internet Identity ලෙස Sign in
      </button>
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Internet Identity ලෙස sign in කිරීමෙන් ඔබේ Dansal listings manage කිරීමට හා
        proximity notifications enable කිරීමට හැකි වේ
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Notification Panel
// ────────────────────────────────────────────────────────────
interface NotificationPanelProps {
  historyItems: NotifHistoryItem[];
  onClearHistory: () => void;
}

function NotificationPanel({
  historyItems,
  onClearHistory,
}: NotificationPanelProps) {
  const { permission, isEnabled, settings, toggleNotifications, setRadius } =
    useNotifications();
  const {
    coords,
    error: geoError,
    isLoading: geoLoading,
    requestLocation,
  } = useGeolocationContext();

  const isUnsupported = permission === "unsupported";
  const isDenied = permission === "denied";

  return (
    <div
      className="bg-card rounded-2xl border border-amber-200/40 overflow-hidden"
      style={{ boxShadow: "0 2px 8px rgba(180,120,0,0.06)" }}
      data-ocid="account.notifications_panel"
    >
      <div className="px-4 pt-4 pb-3 border-b border-amber-200/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {isEnabled ? (
              <Bell className="h-5 w-5 text-amber-500 flex-shrink-0" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                ළඟ Dansal Alerts
              </p>
              <p className="text-xs text-muted-foreground">
                {isEnabled
                  ? `${settings.radiusKm} km radius — සක්‍රියයි`
                  : "Nearby Dansals ගැන දැනුම් දෙන්න"}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            onClick={toggleNotifications}
            disabled={isUnsupported || isDenied}
            data-ocid="account.notifications.toggle"
            aria-label="Toggle notifications"
            className={[
              "relative inline-flex h-6 w-11 items-center rounded-full transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-40 flex-shrink-0",
              isEnabled ? "bg-amber-500" : "bg-muted",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-4 w-4 rounded-full bg-white shadow transition-smooth",
                isEnabled ? "translate-x-6" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>
        {isUnsupported && (
          <p className="mt-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            ⚠ Browser notifications සඳහා support නොමැත
          </p>
        )}
        {isDenied && (
          <p
            className="mt-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2"
            data-ocid="account.notifications.error_state"
          >
            ⚠ Notifications blocked — Browser settings වල allow කරන්න
          </p>
        )}
      </div>

      {isEnabled && (
        <div className="px-4 py-3 space-y-4 border-b border-amber-200/20">
          <div>
            <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
              Alert Radius / සීමාව
            </p>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.map(({ km, label }) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setRadius(km)}
                  data-ocid={`account.notifications.radius_${km}`}
                  className={[
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-smooth",
                    settings.radiusKm === km
                      ? "bg-amber-100 text-amber-700 border-amber-400"
                      : "bg-background text-muted-foreground border-amber-200/60 hover:border-amber-300",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
              ඔබේ ස්ථානය / Your Location
            </p>
            {coords ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                <MapPin className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                <span>
                  {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
                </span>
                <span className="ml-auto text-green-600 font-medium">
                  ලබාගත් ✓
                </span>
              </div>
            ) : (
              <>
                {geoError && (
                  <p
                    className="text-xs text-red-500 mb-2"
                    data-ocid="account.location.error_state"
                  >
                    {geoError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={geoLoading}
                  data-ocid="account.location.request_button"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200/60 text-xs font-medium text-foreground hover:border-amber-400 transition-smooth disabled:opacity-50"
                >
                  <Navigation
                    className={[
                      "h-3.5 w-3.5 text-amber-500",
                      geoLoading ? "animate-pulse" : "",
                    ].join(" ")}
                  />
                  {geoLoading
                    ? "ඉල්ලා සිටිනවා..."
                    : "ස්ථානය share කරන්න / Share location"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Recent Alerts / මෑත දැනුම්
          </p>
          {historyItems.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              data-ocid="account.notifications.clear_history_button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-smooth"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
        {historyItems.length === 0 ? (
          <div
            className="text-center py-4"
            data-ocid="account.notifications.history.empty_state"
          >
            <Bell className="h-7 w-7 text-amber-200 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Alerts නොමැත</p>
          </div>
        ) : (
          <div
            className="space-y-2 max-h-52 overflow-y-auto"
            data-ocid="account.notifications.history.list"
          >
            {historyItems.map((item, i) => (
              <div
                key={item.id}
                className="bg-muted/30 rounded-xl px-3 py-2"
                data-ocid={`account.notifications.history.item.${i + 1}`}
              >
                <p className="text-xs font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {item.body}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  {new Date(item.ts).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// My Dansal Card (with approval status badge)
// ────────────────────────────────────────────────────────────
interface MyDansalCardProps {
  dansal: Dansal;
  index: number;
  userLat: number | null;
  userLon: number | null;
  onDelete: (id: bigint) => void;
  isDeleting: boolean;
}

function MyDansalCard({
  dansal,
  index,
  userLat,
  userLon,
  onDelete,
  isDeleting,
}: MyDansalCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const distanceKm =
    userLat !== null &&
    userLon !== null &&
    dansal.latitude !== 0 &&
    dansal.longitude !== 0
      ? calculateDistance(userLat, userLon, dansal.latitude, dansal.longitude)
      : null;

  return (
    <div
      className="bg-card rounded-2xl border border-amber-200/40 overflow-hidden"
      style={{ boxShadow: "0 2px 8px rgba(180,120,0,0.06)" }}
      data-ocid={`account.my_dansal.item.${index}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-foreground truncate">
                {dansal.organizerName}
              </h3>
              <StatusBadge status={dansal.status} />
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {dansal.foodTypes.slice(0, 3).map((f) => (
                <span
                  key={f}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium"
                >
                  {f}
                </span>
              ))}
              {dansal.foodTypes.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{dansal.foodTypes.length - 3}
                </span>
              )}
            </div>
          </div>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              data-ocid={`account.my_dansal.delete_button.${index}`}
              aria-label="Delete dansal"
              className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-smooth flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <div
              className="flex gap-1.5 flex-shrink-0"
              data-ocid={`account.my_dansal.confirm_delete.${index}`}
            >
              <button
                type="button"
                onClick={() => {
                  onDelete(dansal.id);
                  setConfirmDelete(false);
                }}
                disabled={isDeleting}
                data-ocid={`account.my_dansal.confirm_button.${index}`}
                className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-smooth disabled:opacity-50"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                data-ocid={`account.my_dansal.cancel_button.${index}`}
                className="px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-smooth"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
            <span>
              {dansal.date} at {dansal.time}
            </span>
          </div>
          {dansal.district && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <span>
                {dansal.district}, {dansal.province}
              </span>
              {distanceKm !== null && (
                <span className="ml-auto text-amber-600 font-medium">
                  {formatDistance(distanceKm)} away
                </span>
              )}
            </div>
          )}
          {dansal.contactPhone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <a
                href={`tel:${dansal.contactPhone}`}
                className="hover:text-amber-600 transition-smooth"
              >
                {dansal.contactPhone}
              </a>
            </div>
          )}
          <div className="flex items-center gap-3 pt-1 border-t border-amber-200/30 mt-2">
            <span className="flex items-center gap-1 text-[10px]">
              <Eye className="h-3 w-3" />
              {String(dansal.viewCount)} views
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <ThumbsUp className="h-3 w-3" />
              {String(dansal.likedBy.length)} likes
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <Heart className="h-3 w-3" />
              {String(dansal.appreciationCount)} appreciations
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Analytics Tab
// ────────────────────────────────────────────────────────────
function AnalyticsTab({
  analytics,
  isLoading,
}: {
  analytics: DansalAnalytics[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) return <LoadingSpinner />;

  if (!analytics || analytics.length === 0) {
    return (
      <div
        className="text-center py-12 bg-card rounded-2xl border border-amber-200/40"
        data-ocid="account.analytics.empty_state"
      >
        <BarChart2 className="h-12 w-12 text-amber-200 mx-auto mb-3" />
        <p className="text-sm font-semibold text-foreground mb-1">
          Analytics නොමැත
        </p>
        <p className="text-xs text-muted-foreground">
          ඔබේ Dansal register කිරීමෙන් analytics දැකිය හැක
        </p>
      </div>
    );
  }

  const totalViews = analytics.reduce((s, a) => s + Number(a.viewCount), 0);
  const totalLikes = analytics.reduce((s, a) => s + Number(a.likeCount), 0);
  const totalAppreciations = analytics.reduce(
    (s, a) => s + Number(a.appreciationCount),
    0,
  );

  return (
    <div className="space-y-4" data-ocid="account.analytics.section">
      <div className="grid grid-cols-3 gap-2">
        <div
          className="analytics-card text-center"
          data-ocid="account.analytics.total_views"
        >
          <Eye className="h-5 w-5 text-amber-400 mx-auto" />
          <p className="analytics-value">{totalViews}</p>
          <p className="analytics-label">Views</p>
        </div>
        <div
          className="analytics-card text-center"
          data-ocid="account.analytics.total_likes"
        >
          <ThumbsUp className="h-5 w-5 text-blue-400 mx-auto" />
          <p className="analytics-value">{totalLikes}</p>
          <p className="analytics-label">Likes</p>
        </div>
        <div
          className="analytics-card text-center"
          data-ocid="account.analytics.total_appreciations"
        >
          <Heart className="h-5 w-5 text-rose-400 mx-auto" />
          <p className="analytics-value">{totalAppreciations}</p>
          <p className="analytics-label">Appre.</p>
        </div>
      </div>

      <div
        className="bg-card rounded-2xl border border-amber-200/40 overflow-hidden"
        style={{ boxShadow: "0 2px 8px rgba(180,120,0,0.06)" }}
      >
        <div className="px-4 py-3 border-b border-amber-200/30">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Dansal by Dansal — Analytics
          </p>
        </div>
        <div className="divide-y divide-amber-100/40">
          {analytics.map((a, i) => (
            <div
              key={String(a.dansalId)}
              className="px-4 py-3"
              data-ocid={`account.analytics.item.${i + 1}`}
            >
              <p className="text-sm font-semibold text-foreground truncate mb-2">
                {a.name}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-medium text-foreground">
                    {String(a.viewCount)}
                  </span>{" "}
                  views
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3.5 w-3.5 text-blue-400" />
                  <span className="font-medium text-foreground">
                    {String(a.likeCount)}
                  </span>{" "}
                  likes
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 text-rose-400" />
                  <span className="font-medium text-foreground">
                    {String(a.appreciationCount)}
                  </span>{" "}
                  appre.
                </span>
              </div>
            </div>
          ))}
          <div
            className="px-4 py-3 bg-amber-50/60"
            data-ocid="account.analytics.totals_row"
          >
            <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">
              සම්පූර්ණ / Total
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-bold text-foreground">{totalViews}</span>
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-bold text-foreground">{totalLikes}</span>
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 text-rose-400" />
                <span className="font-bold text-foreground">
                  {totalAppreciations}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Favorites Tab
// ────────────────────────────────────────────────────────────
function FavoritesTab({
  favoriteIds,
  allDansals,
  isLoading,
}: {
  favoriteIds: bigint[] | undefined;
  allDansals: Dansal[] | undefined;
  isLoading: boolean;
}) {
  const toggleFavorite = useToggleFavorite();

  if (isLoading) return <LoadingSpinner />;

  const favSet = new Set((favoriteIds ?? []).map(String));
  const favorites = (allDansals ?? []).filter((d) => favSet.has(String(d.id)));

  if (favorites.length === 0) {
    return (
      <div
        className="text-center py-12 bg-card rounded-2xl border border-amber-200/40"
        data-ocid="account.favorites.empty_state"
      >
        <Star className="h-12 w-12 text-amber-200 mx-auto mb-3" />
        <p className="text-sm font-semibold text-foreground mb-1">
          ප්‍රිය Dansals නොමැත
        </p>
        <p className="text-xs text-muted-foreground">
          ඔබේ ප්‍රිය Dansals star icon ඔස්සේ save කරන්න
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-ocid="account.favorites.list">
      {favorites.map((d, i) => (
        <div
          key={String(d.id)}
          className="bg-card rounded-2xl border border-amber-200/40 p-4"
          style={{ boxShadow: "0 2px 8px rgba(180,120,0,0.06)" }}
          data-ocid={`account.favorites.item.${i + 1}`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-foreground truncate">
                {d.organizerName}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {d.district}, {d.province}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleFavorite.mutate(d.id)}
              disabled={toggleFavorite.isPending}
              data-ocid={`account.favorites.unfavorite_button.${i + 1}`}
              aria-label="Remove from favorites"
              className="p-1.5 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-smooth flex-shrink-0 disabled:opacity-50 btn-favorite active"
            >
              <Star className="h-4 w-4 fill-current" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {d.foodTypes.slice(0, 4).map((f) => (
              <span
                key={f}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium"
              >
                {f}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-400" />
              {d.date} · {d.time}
            </span>
            <StatusBadge status={d.status} />
          </div>
          {d.createdAt && (
            <p className="text-[10px] text-muted-foreground/60 mt-1.5">
              ලියාපදිංචි: {formatSinhalaDate(d.createdAt)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Account Tab Nav
// ────────────────────────────────────────────────────────────
const TAB_OPTIONS: { id: AccountTab; label: string; icon: ReactNode }[] = [
  {
    id: "dansals",
    label: "Dansals",
    icon: <UtensilsCrossed className="h-4 w-4" />,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart2 className="h-4 w-4" />,
  },
  { id: "favorites", label: "ප්‍රිය", icon: <Star className="h-4 w-4" /> },
  { id: "bio", label: "Bio", icon: <User className="h-4 w-4" /> },
];

function AccountTabs({
  active,
  onChange,
}: {
  active: AccountTab;
  onChange: (t: AccountTab) => void;
}) {
  return (
    <div
      className="flex gap-1 bg-muted/40 rounded-2xl p-1 border border-amber-200/30"
      data-ocid="account.tabs"
    >
      {TAB_OPTIONS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          data-ocid={`account.tab.${tab.id}`}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-semibold transition-smooth",
            active === tab.id
              ? "bg-card text-foreground shadow-sm border border-amber-200/40"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main AccountPage
// ────────────────────────────────────────────────────────────
interface AccountPageProps {
  onRequestAdminPin?: () => void;
}

export function AccountPage({ onRequestAdminPin }: AccountPageProps) {
  const { isAuthenticated, principal, login, logout } = useAuth();
  const { data: profile } = useGetMyProfile(isAuthenticated ? principal : null);
  const isAdmin = profile?.role === "admin" || profile?.role === "superAdmin";
  const isOrganizer = profile?.role === "organizer" || isAdmin;

  const { coords } = useGeolocationContext();
  const { data: myDansals, isLoading: myDansalsLoading } = useGetMyDansals(
    isAuthenticated ? principal : null,
  );
  const { data: allDansals } = useGetDansals();
  const { data: favoriteIds, isLoading: favLoading } = useGetMyFavorites(
    isAuthenticated ? principal : null,
  );
  const { data: analytics, isLoading: analyticsLoading } =
    useGetMyDansalAnalytics(isAuthenticated ? principal : null);
  const deleteDansal = useDeleteDansal();
  const { isEnabled, settings } = useNotifications();
  const registerUser = useRegisterUser();
  const markNotificationSeen = useMarkNotificationSeen();

  // Approval notification polling — fire browser notification for unseen approvals
  const { data: approvalNotifications } = useGetApprovalNotifications();
  const firedNotifIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!approvalNotifications?.length) return;
    for (const notif of approvalNotifications) {
      const key = String(notif.id);
      if (!notif.seen && !firedNotifIds.current.has(key)) {
        firedNotifIds.current.add(key);
        sendNotification(
          `ඔබේ ${notif.targetType === "dansal" ? "Dansal" : "ජායාරූපය"} Approved! ✓`,
          notif.targetName,
        );
        markNotificationSeen.mutate(notif.id);
      }
    }
  }, [approvalNotifications, markNotificationSeen]);

  const [activeTab, setActiveTab] = useState<AccountTab>("dansals");
  const [historyItems, setHistoryItems] =
    useState<NotifHistoryItem[]>(loadHistory);
  const lastCheckedRef = useRef<number>(Date.now());

  // biome-ignore lint/correctness/useExhaustiveDependencies: registerUser.mutate is stable
  useEffect(() => {
    if (isAuthenticated && principal && profile === null) {
      registerUser.mutate("Vesak User");
    }
  }, [isAuthenticated, principal, profile]);

  // Proximity check polling
  const runProximityCheck = useCallback(() => {
    if (!isEnabled || !coords || !allDansals?.length) return;

    const now = Date.now();
    const notified = pruneNotified(loadNotified());
    const radiusKm = settings.radiusKm;
    const newNotifications: NotifHistoryItem[] = [];

    for (const d of allDansals) {
      const hasCoords = d.latitude !== 0 && d.longitude !== 0;
      if (!hasCoords) continue;

      const dist = calculateDistance(
        coords.lat,
        coords.lon,
        d.latitude,
        d.longitude,
      );

      const isNearby = dist <= radiusKm;
      const dansalDt = parseDansalDateTime(d.date, d.time);
      const diffMin = dansalDt ? (dansalDt.getTime() - now) / 60_000 : null;

      const proximityKey = `proximity-${d.id}`;
      if (
        isNearby &&
        !notified[proximityKey] &&
        diffMin !== null &&
        diffMin > 0
      ) {
        const title = "Dansal ළඟදී / Nearby Dansal";
        const body = `${d.organizerName} — ${d.district} — ${formatDistance(dist)}`;
        sendNotification(title, body, "/favicon.ico");
        notified[proximityKey] = now;
        newNotifications.push({ id: `${now}-${d.id}`, title, body, ts: now });
      }

      const startingKey = `starting-${d.id}`;
      if (
        isNearby &&
        !notified[startingKey] &&
        diffMin !== null &&
        diffMin >= 0 &&
        diffMin <= 30
      ) {
        const title = "Dansal ආරම්භ වෙන්නට ළඟයි / Starting Soon";
        const body = `${d.organizerName} — 30 minutes තුළ ආරම්භ වේ / starts in 30 min`;
        sendNotification(title, body);
        notified[startingKey] = now;
        newNotifications.push({
          id: `${now}-start-${d.id}`,
          title,
          body,
          ts: now,
        });
      }

      const closedKey = `closed-${d.id}`;
      if (
        isNearby &&
        !notified[closedKey] &&
        dansalDt !== null &&
        dansalDt.getTime() < now
      ) {
        const title = "Dansal වසා ඇත / Dansal Closed";
        const body = `${d.organizerName} වසා ඇත / has closed`;
        sendNotification(title, body);
        notified[closedKey] = now;
        newNotifications.push({
          id: `${now}-closed-${d.id}`,
          title,
          body,
          ts: now,
        });
      }
    }

    if (newNotifications.length > 0) {
      saveNotified(notified);
      const prev = loadHistory();
      const next = [...newNotifications, ...prev].slice(0, HISTORY_MAX);
      saveHistory(next);
      setHistoryItems(next);
    } else {
      saveNotified(notified);
    }

    lastCheckedRef.current = now;
  }, [isEnabled, coords, allDansals, settings.radiusKm]);

  useEffect(() => {
    if (!isEnabled || !coords) return;
    runProximityCheck();
    const interval = setInterval(runProximityCheck, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isEnabled, coords, runProximityCheck]);

  const handleClearHistory = useCallback(() => {
    saveHistory([]);
    setHistoryItems([]);
  }, []);

  return (
    <div data-ocid="account.page">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 py-3 border-b border-amber-200/40">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-amber-500" />
              <h2 className="font-display font-bold text-foreground">
                ගිණුම / Account
              </h2>
            </div>
            {isAuthenticated && principal && (
              <p className="text-xs text-muted-foreground font-mono truncate max-w-[220px] mt-0.5">
                {principal.slice(0, 24)}…
              </p>
            )}
          </div>
          {isAuthenticated && (
            <button
              type="button"
              onClick={logout}
              data-ocid="account.logout_button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-amber-400 transition-smooth"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-28">
        {!isAuthenticated ? (
          <>
            <LoginSection onLogin={login} />
            <NotificationPanel
              historyItems={historyItems}
              onClearHistory={handleClearHistory}
            />
          </>
        ) : (
          <>
            {/* Profile card */}
            <div
              className="bg-card rounded-2xl border border-amber-200/40 p-4"
              style={{ boxShadow: "0 2px 8px rgba(180,120,0,0.06)" }}
              data-ocid="account.profile_card"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-7 w-7 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    {profile?.displayName ?? "Authenticated User"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {principal}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Verified / තහවුරු
                    </span>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        🛡️ {String(profile?.role)}
                      </span>
                    )}
                    {profile?.registeredAt && (
                      <span className="text-[10px] text-muted-foreground">
                        ලියාපදිංචි: {formatSinhalaDate(profile.registeredAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notification settings + history */}
            <NotificationPanel
              historyItems={historyItems}
              onClearHistory={handleClearHistory}
            />

            {/* Tabs: My Dansals / Analytics / Favorites / Bio */}
            <AccountTabs active={activeTab} onChange={setActiveTab} />

            {/* Tab content */}
            {activeTab === "dansals" && (
              <div data-ocid="account.my_dansals_section">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">
                      මගේ Dansals / My Dansals
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {myDansals?.length ?? 0} registered
                    </p>
                  </div>
                  <UtensilsCrossed className="h-5 w-5 text-amber-400" />
                </div>
                {myDansalsLoading ? (
                  <LoadingSpinner />
                ) : myDansals?.length === 0 ? (
                  <div
                    className="text-center py-10 bg-card rounded-2xl border border-amber-200/40"
                    data-ocid="account.my_dansals.empty_state"
                  >
                    <UtensilsCrossed className="h-10 w-10 text-amber-200 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      Dansals නොමැත
                    </p>
                    <p className="text-xs text-muted-foreground">
                      No Dansals registered under your account.
                      <br />
                      Go to the Dansals tab to register one.
                    </p>
                  </div>
                ) : (
                  <div
                    className="space-y-3"
                    data-ocid="account.my_dansals.list"
                  >
                    {myDansals?.map((d, i) => (
                      <MyDansalCard
                        key={String(d.id)}
                        dansal={d}
                        index={i + 1}
                        userLat={coords?.lat ?? null}
                        userLon={coords?.lon ?? null}
                        onDelete={(id) => deleteDansal.mutate(id)}
                        isDeleting={deleteDansal.isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <AnalyticsTab
                analytics={analytics}
                isLoading={analyticsLoading}
              />
            )}

            {activeTab === "favorites" && (
              <FavoritesTab
                favoriteIds={favoriteIds}
                allDansals={allDansals}
                isLoading={favLoading}
              />
            )}

            {activeTab === "bio" && isOrganizer && (
              <div
                className="bg-card rounded-2xl border border-amber-200/40 p-4"
                style={{ boxShadow: "0 2px 8px rgba(180,120,0,0.06)" }}
                data-ocid="account.bio_section"
              >
                <BioEditor currentBio={profile?.bio ?? ""} />
              </div>
            )}

            {activeTab === "bio" && !isOrganizer && (
              <div
                className="text-center py-10 bg-card rounded-2xl border border-amber-200/40"
                data-ocid="account.bio.not_organizer_state"
              >
                <User className="h-10 w-10 text-amber-200 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Organizer Role Required
                </p>
                <p className="text-xs text-muted-foreground">
                  Bio edit කිරීම organizer role ඇති users ට පමණි
                </p>
              </div>
            )}

            {/* Hidden admin PIN lock icon — only visible for authenticated users */}
            {isAuthenticated && (
              <div className="flex justify-center pt-4 pb-2">
                <button
                  type="button"
                  onClick={onRequestAdminPin}
                  aria-label="System settings"
                  data-ocid="account.admin_pin_access_button"
                  className="p-2 rounded-full text-muted-foreground/30 hover:text-muted-foreground/60 transition-smooth"
                >
                  <Lock className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
