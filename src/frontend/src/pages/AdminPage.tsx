import type { Role } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useActionReport,
  useAddReportNote,
  useApproveDansal,
  useApprovePhoto,
  useChangeAdminPin,
  useDeleteReportNote,
  useDeleteUser,
  useDismissReport,
  useGetMyProfile,
  useGetPendingDansals,
  useGetPendingPhotos,
  useGetReportNotes,
  useListReports,
  useListUsers,
  useRejectDansal,
  useRejectPhoto,
  useSetUserRole,
} from "@/hooks/useAdminData";
import { useAuth } from "@/hooks/useAuth";
import { Principal } from "@icp-sdk/core/principal";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Flag,
  Image,
  KeyRound,
  MapPin,
  MessageSquare,
  Phone,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AdminPageProps {
  onBack: () => void;
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    superAdmin:
      "bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-200",
    admin: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200",
    organizer:
      "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200",
    user: "bg-muted text-muted-foreground",
  };
  const label: Record<string, string> = {
    superAdmin: "\uD83D\uDD31 Super Admin",
    admin: "\uD83D\uDEE1\uFE0F Admin",
    organizer: "\uD83C\uDFAA Organizer",
    user: "\uD83D\uDC64 User",
  };
  const cls = map[role] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}
    >
      {label[role] ?? role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending")
    return <span className="badge-pending">⏳ බලාපොරොත්තු</span>;
  if (status === "approved")
    return <span className="badge-approved">✓ අනුමත</span>;
  if (status === "rejected")
    return <span className="badge-rejected">✗ ප්‍රතික්ෂේප</span>;
  if (status === "dismissed")
    return <span className="badge-rejected">— ඉවත</span>;
  if (status === "actioned")
    return <span className="badge-approved">✓ ක්‍රියා</span>;
  return <span className="badge-pending">{status}</span>;
}

function TargetTypeBadge({ type }: { type: string }) {
  if (type === "dansal")
    return (
      <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 border-0 text-xs">
        <UtensilsCrossed className="w-3 h-3 mr-1" /> Dansal
      </Badge>
    );
  return (
    <Badge className="bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200 border-0 text-xs">
      <Image className="w-3 h-3 mr-1" /> ජායාරූපය
    </Badge>
  );
}

const REASON_LABELS: Record<string, string> = {
  spam: "\uD83D\uDCE2 Spam",
  fake: "\uD83C\uDFAD Fake",
  inappropriate: "\u26A0\uFE0F Inappropriate",
  other: "\u2753 Other",
};

function formatTs(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleString("si-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function truncatePrincipal(p: string, chars = 12): string {
  if (p.length <= chars * 2 + 3) return p;
  return `${p.slice(0, chars)}\u2026${p.slice(-chars)}`;
}

interface DeleteDialogProps {
  open: boolean;
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}
function DeleteDialog({
  open,
  name,
  onConfirm,
  onCancel,
  isPending,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent data-ocid="admin.delete_dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            පරිශීලකයා මකන්න
          </DialogTitle>
          <DialogDescription>
            <strong>{name}</strong> පරිශීලකයාගේ ගිණුම ස්ථිරවම මකා දැමීමට ඔබ ළිශ්වාසද? මේය
            අහෝසි කල නොහැකිය. නොහැකිය.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-ocid="admin.delete_dialog.cancel_button"
          >
            අවලංගු කරන්න
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            data-ocid="admin.delete_dialog.confirm_button"
          >
            <Trash2 className="w-4 h-4 mr-1" /> ඔව්, මකන්න
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──── Report Notes Timeline ────
function ReportNotesSection({
  reportId,
  currentUserPrincipal,
}: {
  reportId: bigint;
  currentUserPrincipal: string | null;
}) {
  const { data: notes = [], isLoading } = useGetReportNotes(reportId);
  const addNote = useAddReportNote();
  const deleteNote = useDeleteReportNote();
  const [noteText, setNoteText] = useState("");
  const [noteError, setNoteError] = useState("");

  // Sort newest first
  const sorted = [...notes].sort((a, b) => Number(b.createdAt - a.createdAt));

  async function handleAdd() {
    if (!noteText.trim()) {
      setNoteError("අදහස් ලිවිය යුතුය්.");
      return;
    }
    setNoteError("");
    const result = await addNote.mutateAsync({
      reportId,
      text: noteText.trim(),
    });
    if (result.__kind__ === "ok") {
      setNoteText("");
    } else {
      setNoteError(result.err);
    }
  }

  return (
    <div
      className="mt-3 border-t border-amber-200/30 pt-3 space-y-3"
      data-ocid="admin.report_notes.section"
    >
      <p className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
        Admin Notes
      </p>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : sorted.length === 0 ? (
        <p
          className="text-xs text-muted-foreground text-center py-2"
          data-ocid="admin.report_notes.empty_state"
        >
          Notes නොමැත
        </p>
      ) : (
        <div className="space-y-2" data-ocid="admin.report_notes.list">
          {sorted.map((note, i) => (
            <div
              key={String(note.id)}
              className="bg-muted/30 rounded-xl px-3 py-2.5 flex gap-2"
              data-ocid={`admin.report_notes.item.${i + 1}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {note.authorName}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {formatTs(note.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-foreground mt-0.5 break-words">
                  {note.text}
                </p>
              </div>
              {currentUserPrincipal &&
                note.authorId === currentUserPrincipal && (
                  <button
                    type="button"
                    onClick={() =>
                      deleteNote.mutate({ noteId: note.id, reportId })
                    }
                    disabled={deleteNote.isPending}
                    aria-label="Delete note"
                    data-ocid={`admin.report_notes.delete_button.${i + 1}`}
                    className="p-1 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-smooth flex-shrink-0 self-start mt-0.5 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Add note textarea */}
      <div className="flex gap-2">
        <textarea
          rows={2}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Note add කරන්න..."
          data-ocid="admin.report_notes.textarea"
          className="flex-1 px-3 py-2 rounded-xl bg-background border border-amber-200/60 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-amber-300/60 resize-none"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={addNote.isPending || !noteText.trim()}
          data-ocid="admin.report_notes.add_button"
          className="self-end bg-amber-500 hover:bg-amber-600 text-white text-xs"
        >
          Add
        </Button>
      </div>
      {noteError && (
        <p
          className="text-xs text-red-500"
          data-ocid="admin.report_notes.error_state"
        >
          ⚠ {noteError}
        </p>
      )}
    </div>
  );
}

// ──── PIN Settings Tab ────
function PinSettingsTab() {
  const changePin = useChangeAdminPin();
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleChange() {
    setError("");
    setSuccess("");
    if (oldPin.length !== 4 || newPin.length !== 4) {
      setError("PIN 4 digits විය යුතුය.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("අලුත් PIN ඇතිය උසස් නොමැත.");
      return;
    }
    const result = await changePin.mutateAsync({ oldPin, newPin });
    if (result.__kind__ === "ok") {
      setSuccess("PIN වෙනස් කළා ✓");
      setOldPin("");
      setNewPin("");
      setConfirmPin("");
    } else {
      setError(result.err);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl bg-background border border-amber-200/60 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/60 tracking-[0.5em] font-mono";

  return (
    <div className="space-y-4" data-ocid="admin.settings.pin_section">
      <div
        className="bg-card rounded-2xl border border-amber-200/40 p-4"
        style={{ boxShadow: "0 2px 8px rgba(180,120,0,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Admin PIN වෙනස් කරන්න
            </p>
            <p className="text-xs text-muted-foreground">
              4-digit PIN change කරන්න
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="old-pin"
              className="text-xs font-medium text-foreground mb-1 block"
            >
              පුර්ව PIN / Current PIN
            </label>
            <input
              id="old-pin"
              type="password"
              maxLength={4}
              value={oldPin}
              onChange={(e) =>
                setOldPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="••••"
              data-ocid="admin.settings.old_pin_input"
              className={inputCls}
            />
          </div>
          <div>
            <label
              htmlFor="new-pin"
              className="text-xs font-medium text-foreground mb-1 block"
            >
              අලුත් PIN / New PIN
            </label>
            <input
              id="new-pin"
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) =>
                setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="••••"
              data-ocid="admin.settings.new_pin_input"
              className={inputCls}
            />
          </div>
          <div>
            <label
              htmlFor="confirm-pin"
              className="text-xs font-medium text-foreground mb-1 block"
            >
              අලුත් PIN තහවුරු කරන්න / Confirm New PIN
            </label>
            <input
              id="confirm-pin"
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) =>
                setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="••••"
              data-ocid="admin.settings.confirm_pin_input"
              className={inputCls}
            />
          </div>
          {error && (
            <p
              className="text-xs text-red-500"
              data-ocid="admin.settings.pin_error_state"
            >
              ⚠ {error}
            </p>
          )}
          {success && (
            <p
              className="text-xs text-green-600"
              data-ocid="admin.settings.pin_success_state"
            >
              ✓ {success}
            </p>
          )}
          <Button
            type="button"
            onClick={handleChange}
            disabled={changePin.isPending || !oldPin || !newPin || !confirmPin}
            data-ocid="admin.settings.change_pin_button"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            <KeyRound className="w-4 h-4 mr-2" />
            {changePin.isPending ? "Saving..." : "PIN Change කරන්න"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminPage({ onBack }: AdminPageProps) {
  const { principal } = useAuth();
  const { data: profile, isLoading: profileLoading } =
    useGetMyProfile(principal);

  const isAdmin = profile?.role === "admin" || profile?.role === "superAdmin";

  const { data: pendingDansals = [], isLoading: dansalsLoading } =
    useGetPendingDansals();
  const { data: pendingPhotos = [], isLoading: photosLoading } =
    useGetPendingPhotos();
  const { data: users = [], isLoading: usersLoading } = useListUsers();
  const { data: reports = [], isLoading: reportsLoading } = useListReports();

  const approveDansal = useApproveDansal();
  const rejectDansal = useRejectDansal();
  const approvePhoto = useApprovePhoto();
  const rejectPhoto = useRejectPhoto();
  const setUserRole = useSetUserRole();
  const deleteUser = useDeleteUser();
  const dismissReport = useDismissReport();
  const actionReport = useActionReport();

  const [deleteTarget, setDeleteTarget] = useState<{
    principal: string;
    name: string;
  } | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<bigint | null>(null);

  if (profileLoading) {
    return (
      <div className="p-4 space-y-4" data-ocid="admin.loading_state">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6"
        data-ocid="admin.error_state"
      >
        <ShieldCheck className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">
          ප්‍රවේශය ලබා නොදේ
        </h2>
        <p className="text-muted-foreground text-center">
          ඔබට මෙම කොටසට ප්‍රවේශ වීමට අවසර නැත.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          data-ocid="admin.back_button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> ආපසු
        </Button>
      </div>
    );
  }

  const handleApproveDansal = async (id: bigint) => {
    const result = await approveDansal.mutateAsync(id);
    if (result.__kind__ === "ok") toast.success("Dansal අනුමත කළා ✓");
    else toast.error(result.err);
  };

  const handleRejectDansal = async (id: bigint) => {
    const result = await rejectDansal.mutateAsync(id);
    if (result.__kind__ === "ok") toast.success("Dansal ප්‍රතික්ෂේප කළා");
    else toast.error(result.err);
  };

  const handleApprovePhoto = async (id: bigint) => {
    const result = await approvePhoto.mutateAsync(id);
    if (result.__kind__ === "ok") toast.success("ජායාරූපය අනුමත කළා ✓");
    else toast.error(result.err);
  };

  const handleRejectPhoto = async (id: bigint) => {
    const result = await rejectPhoto.mutateAsync(id);
    if (result.__kind__ === "ok") toast.success("ජායාරූපය ප්‍රතික්ෂේප කළා");
    else toast.error(result.err);
  };

  const handleSetRole = async (principalStr: string, role: Role) => {
    const result = await setUserRole.mutateAsync({
      target: Principal.fromText(principalStr),
      role,
    });
    if (result.__kind__ === "ok") toast.success("භූමිකාව යාවත්කාලීන කළා ✓");
    else toast.error(result.err);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    const result = await deleteUser.mutateAsync(
      Principal.fromText(deleteTarget.principal),
    );
    if (result.__kind__ === "ok") {
      toast.success("පරිශීලකයා මකා දැමීය");
      setDeleteTarget(null);
    } else {
      toast.error(result.err);
    }
  };

  const handleDismissReport = async (id: bigint) => {
    const result = await dismissReport.mutateAsync(id);
    if (result.__kind__ === "ok") toast.success("වාර්තාව ඉවත් කළා");
    else toast.error(result.err);
  };

  const handleActionReport = async (id: bigint) => {
    const result = await actionReport.mutateAsync(id);
    if (result.__kind__ === "ok") toast.success("ක්‍රියාව ගනී ✓");
    else toast.error(result.err);
  };

  const pendingReports = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="pb-24" data-ocid="admin.page">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-amber-200/60 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-muted transition-smooth"
          aria-label="ආපසු"
          data-ocid="admin.back_button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold font-display text-foreground">
            🛡️ Admin Panel
          </h1>
          <p className="text-xs text-muted-foreground">කළමනාකරණය</p>
        </div>
        <RoleBadge role={String(profile?.role ?? "user")} />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="analytics-card">
          <p className="analytics-label">බලාපොරොත්තු දංසල</p>
          <p className="analytics-value text-amber-600">
            {pendingDansals.length}
          </p>
        </div>
        <div className="analytics-card">
          <p className="analytics-label">බලාපොරොත්තු ජායාරූප</p>
          <p className="analytics-value text-sky-600">{pendingPhotos.length}</p>
        </div>
        <div className="analytics-card">
          <p className="analytics-label">මුළ පරිශීලකයින්</p>
          <p className="analytics-value">{users.length}</p>
        </div>
        <div className="analytics-card">
          <p className="analytics-label">ක්‍රියාකාරී වාර්තා</p>
          <p className="analytics-value text-red-600">{pendingReports}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs defaultValue="dansals" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger
              value="dansals"
              data-ocid="admin.dansals_tab"
              className="text-xs"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Dansals</span>
              {pendingDansals.length > 0 && (
                <span className="ml-1 bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {pendingDansals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="photos"
              data-ocid="admin.photos_tab"
              className="text-xs"
            >
              <Image className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">ජායා</span>
              {pendingPhotos.length > 0 && (
                <span className="ml-1 bg-sky-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {pendingPhotos.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="users"
              data-ocid="admin.users_tab"
              className="text-xs"
            >
              <Users className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              data-ocid="admin.reports_tab"
              className="text-xs"
            >
              <Flag className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">වාර්තා</span>
              {pendingReports > 0 && (
                <span className="ml-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {pendingReports}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              data-ocid="admin.settings_tab"
              className="text-xs"
            >
              <Settings className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Pending Dansals */}
          <TabsContent value="dansals" data-ocid="admin.dansals_section">
            {dansalsLoading ? (
              <div
                className="space-y-3"
                data-ocid="admin.dansals.loading_state"
              >
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : pendingDansals.length === 0 ? (
              <div
                className="text-center py-14 text-muted-foreground"
                data-ocid="admin.dansals.empty_state"
              >
                <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">බලාපොරොත්තු දංසල නොමැත</p>
                <p className="text-xs mt-1">සියල්ල විනිශ්ඡය කරඅත</p>
              </div>
            ) : (
              <div className="space-y-3" data-ocid="admin.dansals.list">
                {pendingDansals.map((dansal, idx) => (
                  <div
                    key={String(dansal.id)}
                    className="admin-section"
                    data-ocid={`admin.dansals.item.${idx + 1}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {dansal.organizerName}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {dansal.province} · {dansal.district}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          📅 {dansal.date} · 🕐 {dansal.time}
                        </p>
                        {dansal.contactPhone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{dansal.contactPhone}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {dansal.foodTypes.map((f) => (
                            <Badge
                              key={f}
                              variant="secondary"
                              className="text-xs"
                            >
                              {f}
                            </Badge>
                          ))}
                        </div>
                        {dansal.createdAt > 0n && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ⏱ {formatTs(dansal.createdAt)}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={String(dansal.status)} />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                        onClick={() => handleApproveDansal(dansal.id)}
                        disabled={approveDansal.isPending}
                        data-ocid={`admin.dansals.approve_button.${idx + 1}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> අනුමත කරන්න
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="flex-1 text-xs"
                        onClick={() => handleRejectDansal(dansal.id)}
                        disabled={rejectDansal.isPending}
                        data-ocid={`admin.dansals.reject_button.${idx + 1}`}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> ප්‍රතික්ෂේප
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending Photos */}
          <TabsContent value="photos" data-ocid="admin.photos_section">
            {photosLoading ? (
              <div className="space-y-3" data-ocid="admin.photos.loading_state">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-36 w-full rounded-xl" />
                ))}
              </div>
            ) : pendingPhotos.length === 0 ? (
              <div
                className="text-center py-14 text-muted-foreground"
                data-ocid="admin.photos.empty_state"
              >
                <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">බලාපොරොත්තු ජායාරූප නොමැත</p>
                <p className="text-xs mt-1">සියල්ල විනිශ්ඡය කරඅත</p>
              </div>
            ) : (
              <div className="space-y-3" data-ocid="admin.photos.list">
                {pendingPhotos.map((photo, idx) => (
                  <div
                    key={String(photo.id)}
                    className="admin-section"
                    data-ocid={`admin.photos.item.${idx + 1}`}
                  >
                    <div className="flex gap-3 mb-3">
                      <img
                        src={photo.image.getDirectURL()}
                        alt={photo.caption}
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0 border border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">
                          {photo.uploaderName}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {photo.caption}
                        </p>
                        {photo.uploadedAt > 0n && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ⏱ {formatTs(photo.uploadedAt)}
                          </p>
                        )}
                        <div className="mt-1.5">
                          <StatusBadge status={String(photo.status)} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                        onClick={() => handleApprovePhoto(photo.id)}
                        disabled={approvePhoto.isPending}
                        data-ocid={`admin.photos.approve_button.${idx + 1}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> අනුමත
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="flex-1 text-xs"
                        onClick={() => handleRejectPhoto(photo.id)}
                        disabled={rejectPhoto.isPending}
                        data-ocid={`admin.photos.reject_button.${idx + 1}`}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> ප්‍රතික්ෂේප
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users" data-ocid="admin.users_section">
            {usersLoading ? (
              <div className="space-y-3" data-ocid="admin.users.loading_state">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div
                className="text-center py-14 text-muted-foreground"
                data-ocid="admin.users.empty_state"
              >
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">ලියාපදිංචි පරිශීලකයින් නොමැත</p>
              </div>
            ) : (
              <div className="space-y-2" data-ocid="admin.users.list">
                {users.map((user, idx) => (
                  <div
                    key={String(user.principal)}
                    className="admin-section"
                    data-ocid={`admin.users.item.${idx + 1}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">
                          {user.displayName}
                        </p>
                        <p
                          className="text-xs text-muted-foreground truncate font-mono mt-0.5"
                          title={String(user.principal)}
                        >
                          {truncatePrincipal(String(user.principal))}
                        </p>
                        {user.registeredAt > 0n && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            🗓 {formatTs(user.registeredAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <RoleBadge role={String(user.role)} />
                        {profile?.role === "superAdmin" &&
                          String(user.role) !== "superAdmin" && (
                            <select
                              className="text-xs border border-border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                              defaultValue={String(user.role)}
                              onChange={(e) =>
                                handleSetRole(
                                  String(user.principal),
                                  e.target.value as Role,
                                )
                              }
                              data-ocid={`admin.users.role_select.${idx + 1}`}
                            >
                              <option value="user">👤 User</option>
                              <option value="organizer">🎪 Organizer</option>
                              <option value="admin">🛡️ Admin</option>
                            </select>
                          )}
                        {String(user.role) !== "superAdmin" && (
                          <button
                            type="button"
                            className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-smooth px-2 py-1 rounded-lg hover:bg-destructive/10"
                            onClick={() =>
                              setDeleteTarget({
                                principal: String(user.principal),
                                name: user.displayName,
                              })
                            }
                            aria-label={`${user.displayName} මකන්න`}
                            data-ocid={`admin.users.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> මකන්න
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" data-ocid="admin.reports_section">
            {reportsLoading ? (
              <div
                className="space-y-3"
                data-ocid="admin.reports.loading_state"
              >
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div
                className="text-center py-14 text-muted-foreground"
                data-ocid="admin.reports.empty_state"
              >
                <Flag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">වාර්තා නොමැත</p>
                <p className="text-xs mt-1">සෙමක් හොටින් ඇත 🎉</p>
              </div>
            ) : (
              <div className="space-y-3" data-ocid="admin.reports.list">
                {reports.map((report, idx) => {
                  const isHandled =
                    report.status === "dismissed" ||
                    report.status === "actioned";
                  const isExpanded = expandedReportId === report.id;
                  return (
                    <div
                      key={String(report.id)}
                      className={`admin-section transition-smooth${isHandled ? " opacity-60" : ""}`}
                      data-ocid={`admin.reports.item.${idx + 1}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <TargetTypeBadge type={String(report.targetType)} />
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                            {REASON_LABELS[String(report.reason)] ??
                              String(report.reason)}
                          </span>
                        </div>
                        <StatusBadge status={String(report.status)} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        <span className="font-medium">Reporter:</span>{" "}
                        <span
                          className="font-mono"
                          title={String(report.reporterPrincipal)}
                        >
                          {truncatePrincipal(
                            String(report.reporterPrincipal),
                            8,
                          )}
                        </span>
                      </p>
                      {report.description && (
                        <p className="text-xs text-foreground/80 bg-muted rounded-lg p-2 mb-2">
                          “{report.description}”
                        </p>
                      )}
                      {report.timestamp > 0n && (
                        <p className="text-xs text-muted-foreground mb-2">
                          ⏱ {formatTs(report.timestamp)}
                        </p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {!isHandled && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs"
                              onClick={() => handleActionReport(report.id)}
                              disabled={actionReport.isPending}
                              data-ocid={`admin.reports.action_button.${idx + 1}`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" />{" "}
                              ක්‍රියාව ගන්න
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs"
                              onClick={() => handleDismissReport(report.id)}
                              disabled={dismissReport.isPending}
                              data-ocid={`admin.reports.dismiss_button.${idx + 1}`}
                            >
                              ඉවත් කරන්න
                            </Button>
                          </>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-xs text-muted-foreground"
                          onClick={() =>
                            setExpandedReportId(isExpanded ? null : report.id)
                          }
                          data-ocid={`admin.reports.notes_toggle.${idx + 1}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1" />
                          {isExpanded ? "Notes හංගන්න" : "Notes"}
                        </Button>
                      </div>

                      {/* Report Notes Timeline */}
                      {isExpanded && (
                        <ReportNotesSection
                          reportId={report.id}
                          currentUserPrincipal={principal}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" data-ocid="admin.settings_section">
            <PinSettingsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteDialog
        open={!!deleteTarget}
        name={deleteTarget?.name ?? ""}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteTarget(null)}
        isPending={deleteUser.isPending}
      />
    </div>
  );
}
