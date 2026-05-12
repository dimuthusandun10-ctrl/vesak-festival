import type { TabId } from "@/types";
import { Camera, Home, Star, UserCircle, UtensilsCrossed } from "lucide-react";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: {
  id: Exclude<TabId, "admin">;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "home", label: "ගෙය / Home", icon: Home },
  { id: "dansals", label: "දංසල / Dansals", icon: UtensilsCrossed },
  { id: "gallery", label: "ගැලරියාව / Gallery", icon: Camera },
  { id: "favorites", label: "ප්‍රියතම / Saved", icon: Star },
  { id: "account", label: "ගිණුම / Account", icon: UserCircle },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-amber-200/60 pb-[env(safe-area-inset-bottom)]"
      style={{ boxShadow: "0 -4px 20px rgba(180,120,0,0.08)" }}
      data-ocid="bottom_nav"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              data-ocid={`nav_${tab.id}_tab`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl min-w-[64px] transition-smooth",
                isActive
                  ? "text-amber-600"
                  : "text-muted-foreground hover:text-amber-500",
              ].join(" ")}
            >
              <div
                className={[
                  "flex items-center justify-center w-10 h-6 rounded-full transition-smooth",
                  isActive ? "bg-amber-100" : "",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-5 w-5 transition-smooth",
                    isActive ? "text-amber-600" : "text-muted-foreground",
                  ].join(" ")}
                />
              </div>
              <span
                className={`text-[10px] font-medium tracking-wide ${
                  isActive ? "text-amber-600" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
