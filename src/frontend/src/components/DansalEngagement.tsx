import {
  ReportTargetType,
  Variant_other_fake_inappropriate_spam,
} from "@/backend";
import type { ApprovalStatus } from "@/backend";
import { useAuth } from "@/hooks/useAuth";
import { useSubmitReport, useToggleDansalLike } from "@/hooks/useVesakData";
import { Flag, Heart, X } from "lucide-react";
import { useState } from "react";

// ── Status Badge ───────────────────────────────
export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  if (status === "approved") {
    return (
      <span className="badge-approved inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
        අනුමත / Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="badge-rejected inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
        ප්‍රතික්ෂේප / Rejected
      </span>
    );
  }
  return (
    <span className="badge-pending inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 inline-block animate-pulse" />
      බලාපොරොත්තු / Pending
    </span>
  );
}

// ── Like Button ────────────────────────────────
export function DansalLikeButton({
  dansalId,
  likeCount,
  likedBy,
  principal,
  onNeedLogin,
  ocid,
}: {
  dansalId: bigint;
  likeCount: bigint;
  likedBy: string[];
  principal: string | null;
  onNeedLogin: () => void;
  ocid: string;
}) {
  const toggleLike = useToggleDansalLike();
  const liked = principal ? likedBy.includes(principal) : false;
  const [localLiked, setLocalLiked] = useState<boolean | null>(null);
  const [localCount, setLocalCount] = useState<bigint | null>(null);

  const displayLiked = localLiked ?? liked;
  const displayCount = localCount ?? likeCount;

  function handleClick() {
    if (!principal) {
      onNeedLogin();
      return;
    }
    // Optimistic update
    const nextLiked = !displayLiked;
    setLocalLiked(nextLiked);
    setLocalCount(BigInt(displayCount) + BigInt(nextLiked ? 1 : -1));
    toggleLike.mutate(dansalId, {
      onSuccess: (res) => {
        setLocalLiked(res.liked);
        setLocalCount(res.likeCount);
      },
      onError: () => {
        // Revert optimistic
        setLocalLiked(null);
        setLocalCount(null);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      data-ocid={ocid}
      aria-label={displayLiked ? "Like ඉවත් කරන්න" : "Like කරන්න"}
      className={[
        "btn-like",
        displayLiked ? "text-primary" : "",
        "select-none",
      ].join(" ")}
    >
      <Heart
        className={[
          "h-4 w-4 transition-all duration-200",
          displayLiked ? "fill-current scale-110" : "scale-100",
        ].join(" ")}
      />
      <span className="text-xs">{Number(displayCount)}</span>
    </button>
  );
}

// ── Report Reason options ──────────────────────
const REPORT_REASONS: Array<{
  value: Variant_other_fake_inappropriate_spam;
  label: string;
}> = [
  { value: Variant_other_fake_inappropriate_spam.spam, label: "Spam" },
  { value: Variant_other_fake_inappropriate_spam.fake, label: "ව්‍යාජ (Fake)" },
  {
    value: Variant_other_fake_inappropriate_spam.inappropriate,
    label: "නුසුදුසු (Inappropriate)",
  },
  { value: Variant_other_fake_inappropriate_spam.other, label: "වෙනත් (Other)" },
];

type ReportReason = Variant_other_fake_inappropriate_spam;

// ── Report Modal ───────────────────────────────
export function ReportModal({
  dansalId,
  dansalName,
  onClose,
}: {
  dansalId: bigint;
  dansalName: string;
  onClose: () => void;
}) {
  const submitReport = useSubmitReport();
  const [reason, setReason] = useState<ReportReason>(
    Variant_other_fake_inappropriate_spam.spam,
  );
  const [description, setDescription] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitReport.mutateAsync({
      targetId: dansalId,
      targetType: ReportTargetType.dansal,
      reason,
      description: description.trim() || undefined,
    });
    setDone(true);
    setTimeout(onClose, 1600);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
      data-ocid="report.dialog"
    >
      <div className="bg-card rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200/40">
          <h3 className="font-display font-bold text-foreground text-sm">
            🚩 Report කරන්න
          </h3>
          <button
            type="button"
            onClick={onClose}
            data-ocid="report.close_button"
            aria-label="Close"
            className="p-1 rounded-full hover:bg-muted transition-smooth"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {done ? (
          <div
            className="flex flex-col items-center py-10 gap-2"
            data-ocid="report.success_state"
          >
            <div className="text-4xl">✅</div>
            <p className="text-sm font-medium text-foreground">
              Report ලබාගත්තා. ස්තූතියි!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {dansalName}
              </span>{" "}
              ගැන report කරනවා
            </p>
            <div className="space-y-2">
              <label
                className="text-xs font-semibold text-foreground uppercase tracking-wide block"
                htmlFor="report-reason"
              >
                හේතුව / Reason *
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                data-ocid="report.reason_select"
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-amber-200/60 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/60"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-semibold text-foreground uppercase tracking-wide block"
                htmlFor="report-desc"
              >
                විස්තර / Description (Optional)
              </label>
              <textarea
                id="report-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="අමතර විස්තර ලිවිය හැකිය..."
                data-ocid="report.description_textarea"
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-amber-200/60 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-300/60 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                data-ocid="report.cancel_button"
                className="flex-1 py-2.5 rounded-xl border border-amber-200/60 text-foreground font-semibold text-sm hover:bg-muted transition-smooth"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitReport.isPending}
                data-ocid="report.confirm_button"
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-smooth disabled:opacity-60"
              >
                {submitReport.isPending ? "Sending..." : "Report කරන්න"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Report Trigger Button ──────────────────────
export function DansalReportButton({
  dansalId,
  dansalName,
  ocid,
}: {
  dansalId: bigint;
  dansalName: string;
  ocid: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-ocid={ocid}
        aria-label="Report Dansal"
        className="btn-report"
      >
        <Flag className="h-4 w-4" />
      </button>
      {open && (
        <ReportModal
          dansalId={dansalId}
          dansalName={dansalName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
