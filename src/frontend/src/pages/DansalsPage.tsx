import type { AddDansalRequest, Dansal, UpdateDansalRequest } from "@/backend";
import { DansalDetailSheet } from "@/components/DansalDetailSheet";
import {
  ApprovalStatusBadge,
  DansalLikeButton,
  DansalReportButton,
} from "@/components/DansalEngagement";
import { AppreciateButton } from "@/components/ui/AppreciateButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useGetMyProfile } from "@/hooks/useAdminData";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocationContext } from "@/hooks/useGeolocationContext";
import {
  useAddDansal,
  useAppreciateDansal,
  useDeleteDansal,
  useFilterDansals,
  useGetDansals,
  useGetMyDansals,
  useUpdateDansal,
} from "@/hooks/useVesakData";
import { calculateDistance, formatDistance } from "@/lib/geo";
import {
  DISTRICTS_BY_PROVINCE,
  FOOD_CATEGORIES,
  PROVINCES,
} from "@/lib/sri-lanka-data";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  Filter,
  LogIn,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Search,
  Share2,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const INPUT_CLS =
  "w-full px-3 py-2.5 rounded-xl bg-background border border-amber-200/60 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/60";
const LABEL_CLS =
  "text-xs font-semibold text-foreground uppercase tracking-wide";

// ─────────────────────────────────────────────
// AddDansalForm
// ─────────────────────────────────────────────
function AddDansalForm({ onClose }: { onClose: () => void }) {
  const addDansal = useAddDansal();
  const [form, setForm] = useState<AddDansalRequest>({
    organizerName: "",
    contactName: "",
    contactPhone: "",
    foodTypes: [],
    date: "",
    time: "",
    locationLink: "",
    latitude: 0,
    longitude: 0,
    province: "",
    district: "",
    category: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function toggleFood(food: string) {
    setForm((prev) => ({
      ...prev,
      foodTypes: prev.foodTypes.includes(food)
        ? prev.foodTypes.filter((f) => f !== food)
        : [...prev.foodTypes, food],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.organizerName.trim()) {
      setError("Organizer name is required");
      return;
    }
    if (form.foodTypes.length === 0) {
      setError("Select at least one food type");
      return;
    }
    if (!form.date || !form.time) {
      setError("Date and time are required");
      return;
    }
    try {
      await addDansal.mutateAsync(form);
      setSuccess(true);
      setTimeout(() => onClose(), 1600);
    } catch {
      setError("Failed to register. Please try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end"
      data-ocid="add_dansal.dialog"
    >
      <div className="w-full max-w-lg mx-auto bg-card rounded-t-3xl max-h-[92dvh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-amber-200/40 px-4 py-3 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-display font-bold text-foreground">
            දංසල ලියාපදිංජි කරන්න
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-ocid="add_dansal.close_button"
            aria-label="Close"
            className="p-1 rounded-full hover:bg-muted transition-smooth"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {success ? (
          <div
            className="flex flex-col items-center justify-center py-16 px-4 gap-3"
            data-ocid="add_dansal.success_state"
          >
            <div className="text-5xl animate-bounce">🏮</div>
            <h3 className="font-display font-bold text-foreground text-lg">
              දංසල ලියාපදිංජි විය!
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              ඔබේ දංසල ශේයාර කිරීමට ස්තුතියි.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
            <div className="space-y-1">
              <label className={LABEL_CLS} htmlFor="organizerName">
                Organizer / Temple Name *
              </label>
              <input
                id="organizerName"
                type="text"
                value={form.organizerName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, organizerName: e.target.value }))
                }
                placeholder="e.g., Gangaramaya Temple"
                data-ocid="add_dansal.organizer_input"
                className={INPUT_CLS}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={LABEL_CLS} htmlFor="contactName">
                  Contact Person
                </label>
                <input
                  id="contactName"
                  type="text"
                  value={form.contactName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contactName: e.target.value }))
                  }
                  placeholder="Full name"
                  data-ocid="add_dansal.contact_name_input"
                  className={INPUT_CLS}
                />
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLS} htmlFor="contactPhone">
                  Phone
                </label>
                <input
                  id="contactPhone"
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contactPhone: e.target.value }))
                  }
                  placeholder="07X XXX XXXX"
                  data-ocid="add_dansal.phone_input"
                  className={INPUT_CLS}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={LABEL_CLS} htmlFor="date">
                  Date *
                </label>
                <input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                  data-ocid="add_dansal.date_input"
                  className={INPUT_CLS}
                />
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLS} htmlFor="time">
                  Time *
                </label>
                <input
                  id="time"
                  type="time"
                  value={form.time}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, time: e.target.value }))
                  }
                  data-ocid="add_dansal.time_input"
                  className={INPUT_CLS}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={LABEL_CLS} htmlFor="locationLink">
                Google Maps Link
              </label>
              <input
                id="locationLink"
                type="url"
                value={form.locationLink}
                onChange={(e) =>
                  setForm((p) => ({ ...p, locationLink: e.target.value }))
                }
                placeholder="https://maps.google.com/..."
                data-ocid="add_dansal.location_input"
                className={INPUT_CLS}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={LABEL_CLS} htmlFor="province">
                  පළාත / Province
                </label>
                <select
                  id="province"
                  value={form.province}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      province: e.target.value,
                      district: "",
                    }))
                  }
                  data-ocid="add_dansal.province_select"
                  className={INPUT_CLS}
                >
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLS} htmlFor="district">
                  දිස්ත්‍රික්කය / District
                </label>
                <select
                  id="district"
                  value={form.district}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, district: e.target.value }))
                  }
                  data-ocid="add_dansal.district_select"
                  disabled={!form.province}
                  className={`${INPUT_CLS} disabled:opacity-50`}
                >
                  <option value="">Select district</option>
                  {(DISTRICTS_BY_PROVINCE[form.province] ?? []).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className={LABEL_CLS} htmlFor="category">
                ආහාර වර්ගය / Category
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                data-ocid="add_dansal.category_select"
                className={INPUT_CLS}
              >
                <option value="">Select category</option>
                {FOOD_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <span className={LABEL_CLS}>Food Types *</span>
              <div className="flex flex-wrap gap-2">
                {FOOD_CATEGORIES.map((food) => (
                  <button
                    key={food}
                    type="button"
                    onClick={() => toggleFood(food)}
                    data-ocid={`add_dansal.food_toggle.${food.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
                    className={[
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-smooth",
                      form.foodTypes.includes(food)
                        ? "bg-amber-100 text-amber-700 border-amber-400"
                        : "bg-background text-muted-foreground border-amber-200/60 hover:border-amber-300",
                    ].join(" ")}
                  >
                    {food}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <p
                className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg"
                data-ocid="add_dansal.error_state"
              >
                ⚠ {error}
              </p>
            )}
            <button
              type="submit"
              disabled={addDansal.isPending}
              data-ocid="add_dansal.submit_button"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-smooth disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {addDansal.isPending ? "ලියාපදිංජි කරනවා..." : "දංසල ලියාපදිංජි කරන්න 🌮"}
            </button>
            <p className="text-center text-xs text-muted-foreground pb-2">
              * සහිත කරුනු අනිවාර්යයි
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EditDansalModal
// ─────────────────────────────────────────────
function EditDansalModal({
  dansal,
  onClose,
}: {
  dansal: Dansal;
  onClose: () => void;
}) {
  const updateDansal = useUpdateDansal();
  const [form, setForm] = useState<UpdateDansalRequest>({
    organizerName: dansal.organizerName,
    contactName: dansal.contactName,
    contactPhone: dansal.contactPhone,
    foodTypes: [...dansal.foodTypes],
    date: dansal.date,
    time: dansal.time,
    locationLink: dansal.locationLink,
    latitude: dansal.latitude,
    longitude: dansal.longitude,
    province: dansal.province,
    district: dansal.district,
    category: dansal.category,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function toggleFood(food: string) {
    setForm((prev) => ({
      ...prev,
      foodTypes: (prev.foodTypes ?? []).includes(food)
        ? (prev.foodTypes ?? []).filter((f) => f !== food)
        : [...(prev.foodTypes ?? []), food],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.organizerName?.trim()) {
      setError("Organizer name is required");
      return;
    }
    try {
      await updateDansal.mutateAsync({ id: dansal.id, req: form });
      setSuccess(true);
      setTimeout(() => onClose(), 1400);
    } catch {
      setError("Failed to update. Please try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end"
      data-ocid="edit_dansal.dialog"
    >
      <div className="w-full max-w-lg mx-auto bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-amber-200/40 px-4 py-3 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-display font-bold text-foreground">
            දංසල සඹදිසිය කරන්න
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-ocid="edit_dansal.close_button"
            aria-label="Close"
            className="p-1 rounded-full hover:bg-muted transition-smooth"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {success ? (
          <div
            className="flex flex-col items-center justify-center py-16 px-4 gap-3"
            data-ocid="edit_dansal.success_state"
          >
            <div className="text-5xl">✅</div>
            <h3 className="font-display font-bold text-foreground text-lg">
              Updated!
            </h3>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
            <div className="space-y-1">
              <label className={LABEL_CLS} htmlFor="edit-organizerName">
                Organizer / Temple Name *
              </label>
              <input
                id="edit-organizerName"
                type="text"
                value={form.organizerName ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, organizerName: e.target.value }))
                }
                data-ocid="edit_dansal.organizer_input"
                className={INPUT_CLS}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={LABEL_CLS} htmlFor="edit-date">
                  Date
                </label>
                <input
                  id="edit-date"
                  type="date"
                  value={form.date ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                  data-ocid="edit_dansal.date_input"
                  className={INPUT_CLS}
                />
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLS} htmlFor="edit-time">
                  Time
                </label>
                <input
                  id="edit-time"
                  type="time"
                  value={form.time ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, time: e.target.value }))
                  }
                  data-ocid="edit_dansal.time_input"
                  className={INPUT_CLS}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={LABEL_CLS} htmlFor="edit-province">
                  පළාත / Province
                </label>
                <select
                  id="edit-province"
                  value={form.province ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      province: e.target.value,
                      district: "",
                    }))
                  }
                  data-ocid="edit_dansal.province_select"
                  className={INPUT_CLS}
                >
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLS} htmlFor="edit-district">
                  දිස්ත්‍රික්කය / District
                </label>
                <select
                  id="edit-district"
                  value={form.district ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, district: e.target.value }))
                  }
                  data-ocid="edit_dansal.district_select"
                  disabled={!form.province}
                  className={`${INPUT_CLS} disabled:opacity-50`}
                >
                  <option value="">Select district</option>
                  {(DISTRICTS_BY_PROVINCE[form.province ?? ""] ?? []).map(
                    (d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className={LABEL_CLS} htmlFor="edit-locationLink">
                Google Maps Link
              </label>
              <input
                id="edit-locationLink"
                type="url"
                value={form.locationLink ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, locationLink: e.target.value }))
                }
                placeholder="https://maps.google.com/..."
                data-ocid="edit_dansal.location_input"
                className={INPUT_CLS}
              />
            </div>
            <div className="space-y-2">
              <span className={LABEL_CLS}>Food Types</span>
              <div className="flex flex-wrap gap-2">
                {FOOD_CATEGORIES.map((food) => (
                  <button
                    key={food}
                    type="button"
                    onClick={() => toggleFood(food)}
                    className={[
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-smooth",
                      (form.foodTypes ?? []).includes(food)
                        ? "bg-amber-100 text-amber-700 border-amber-400"
                        : "bg-background text-muted-foreground border-amber-200/60 hover:border-amber-300",
                    ].join(" ")}
                  >
                    {food}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <p
                className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg"
                data-ocid="edit_dansal.error_state"
              >
                ⚠ {error}
              </p>
            )}
            <div className="flex gap-2 pb-2">
              <button
                type="button"
                onClick={onClose}
                data-ocid="edit_dansal.cancel_button"
                className="flex-1 py-3 rounded-xl border border-amber-200/60 text-foreground font-semibold text-sm hover:bg-muted transition-smooth"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateDansal.isPending}
                data-ocid="edit_dansal.save_button"
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-smooth disabled:opacity-60"
              >
                {updateDansal.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DeleteConfirmDialog
// ─────────────────────────────────────────────
function DeleteConfirmDialog({
  dansalName,
  onConfirm,
  onCancel,
  isPending,
}: {
  dansalName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
      data-ocid="delete_dansal.dialog"
    >
      <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-lg">
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">🗑️</div>
          <h3 className="font-display font-bold text-foreground text-lg">
            දංසල මකන්නද?
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium text-foreground">{dansalName}</span>{" "}
            ලැයිස්තුවේන් ඉවත් කරන්නක්මැ වේයි.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            data-ocid="delete_dansal.cancel_button"
            className="flex-1 py-2.5 rounded-xl border border-amber-200/60 text-foreground font-semibold text-sm hover:bg-muted transition-smooth"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            data-ocid="delete_dansal.confirm_button"
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-smooth disabled:opacity-60"
          >
            {isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LoginPromptModal
// ─────────────────────────────────────────────
function LoginPromptModal({
  onLogin,
  onClose,
}: {
  onLogin: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
      data-ocid="login_prompt.dialog"
    >
      <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-lg text-center">
        <div className="text-5xl mb-3">🏮</div>
        <h3 className="font-display font-bold text-foreground text-lg mb-1">
          Login Required
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Dansal register කිරීමට login කරන්න.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            data-ocid="login_prompt.cancel_button"
            className="flex-1 py-2.5 rounded-xl border border-amber-200/60 text-foreground font-semibold text-sm hover:bg-muted transition-smooth"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onLogin}
            data-ocid="login_prompt.login_button"
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-smooth flex items-center justify-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FilterPanel
// ─────────────────────────────────────────────
interface FilterValues {
  province: string;
  district: string;
  category: string;
  timeStart: string;
  timeEnd: string;
}

const EMPTY_FILTER: FilterValues = {
  province: "",
  district: "",
  category: "",
  timeStart: "",
  timeEnd: "",
};

function FilterPanel({
  filters,
  onChange,
  onClear,
}: {
  filters: FilterValues;
  onChange: (f: FilterValues) => void;
  onClear: () => void;
}) {
  const hasActive =
    filters.province ||
    filters.district ||
    filters.category ||
    filters.timeStart ||
    filters.timeEnd;

  return (
    <div
      className="bg-card/80 border border-amber-200/40 rounded-2xl p-4 space-y-3"
      data-ocid="dansals.filter_panel"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className={`${LABEL_CLS} block`} htmlFor="filter-province">
            <span>පළාත</span>
            <span className="text-muted-foreground font-normal normal-case ml-1">
              / Province
            </span>
          </label>
          <select
            value={filters.province}
            onChange={(e) =>
              onChange({ ...filters, province: e.target.value, district: "" })
            }
            data-ocid="dansals.filter.province_select"
            className={INPUT_CLS}
            id="filter-province"
          >
            <option value="">All provinces</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={`${LABEL_CLS} block`} htmlFor="filter-district">
            <span>දිස්ත්‍රික්කය</span>
            <span className="text-muted-foreground font-normal normal-case ml-1">
              / District
            </span>
          </label>
          <select
            value={filters.district}
            onChange={(e) => onChange({ ...filters, district: e.target.value })}
            disabled={!filters.province}
            data-ocid="dansals.filter.district_select"
            className={`${INPUT_CLS} disabled:opacity-50`}
            id="filter-district"
          >
            <option value="">All districts</option>
            {(DISTRICTS_BY_PROVINCE[filters.province] ?? []).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className={`${LABEL_CLS} block`} htmlFor="filter-category">
          <span>ආහාර වර්ගය</span>
          <span className="text-muted-foreground font-normal normal-case ml-1">
            / Category
          </span>
        </label>
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          data-ocid="dansals.filter.category_select"
          className={INPUT_CLS}
          id="filter-category"
        >
          <option value="">All categories</option>
          {FOOD_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className={`${LABEL_CLS} block`} htmlFor="filter-time-start">
            <span>වේලාව සිට</span>
            <span className="text-muted-foreground font-normal normal-case ml-1">
              / From
            </span>
          </label>
          <input
            type="time"
            value={filters.timeStart}
            onChange={(e) =>
              onChange({ ...filters, timeStart: e.target.value })
            }
            data-ocid="dansals.filter.time_start_input"
            className={INPUT_CLS}
            id="filter-time-start"
          />
        </div>
        <div className="space-y-1">
          <label className={`${LABEL_CLS} block`} htmlFor="filter-time-end">
            <span>දක්වා</span>
            <span className="text-muted-foreground font-normal normal-case ml-1">
              / Until
            </span>
          </label>
          <input
            type="time"
            value={filters.timeEnd}
            onChange={(e) => onChange({ ...filters, timeEnd: e.target.value })}
            data-ocid="dansals.filter.time_end_input"
            className={INPUT_CLS}
            id="filter-time-end"
          />
        </div>
      </div>
      {hasActive && (
        <button
          type="button"
          onClick={onClear}
          data-ocid="dansals.filter.clear_button"
          className="w-full py-2 rounded-xl border border-amber-300/60 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-smooth"
        >
          Clear Filters / ෆිල්ටර් ඉවත් කරන්න
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// DansalCard
// ─────────────────────────────────────────────
function shareDansal(dansal: Dansal) {
  const url = `${window.location.origin}${window.location.pathname}?dansal=${encodeURIComponent(dansal.organizerName)}`;
  const foods = dansal.foodTypes.join(", ");
  const text = `🏮 ${dansal.organizerName} - Vesak Dansal\n🍽 ${foods}\n⏰ ${dansal.date} at ${dansal.time}`;
  if (navigator.share) {
    navigator.share({ title: dansal.organizerName, text, url }).catch(() => {});
  } else {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n👉 ${url}`)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }
}

function DansalCard({
  dansal,
  index,
  userCoords,
  isOwner,
  isAdmin,
  principal,
  onEdit,
  onDelete,
  onAppreciate,
  onNeedLogin,
  onOpenDetail,
}: {
  dansal: Dansal;
  index: number;
  userCoords: { lat: number; lon: number } | null;
  isOwner: boolean;
  isAdmin: boolean;
  principal: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onAppreciate: () => void;
  onNeedLogin: () => void;
  onOpenDetail: () => void;
}) {
  const _appreciateDansal = useAppreciateDansal();

  const distanceStr = useMemo(() => {
    if (!userCoords || !dansal.latitude || !dansal.longitude) return null;
    const km = calculateDistance(
      userCoords.lat,
      userCoords.lon,
      dansal.latitude,
      dansal.longitude,
    );
    return formatDistance(km);
  }, [userCoords, dansal.latitude, dansal.longitude]);

  // likedBy is a Principal[] on the backend; toString() for comparison
  const likedByStrings = (dansal.likedBy ?? []).map((p) => p.toString());
  const likeCount = BigInt((dansal.likedBy ?? []).length);

  return (
    <div
      data-ocid={`dansals.item.${index}`}
      className="bg-card rounded-2xl border border-amber-200/40 overflow-hidden"
      style={{ boxShadow: "0 2px 8px rgba(180,120,0,0.06)" }}
    >
      {/* Approval badge strip for owner/admin */}
      {(isOwner || isAdmin) && dansal.status !== "approved" && (
        <div className="px-4 pt-3 pb-0">
          <ApprovalStatusBadge status={dansal.status} />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={onOpenDetail}
            data-ocid={`dansals.open_detail_button.${index}`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-foreground truncate hover:text-amber-700 transition-smooth">
                {dansal.organizerName}
              </h3>
              {distanceStr && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex-shrink-0"
                  data-ocid={`dansals.distance_badge.${index}`}
                >
                  <Navigation className="h-2.5 w-2.5" />
                  {distanceStr}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
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
          </button>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Share button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                shareDansal(dansal);
              }}
              data-ocid={`dansals.share_button.${index}`}
              aria-label="Share Dansal"
              className="p-1.5 rounded-lg border border-amber-200/60 text-amber-500 hover:bg-amber-50 transition-smooth"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  data-ocid={`dansals.edit_button.${index}`}
                  aria-label="Edit Dansal"
                  className="p-1.5 rounded-lg border border-amber-200/60 text-amber-600 hover:bg-amber-50 transition-smooth"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  data-ocid={`dansals.delete_button.${index}`}
                  aria-label="Delete Dansal"
                  className="p-1.5 rounded-lg border border-red-200/60 text-red-500 hover:bg-red-50 transition-smooth"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <AppreciateButton
              count={dansal.appreciationCount}
              onAppreciate={onAppreciate}
              data-ocid={`dansals.appreciate_button.${index}`}
            />
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
            <span>
              {dansal.date} at {dansal.time}
            </span>
          </div>
          {(dansal.province || dansal.district) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <span className="truncate">
                {[dansal.district, dansal.province].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}
          {dansal.contactPhone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <a
                href={`tel:${dansal.contactPhone}`}
                className="hover:text-amber-600 transition-smooth"
                onClick={(e) => e.stopPropagation()}
              >
                {dansal.contactPhone}
              </a>
              {dansal.contactName && (
                <span className="text-muted-foreground/60">
                  — {dansal.contactName}
                </span>
              )}
            </div>
          )}
          {dansal.locationLink && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <a
                href={dansal.locationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-600 transition-smooth underline underline-offset-2"
                onClick={(e) => e.stopPropagation()}
              >
                View on Maps
              </a>
            </div>
          )}
        </div>

        {/* Engagement row: Like + Report */}
        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-amber-100/60">
          <DansalLikeButton
            dansalId={dansal.id}
            likeCount={likeCount}
            likedBy={likedByStrings}
            principal={principal}
            onNeedLogin={onNeedLogin}
            ocid={`dansals.like_button.${index}`}
          />
          {!isOwner && (
            <DansalReportButton
              dansalId={dansal.id}
              dansalName={dansal.organizerName}
              ocid={`dansals.report_button.${index}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DansalsPage
// ─────────────────────────────────────────────
type TabMode = "all" | "mine";
type SortMode = "recent" | "distance";

function hasActiveFilter(f: FilterValues) {
  return !!(f.province || f.district || f.category || f.timeStart || f.timeEnd);
}

export function DansalsPage({
  onViewOrganizerProfile,
}: { onViewOrganizerProfile?: (principal: string) => void }) {
  const { isAuthenticated, principal, login } = useAuth();
  const { coords, error: geoError, requestLocation } = useGeolocationContext();
  const appreciateDansal = useAppreciateDansal();
  const deleteDansal = useDeleteDansal();

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [editTarget, setEditTarget] = useState<Dansal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Dansal | null>(null);
  const [detailTarget, setDetailTarget] = useState<Dansal | null>(null);
  const [tab, setTab] = useState<TabMode>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTER);
  // Admin check via profile
  const profileQuery = useGetMyProfile(principal ?? null);
  const isAdmin =
    profileQuery.data?.role === "admin" ||
    profileQuery.data?.role === "superAdmin";

  // Request location on mount
  const didRequestRef = useRef(false);
  useEffect(() => {
    if (!didRequestRef.current) {
      didRequestRef.current = true;
      requestLocation();
    }
  }, [requestLocation]);

  // Data hooks
  const activeFilter = hasActiveFilter(filters);
  const backendFilter = useMemo(
    () =>
      activeFilter
        ? {
            province: filters.province || undefined,
            district: filters.district || undefined,
            category: filters.category || undefined,
            timeStart: filters.timeStart || undefined,
            timeEnd: filters.timeEnd || undefined,
          }
        : {},
    [filters, activeFilter],
  );

  const allQuery = useGetDansals();
  const filteredQuery = useFilterDansals(backendFilter);
  const myQuery = useGetMyDansals(principal);

  // Resolve the base list
  const baseList: Dansal[] = useMemo(() => {
    if (tab === "mine") return (myQuery.data as Dansal[] | undefined) ?? [];
    if (activeFilter) return (filteredQuery.data as Dansal[] | undefined) ?? [];
    return (allQuery.data as Dansal[] | undefined) ?? [];
  }, [tab, activeFilter, allQuery.data, filteredQuery.data, myQuery.data]);

  const isLoading =
    tab === "mine"
      ? myQuery.isLoading
      : activeFilter
        ? filteredQuery.isLoading
        : allQuery.isLoading;

  // Client-side text search
  const searchFiltered = useMemo(() => {
    if (!searchText.trim()) return baseList;
    const q = searchText.toLowerCase();
    return baseList.filter(
      (d) =>
        d.organizerName.toLowerCase().includes(q) ||
        d.contactName.toLowerCase().includes(q) ||
        d.district.toLowerCase().includes(q) ||
        d.province.toLowerCase().includes(q),
    );
  }, [baseList, searchText]);

  // Sort
  const displayList = useMemo(() => {
    if (sortMode === "distance" && coords) {
      return [...searchFiltered].sort((a, b) => {
        const dA =
          a.latitude && a.longitude
            ? calculateDistance(coords.lat, coords.lon, a.latitude, a.longitude)
            : Number.POSITIVE_INFINITY;
        const dB =
          b.latitude && b.longitude
            ? calculateDistance(coords.lat, coords.lon, b.latitude, b.longitude)
            : Number.POSITIVE_INFINITY;
        return dA - dB;
      });
    }
    return searchFiltered;
  }, [searchFiltered, sortMode, coords]);

  function handleRegisterClick() {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    } else {
      setShowForm(true);
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteDansal.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  const filterActiveCount = [
    filters.province,
    filters.district,
    filters.category,
    filters.timeStart,
    filters.timeEnd,
  ].filter(Boolean).length;

  return (
    <div className="relative">
      {/* Modals */}
      {showForm && <AddDansalForm onClose={() => setShowForm(false)} />}
      {showLoginPrompt && (
        <LoginPromptModal
          onLogin={() => {
            setShowLoginPrompt(false);
            login();
          }}
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
      {editTarget && (
        <EditDansalModal
          dansal={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
      {detailTarget && (
        <DansalDetailSheet
          dansal={detailTarget}
          onClose={() => setDetailTarget(null)}
          onNeedLogin={() => {
            setDetailTarget(null);
            setShowLoginPrompt(true);
          }}
          onViewOrganizerProfile={onViewOrganizerProfile}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmDialog
          dansalName={deleteTarget.organizerName}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isPending={deleteDansal.isPending}
        />
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-amber-200/40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-foreground">Dansals</h2>
            <p className="text-xs text-muted-foreground">
              {displayList.length} registered this Vesak
            </p>
          </div>
          <button
            type="button"
            onClick={handleRegisterClick}
            data-ocid="dansals.add_dansal_button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-smooth active:scale-95 shadow-subtle"
          >
            <Plus className="h-4 w-4" />
            Register
          </button>
        </div>

        {/* Tabs (visible when authenticated) */}
        {isAuthenticated && (
          <div className="px-4 pb-2 flex gap-2" data-ocid="dansals.tab_row">
            <button
              type="button"
              onClick={() => setTab("all")}
              data-ocid="dansals.tab.all"
              className={[
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth",
                tab === "all"
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-amber-50",
              ].join(" ")}
            >
              All Dansals
            </button>
            <button
              type="button"
              onClick={() => setTab("mine")}
              data-ocid="dansals.tab.mine"
              className={[
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth",
                tab === "mine"
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-amber-50",
              ].join(" ")}
            >
              මගේ Dansals
            </button>
          </div>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Search + Filter toolbar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search dansals... / සොයන්න"
              data-ocid="dansals.search_input"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-amber-200/60 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/60"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            data-ocid="dansals.filter_toggle"
            aria-label="Toggle filters"
            className={[
              "relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-smooth",
              showFilters || filterActiveCount > 0
                ? "bg-amber-100 border-amber-400 text-amber-700"
                : "bg-card border-amber-200/60 text-muted-foreground hover:border-amber-300",
            ].join(" ")}
          >
            <Filter className="h-3.5 w-3.5" />
            {filterActiveCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                {filterActiveCount}
              </span>
            )}
            {showFilters ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(EMPTY_FILTER)}
          />
        )}

        {/* Sort + Location row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5" data-ocid="dansals.sort_row">
            <button
              type="button"
              onClick={() => setSortMode("recent")}
              data-ocid="dansals.sort.recent"
              className={[
                "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-smooth border",
                sortMode === "recent"
                  ? "bg-amber-100 border-amber-300 text-amber-700"
                  : "bg-card border-amber-200/40 text-muted-foreground hover:border-amber-200",
              ].join(" ")}
            >
              Recent
            </button>
            <button
              type="button"
              onClick={() => setSortMode("distance")}
              data-ocid="dansals.sort.distance"
              disabled={!coords}
              title={
                !coords ? "Enable location to sort by distance" : undefined
              }
              className={[
                "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-smooth border disabled:opacity-40",
                sortMode === "distance"
                  ? "bg-amber-100 border-amber-300 text-amber-700"
                  : "bg-card border-amber-200/40 text-muted-foreground hover:border-amber-200",
              ].join(" ")}
            >
              Nearest
            </button>
          </div>

          {/* Location status */}
          {!coords && !geoError && (
            <span className="text-[11px] text-muted-foreground/70 italic">
              ස්ථාන දත්ත ලබා ගනිමින්...
            </span>
          )}
          {geoError && (
            <button
              type="button"
              onClick={requestLocation}
              data-ocid="dansals.enable_location_button"
              className="flex items-center gap-1 text-[11px] text-amber-600 underline underline-offset-2 hover:text-amber-700 transition-smooth"
            >
              <Navigation className="h-3 w-3" />
              Enable location for distances
            </button>
          )}
          {coords && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <Navigation className="h-3 w-3" />
              Location active
            </span>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <LoadingSpinner />
        ) : displayList.length === 0 ? (
          <div data-ocid="dansals.empty_state" className="text-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-amber-200 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
              {tab === "mine" ? "ඔබේ Dansals නොමැත" : "No Dansals yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {tab === "mine"
                ? "Register your first Dansal this Vesak"
                : "Be the first to register a Dansal for this Vesak"}
            </p>
            <button
              type="button"
              onClick={handleRegisterClick}
              data-ocid="dansals.empty_register_button"
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-smooth"
            >
              Register a Dansal
            </button>
          </div>
        ) : (
          <div className="space-y-3" data-ocid="dansals.list">
            {displayList.map((d, i) => (
              <DansalCard
                key={String(d.id)}
                dansal={d}
                index={i + 1}
                userCoords={coords}
                isOwner={
                  isAuthenticated &&
                  principal !== null &&
                  d.organizerPrincipal.toString() === principal
                }
                isAdmin={isAdmin}
                principal={principal}
                onEdit={() => setEditTarget(d)}
                onDelete={() => setDeleteTarget(d)}
                onAppreciate={() => appreciateDansal.mutate(d.id)}
                onNeedLogin={() => setShowLoginPrompt(true)}
                onOpenDetail={() => setDetailTarget(d)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
