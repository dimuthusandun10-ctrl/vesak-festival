import { useEffect } from "react";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    function handleResize() {
      const heightRatio =
        (vv?.height ?? window.innerHeight) / window.screen.height;
      if (heightRatio < 0.65) {
        document.body.classList.add("keyboard-open");
      } else {
        document.body.classList.remove("keyboard-open");
      }
    }
    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-card border-b border-amber-200/60"
        style={{ boxShadow: "0 2px 12px rgba(180,120,0,0.07)" }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              🏮
            </span>
            <div>
              <h1 className="font-display font-bold text-base text-foreground leading-tight">
                Vesak Festival
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-wide uppercase font-medium">
                Community Dashboard
              </p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium border border-amber-200">
            🌕 Poya 2026
          </span>
        </div>
      </header>

      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Caffeine attribution footer */}
      <footer className="pb-[calc(5rem+env(safe-area-inset-bottom))] pt-1 text-center">
        <p className="text-[10px] text-muted-foreground/50">
          Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
