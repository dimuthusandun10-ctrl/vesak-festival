import type { Comment, Dansal, Review } from "@/backend";
import { useAuth } from "@/hooks/useAuth";
import {
  useAddComment,
  useAddReview,
  useDeleteComment,
  useDeleteReview,
  useGetAverageRating,
  useGetComments,
  useGetReviews,
} from "@/hooks/useVesakData";
import { Principal } from "@icp-sdk/core/principal";
import {
  Clock,
  Copy,
  ExternalLink,
  Globe,
  MapIcon,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Share2,
  Star,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useState } from "react";

const INPUT_CLS =
  "w-full px-3 py-2.5 rounded-xl bg-background border border-amber-200/60 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/60";

// ── Star Picker ─────────────────────────────────
function StarPicker({
  value,
  onChange,
}: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onTouchEnd={(e) => {
            e.preventDefault();
            onChange(s);
          }}
          aria-label={`${s} ශ්‍රේණිය`}
          className="p-1.5 transition-smooth hover:scale-110 active:scale-125 touch-manipulation"
        >
          <Star
            className={[
              "h-7 w-7 transition-colors duration-150",
              s <= value
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground",
            ].join(" ")}
          />
        </button>
      ))}
    </div>
  );
}

// ── Star Display ────────────────────────────────
function StarDisplay({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={[
            "h-3.5 w-3.5",
            s <= rounded
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
          ].join(" ")}
        />
      ))}
    </span>
  );
}

// ── Comment Item ────────────────────────────────
function CommentItem({
  comment,
  isOwn,
  onDelete,
}: {
  comment: Comment;
  isOwn: boolean;
  onDelete: () => void;
}) {
  const time = new Date(
    Number(comment.timestamp) / 1_000_000,
  ).toLocaleDateString("si-LK", { month: "short", day: "numeric" });

  return (
    <div className="flex gap-2.5">
      <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-700">
        {comment.authorName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-semibold text-foreground truncate">
            {comment.authorName}
          </span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {time}
          </span>
        </div>
        <p className="text-sm text-foreground mt-0.5 break-words">
          {comment.text}
        </p>
      </div>
      {isOwn && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete comment"
          className="p-1 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-smooth flex-shrink-0 self-start mt-0.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Review Item ──────────────────────────────────
function ReviewItem({
  review,
  isOwn,
  onDelete,
}: {
  review: Review;
  isOwn: boolean;
  onDelete: () => void;
}) {
  const time = new Date(
    Number(review.timestamp) / 1_000_000,
  ).toLocaleDateString("si-LK", { month: "short", day: "numeric" });

  return (
    <div className="flex gap-2.5">
      <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-orange-700">
        {review.reviewerName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground truncate">
            {review.reviewerName}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StarDisplay rating={Number(review.rating)} />
            <span className="text-[10px] text-muted-foreground">{time}</span>
          </div>
        </div>
        {review.text && (
          <p className="text-sm text-foreground mt-0.5 break-words">
            {review.text}
          </p>
        )}
      </div>
      {isOwn && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete review"
          className="p-1 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-smooth flex-shrink-0 self-start mt-0.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Detail Sheet ─────────────────────────────────
export function DansalDetailSheet({
  dansal,
  onClose,
  onNeedLogin,
  onViewOrganizerProfile,
}: {
  dansal: Dansal;
  onClose: () => void;
  onNeedLogin: () => void;
  onViewOrganizerProfile?: (principal: string) => void;
}) {
  const { isAuthenticated, principal } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "details" | "comments" | "reviews"
  >("details");

  // Hooks
  const commentsQuery = useGetComments(
    activeTab === "comments" ? dansal.id : null,
  );
  const reviewsQuery = useGetReviews(
    activeTab === "reviews" ? dansal.id : null,
  );
  const ratingQuery = useGetAverageRating(dansal.id);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const addReview = useAddReview();
  const deleteReview = useDeleteReview();

  // Comment form state
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentCharCount, setCommentCharCount] = useState(0);
  const MAX_COMMENT_CHARS = 500;
  const [optimisticComments, setOptimisticComments] = useState<Comment[]>([]);

  // Share state
  const [copyToast, setCopyToast] = useState(false);

  // Copy to clipboard helper
  function copyToClipboard(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  // Build share URL/message
  function buildShareUrl() {
    return `${window.location.origin}${window.location.pathname}?dansal=${encodeURIComponent(dansal.organizerName)}`;
  }

  function buildWhatsAppMessage() {
    const url = buildShareUrl();
    const foods = dansal.foodTypes.join(", ");
    const location = [dansal.district, dansal.province]
      .filter(Boolean)
      .join(", ");
    return `🏮 *${dansal.organizerName}* - Vesak Dansal\n\n🍽 ${foods}\n⏰ ${dansal.date} at ${dansal.time}${location ? `\n📍 ${location}` : ""}\n\n👉 ${url}`;
  }

  function handleCopyLink() {
    const url = buildShareUrl();
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopyToast(true);
        setTimeout(() => setCopyToast(false), 3000);
      })
      .catch(() => {});
  }

  // Review form state
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewError, setReviewError] = useState("");

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    setCommentError("");
    if (!commentName.trim() || !commentText.trim()) {
      setCommentError("නම සහ අදහස් ලිවිය යුතුය්.");
      return;
    }
    if (commentText.trim().length > MAX_COMMENT_CHARS) {
      setCommentError(`අදහස් අකුරු ${MAX_COMMENT_CHARS} ක් ඉක්මළිය නොහැක්.`);
      return;
    }
    // Optimistic update
    const tempComment: Comment = {
      id: BigInt(-Date.now()),
      dansalId: dansal.id,
      authorName: commentName.trim(),
      text: commentText.trim(),
      timestamp: BigInt(Date.now()) * 1_000_000n,
      authorPrincipal: Principal.anonymous(),
    };
    setOptimisticComments((prev) => [tempComment, ...prev]);
    const textToSend = commentText.trim();
    setCommentText("");
    setCommentCharCount(0);
    try {
      await addComment.mutateAsync({
        dansalId: dansal.id,
        authorName: commentName.trim(),
        text: textToSend,
      });
      setOptimisticComments([]);
    } catch {
      setCommentError("අදහස් යගරයන් විය. නොහැකිය.");
      setOptimisticComments((prev) =>
        prev.filter((c) => c.id !== tempComment.id),
      );
      setCommentText(textToSend);
      setCommentCharCount(textToSend.length);
    }
  }

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewError("");
    if (!reviewName.trim()) {
      setReviewError("නම ලිවිය යුතුය.");
      return;
    }
    try {
      const result = await addReview.mutateAsync({
        dansalId: dansal.id,
        reviewerName: reviewName.trim(),
        text: reviewText.trim(),
        rating: BigInt(reviewRating),
      });
      if ("__kind__" in result && result.__kind__ === "err") {
        setReviewError(result.err);
        return;
      }
      setReviewText("");
      setReviewRating(5);
    } catch {
      setReviewError("Review add කිරීමට නොහැකි විය.");
    }
  }

  const avgRating = ratingQuery.data ?? 0;
  const serverComments = (commentsQuery.data as Comment[] | undefined) ?? [];
  const comments = [
    ...optimisticComments.filter(
      (oc) => !serverComments.some((sc) => sc.id === oc.id),
    ),
    ...serverComments,
  ];
  const reviews = (reviewsQuery.data as Review[] | undefined) ?? [];

  return (
    <div
      className="w-full max-w-lg mx-auto bg-card rounded-t-3xl max-h-[92dvh] flex flex-col"
      data-ocid="dansal_detail.dialog"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyUp={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="w-full max-w-lg mx-auto bg-card rounded-t-3xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-amber-200/40 px-4 py-3 rounded-t-3xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              {onViewOrganizerProfile ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewOrganizerProfile(String(dansal.organizerPrincipal));
                  }}
                  data-ocid="dansal_detail.organizer_profile_link"
                  className="font-display font-bold text-foreground hover:text-amber-600 transition-smooth truncate text-left w-full underline decoration-dotted underline-offset-2"
                >
                  {dansal.organizerName}
                </button>
              ) : (
                <h2 className="font-display font-bold text-foreground truncate">
                  {dansal.organizerName}
                </h2>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              data-ocid="dansal_detail.close_button"
              aria-label="Close"
              className="p-1.5 rounded-full hover:bg-muted transition-smooth flex-shrink-0"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          {/* Rating summary */}
          {avgRating > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <StarDisplay rating={avgRating} />
              <span className="text-xs text-muted-foreground">
                {avgRating.toFixed(1)} · {reviews.length} reviews
              </span>
            </div>
          )}
          {/* Tabs */}
          <div className="flex gap-1 mt-2" data-ocid="dansal_detail.tab_row">
            {(["details", "comments", "reviews"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                data-ocid={`dansal_detail.tab.${t}`}
                className={[
                  "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-smooth",
                  activeTab === t
                    ? "bg-amber-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-amber-50",
                ].join(" ")}
              >
                {t === "details" && "විස්තර"}
                {t === "comments" && (
                  <span className="inline-flex items-center gap-1 justify-center">
                    <MessageCircle className="h-3 w-3" />
                    Comments
                  </span>
                )}
                {t === "reviews" && (
                  <span className="inline-flex items-center gap-1 justify-center">
                    <Star className="h-3 w-3" />
                    Reviews
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {/* ── Details Tab ── */}
          {activeTab === "details" && (
            <div className="p-4 space-y-4">
              {/* Food types */}
              <div className="flex flex-wrap gap-1.5">
                {dansal.foodTypes.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-medium"
                  >
                    <UtensilsCrossed className="h-3 w-3" />
                    {f}
                  </span>
                ))}
              </div>
              {/* Info rows */}
              <div className="space-y-2.5 text-sm">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">
                    {dansal.date}{" "}
                    <span className="text-muted-foreground">at</span>{" "}
                    {dansal.time}
                  </span>
                </div>
                {(dansal.province || dansal.district) && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">
                      {[dansal.district, dansal.province]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {dansal.contactPhone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <a
                        href={`tel:${dansal.contactPhone}`}
                        className="text-foreground hover:text-amber-600 transition-smooth font-medium"
                      >
                        {dansal.contactPhone}
                      </a>
                      {dansal.contactName && (
                        <span className="text-muted-foreground ml-1 text-xs">
                          — {dansal.contactName}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {dansal.locationLink && (
                  <div className="space-y-2">
                    {/* Static map preview only when valid non-zero coords exist */}
                    {dansal.latitude !== 0 && dansal.longitude !== 0 ? (
                      <div className="rounded-xl overflow-hidden border border-amber-200/40 bg-amber-50 relative">
                        <img
                          src={`https://staticmap.openstreetmap.de/staticmap.php?center=${dansal.latitude},${dansal.longitude}&zoom=15&size=300x140&markers=${dansal.latitude},${dansal.longitude},red`}
                          alt="ස්ථානය සිතියම / Location Map"
                          className="w-full h-36 object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute bottom-2 right-2">
                          <a
                            href={dansal.locationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-ocid="dansal_detail.maps_open_button"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md transition-smooth"
                          >
                            <MapIcon className="h-3.5 w-3.5" />
                            සිතියම බලන්න
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-200/40 bg-amber-50/60 px-3 py-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-amber-400 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          ස්ථාන තොරතුරු නොමැත
                        </span>
                      </div>
                    )}
                    {/* Maps link row */}
                    <div className="flex items-center gap-2">
                      <a
                        href={dansal.locationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-ocid="dansal_detail.maps_link"
                        className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-smooth"
                      >
                        <MapPin className="h-4 w-4" />
                        Google Maps හි බලන්න
                        <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(dansal.locationLink)}
                        data-ocid="dansal_detail.copy_location_button"
                        aria-label="Copy location link"
                        className="p-2.5 rounded-xl border border-amber-200/60 text-amber-600 hover:bg-amber-50 transition-smooth flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                {!dansal.locationLink &&
                  (dansal.district || dansal.province) && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200/40 text-sm">
                        <MapPin className="h-4 w-4 text-amber-400 flex-shrink-0" />
                        <span className="text-foreground">
                          {[dansal.district, dansal.province]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            [dansal.district, dansal.province]
                              .filter(Boolean)
                              .join(", "),
                          )
                        }
                        aria-label="Copy location"
                        className="p-2.5 rounded-xl border border-amber-200/60 text-amber-600 hover:bg-amber-50 transition-smooth flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  )}
              </div>

              {/* ── Share Section ── */}
              <div
                className="mt-1 pt-4 border-t border-amber-100/60"
                data-ocid="dansal_detail.share_section"
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <Share2 className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-foreground">
                    Share කරන්න
                  </span>
                </div>
                <div className="flex gap-2">
                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(buildWhatsAppMessage())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="dansal_detail.share_whatsapp_button"
                    className="flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C7E] text-sm font-semibold hover:bg-[#25D366]/20 transition-smooth active:scale-[0.97]"
                  >
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </a>
                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(buildShareUrl())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="dansal_detail.share_facebook_button"
                    className="flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/30 text-[#1877F2] text-sm font-semibold hover:bg-[#1877F2]/20 transition-smooth active:scale-[0.97]"
                  >
                    <Globe className="h-4 w-4" />
                    Facebook
                  </a>
                  {/* Copy Link */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    data-ocid="dansal_detail.share_copy_button"
                    aria-label="ලින්ක් copy කරන්න"
                    className="flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-smooth active:scale-[0.97]"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                </div>
                {/* Copy toast */}
                {copyToast && (
                  <div
                    data-ocid="dansal_detail.copy_link_toast"
                    className="mt-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold animate-fade-in"
                  >
                    ✓ ලින්ක් එක copy වුණා!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Comments Tab ── */}
          {activeTab === "comments" && (
            <div className="p-4 space-y-4">
              {/* Comments list */}
              <div
                className="space-y-3"
                data-ocid="dansal_detail.comments_list"
              >
                {commentsQuery.isLoading && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Loading...
                  </p>
                )}
                {!commentsQuery.isLoading && comments.length === 0 && (
                  <div
                    data-ocid="dansal_detail.comments_empty_state"
                    className="text-center py-6"
                  >
                    <MessageCircle className="h-8 w-8 text-amber-200 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Comments නොමැත
                    </p>
                  </div>
                )}
                {comments.map((c) => (
                  <CommentItem
                    key={String(c.id)}
                    comment={c}
                    isOwn={
                      !!principal && c.authorPrincipal?.toString() === principal
                    }
                    onDelete={() =>
                      deleteComment.mutate({
                        id: c.id,
                        dansalId: dansal.id,
                      })
                    }
                  />
                ))}
              </div>

              {/* Add comment form */}
              {isAuthenticated ? (
                <form
                  onSubmit={handleAddComment}
                  className="pt-3 border-t border-amber-200/40 space-y-2"
                  data-ocid="dansal_detail.add_comment_form"
                >
                  <input
                    type="text"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    placeholder="ඔබේ නම / Your name"
                    data-ocid="dansal_detail.comment_name_input"
                    className={INPUT_CLS}
                  />
                  <div className="space-y-1">
                    <textarea
                      rows={2}
                      value={commentText}
                      onChange={(e) => {
                        setCommentText(e.target.value);
                        setCommentCharCount(e.target.value.length);
                      }}
                      placeholder="Comment ලියන්න... / Write a comment..."
                      maxLength={MAX_COMMENT_CHARS + 10}
                      data-ocid="dansal_detail.comment_input"
                      className={`${INPUT_CLS} resize-none`}
                    />
                    <span
                      className={`text-[10px] ${
                        commentCharCount > MAX_COMMENT_CHARS
                          ? "text-red-500 font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {commentCharCount}/{MAX_COMMENT_CHARS}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      addComment.isPending ||
                      commentCharCount > MAX_COMMENT_CHARS
                    }
                    data-ocid="dansal_detail.comment_submit_button"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-smooth disabled:opacity-60 active:scale-[0.98]"
                  >
                    {addComment.isPending ? "යගරනවා..." : "අදහස් යගරන්න"}
                  </button>
                  {commentError && (
                    <p
                      className="text-xs text-red-500 font-medium"
                      data-ocid="dansal_detail.comment_error_state"
                    >
                      ⚠ {commentError}
                    </p>
                  )}
                </form>
              ) : (
                <button
                  type="button"
                  onClick={onNeedLogin}
                  data-ocid="dansal_detail.comment_login_button"
                  className="w-full py-2.5 rounded-xl border border-amber-300/60 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-smooth"
                >
                  Comment කිරීමට login කරන්න
                </button>
              )}
            </div>
          )}

          {/* ── Reviews Tab ── */}
          {activeTab === "reviews" && (
            <div className="p-4 space-y-4">
              {/* Average */}
              {avgRating > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200/40">
                  <span className="text-2xl font-bold text-amber-700">
                    {avgRating.toFixed(1)}
                  </span>
                  <div>
                    <StarDisplay rating={avgRating} />
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )}

              {/* Reviews list */}
              <div className="space-y-3" data-ocid="dansal_detail.reviews_list">
                {reviewsQuery.isLoading && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Loading...
                  </p>
                )}
                {!reviewsQuery.isLoading && reviews.length === 0 && (
                  <div
                    data-ocid="dansal_detail.reviews_empty_state"
                    className="text-center py-6"
                  >
                    <Star className="h-8 w-8 text-amber-200 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Reviews නොමැත
                    </p>
                  </div>
                )}
                {reviews.map((r) => (
                  <ReviewItem
                    key={String(r.id)}
                    review={r}
                    isOwn={
                      !!principal &&
                      r.reviewerPrincipal?.toString() === principal
                    }
                    onDelete={() =>
                      deleteReview.mutate({
                        id: r.id,
                        dansalId: dansal.id,
                      })
                    }
                  />
                ))}
              </div>

              {/* Add review form */}
              {isAuthenticated ? (
                <form
                  onSubmit={handleAddReview}
                  className="pt-3 border-t border-amber-200/40 space-y-3"
                  data-ocid="dansal_detail.add_review_form"
                >
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="ඔබේ නම / Your name"
                    data-ocid="dansal_detail.review_name_input"
                    className={INPUT_CLS}
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">
                      ශ්‍රේණිය / Rating
                    </p>
                    <StarPicker
                      value={reviewRating}
                      onChange={setReviewRating}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="ඔබේ review ලිවියා... / Write your review..."
                    data-ocid="dansal_detail.review_textarea"
                    className={`${INPUT_CLS} resize-none`}
                  />
                  {reviewError && (
                    <p
                      className="text-xs text-red-500 font-medium"
                      data-ocid="dansal_detail.review_error_state"
                    >
                      ⚠ {reviewError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={addReview.isPending}
                    data-ocid="dansal_detail.review_submit_button"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-smooth disabled:opacity-60"
                  >
                    {addReview.isPending ? "ථැත෎න්නවා..." : "Review යගරන්න"}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={onNeedLogin}
                  data-ocid="dansal_detail.review_login_button"
                  className="w-full py-2.5 rounded-xl border border-amber-300/60 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-smooth"
                >
                  Review කිරීමට login කරන්න
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
