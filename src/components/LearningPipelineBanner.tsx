import React from "react";
import { Zap, BookOpen, HelpCircle, FileText, Compass, ChevronRight } from "lucide-react";
import { StudyTab } from "../types";

interface LearningPipelineBannerProps {
  activeTab: StudyTab;
  onSelectTab: (tab: StudyTab) => void;
}

export const LearningPipelineBanner: React.FC<LearningPipelineBannerProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const steps = [
    {
      id: "qa" as StudyTab,
      stepNum: "1",
      action: "Ask",
      feature: "Q&A",
      tagline: "Smart answers to general & academic questions",
      model: "Gemini 1.5 Pro",
      icon: Zap,
      color: "from-blue-500 to-indigo-500",
      activeBorder: "border-blue-500 bg-blue-50/80 dark:bg-blue-950/30",
    },
    {
      id: "explain" as StudyTab,
      stepNum: "2",
      action: "Understand",
      feature: "Concept Explanation",
      tagline: "Simple & concise plain-language breakdowns",
      model: "LaMini-Flan-T5-783M",
      icon: BookOpen,
      color: "from-amber-500 to-orange-500",
      activeBorder: "border-amber-500 bg-amber-50/80 dark:bg-amber-950/30",
    },
    {
      id: "quiz" as StudyTab,
      stepNum: "3",
      action: "Practice",
      feature: "Quiz Generation",
      tagline: "3 MCQs with 4 options each from topic or text",
      model: "Gemini 1.5 Pro",
      icon: HelpCircle,
      color: "from-emerald-500 to-teal-500",
      activeBorder: "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30",
    },
    {
      id: "summarize" as StudyTab,
      stepNum: "4",
      action: "Summarize",
      feature: "Text Summarization",
      tagline: "Short, clear summaries for quick revision",
      model: "Gemini 1.5 Pro",
      icon: FileText,
      color: "from-purple-500 to-violet-500",
      activeBorder: "border-purple-500 bg-purple-50/80 dark:bg-purple-950/30",
    },
    {
      id: "path" as StudyTab,
      stepNum: "5",
      action: "Follow a Path",
      feature: "Learning Path",
      tagline: "Beginner to advanced plan with resources",
      model: "Gemini 1.5 Pro",
      icon: Compass,
      color: "from-rose-500 to-pink-500",
      activeBorder: "border-rose-500 bg-rose-50/80 dark:bg-rose-950/30",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-3 pb-1">
      <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-2.5 sm:p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">
              ⚡
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              EduGenie Study Loop: <span className="text-indigo-600 dark:text-indigo-400">Ask → Understand → Practice → Summarize → Follow a Learning Path</span>
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Click any step to jump directly to the tool
          </span>
        </div>

        {/* 5-Step Pipeline Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = activeTab === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectTab(s.id)}
                className={`group relative flex flex-col text-left rounded-xl p-2.5 transition-all border cursor-pointer ${
                  isActive
                    ? `${s.activeBorder} shadow-sm ring-1 ring-indigo-500/20`
                    : "border-slate-200/70 bg-slate-50/60 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black text-white bg-gradient-to-br ${s.color}`}
                    >
                      {s.stepNum}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {s.action}
                    </span>
                  </div>
                  <Icon
                    className={`h-3.5 w-3.5 transition-transform group-hover:scale-110 ${
                      isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                    }`}
                  />
                </div>

                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 leading-snug">
                  {s.feature}
                </span>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  {s.tagline}
                </p>

                <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[9px] font-semibold text-slate-400">
                  <span className="truncate">{s.model}</span>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600 hidden lg:block" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
