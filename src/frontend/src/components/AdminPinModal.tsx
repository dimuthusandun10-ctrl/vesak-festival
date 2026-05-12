import { X } from "lucide-react";
import { useState } from "react";

interface AdminPinModalProps {
  onVerified: () => void;
  onClose: () => void;
  verifyPin: (pin: string) => Promise<boolean>;
}

const NUMPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "\u2190"],
];

export function AdminPinModal({
  onVerified,
  onClose,
  verifyPin,
}: AdminPinModalProps) {
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const display = Array.from({ length: 4 }, (_, i) => digits[i] ?? "");

  function handleDigit(d: string) {
    if (digits.length >= 4) return;
    const next = [...digits, d];
    setDigits(next);
    setError("");
    if (next.length === 4) confirmPin(next.join(""));
  }

  function handleBackspace() {
    if (digits.length === 0) return;
    setDigits((prev) => prev.slice(0, -1));
    setError("");
  }

  async function confirmPin(pin: string) {
    setChecking(true);
    try {
      const ok = await verifyPin(pin);
      if (ok) {
        onVerified();
      } else {
        setError("PIN වැරදියි. නැවත උත්සාහ කරන්න.");
        setDigits([]);
      }
    } catch {
      setError("දෝෂයක් සිදු විය.");
      setDigits([]);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
      data-ocid="admin_pin.dialog"
      aria-modal="true"
      aria-label="Admin Access"
    >
      <div className="w-full max-w-sm mx-auto bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl border border-amber-200/40 pb-safe">
        {/* Header */}
        <div className="relative flex items-center justify-center px-4 pt-6 pb-2">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-md">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="font-display font-bold text-foreground text-lg">
              Admin Access
            </h2>
            <p className="text-xs text-muted-foreground">
              4-digit PIN ඇතුලත් කරන්න
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-ocid="admin_pin.close_button"
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-smooth text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* PIN dots */}
        <div
          className="flex justify-center gap-4 py-6"
          data-ocid="admin_pin.dots"
        >
          {display.map((d, dotIdx) => {
            const dotKey = `dot-${dotIdx}`;
            return (
              <div
                key={dotKey}
                className={[
                  "w-4 h-4 rounded-full border-2 transition-all duration-150",
                  d
                    ? "bg-amber-500 border-amber-500 scale-110"
                    : "bg-transparent border-amber-300/60",
                ].join(" ")}
              />
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <p
            className="text-center text-sm text-red-500 font-medium mb-4 px-4"
            data-ocid="admin_pin.error_state"
          >
            ⚠ {error}
          </p>
        )}

        {checking && (
          <p className="text-center text-sm text-muted-foreground mb-4 animate-pulse">
            Checking...
          </p>
        )}

        {/* Numpad */}
        <div className="px-8 pb-8 space-y-3" data-ocid="admin_pin.numpad">
          {NUMPAD_ROWS.map((row) => (
            <div key={row.join("-")} className="grid grid-cols-3 gap-3">
              {row.map((key) => {
                if (key === "") return <div key="empty" />;
                const isBackspace = key === "\u2190";
                return (
                  <button
                    key={`btn-${key}`}
                    type="button"
                    onClick={() =>
                      isBackspace ? handleBackspace() : handleDigit(key)
                    }
                    disabled={checking || (!isBackspace && digits.length >= 4)}
                    data-ocid={`admin_pin.key_${isBackspace ? "backspace" : key}`}
                    aria-label={isBackspace ? "Backspace" : key}
                    className={[
                      "h-16 rounded-2xl font-semibold text-xl transition-smooth active:scale-95 disabled:opacity-50",
                      isBackspace
                        ? "bg-muted text-muted-foreground hover:bg-muted/80 text-base"
                        : "bg-amber-50 border border-amber-200/60 text-foreground hover:bg-amber-100 hover:border-amber-400 shadow-sm",
                    ].join(" ")}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
