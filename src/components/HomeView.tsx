import React from "react";
import { StudyTab, AcademicSubject, DifficultyLevel } from "../types";
import {
  Sparkles,
  HelpCircle,
  BookOpen,
  FileText,
  Compass,
  History,
  Settings,
  ArrowRight,
  Flame,
  CheckCircle2,
  GraduationCap,
  Zap,
  Layers,
  Brain,
  Award,
  Clock
} from "lucide-react";

interface HomeViewProps {
  onNavigate: (tab: StudyTab) => void;
  onQuickAsk?: (question: string, subject: AcademicSubject) => void;
  onQuickExplain?: (topic: string, level: DifficultyLevel) => void;
  streakCount: number;
  historyCount: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onQuickAsk,
  onQuickExplain,
  streakCount,
  historyCount,
}) => {
  const featureCards = [
    {
      id: "qa" as StudyTab,
      badge: "Question & Answer",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
      icon: Zap,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-950/60",
      title: "Ask AI",
      description:
        "Enter any academic question across Math, Science, Computer Science, English, or General Knowledge for clear, accurate, student-friendly answers.",
      features: ["Step-by-step solutions", "Governing formulas & rules", "Key revision points"],
      quickActionLabel: "Ask a Question",
      quickSample: {
        text: "Why does the derivative of e^x equal e^x?",
        subject: "Mathematics" as AcademicSubject,
      },
    },
    {
      id: "explain" as StudyTab,
      badge: "Concept Simplifier",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
      icon: BookOpen,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
      title: "Explain Topic",
      description:
        "Demystify difficult topics in simple, intuitive language with real-world examples, everyday analogies, and Beginner, Intermediate, or Advanced levels.",
      features: ["Beginner to Advanced tiers", "Real-world relatable analogies", "Memory tricks & mnemonics"],
      quickActionLabel: "Explain a Topic",
      quickSample: {
        text: "Quantum Entanglement",
        level: "Beginner" as DifficultyLevel,
      },
    },
    {
      id: "quiz" as StudyTab,
      badge: "Assessment Engine",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50",
      icon: HelpCircle,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-100 dark:bg-purple-950/60",
      title: "Generate Quiz",
      description:
        "Generate 3–10 multiple-choice questions from a topic or pasted study passage. Each question contains four options with instant feedback, hints, and scoring.",
      features: ["3 to 10 custom MCQs", "4 options per question", "Detailed explanations & score"],
      quickActionLabel: "Create Quiz",
    },
    {
      id: "summarize" as StudyTab,
      badge: "High-Yield Notes",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
      icon: FileText,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-950/60",
      title: "Summarize",
      description:
        "Paste long educational content and convert it into concise, easy-to-understand summaries with important key points for quick revision.",
      features: ["Concise TL;DR summary", "Quick revision bullet points", "Active recall flashcards"],
      quickActionLabel: "Summarize Text",
    },
    {
      id: "path" as StudyTab,
      badge: "Personalized Roadmap",
      badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
      icon: Compass,
      iconColor: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-100 dark:bg-rose-950/60",
      title: "Learning Path",
      description:
        "Enter your target topic and current knowledge level to get a structured roadmap from beginner to advanced with ordered topics, estimated times, and curated resources.",
      features: ["Beginner to Advanced curriculum", "Recommended topic ordering", "Estimated study time & resources"],
      quickActionLabel: "Build Roadmap",
    },
    {
      id: "history" as StudyTab,
      badge: "Saved Knowledge",
      badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50",
      icon: History,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-100 dark:bg-indigo-950/60",
      title: "History",
      description:
        "Review your generated questions, concept simplifications, quizzes, summaries, and learning roadmaps. Search, export, and load previous sessions.",
      features: ["Searchable session archive", "Filter by feature type", "One-click reload into tool"],
      quickActionLabel: "View History",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Hero Banner with EduGenie branding */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 sm:p-10 text-white shadow-2xl border border-indigo-800/40">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/30 px-3.5 py-1 text-xs font-semibold text-indigo-200 border border-indigo-400/30 backdrop-blur-md">
            <GraduationCap className="h-4 w-4 text-amber-300" />
            <span>EduGenie · AI-Powered Student Learning Assistant</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Learn smarter, retain faster, and master anything with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-indigo-200 to-white">
              EduGenie
            </span>
          </h1>

          <p className="text-sm sm:text-base text-indigo-200/90 leading-relaxed">
            Your all-in-one AI study companion powered by Google Gemini. Ask tough academic questions, simplify complex theories, generate 4-option practice quizzes, summarize lecture texts, and construct personalized beginner-to-advanced learning roadmaps.
          </p>

          {/* Quick Launch Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate("qa")}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <Zap className="h-4 w-4 text-amber-300" />
              <span>Ask AI a Question</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate("explain")}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-indigo-100 hover:bg-white/20 border border-white/15 transition-all cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-emerald-300" />
              <span>Explain a Concept</span>
            </button>
            <button
              onClick={() => onNavigate("quiz")}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-indigo-100 hover:bg-white/20 border border-white/15 transition-all cursor-pointer"
            >
              <HelpCircle className="h-4 w-4 text-purple-300" />
              <span>Practice Quiz</span>
            </button>
          </div>

          {/* Key metrics bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-indigo-800/40 text-xs">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Study Streak</span>
                <span className="font-extrabold text-white">{streakCount} Days Active</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-300" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Saved Items</span>
                <span className="font-extrabold text-white">{historyCount} Records</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-300" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Subjects</span>
                <span className="font-extrabold text-white">Math, Science, CS, English, GK</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">AI Engine</span>
                <span className="font-extrabold text-white">Google Gemini</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Interactive Learning Modules
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Select an educational module to accelerate your learning
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 hover:-translate-y-1"
              >
                <div className="space-y-4">
                  {/* Badge & Icon */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${card.badgeColor}`}
                    >
                      {card.badge}
                    </span>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconBg} ${card.iconColor}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  {/* Feature checklist */}
                  <div className="space-y-1.5 pt-1">
                    {card.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onNavigate(card.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-600 transition-colors cursor-pointer"
                  >
                    <span>{card.quickActionLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  {card.quickSample && onQuickAsk && card.id === "qa" && (
                    <button
                      onClick={() =>
                        onQuickAsk(card.quickSample.text, card.quickSample.subject)
                      }
                      title="Try sample question"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      Try Math Sample
                    </button>
                  )}

                  {card.quickSample && onQuickExplain && card.id === "explain" && (
                    <button
                      onClick={() =>
                        onQuickExplain(card.quickSample.text, card.quickSample.level)
                      }
                      title="Try sample topic"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      Try Physics Sample
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
