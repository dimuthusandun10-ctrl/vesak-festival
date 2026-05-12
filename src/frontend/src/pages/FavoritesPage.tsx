import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetDansals,
  useGetMyFavorites,
  useToggleFavorite,
} from "@/hooks/useVesakData";
import { MapPin, Phone, Star, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

export function FavoritesPage() {
  const { isAuthenticated, principal, login } = useAuth();
  const { data: favoriteIds = [], isLoading: favLoading } =
    useGetMyFavorites(principal);
  const { data: allDansals = [], isLoading: dansalsLoading } = useGetDansals();
  const toggleFavorite = useToggleFavorite();

  const isLoading = favLoading || dansalsLoading;

  const favoriteDansals = allDansals.filter((d) =>
    favoriteIds.some((fid) => fid === d.id),
  );

  const handleUnfavorite = async (id: bigint) => {
    await toggleFavorite.mutateAsync(id);
    toast.success("Favorites ලැයිස්තුවෙන් ඉවත් කළා");
  };

  if (!isAuthenticated) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-5 p-6"
        data-ocid="favorites.unauthenticated_state"
      >
        <Star className="w-16 h-16 text-amber-400" />
        <div className="text-center">
          <h2 className="text-xl font-semibold font-display text-foreground mb-2">
            ⭐ ප්‍රියතම Dansals
          </h2>
          <p className="text-muted-foreground">
            ප්‍රියතම Dansals save කිරීමට login කරන්න.
          </p>
        </div>
        <Button
          type="button"
          className="btn-warm"
          onClick={login}
          data-ocid="favorites.login_button"
        >
          Login / ලොගින්
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-24" data-ocid="favorites.page">
      {/* Header */}
      <div className="bg-card border-b border-amber-200/60 px-4 py-4">
        <h1 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          ප්‍රියතම Dansals
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          ඔබ save කළ Dansals
        </p>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-4" data-ocid="favorites.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : favoriteDansals.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-4"
            data-ocid="favorites.empty_state"
          >
            <Star className="w-14 h-14 text-muted-foreground/30" />
            <p className="text-muted-foreground text-center">
              ඔබ තවම Dansals save කර නැත.
              <br />
              <span className="text-xs">Dansals page එකේ ⭐ button ඔබන්න.</span>
            </p>
          </div>
        ) : (
          <div className="space-y-4" data-ocid="favorites.list">
            {favoriteDansals.map((dansal, idx) => (
              <div
                key={String(dansal.id)}
                className="card-soft bg-card p-4 rounded-xl"
                data-ocid={`favorites.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <UtensilsCrossed className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <h3 className="font-semibold text-foreground truncate">
                        {dansal.organizerName}
                      </h3>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {dansal.province} · {dansal.district}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {dansal.contactPhone}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        🕐 {dansal.date} · {dansal.time}
                      </p>
                    </div>
                    {dansal.locationLink && (
                      <a
                        href={dansal.locationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline mt-2 inline-block"
                        data-ocid={`favorites.location_link.${idx + 1}`}
                      >
                        📍 Google Maps
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnfavorite(dansal.id)}
                    disabled={toggleFavorite.isPending}
                    className="p-2 rounded-full btn-favorite active flex-shrink-0"
                    aria-label="Remove from favorites"
                    data-ocid={`favorites.unfavorite_button.${idx + 1}`}
                  >
                    <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
