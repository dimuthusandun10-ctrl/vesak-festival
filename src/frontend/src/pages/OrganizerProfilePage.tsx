import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useGetOrganizerProfile } from "@/hooks/useAdminData";
import type { OrganizerPublicProfile } from "@/types";
import { Eye, Heart, Star, ThumbsUp, UtensilsCrossed } from "lucide-react";

function StarDisplay({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={[
            "h-5 w-5",
            s <= rounded
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
          ].join(" ")}
        />
      ))}
    </span>
  );
}

function ProfileStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-4 px-2">
      <div className="text-amber-500">{icon}</div>
      <span className="font-bold text-xl text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function ProfileCard({ profile }: { profile: OrganizerPublicProfile }) {
  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="px-4 py-4 space-y-5" data-ocid="organizer_profile.card">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-300/60 flex items-center justify-center shadow-md">
          <span className="font-display font-bold text-amber-700 text-2xl">
            {initials}
          </span>
        </div>
        <div className="text-center">
          <h2 className="font-display font-bold text-foreground text-xl">
            {profile.name}
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {String(profile.principal).slice(0, 20)}…
          </p>
        </div>
        {/* Rating */}
        {profile.avgRating > 0 && (
          <div className="flex flex-col items-center gap-1">
            <StarDisplay rating={profile.avgRating} />
            <span className="text-xs text-muted-foreground">
              {profile.avgRating.toFixed(1)} average rating
            </span>
          </div>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <div
          className="bg-amber-50/60 rounded-2xl border border-amber-200/40 px-4 py-3"
          data-ocid="organizer_profile.bio"
        >
          <p className="text-sm font-semibold text-amber-700 mb-1">Bio</p>
          <p className="text-sm text-foreground leading-relaxed">
            {profile.bio}
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div
        className="grid grid-cols-4 divide-x divide-amber-200/30 bg-card rounded-2xl border border-amber-200/40 overflow-hidden"
        data-ocid="organizer_profile.stats"
        style={{ boxShadow: "0 2px 8px rgba(180,120,0,0.06)" }}
      >
        <ProfileStat
          icon={<UtensilsCrossed className="h-5 w-5" />}
          label="Dansals"
          value={String(profile.totalDansals)}
        />
        <ProfileStat
          icon={<Eye className="h-5 w-5" />}
          label="Views"
          value={String(profile.totalViews)}
        />
        <ProfileStat
          icon={<ThumbsUp className="h-5 w-5" />}
          label="Likes"
          value={String(profile.totalLikes)}
        />
        <ProfileStat
          icon={<Star className="h-5 w-5" />}
          label="Rating"
          value={profile.avgRating > 0 ? profile.avgRating.toFixed(1) : "–"}
        />
      </div>

      {/* Empty bio note */}
      {!profile.bio && (
        <div
          className="text-center py-4 bg-muted/30 rounded-2xl border border-dashed border-amber-200/40"
          data-ocid="organizer_profile.bio_empty_state"
        >
          <Heart className="h-6 w-6 text-amber-200 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Bio හදන ලද නොමැත</p>
        </div>
      )}
    </div>
  );
}

interface OrganizerProfilePageProps {
  organizerPrincipal: string;
  onBack: () => void;
}

export function OrganizerProfilePage({
  organizerPrincipal,
  onBack,
}: OrganizerProfilePageProps) {
  const { data: profile, isLoading } =
    useGetOrganizerProfile(organizerPrincipal);

  return (
    <div data-ocid="organizer_profile.page">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 py-3 border-b border-amber-200/40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-muted transition-smooth text-muted-foreground hover:text-foreground"
            aria-label="Back"
            data-ocid="organizer_profile.back_button"
          >
            ←
          </button>
          <h2 className="font-display font-bold text-foreground">
            Organizer Profile
          </h2>
        </div>
      </div>

      <div className="pb-28">
        {isLoading ? (
          <div className="py-16" data-ocid="organizer_profile.loading_state">
            <LoadingSpinner />
          </div>
        ) : !profile ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3 px-6"
            data-ocid="organizer_profile.empty_state"
          >
            <span className="text-4xl">🪷</span>
            <p className="text-sm font-semibold text-foreground">
              Profile හොයාගන්න නොහැකි
            </p>
            <p className="text-xs text-muted-foreground text-center">
              මෙම organizer ලියාපදිංචි වී නොමැත
            </p>
          </div>
        ) : (
          <ProfileCard profile={profile} />
        )}
      </div>
    </div>
  );
}
