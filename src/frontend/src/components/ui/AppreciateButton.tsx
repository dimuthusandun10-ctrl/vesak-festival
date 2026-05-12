import { Heart } from "lucide-react";
import { useState } from "react";

interface AppreciateButtonProps {
  count: bigint | number;
  onAppreciate: () => void;
  disabled?: boolean;
  "data-ocid"?: string;
}

export function AppreciateButton({
  count,
  onAppreciate,
  disabled = false,
  "data-ocid": dataOcid,
}: AppreciateButtonProps) {
  const [appreciated, setAppreciated] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  function handleClick() {
    if (appreciated || disabled) return;
    setIsAnimating(true);
    setAppreciated(true);
    onAppreciate();
    setTimeout(() => setIsAnimating(false), 400);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      data-ocid={dataOcid}
      aria-label={`Appreciate — ${count} appreciations`}
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-smooth select-none",
        appreciated
          ? "bg-amber-100 text-amber-700 border border-amber-300"
          : "bg-muted text-muted-foreground border border-amber-200/60 hover:bg-amber-50 hover:text-amber-600",
        isAnimating ? "scale-110" : "scale-100",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer active:scale-95",
      ].join(" ")}
    >
      <Heart
        className={`h-4 w-4 transition-smooth ${
          appreciated ? "fill-amber-500 text-amber-500" : "text-amber-400"
        } ${isAnimating ? "scale-125" : "scale-100"}`}
      />
      <span>{String(count)}</span>
    </button>
  );
}
