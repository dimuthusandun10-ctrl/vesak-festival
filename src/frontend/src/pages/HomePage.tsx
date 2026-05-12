import type { Dansal } from "@/backend";
import { AppreciateButton } from "@/components/ui/AppreciateButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  useAppreciateDansal,
  useAppreciatePhoto,
  useGetDansals,
  useGetGalleryPhotos,
} from "@/hooks/useVesakData";
import { FOOD_CATEGORIES, PROVINCES } from "@/lib/sri-lanka-data";
import type { TabId } from "@/types";
import {
  Camera,
  ChevronRight,
  Clock,
  Images,
  MapPin,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const VESAK_DATE = new Date("2026-05-12T00:00:00");

const SINHALA_DAYS: Record<number, string> = {
  0: "ඉරිදා",
  1: "සඳුදා",
  2: "අඟහරුවාදා",
  3: "බදාදා",
  4: "බ්‍රහස්පතින්දා",
  5: "සිකුරාදා",
  6: "සෙනසුරාදා",
};

const SINHALA_MONTHS: Record<number, string> = {
  0: "ජනවාරි",
  1: "පෙබරවාරි",
  2: "මාර්තු",
  3: "අප්‍රේල්",
  4: "මැයි",
  5: "ජූනි",
  6: "ජූලි",
  7: "අගෝස්තු",
  8: "සැප්තැම්බර්",
  9: "ඔක්තෝබර්",
  10: "නොවැම්බර්",
  11: "දෙසැම්බර්",
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft());

  function getTimeLeft() {
    const diff = VESAK_DATE.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }

  useEffect(() => {
    const id = setInterval(() => {
      const diff = VESAK_DATE.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

function useLiveDateTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function LiveDateBadge() {
  const now = useLiveDateTime();
  const dayName = SINHALA_DAYS[now.getDay()];
  const monthName = SINHALA_MONTHS[now.getMonth()];
  const dateStr = `${dayName}, ${now.getFullYear()} ${monthName} ${now.getDate()}`;
  return (
    <div
      data-ocid="home.live_date_badge"
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <Clock className="h-3 w-3 shrink-0" />
      <span>{dateStr}</span>
    </div>
  );
}

function CountdownTimer() {
  const { days, hours, minutes, seconds } = useCountdown();
  const units = [
    { label: "දින / Days", value: days },
    { label: "පැය / Hrs", value: hours },
    { label: "මිනි / Min", value: minutes },
    { label: "තත් / Sec", value: seconds },
  ];
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200/60">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-700">
          වෙසක් පොහෝ දිනට / Countdown to Vesak Poya
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {units.map((u) => (
          <div
            key={u.label}
            className="flex flex-col items-center bg-card rounded-xl py-2 shadow-subtle"
          >
            <span className="text-2xl font-display font-bold text-amber-600">
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5 text-center leading-tight px-1">
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Province Density Map ────────────────────────────────────────────────────

interface ProvinceDensityMapProps {
  dansals: Dansal[];
  activeCategory: string;
  onNavigate: (tab: TabId) => void;
}

function ProvinceDensityMap({
  dansals,
  activeCategory,
  onNavigate,
}: ProvinceDensityMapProps) {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  // Compute per-province stats filtered by active category
  const provinceStats = useMemo(() => {
    const filtered =
      activeCategory === "ALL"
        ? dansals
        : dansals.filter((d) =>
            d.foodTypes.some(
              (ft) => ft === activeCategory || d.category === activeCategory,
            ),
          );

    return PROVINCES.map((province) => {
      const provinceDansals = filtered.filter((d) => d.province === province);
      // Top category by frequency
      const catFreq: Record<string, number> = {};
      for (const d of provinceDansals) {
        catFreq[d.category] = (catFreq[d.category] ?? 0) + 1;
        for (const ft of d.foodTypes) {
          catFreq[ft] = (catFreq[ft] ?? 0) + 1;
        }
      }
      const topCategory =
        Object.entries(catFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        province,
        count: provinceDansals.length,
        topCategory,
        dansals: provinceDansals,
      };
    }).filter((p) => p.count > 0);
  }, [dansals, activeCategory]);

  const selectedData = selectedProvince
    ? provinceStats.find((p) => p.province === selectedProvince)
    : null;

  // short province label — Sinhala part before " / "
  function shortProvince(p: string) {
    return p.split(" / ")[0];
  }

  const maxCount = Math.max(1, ...provinceStats.map((p) => p.count));

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-amber-600" />
        <h3 className="font-display font-semibold text-foreground">
          පළාත් සිතියම / Province Map
        </h3>
      </div>

      {provinceStats.length === 0 ? (
        <div
          data-ocid="home.province_map_empty_state"
          className="rounded-2xl overflow-hidden border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 h-28 flex flex-col items-center justify-center gap-2"
        >
          <MapPin className="h-7 w-7 text-amber-300" />
          <p className="text-sm text-muted-foreground">
            Dansals ලියාපදිංඡි වීමේන් සිතියම පේන්වේයි
          </p>
        </div>
      ) : (
        <div
          data-ocid="home.province_map_section"
          className="rounded-2xl border border-amber-200/60 overflow-hidden bg-gradient-to-br from-amber-50/60 to-orange-50/60"
        >
          <div className="p-3 grid grid-cols-3 gap-2">
            {provinceStats.map((stat, idx) => {
              const intensity = stat.count / maxCount;
              const isSelected = selectedProvince === stat.province;
              return (
                <button
                  key={stat.province}
                  type="button"
                  data-ocid={`home.province_card.item.${idx + 1}`}
                  onClick={() =>
                    setSelectedProvince(isSelected ? null : stat.province)
                  }
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-smooth active:scale-95 ${
                    isSelected
                      ? "border-amber-500 bg-amber-100 shadow-md"
                      : "border-amber-200/60 hover:border-amber-400 bg-card/80"
                  }`}
                  style={{
                    boxShadow: isSelected
                      ? undefined
                      : `inset 0 0 0 ${Math.round(intensity * 3)}px oklch(0.82 0.14 85 / 0.35)`,
                  }}
                >
                  {/* Count bubble */}
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {stat.count}
                  </span>
                  <span className="text-[11px] font-semibold text-foreground leading-tight">
                    {shortProvince(stat.province)}
                  </span>
                  {stat.topCategory && (
                    <span className="text-[9px] text-muted-foreground leading-tight truncate w-full text-center">
                      {stat.topCategory.split(" / ")[0]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Expanded province dansal list */}
          {selectedData && (
            <div
              data-ocid="home.province_dansal_list"
              className="border-t border-amber-200/60 bg-card/90 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground">
                  {shortProvince(selectedData.province)} — {selectedData.count}{" "}
                  Dansals
                </p>
                <button
                  type="button"
                  data-ocid="home.province_list_close_button"
                  onClick={() => setSelectedProvince(null)}
                  className="text-muted-foreground hover:text-foreground transition-smooth"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {selectedData.dansals.slice(0, 8).map((d, i) => (
                  <div
                    key={String(d.id)}
                    data-ocid={`home.province_dansal_item.${i + 1}`}
                    className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {d.organizerName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {d.district.split(" / ")[0]} • {d.time}
                      </p>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 shrink-0">
                      {d.category.split(" / ")[0]}
                    </span>
                  </div>
                ))}
              </div>
              {selectedData.dansals.length > 8 && (
                <button
                  type="button"
                  data-ocid="home.province_view_all_button"
                  onClick={() => onNavigate("dansals")}
                  className="mt-2 w-full text-xs text-amber-600 font-medium flex items-center justify-center gap-1 hover:text-amber-700 transition-smooth"
                >
                  සියල්ල බලන්න / View all
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface HomePageProps {
  onNavigate: (tab: TabId) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { data: dansals, isLoading: dansalsLoading } = useGetDansals();
  const { data: photos, isLoading: photosLoading } = useGetGalleryPhotos();
  const appreciateDansal = useAppreciateDansal();
  const appreciatePhoto = useAppreciatePhoto();

  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const allDansals = dansals ?? [];
  const recentPhotos = (photos ?? []).slice(0, 4);

  // Category tabs: ALL + FOOD_CATEGORIES
  const categoryTabs = [
    { key: "ALL", label: "සියල්ල / All" },
    ...FOOD_CATEGORIES.map((c) => ({ key: c, label: c })),
  ];

  // Filter featured dansals by active category
  const filteredDansals = useMemo(() => {
    if (activeCategory === "ALL") return allDansals.slice(0, 6);
    return allDansals
      .filter(
        (d) =>
          d.category === activeCategory || d.foodTypes.includes(activeCategory),
      )
      .slice(0, 6);
  }, [allDansals, activeCategory]);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Hero banner with live date */}
      <div className="relative rounded-2xl overflow-hidden">
        <img
          src="/assets/images/vesak-hero.jpg"
          alt="Vesak Festival lanterns"
          className="w-full h-40 object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute top-3 left-4 right-14">
          <LiveDateBadge />
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <h2 className="text-white font-display font-bold text-xl leading-tight drop-shadow">
            Sri Lankan Vesak 2026
          </h2>
          <p className="text-white/80 text-xs mt-0.5">
            වේසක් පර්සක සමුදාය දැහුම / Vesak Community
          </p>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-amber-500/90 text-white text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
            <Sparkles className="h-3 w-3 inline mr-1" />
            LIVE
          </span>
        </div>
      </div>

      {/* Countdown */}
      <CountdownTimer />

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigate("dansals")}
          data-ocid="home.dansals_quick_button"
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200/60 hover:shadow-subtle transition-smooth active:scale-95"
        >
          <UtensilsCrossed className="h-6 w-6 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">
            දංසල සොයන්න
          </span>
          <span className="text-xs text-amber-600/70">
            {allDansals.length} registered
          </span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate("gallery")}
          data-ocid="home.gallery_quick_button"
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-orange-100 to-yellow-100 border border-orange-200/60 hover:shadow-subtle transition-smooth active:scale-95"
        >
          <Camera className="h-6 w-6 text-orange-600" />
          <span className="text-sm font-semibold text-orange-800">
            ලාම්පු කුඩුඵ ගැලරියාව
          </span>
          <span className="text-xs text-orange-600/70">ලාම්පු යක්කන්න</span>
        </button>
      </div>

      {/* Province density map */}
      <ProvinceDensityMap
        dansals={allDansals}
        activeCategory={activeCategory}
        onNavigate={onNavigate}
      />

      {/* Featured Dansals with category filter */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-foreground">
            විශේෂ දංසල / Featured
          </h3>
          <button
            type="button"
            onClick={() => onNavigate("dansals")}
            data-ocid="home.view_all_dansals_link"
            className="text-xs text-amber-600 font-medium hover:text-amber-700 transition-smooth"
          >
            සියල්ල →
          </button>
        </div>

        {/* Category filter tabs */}
        <div
          data-ocid="home.category_filter_tabs"
          className="category-tabs scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {categoryTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              data-ocid={`home.category_tab.${tab.key === "ALL" ? "all" : (tab.key.split(" / ")[1]?.toLowerCase().replace(/\s/g, "_") ?? "other")}`}
              onClick={() => setActiveCategory(tab.key)}
              className={`category-tab${
                activeCategory === tab.key ? " active" : ""
              }`}
            >
              {tab.key === "ALL" ? "සියල්ල / All" : tab.label.split(" / ")[0]}
            </button>
          ))}
        </div>

        {dansalsLoading ? (
          <LoadingSpinner />
        ) : filteredDansals.length === 0 ? (
          <div
            data-ocid="home.dansals_empty_state"
            className="text-center py-6 text-muted-foreground text-sm rounded-xl border border-dashed border-amber-200/60"
          >
            <UtensilsCrossed className="h-6 w-6 mx-auto mb-2 text-amber-300" />
            මේම ප්‍රවරගයේ දංසල නැත
            <p className="text-xs mt-0.5">No dansals in this category yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDansals.map((d, i) => (
              <div
                key={String(d.id)}
                data-ocid={`home.dansal_card.item.${i + 1}`}
                className="bg-card rounded-xl p-3 border border-amber-200/40 flex items-center justify-between gap-2 hover:border-amber-300 transition-smooth"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {d.organizerName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {d.district.split(" / ")[0]} •{" "}
                    {d.foodTypes
                      .slice(0, 2)
                      .map((f) => f.split(" / ")[0])
                      .join(", ")}
                  </p>
                  <p className="text-[10px] text-amber-600/80 mt-0.5">
                    {d.date} · {d.time}
                  </p>
                </div>
                <AppreciateButton
                  count={d.appreciationCount}
                  onAppreciate={() => appreciateDansal.mutate(d.id)}
                  data-ocid={`home.appreciate_dansal.${i + 1}`}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Gallery */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-1.5">
            <Images className="h-4 w-4 text-orange-500" />
            ලාම්පු කුඩුඵ ගැලරියාව / Lantern Gallery
          </h3>
          <button
            type="button"
            onClick={() => onNavigate("gallery")}
            data-ocid="home.view_all_gallery_link"
            className="text-xs text-orange-500 font-medium hover:text-orange-600 transition-smooth"
          >
            සියල්ල →
          </button>
        </div>
        {photosLoading ? (
          <LoadingSpinner />
        ) : recentPhotos.length === 0 ? (
          <div
            data-ocid="home.gallery_empty_state"
            className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 h-28 flex flex-col items-center justify-center gap-1.5"
          >
            <Camera className="h-7 w-7 text-amber-300" />
            <p className="text-xs text-muted-foreground">
              පලමුවේන ලාම්පු ජායාරූපය upload කරන්න!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {recentPhotos.map((photo, i) => (
              <div
                key={String(photo.id)}
                data-ocid={`home.gallery_photo.item.${i + 1}`}
                className="relative rounded-xl overflow-hidden border border-amber-200/40 bg-muted aspect-square"
              >
                <img
                  src={photo.image.getDirectURL()}
                  alt={
                    photo.caption || `Vesak lantern by ${photo.uploaderName}`
                  }
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2 flex items-end justify-between">
                  <p className="text-white text-[10px] font-medium truncate leading-tight max-w-[55%]">
                    {photo.caption || photo.uploaderName}
                  </p>
                  <AppreciateButton
                    count={photo.appreciationCount}
                    onAppreciate={() => appreciatePhoto.mutate(photo.id)}
                    data-ocid={`home.appreciate_photo.${i + 1}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
