import React, { useState } from "react";
import { QAResult, AIModelEngine, SavedNote } from "../types";
import { speakText, stopSpeaking } from "../utils/speech";
import {
  HelpCircle,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Lightbulb,
  GraduationCap,
  BookOpen,
  Cpu,
  Layers
} from "lucide-react";

interface QAViewProps {
  initialQuestion?: string;
  onSaveNote: (note: Omit<SavedNote, "id" | "date">) => void;
  onSendToExplain?: (topic: string) => void;
}

const ACADEMIC_PRESETS = [
  { question: "Why does the derivative of e^x equal itself?", category: "Math & Calculus", icon: "📐" },
  { question: "State Heisenberg's Uncertainty Principle and why it holds.", category: "Quantum Physics", icon: "⚛️" },
  { question: "How does the Central Limit Theorem work in probability?", category: "Statistics", icon: "📊" },
  { question: "Explain the biochemical difference between mitosis and meiosis.", category: "Biology", icon: "🧬" },
  { question: "Why does fractional reserve banking cause the money multiplier effect?", category: "Economics", icon: "📈" },
  { question: "What is the time complexity difference between QuickSort and MergeSort?", category: "Computer Science", icon: "💻" },
];

const GENERAL_PRESETS = [
  { question: "Why is the sky blue during the day and red at sunset?", category: "Atmospheric Science", icon: "🌅" },
  { question: "How do noise-cancelling headphones invert sound waves?", category: "Acoustics & Tech", icon: "🎧" },
  { question: "What is the cognitive difference between deductive and inductive reasoning?", category: "Logic & Philosophy", icon: "🧠" },
  { question: "How does GPS calculate user elevation using 4 satellites?", category: "Navigation Tech", icon: "🛰️" },
];

export const QAView: React.FC<QAViewProps> = ({ initialQuestion, onSaveNote, onSendToExplain }) => {
  const [question, setQuestion] = useState(initialQuestion || "");
  const [category, setCategory] = useState<"academic" | "general">("academic");
  const [modelEngine, setModelEngine] = useState<AIModelEngine>("gemini");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qaResult, setQaResult] = useState<QAResult | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  const handleAsk = async (queryToAsk?: string, overrideCategory?: "academic" | "general") => {
    const targetQ = queryToAsk || question;
    if (!targetQ.trim() || loading) return;

    setLoading(true);
    setError(null);
    setSaved(false);
    stopSpeaking();
    setIsSpeaking(false);

    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: targetQ.trim(),
          category: overrideCategory || category,
          model: modelEngine,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get answer");
      }

      const data: QAResult = await res.json();
      setQaResult(data);
      if (queryToAsk) {
        setQuestion(queryToAsk);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to answer question right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(text, () => setIsSpeaking(false));
    }
  };

  const handleCopy = () => {
    if (!qaResult) return;
    const formatted = `Q: ${qaResult.question}\n\nConcise Answer:\n${qaResult.conciseAnswer}\n\nKey Points:\n${qaResult.keyPoints
      .map((p) => `• ${p}`)
      .join("\n")}${
      qaResult.formulaOrRule && qaResult.formulaOrRule !== "N/A"
        ? `\n\nGoverning Principle/Formula:\n${qaResult.formulaOrRule}`
        : ""
    }\n\nContext:\n${qaResult.academicContext}`;

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!qaResult) return;
    onSaveNote({
      title: `Q&A: ${qaResult.question.slice(0, 50)}...`,
      type: "explanation",
      content: `${qaResult.conciseAnswer}\n\nKey Points:\n${qaResult.keyPoints
        .map((p) => `• ${p}`)
        .join("\n")}\n\nFormula/Principle: ${qaResult.formulaOrRule || "N/A"}\n\nAcademic Context: ${qaResult.academicContext}`,
      tags: [qaResult.category, qaResult.modelUsed.replace(/\s+/g, "")],
    });
    setSaved(true);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-6">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-200 border border-indigo-400/30 mb-3">
            <Zap className="h-3.5 w-3.5 text-amber-300" />
            Step 1 · Question & Answer (Q&A)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Provides smart answers to general knowledge and academic questions.
          </h1>
          <p className="text-sm sm:text-base text-indigo-200/90 mb-4">
            Powered by Google Gemini 1.5 Pro with smart reasoning for academic disciplines and general knowledge, with fast, concise distillation from LaMini-Flan-T5-783M.
          </p>

          {/* Model Engine Selector inside Hero */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-indigo-200 font-medium mr-1">AI Model:</span>
            <button
              type="button"
              onClick={() => setModelEngine("gemini")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all cursor-pointer ${
                modelEngine === "gemini"
                  ? "bg-indigo-400 text-slate-950 shadow-md ring-2 ring-indigo-300/40"
                  : "bg-white/10 text-indigo-100 hover:bg-white/20 border border-white/10"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Google Gemini 1.5 Pro (Primary Q&A)</span>
            </button>

            <button
              type="button"
              onClick={() => setModelEngine("lamini")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all cursor-pointer ${
                modelEngine === "lamini"
                  ? "bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300/40"
                  : "bg-white/10 text-indigo-100 hover:bg-white/20 border border-white/10"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>LaMini-Flan-T5-783M (Fast & Concise)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Input Box and Preset Questions */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        {/* Category Switcher */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCategory("academic")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                category === "academic"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Academic Questions</span>
            </button>

            <button
              type="button"
              onClick={() => setCategory("general")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                category === "general"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>General Knowledge & Logic</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tuned for concise responses</span>
          </div>
        </div>

        {/* Question Input */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block">
            Ask Your Question
          </label>
          <div className="relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder={
                category === "academic"
                  ? "e.g. Why does boiling water temperature stay constant during phase change?"
                  : "e.g. How does noise-cancellation work in plain English?"
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3.5 pl-4 pr-28 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100"
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading || !question.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Answering...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span>Ask</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Preset clickers */}
        <div className="pt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
            Popular {category === "academic" ? "Academic" : "General"} Queries (Click to try):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(category === "academic" ? ACADEMIC_PRESETS : GENERAL_PRESETS).map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(preset.question);
                  handleAsk(preset.question, category);
                }}
                className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-left text-xs font-medium text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:border-indigo-800 transition-colors cursor-pointer"
              >
                <span className="text-base">{preset.icon}</span>
                <div className="truncate flex-1">
                  <span className="block font-semibold text-slate-900 dark:text-white truncate">
                    {preset.question}
                  </span>
                  <span className="text-[10px] text-slate-400">{preset.category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Unable to fetch answer</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Answer Output View */}
      {qaResult && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {qaResult.modelUsed}
              </span>
              <span className="text-xs font-semibold text-slate-400 capitalize">
                {qaResult.category} Q&A
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSpeak(qaResult.conciseAnswer)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isSpeaking
                    ? "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-amber-500" /> : <Volume2 className="h-3.5 w-3.5" />}
                <span>{isSpeaking ? "Stop Voice" : "Listen"}</span>
              </button>

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                onClick={handleSave}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  saved
                    ? "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {saved ? <BookmarkCheck className="h-3.5 w-3.5 text-green-600" /> : <Bookmark className="h-3.5 w-3.5" />}
                <span>{saved ? "Saved in Notebook" : "Save"}</span>
              </button>
            </div>
          </div>

          {/* Concise Direct Answer Card */}
          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-white p-6 shadow-sm dark:border-indigo-900/40 dark:bg-gradient-to-br dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Direct Concise Answer
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {qaResult.conciseAnswer}
            </h3>
          </div>

          {/* Key Points Grid */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              High-Yield Key Points
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {qaResult.keyPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs sm:text-sm text-slate-800 dark:border-slate-800/80 dark:bg-slate-800/50 dark:text-slate-200 font-medium flex items-start gap-2.5"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Formula or Fundamental Rule Banner (if applicable) */}
          {qaResult.formulaOrRule && qaResult.formulaOrRule !== "N/A" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/30 flex items-start gap-3">
              <span className="text-lg">📐</span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 block">
                  Governing Formula / Scientific Principle:
                </span>
                <p className="text-sm font-mono font-bold text-amber-950 dark:text-amber-100 mt-1">
                  {qaResult.formulaOrRule}
                </p>
              </div>
            </div>
          )}

          {/* Academic Context / Significance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Academic Context & Why It Matters
            </span>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {qaResult.academicContext}
            </p>
          </div>

          {/* Suggested Next Questions */}
          {qaResult.suggestedQuestions && qaResult.suggestedQuestions.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                Suggested Next Questions
              </span>
              <div className="flex flex-wrap gap-2">
                {qaResult.suggestedQuestions.map((sug, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => {
                      setQuestion(sug);
                      handleAsk(sug, qaResult.category);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-700 transition-colors cursor-pointer text-left"
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
