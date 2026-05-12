import type { PhotoComment } from "@/backend";
import type { GalleryPhoto } from "@/backend";
import { useAuth } from "@/hooks/useAuth";
import {
  useAddPhotoComment,
  useAppreciatePhoto,
  useDeletePhotoComment,
  useGetPhotoComments,
  useTogglePhotoLike,
} from "@/hooks/useVesakData";
import { Principal } from "@icp-sdk/core/principal";
import {
  Camera,
  Heart,
  MessageCircle,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

const EMOJI_REACTIONS = [
  { emoji: "🙏", label: "ස්තූතිය" },
  { emoji: "❤️", label: "ප්‍රේමය" },
  { emoji: "✨", label: "දීප්තිය" },
  { emoji: "🏮", label: "ලාම්පුව" },
  { emoji: "😍", label: "ඇදහිලිවන්ත" },
];

const INPUT_CLS =
  "w-full px-3 py-2.5 rounded-xl bg-background border border-amber-200/60 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/60";

// ── Photo Comment Item ───────────────────────────
function PhotoCommentItem({
  comment,
  isOwn,
  onDelete,
}: {
  comment: PhotoComment;
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
          data-ocid="gallery_photo_detail.comment.delete_button"
          className="p-1 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-smooth flex-shrink-0 self-start mt-0.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

interface GalleryPhotoDetailSheetProps {
  photo: GalleryPhoto;
  onClose: () => void;
}

export function GalleryPhotoDetailSheet({
  photo,
  onClose,
}: GalleryPhotoDetailSheetProps) {
  const { principal } = useAuth();
  const appreciatePhoto = useAppreciatePhoto();
  const toggleLike = useTogglePhotoLike();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<"photo" | "comments">("photo");

  // Comment hooks
  const commentsQuery = useGetPhotoComments(
    activeTab === "comments" ? photo.id : null,
  );
  const addComment = useAddPhotoComment();
  const deleteComment = useDeletePhotoComment();

  // Comment form state
  const MAX_COMMENT_CHARS = 500;
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const uploadedAtMs = Number(photo.uploadedAt) / 1_000_000;
  const uploadedDate = new Date(uploadedAtMs).toLocaleDateString("si-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const uploadedTime = new Date(uploadedAtMs).toLocaleTimeString("si-LK", {
    hour: "2-digit",
    minute: "2-digit",
  });

  function handleReact(emoji: string) {
    setReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }));
  }

  function handleLike() {
    if (!liked) {
      setLiked(true);
      toggleLike.mutate(photo.id);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    setCommentError("");
    if (!commentName.trim() || !commentText.trim()) {
      setCommentError("නම සහ අදහස ලිළියා යුතුය.");
      return;
    }
    if (commentText.trim().length > MAX_COMMENT_CHARS) {
      setCommentError(`අදහස් ${MAX_COMMENT_CHARS} ක් ඇකමළියා නෝහැක.`);
      return;
    }
    try {
      await addComment.mutateAsync({
        photoId: photo.id,
        authorName: commentName.trim(),
        text: commentText.trim(),
      });
      setCommentName("");
      setCommentText("");
      formRef.current?.reset();
    } catch {
      setCommentError("අදහස් එකතු කිරීමේ දෝෂයකි. නැවත උත්සාහ කරන්න.");
    }
  }

  // Determine own comments via principal
  function isOwnComment(c: PhotoComment) {
    if (!principal) return false;
    const authorP =
      c.authorPrincipal instanceof Principal
        ? c.authorPrincipal.toText()
        : String(c.authorPrincipal ?? "");
    return authorP === principal;
  }

  const comments = commentsQuery.data ?? [];
  const commentCount = comments.length;

  const likeCount = photo.likedBy.length + (liked ? 1 : 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end"
      data-ocid="gallery_photo_detail.dialog"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyUp={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="w-full max-w-lg mx-auto bg-card rounded-t-3xl max-h-[94vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-amber-200/40 px-4 py-3 rounded-t-3xl flex-shrink-0 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {photo.uploaderName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-foreground text-sm truncate">
                {photo.uploaderName}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {uploadedDate} · {uploadedTime}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-ocid="gallery_photo_detail.close_button"
            aria-label="Close"
            className="p-1.5 rounded-full hover:bg-muted transition-smooth flex-shrink-0"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-amber-200/40 bg-card flex-shrink-0 px-4">
          <button
            type="button"
            data-ocid="gallery_photo_detail.photo_tab"
            onClick={() => setActiveTab("photo")}
            className={[
              "flex-1 py-2.5 text-sm font-semibold transition-smooth border-b-2",
              activeTab === "photo"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            📷 ඡායාරූපය
          </button>
          <button
            type="button"
            data-ocid="gallery_photo_detail.comments_tab"
            onClick={() => setActiveTab("comments")}
            className={[
              "flex-1 py-2.5 text-sm font-semibold transition-smooth border-b-2 flex items-center justify-center gap-1.5",
              activeTab === "comments"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <MessageCircle className="h-4 w-4" />
            <span>අදහස්</span>
            {commentCount > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {commentCount}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {activeTab === "photo" && (
            <>
              {/* Photo */}
              <div
                className="w-full bg-amber-50 relative"
                style={{ aspectRatio: "4/3" }}
              >
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-amber-50">
                    <Camera className="h-8 w-8 text-amber-200 animate-pulse" />
                  </div>
                )}
                <img
                  src={photo.image.getDirectURL()}
                  alt={
                    photo.caption || `Vesak lantern by ${photo.uploaderName}`
                  }
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImageLoaded(true)}
                  className={[
                    "w-full h-full object-cover transition-opacity duration-500",
                    imageLoaded ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                />
              </div>

              <div className="p-4 space-y-4">
                {/* Caption */}
                {photo.caption && (
                  <p className="text-sm text-foreground leading-relaxed">
                    {photo.caption}
                  </p>
                )}

                {/* Appreciate + Like row */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => appreciatePhoto.mutate(photo.id)}
                    data-ocid="gallery_photo_detail.appreciate_button"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold transition-smooth active:scale-95 shadow-sm flex-1 justify-center"
                  >
                    <Heart className="h-4 w-4" />
                    <span>ස්තූති කරන්න</span>
                    {photo.appreciationCount > 0n && (
                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                        {String(photo.appreciationCount)}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleLike}
                    disabled={liked}
                    data-ocid="gallery_photo_detail.like_button"
                    aria-label="Like photo"
                    className={[
                      "flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-smooth active:scale-95 flex-1 justify-center",
                      liked
                        ? "bg-blue-50 border-blue-300 text-blue-600"
                        : "border-amber-200/60 text-muted-foreground hover:border-amber-400 hover:text-amber-600",
                    ].join(" ")}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{liked ? "Like කළා ✓" : "Like"}</span>
                    {likeCount > 0 && (
                      <span className="text-xs">{likeCount}</span>
                    )}
                  </button>
                </div>

                {/* Emoji Reactions */}
                <div className="pt-1">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                    ප්‍රතිචාර
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {EMOJI_REACTIONS.map((r) => (
                      <button
                        key={r.emoji}
                        type="button"
                        onClick={() => handleReact(r.emoji)}
                        data-ocid={`gallery_photo_detail.reaction.${r.label}`}
                        title={r.label}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-amber-200/60 bg-amber-50/60 hover:bg-amber-100 active:scale-95 transition-smooth text-sm"
                      >
                        <span>{r.emoji}</span>
                        {reactions[r.emoji] ? (
                          <span className="text-xs font-semibold text-amber-700">
                            {reactions[r.emoji]}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload info */}
                <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/30">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {photo.uploaderName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {photo.uploaderName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {uploadedDate} · {uploadedTime}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                {photo.status !== "approved" && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-50 border border-yellow-200">
                    <span className="text-yellow-600 text-xs font-semibold">
                      ⏳ Admin අනුමත කිරීමට ඇත
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "comments" && (
            <div className="p-4 space-y-5">
              {/* Comments list */}
              {commentsQuery.isLoading ? (
                <div
                  data-ocid="gallery_photo_detail.comments.loading_state"
                  className="flex flex-col gap-3"
                >
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex gap-2.5 animate-pulse">
                      <div className="h-7 w-7 rounded-full bg-amber-100 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-24 bg-amber-100 rounded" />
                        <div className="h-3 w-full bg-amber-50 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div
                  data-ocid="gallery_photo_detail.comments.empty_state"
                  className="flex flex-col items-center justify-center py-10 gap-2 text-center"
                >
                  <MessageCircle className="h-10 w-10 text-amber-200" />
                  <p className="text-sm font-semibold text-foreground">
                    තවමත් අදහස් නැත
                  </p>
                  <p className="text-xs text-muted-foreground">
                    පළමු අදහස ඔබ විසින් ලියන්න!
                  </p>
                </div>
              ) : (
                <div
                  className="flex flex-col gap-4"
                  data-ocid="gallery_photo_detail.comments.list"
                >
                  {comments.map((c) => (
                    <PhotoCommentItem
                      key={String(c.id)}
                      comment={c}
                      isOwn={isOwnComment(c)}
                      onDelete={() =>
                        deleteComment.mutate({ id: c.id, photoId: photo.id })
                      }
                    />
                  ))}
                </div>
              )}

              {/* Add comment form */}
              <div className="border-t border-amber-200/30 pt-4">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
                  අදහස් එකතු කරන්න
                </p>
                <form
                  ref={formRef}
                  onSubmit={handleAddComment}
                  className="space-y-3"
                  data-ocid="gallery_photo_detail.comment_form"
                >
                  <div>
                    <label
                      htmlFor="photo-comment-author"
                      className="block text-xs font-medium text-foreground mb-1"
                    >
                      ඔබගේ නම
                    </label>
                    <input
                      id="photo-comment-author"
                      type="text"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="ඔබගේ නම"
                      maxLength={80}
                      data-ocid="gallery_photo_detail.comment_name.input"
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="photo-comment-text"
                      className="block text-xs font-medium text-foreground mb-1"
                    >
                      <span>අදහස්</span>
                      <span className="text-muted-foreground ml-1 font-normal">
                        ({commentText.length}/{MAX_COMMENT_CHARS})
                      </span>
                    </label>
                    <textarea
                      id="photo-comment-text"
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="අදහස් ලියන්න..."
                      maxLength={MAX_COMMENT_CHARS}
                      data-ocid="gallery_photo_detail.comment_text.textarea"
                      className={`${INPUT_CLS} resize-none`}
                    />
                  </div>
                  {commentError && (
                    <p
                      className="text-xs text-red-500"
                      data-ocid="gallery_photo_detail.comment.error_state"
                    >
                      {commentError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={addComment.isPending}
                    data-ocid="gallery_photo_detail.comment.submit_button"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold transition-smooth active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {addComment.isPending ? (
                      <>
                        <span
                          data-ocid="gallery_photo_detail.comment.loading_state"
                          className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                        />
                        <span>යොදවමින්...</span>
                      </>
                    ) : (
                      "එකතු කරන්න"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
