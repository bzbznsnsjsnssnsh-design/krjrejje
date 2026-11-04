import React, { useState, Suspense, lazy } from "react";
import Navbar from "./components/Navbar";
import MobileBottomNav from "./components/MobileBottomNav";
import { Loader2 } from "lucide-react";

const NovelToMangaPage = lazy(() => import("./components/novel-to-manga/NovelToMangaPage"));
const GeminiTTSStudio = lazy(() => import("./gemini-tts/GeminiTTSStudio"));
const SettingsPage = lazy(() => import("./components/SettingsPage"));

export type ActiveView = "novel-to-manga" | "gemini-tts" | "settings";

// Sleek loading fallback for view transitions
function ViewLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-8 text-center select-none" dir="rtl">
      <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-3 animate-pulse shadow-lg shadow-emerald-500/5">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
      <span className="text-xs text-slate-400 font-bold">جاري تحميل الاستوديو...</span>
    </div>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState<ActiveView>("novel-to-manga");

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300 flex flex-col">
      {/* Navigation header */}
      <Navbar
        currentView={currentView}
        onViewChange={(view: any) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-24 sm:pb-12">
        <Suspense fallback={<ViewLoadingFallback />}>
          {currentView === "novel-to-manga" && (
            <NovelToMangaPage
              onNavigateToSettings={() => {
                setCurrentView("settings");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}

          {currentView === "gemini-tts" && <GeminiTTSStudio />}

          {currentView === "settings" && <SettingsPage />}
        </Suspense>
      </main>

      {/* Modern Android & Mobile Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}
