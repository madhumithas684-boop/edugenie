import React from "react";
import { StudyTab } from "../types";
import {
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  Compass,
  BookmarkCheck,
  Flame,
  Moon,
  Sun,
  GraduationCap,
  Zap,
  Server
} from "lucide-react";

interface HeaderProps {
  activeTab: StudyTab;
  setActiveTab: (tab: StudyTab) => void;
  savedCount: number;
  streak: number;
  isDark: boolean;
  toggleDark: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  streak,
  isDark,
  toggleDark,
}) => {
  const tabs = [
    { id: "qa" as StudyTab, label: "Q&A", icon: Zap, tag: "Ask" },
    { id: "explain" as StudyTab, label: "Concept Explanation", icon: BookOpen, tag: "Understand" },
    { id: "quiz" as StudyTab, label: "Quiz Generation", icon: HelpCircle, tag: "Practice" },
    { id: "summarize" as StudyTab, label: "Text Summarization", icon: FileText, tag: "Summarize" },
    { id: "path" as StudyTab, label: "Personalized Learning Path", icon: Compass, tag: "Learning Path" },
    { id: "notebook" as StudyTab, label: "Notebook", icon: BookmarkCheck, count: savedCount },
    { id: "tech_stack" as StudyTab, label: "FastAPI Stack", icon: Server, tag: "Architecture" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 text-white shadow-md shadow-indigo-500/20 shrink-0">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Edu<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400 dark:from-indigo-400 dark:to-indigo-300">Genie</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wide text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                Gemini 1.5 Pro & LaMini-Flan-T5-783M
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
              Ask → Understand → Practice → Summarize → Follow a Learning Path
            </p>
          </div>
        </div>

        {/* Center Navigation - Desktop */}
        <nav className="hidden xl:flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-indigo-600 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-indigo-600 dark:text-white" : "text-slate-500 dark:text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                    isActive ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200" : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right side stats & mode toggle */}
        <div className="flex items-center gap-2">
          {/* Study streak badge */}
          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300">
            <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500 animate-pulse" />
            <span className="hidden sm:inline">{streak} Day Streak</span>
            <span className="sm:hidden">{streak}d</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleDark}
            aria-label="Toggle theme"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Navigation bar */}
      <div className="flex xl:hidden overflow-x-auto border-t border-slate-200 px-2 py-1.5 scrollbar-none dark:border-slate-800">
        <div className="flex min-w-full justify-around gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400 font-bold"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="relative">
                  <Icon className="h-4 w-4" />
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white">
                      {tab.count}
                    </span>
                  )}
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
