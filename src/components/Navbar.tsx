import React from "react";
import {
  Sparkles,
  Settings,
  BookMarked,
  Wand2,
} from "lucide-react";

export type AppViewId =
  | "novel-to-manga"
  | "gemini-tts"
  | "settings";

interface NavbarProps {
  currentView?: AppViewId | string;
  onViewChange?: (view: any) => void;
  // Legacy optional props
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
  targetLang?: any;
  setTargetLang?: (lang: any) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
}

export default function Navbar({
  currentView,
  onViewChange,
  activeTab,
  setActiveTab,
}: NavbarProps) {
  const activeView = currentView || activeTab || "novel-to-manga";

  const handleSelectView = (view: AppViewId) => {
    if (onViewChange) {
      onViewChange(view);
    } else if (setActiveTab) {
      setActiveTab(view);
    }
  };

  const navItems: Array<{
    id: AppViewId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accent?: string;
    badge?: string;
  }> = [
    { id: "novel-to-manga", label: "الرواية ⬅ مانجا", icon: BookMarked, accent: "text-emerald-400", badge: "1.1" },
    { id: "gemini-tts", label: "Gemini TTS", icon: Sparkles, accent: "text-teal-400" },
    { id: "settings", label: "الإعدادات", icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md" dir="rtl">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Brand */}
          <div
            onClick={() => handleSelectView("novel-to-manga")}
            className="flex cursor-pointer items-center gap-2.5 shrink-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20">
              <Wand2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight">
                AI Studio <span className="text-emerald-400 text-xs sm:text-sm font-semibold">Pro</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Novel → Manga & Gemini TTS
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectView(item.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : item.accent || "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

