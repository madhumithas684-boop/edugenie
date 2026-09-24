import React, { useState, useEffect } from "react";
import { LearningPathResult, SavedNote } from "../types";
import {
  Compass,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Trophy,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Loader2,
  AlertTriangle,
  Lightbulb,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Video,
  Globe,
  ExternalLink
} from "lucide-react";

interface LearningPathViewProps {
  onSaveNote: (note: Omit<SavedNote, "id" | "date">) => void;
  onSendToTutor: (query: string) => void;
  onExplainTopic: (topic: string) => void;
}

const PRESET_GOALS = [
  { subject: "Linear Algebra & Matrix Calculus", goal: "Machine Learning Foundations", weeks: 4, hours: 6 },
  { subject: "AP Biology: Cell Division & Genetics", goal: "High School Exam Top Score", weeks: 3, hours: 5 },
  { subject: "Data Structures & Algorithms in Python", goal: "Technical Coding Interviews", weeks: 6, hours: 8 },
  { subject: "Micro & Macroeconomics Principles", goal: "College Midterm Mastery", weeks: 4, hours: 5 },
];

export const LearningPathView: React.FC<LearningPathViewProps> = ({
  onSaveNote,
  onSendToTutor,
  onExplainTopic,
}) => {
  const [subject, setSubject] = useState("");
  const [currentLevel, setCurrentLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [targetGoal, setTargetGoal] = useState("Mastery");
  const [timeframeWeeks, setTimeframeWeeks] = useState(4);
  const [hoursPerWeek, setHoursPerWeek] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPathResult | null>(null);

  // Checkbox completions state stored as "weekIndex-dayIndex"
  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({ 0: true });
  const [saved, setSaved] = useState(false);

  // Load persisted roadmap if any
  useEffect(() => {
    try {
      const stored = localStorage.getItem("edugemini_active_plan");
      const storedProgress = localStorage.getItem("edugemini_plan_progress");
      if (stored) {
        setLearningPath(JSON.parse(stored));
      }
      if (storedProgress) {
        setCompletedDays(JSON.parse(storedProgress));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleGeneratePath = async (overrideSubject?: string, overrideGoal?: string) => {
    const targetSub = overrideSubject || subject;
    if (!targetSub.trim()) return;

    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/learning-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: targetSub,
          currentLevel,
          targetGoal: overrideGoal || targetGoal,
          timeframeWeeks,
          hoursPerWeek,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate learning path");
      }

      const data: LearningPathResult = await res.json();
      setLearningPath(data);
      setCompletedDays({});
      setExpandedWeeks({ 0: true, 1: true });

      localStorage.setItem("edugemini_active_plan", JSON.stringify(data));
      localStorage.setItem("edugemini_plan_progress", JSON.stringify({}));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate learning plan.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDayCompletion = (wIdx: number, dIdx: number) => {
    const key = `${wIdx}-${dIdx}`;
    setCompletedDays((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem("edugemini_plan_progress", JSON.stringify(updated));
      return updated;
    });
  };

  const toggleWeekExpand = (wIdx: number) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [wIdx]: !prev[wIdx],
    }));
  };

  // Progress metrics
  const totalTasks = learningPath
    ? learningPath.weeks.reduce((acc, w) => acc + w.dailySchedule.length, 0)
    : 0;
  const completedCount = Object.values(completedDays).filter(Boolean).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const handleSave = () => {
    if (!learningPath) return;
    onSaveNote({
      title: learningPath.planTitle,
      type: "path_milestone",
      content: `${learningPath.overview}\n\nTimeframe: ${timeframeWeeks} Weeks | Total Hours: ${learningPath.totalEstimatedHours}h\nProgress: ${progressPercent}%\n\nWeeks Summary:\n${learningPath.weeks
        .map((w) => `Week ${w.weekNumber}: ${w.phaseTitle} (Milestone: ${w.milestoneCheck})`)
        .join("\n")}`,
      tags: ["StudyPlan", subject || "General"],
    });
    setSaved(true);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-6">
      {/* Top Hero Card */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-200 border border-indigo-400/30 mb-3">
            <Compass className="h-3.5 w-3.5 text-amber-300" />
            Step 5 · Personalized Learning Path (Gemini 1.5 Pro)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Provides a structured learning plan from beginner to advanced level, including suggested learning resources.
          </h1>
          <p className="text-sm sm:text-base text-indigo-200/90 mb-6">
            Powered by Google Gemini 1.5 Pro. Set your current level and target goal. EduGenie generates a comprehensive curriculum with weekly milestones, daily actionable tasks, and curated learning resources (books, videos, docs, and courses).
          </p>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-indigo-200 font-medium">Popular Curricula:</span>
            {PRESET_GOALS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSubject(preset.subject);
                  setTargetGoal(preset.goal);
                  setTimeframeWeeks(preset.weeks);
                  setHoursPerWeek(preset.hours);
                  handleGeneratePath(preset.subject, preset.goal);
                }}
                className="rounded-xl bg-white/10 px-3 py-1 text-indigo-100 hover:bg-white/20 border border-white/10 transition-colors cursor-pointer"
              >
                🎯 {preset.subject}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generator Configuration Form */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block">
              What do you want to learn?
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Organic Chemistry, Quantum Computing, Microeconomics..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block">
              Your Specific Goal / Target
            </label>
            <input
              type="text"
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              placeholder="e.g. Ace College Final, Build Real Apps, Complete Syllabus..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Sliders and Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Current Level */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
              Current Level
            </label>
            <select
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="beginner">Beginner (Starting Fresh)</option>
              <option value="intermediate">Intermediate (Some Basics)</option>
              <option value="advanced">Advanced (Exam Prep & Polishing)</option>
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
              Timeframe: <span className="font-bold text-indigo-600">{timeframeWeeks} Weeks</span>
            </label>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              value={timeframeWeeks}
              onChange={(e) => setTimeframeWeeks(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Weekly Hours */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
              Commitment: <span className="font-bold text-indigo-600">{hoursPerWeek} Hours/Week</span>
            </label>
            <input
              type="range"
              min="3"
              max="20"
              step="1"
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => handleGeneratePath()}
            disabled={loading || !subject.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Designing Curriculum...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Generate Roadmap</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Unable to generate study plan</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Active Learning Path Content */}
      {learningPath && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Personalized Learning Plan
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {learningPath.planTitle}
              </h2>
            </div>

            <button
              onClick={handleSave}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                saved
                  ? "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              {saved ? <BookmarkCheck className="h-3.5 w-3.5 text-green-600" /> : <Bookmark className="h-3.5 w-3.5" />}
              <span>{saved ? "Saved in Notebook" : "Save Plan"}</span>
            </button>
          </div>

          {/* Overview & Progress Bar */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {learningPath.overview}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Duration</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {learningPath.weeks.length} Weeks
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimated Effort</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {learningPath.totalEstimatedHours} Hours
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sessions</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {completedCount} / {totalTasks} Completed
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mastery Progress</span>
                <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {progressPercent}%
                </p>
              </div>
            </div>

            {/* Overall Progress Gauge */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Course Completion</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pro Study Tips */}
          {learningPath.proStudyTips && learningPath.proStudyTips.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                <Lightbulb className="h-4 w-4" />
                <span>Coach's High-Efficiency Study Tips</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {learningPath.proStudyTips.map((tip, idx) => (
                  <div key={idx} className="rounded-xl bg-white/70 p-3 text-xs text-slate-800 dark:bg-slate-900/60 dark:text-slate-200 font-medium border border-amber-100 dark:border-amber-900/40">
                    💡 {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Learning Resources */}
          {learningPath.suggestedResources && learningPath.suggestedResources.length > 0 && (
            <div className="rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 to-white p-5 dark:border-indigo-900/50 dark:bg-slate-900/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                  <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Suggested Learning Resources (Beginner to Advanced)</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {learningPath.suggestedResources.length} Curated References
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {learningPath.suggestedResources.map((res, rIdx) => {
                  const badgeColors: Record<string, string> = {
                    book: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
                    course: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
                    video: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
                    doc: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
                    interactive: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
                  };
                  return (
                    <div
                      key={rIdx}
                      className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-800/80 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              badgeColors[res.type] || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {res.type}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 truncate max-w-[140px]">
                            {res.source}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {res.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                          {res.description}
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-[10px]">
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Recommended for Level</span>
                        <span className="text-slate-400">{res.source}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weekly Roadmaps */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Weekly Study Plan & Checklists
            </h3>

            {learningPath.weeks.map((week, wIdx) => {
              const isExpanded = expandedWeeks[wIdx] ?? false;
              const weekCompletedTasks = week.dailySchedule.filter((_, dIdx) => completedDays[`${wIdx}-${dIdx}`]).length;
              const isWeekFullyDone = weekCompletedTasks === week.dailySchedule.length;

              return (
                <div
                  key={wIdx}
                  className={`rounded-3xl border transition-all ${
                    isWeekFullyDone
                      ? "border-green-300 bg-green-50/20 dark:border-green-900/60 dark:bg-green-950/10"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  {/* Week Accordion Header */}
                  <div
                    onClick={() => toggleWeekExpand(wIdx)}
                    className="flex flex-wrap items-center justify-between gap-3 p-5 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black ${
                          isWeekFullyDone
                            ? "bg-green-600 text-white"
                            : "bg-indigo-600 text-white shadow-sm"
                        }`}
                      >
                        W{week.weekNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                            {week.phaseTitle}
                          </h4>
                          {isWeekFullyDone && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {weekCompletedTasks} of {week.dailySchedule.length} sessions completed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Week Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100 dark:border-slate-800">
                      {/* Objectives */}
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                          Weekly Key Objectives
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {week.keyObjectives.map((obj, oIdx) => (
                            <span
                              key={oIdx}
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium"
                            >
                              🎯 {obj}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Daily schedule checklist */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          Daily Study Schedule
                        </span>

                        {week.dailySchedule.map((day, dIdx) => {
                          const isDone = completedDays[`${wIdx}-${dIdx}`] ?? false;
                          return (
                            <div
                              key={dIdx}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
                                isDone
                                  ? "border-green-200 bg-green-50/50 text-slate-500 line-through dark:border-green-950 dark:bg-green-950/20"
                                  : "border-slate-100 bg-slate-50/70 hover:border-slate-200 dark:border-slate-800/80 dark:bg-slate-800/40"
                              }`}
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <button
                                  type="button"
                                  onClick={() => toggleDayCompletion(wIdx, dIdx)}
                                  className="mt-0.5 text-slate-400 hover:text-green-600 transition-colors cursor-pointer shrink-0"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <Circle className="h-5 w-5" />
                                  )}
                                </button>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                      {day.day}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                      <Clock className="h-3 w-3" />
                                      {day.durationMinutes} mins
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                                    {day.task}
                                  </p>
                                  {day.studyTip && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 italic">
                                      Tip: {day.studyTip}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => onExplainTopic(day.task)}
                                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                                >
                                  Explain Concept
                                </button>
                                <button
                                  onClick={() => onSendToTutor(`I am on ${day.day} of my study plan: "${day.task}". Can you tutor me through this?`)}
                                  className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                                >
                                  Ask Tutor
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Milestone Check Challenge */}
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/20 flex items-start gap-3">
                        <Trophy className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <span className="font-bold text-indigo-950 dark:text-indigo-200">
                            Week {week.weekNumber} Milestone Challenge:
                          </span>{" "}
                          <span className="text-slate-700 dark:text-slate-300">
                            {week.milestoneCheck}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
