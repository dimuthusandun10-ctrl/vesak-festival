import { ExternalBlob, type GalleryPhoto } from "@/backend";
import { GalleryPhotoDetailSheet } from "@/components/GalleryPhotoDetailSheet";
import { AppreciateButton } from "@/components/ui/AppreciateButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  useAddGalleryPhoto,
  useAppreciatePhoto,
  useGetGalleryPhotos,
} from "@/hooks/useVesakData";
import { Camera, ImagePlus, Sparkles, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

function UploadPhotoModal({ onClose }: { onClose: () => void }) {
  const addPhoto = useAddGalleryPhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ uploaderName: "", caption: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Please select a photo first");
      return;
    }
    if (!form.uploaderName.trim()) {
      setError("Your name is required");
      return;
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((p) =>
        setUploadProgress(Math.round(p)),
      );
      await addPhoto.mutateAsync({
        uploaderName: form.uploaderName,
        caption: form.caption,
        image: blob,
      });
      onClose();
    } catch {
      setError("Upload failed. Please try again.");
    }
  }

  return (
    <div
      className="w-full max-w-lg mx-auto bg-card rounded-t-3xl max-h-[92dvh] overflow-y-auto shadow-2xl"
      data-ocid="upload_photo.dialog"
    >
      <div className="w-full max-w-lg mx-auto bg-card rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Modal header */}
        <div className="sticky top-0 bg-card border-b border-amber-200/40 px-4 py-3.5 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-amber-100">
              <Camera className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="font-display font-bold text-foreground">
              Share Your Lantern
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-ocid="upload_photo.close_button"
            aria-label="Close"
            className="p-1.5 rounded-full hover:bg-muted transition-smooth"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4">
          {/* Photo selection */}
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden border border-amber-200/40">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-56 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                }}
                data-ocid="upload_photo.remove_image_button"
                className="absolute top-2.5 right-2.5 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-smooth"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2.5 left-2.5 bg-black/40 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                Photo selected ✓
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                Add Photo
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  data-ocid="upload_photo.camera_button"
                  className="flex flex-col items-center gap-2.5 p-6 rounded-2xl border-2 border-dashed border-amber-300/70 bg-amber-50/60 hover:bg-amber-100/70 active:scale-95 transition-smooth"
                >
                  <div className="p-2 bg-amber-200/60 rounded-full">
                    <Camera className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-amber-700">
                      Take Photo
                    </p>
                    <p className="text-[10px] text-amber-500 mt-0.5">
                      Use camera
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  data-ocid="upload_photo.upload_button"
                  className="flex flex-col items-center gap-2.5 p-6 rounded-2xl border-2 border-dashed border-amber-300/70 bg-amber-50/60 hover:bg-amber-100/70 active:scale-95 transition-smooth"
                >
                  <div className="p-2 bg-amber-200/60 rounded-full">
                    <ImagePlus className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-amber-700">
                      From Gallery
                    </p>
                    <p className="text-[10px] text-amber-500 mt-0.5">
                      Pick image
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Name field */}
          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold text-foreground uppercase tracking-wide"
              htmlFor="uploaderName"
            >
              Your Name
            </label>
            <input
              id="uploaderName"
              type="text"
              value={form.uploaderName}
              onChange={(e) =>
                setForm((p) => ({ ...p, uploaderName: e.target.value }))
              }
              placeholder="e.g., Nimal Perera"
              data-ocid="upload_photo.name_input"
              className="w-full px-3.5 py-3 rounded-xl bg-background border border-amber-200/60 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/70 transition-smooth"
            />
          </div>

          {/* Caption field */}
          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold text-foreground uppercase tracking-wide"
              htmlFor="caption"
            >
              Caption{" "}
              <span className="text-muted-foreground font-normal normal-case">
                (optional)
              </span>
            </label>
            <textarea
              id="caption"
              value={form.caption}
              onChange={(e) =>
                setForm((p) => ({ ...p, caption: e.target.value }))
              }
              placeholder="Share the story behind your lantern..."
              rows={2}
              data-ocid="upload_photo.caption_textarea"
              className="w-full px-3.5 py-3 rounded-xl bg-background border border-amber-200/60 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/70 transition-smooth resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p
              className="text-xs text-red-500 font-medium flex items-center gap-1"
              data-ocid="upload_photo.error_state"
            >
              <X className="h-3.5 w-3.5" />
              {error}
            </p>
          )}

          {/* Upload progress */}
          {addPhoto.isPending && uploadProgress > 0 && (
            <div className="space-y-1.5" data-ocid="upload_photo.loading_state">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span className="font-semibold text-amber-600">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-amber-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={addPhoto.isPending}
            data-ocid="upload_photo.submit_button"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm transition-smooth disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] shadow-sm"
          >
            {addPhoto.isPending ? "Uploading..." : "Share Lantern 🏮"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Photo Card ──────────────────────────────────
function PhotoCard({
  photo,
  index,
  formatDate,
  onAppreciate,
  onClick,
}: {
  photo: GalleryPhoto;
  index: number;
  formatDate: (ns: bigint) => string;
  onAppreciate: () => void;
  onClick: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  return (
    <div
      data-ocid={`gallery.item.${index}`}
      className="bg-card rounded-2xl overflow-hidden"
      style={{
        boxShadow:
          "0 2px 10px rgba(180,100,0,0.08), 0 0 0 1px rgba(251,191,36,0.12)",
      }}
    >
      {/* Clickable photo area */}
      <button
        type="button"
        onClick={onClick}
        aria-label={`\u0da2\u0dcf\u0dba\u0dcf\u0dbb\u0dd6\u0db4\u0dba \u0db6\u0dbd\u0db1\u0dca\u0db1: ${photo.uploaderName}`}
        className="w-full aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 relative block active:scale-[0.98] transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        {!imgLoaded && (
          <div className="absolute inset-0 bg-amber-50 animate-pulse" />
        )}
        <img
          src={photo.image.getDirectURL()}
          alt={photo.caption || `Vesak lantern by ${photo.uploaderName}`}
          className={[
            "w-full h-full object-cover transition-all duration-500 hover:scale-105",
            imgLoaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
        />
      </button>

      {/* Card content */}
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left p-2.5 space-y-1.5 hover:bg-amber-50/30 transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        aria-label={`\u0dc0ි\u0dc3්තර \u0db6ලන්න: ${photo.uploaderName}`}
      >
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] text-white font-bold">
              {photo.uploaderName.charAt(0).toUpperCase()}
            </span>
          </div>
          <p className="text-xs font-semibold text-foreground truncate min-w-0">
            {photo.uploaderName}
          </p>
        </div>
        {photo.caption && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {photo.caption}
          </p>
        )}
      </button>

      {/* Appreciate footer (outside clickable area) */}
      <div className="px-2.5 pb-2.5 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {formatDate(photo.uploadedAt)}
        </span>
        <AppreciateButton
          count={photo.appreciationCount}
          onAppreciate={onAppreciate}
          data-ocid={`gallery.appreciate_button.${index}`}
        />
      </div>
    </div>
  );
}

export function GalleryPage() {
  const { data: photos, isLoading } = useGetGalleryPhotos();
  const appreciatePhoto = useAppreciatePhoto();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  const formatDate = (nanoseconds: bigint) => {
    const ms = Number(nanoseconds) / 1_000_000;
    const d = new Date(ms);
    return d.toLocaleDateString("en-LK", { month: "short", day: "numeric" });
  };

  return (
    <div className="relative min-h-screen">
      {showUpload && <UploadPhotoModal onClose={() => setShowUpload(false)} />}
      {selectedPhoto && (
        <GalleryPhotoDetailSheet
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      {/* Festive gallery header */}
      <div className="relative overflow-hidden">
        <div className="w-full h-36 bg-gradient-to-br from-amber-800 to-orange-700" />
        <img
          src="/assets/generated/gallery-header-lanterns.dim_800x300.jpg"
          alt=""
          className="absolute inset-0 w-full h-36 object-cover object-center"
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 via-amber-800/10 to-background/90" />
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span className="text-[11px] font-semibold text-amber-200 uppercase tracking-widest">
              Vesak 2026
            </span>
            <Sparkles className="h-4 w-4 text-amber-300" />
          </div>
          <h1
            className="font-display font-bold text-white text-2xl drop-shadow-lg text-center leading-tight"
            data-ocid="gallery.page"
          >
            ලාම්පු ගැලරියාව
          </h1>
          <p className="text-amber-100 text-xs mt-1 drop-shadow">
            Vesak Lantern Gallery
          </p>
        </div>
      </div>

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between border-b border-amber-200/40">
        <div>
          <p className="text-xs text-muted-foreground">
            {isLoading ? (
              "ජායාරූප ලබාගනිමින්..."
            ) : (
              <span>
                <span className="font-semibold text-foreground">
                  {photos?.length ?? 0}
                </span>{" "}
                {(photos?.length ?? 0) === 1 ? "ජායාරූපය" : "ජායාරූප"} shared
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          data-ocid="gallery.upload_button"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-smooth active:scale-95 shadow-sm"
        >
          <Camera className="h-4 w-4" />
          <span>යක්කන්න</span>
        </button>
      </div>

      {/* Content area */}
      <div className="px-3 py-4 pb-24">
        {isLoading ? (
          <div data-ocid="gallery.loading_state">
            <LoadingSpinner />
            <p className="text-center text-xs text-muted-foreground -mt-4">
              ලාම්පු කුඩුඵ ලබාගනිමින්...
            </p>
          </div>
        ) : photos?.length === 0 ? (
          /* Empty state */
          <div
            data-ocid="gallery.empty_state"
            className="flex flex-col items-center text-center py-16 px-4"
          >
            <div className="relative mb-5">
              <div className="h-24 w-24 rounded-full bg-amber-100/80 flex items-center justify-center">
                <span className="text-5xl">🏮</span>
              </div>
              <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-xl">✨</span>
              </div>
            </div>
            <h3 className="font-display font-bold text-foreground text-lg mb-2">
              ගැලරියාවේ ජායාරූප නැත!
            </h3>
            <p className="text-sm text-muted-foreground mb-1 max-w-xs">
              පලමුවේන ඔබේ සුන්දර වේසක් ලාම්පුව සමුදාය සහ share කරන්න.
            </p>
            <p className="text-xs text-amber-500 mb-6 font-medium">
              ලාම්පු කුඩුඵ් ඤැලළ් කරන්න 🌟
            </p>
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              data-ocid="gallery.empty_upload_button"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm hover:from-amber-600 hover:to-orange-600 transition-smooth active:scale-95 shadow-md"
            >
              <Upload className="h-4 w-4" />
              පලමුවේන ලාම්පුව යක්කන්න
            </button>
          </div>
        ) : (
          /* Photo grid */
          <div
            className="grid grid-cols-2 gap-3"
            data-ocid="gallery.list"
            style={{ contain: "layout" }}
          >
            {photos?.map((photo, i) => (
              <PhotoCard
                key={String(photo.id)}
                photo={photo}
                index={i + 1}
                formatDate={formatDate}
                onAppreciate={() => appreciatePhoto.mutate(photo.id)}
                onClick={() => setSelectedPhoto(photo)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
