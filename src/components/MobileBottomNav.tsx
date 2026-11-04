import React from "react";
import { Settings, Sparkles, BookMarked } from "lucide-react";

export type MobileViewId = "novel-to-manga" | "gemini-tts" | "settings";

interface MobileBottomNavProps {
  currentView: string;
  onViewChange: (view: any) => void;
}

export default function MobileBottomNav({ currentView, onViewChange }: MobileBottomNavProps) {
  const navItems = [
    {
      id: "novel-to-manga" as const,
      label: "الرواية ⬅ مانجا",
      icon: BookMarked,
      badge: "1.1",
    },
    {
      id: "gemini-tts" as const,
      label: "Gemini TTS",
      icon: Sparkles,
      badge: "أصوات",
    },
    {
      id: "settings" as const,
      label: "الإعدادات",
      icon: Settings,
    },
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="التنقل الرئيسي للهواتف"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-lg sm:hidden pb-[max(env(safe-area-inset-bottom),8px)] pt-1 px-4 shadow-2xl shadow-black/80"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              type="button"
              onClick={() => onViewChange(item.id)}
              className={`relative flex min-h-[50px] flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-center transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive
                  ? "text-emerald-400 font-bold"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              {/* Active pill glow */}
              {isActive && (
                <span className="absolute -top-1 h-0.5 w-10 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}

              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isActive ? "scale-110 stroke-[2.4]" : "stroke-[1.8]"
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-3 rounded-full bg-emerald-500/20 px-1 py-0.2 text-[8px] font-mono font-bold text-emerald-300 border border-emerald-500/40 leading-none">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
