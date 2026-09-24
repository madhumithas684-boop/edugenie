import React, { useState } from "react";
import { ExplanationResult, SavedNote } from "../types";
import { speakText, stopSpeaking } from "../utils/speech";
import {
  Lightbulb,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
  Brain,
  Globe,
  Loader2,
  Copy,
  Check
} from "lucide-react";

interface ExplanationViewProps {
  onSaveNote: (note: Omit<SavedNote, "id" | "date">) => void;
  onSendToTutor: (topic: string) => void;
  onGenerateQuizFromTopic: (topic: string) => void;
}

const PRESET_TOPICS = [
  { topic: "Quantum Superposition & Schrödinger's Cat", category: "Physics", icon: "⚛️" },
  { topic: "How Neural Networks Actually Learn", category: "AI & Tech", icon: "🧠" },
  { topic: "Photosynthesis: Light vs Dark Reactions", category: "Biology", icon: "🌿" },
  { topic: "Inflation, Interest Rates & The Central Bank", category: "Economics", icon: "📈" },
  { topic: "CRISPR-Cas9 Gene Editing Mechanism", category: "Biotech", icon: "🧬" },
  { topic: "How Blockchain & Proof of Work Work", category: "Computing", icon: "🔗" },
];

export const ExplanationView: React.FC<ExplanationViewProps> = ({
  onSaveNote,
  onSendToTutor,
  onGenerateQuizFromTopic,
}) => {
  const [topicInput, setTopicInput] = useState("");
  const [level, setLevel] = useState<"eli5" | "high_school" | "undergrad">("high_school");
  const [modelEngine, setModelEngine] = useState<"lamini" | "gemini">("lamini");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResult | null>(null);

  // Interactive checkpoint state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchExplanation = async (targetTopic: string) => {
    if (!targetTopic.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedOption(null);
    setHasAnswered(false);
    setSaved(false);
    stopSpeaking();
    setIsSpeaking(false);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: targetTopic,
          level: level === "eli5" ? "elementary" : level === "undergrad" ? "undergrad" : "high_school",
          format: "balanced",
          model: modelEngine,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate explanation");
      }

      const data: ExplanationResult = await res.json();
      setExplanation(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while explaining this concept.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExplanation(topicInput);
  };

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else if (explanation) {
      setIsSpeaking(true);
      const speechText = `${explanation.title}. ${explanation.simplifiedSummary}. Here is an analogy: ${explanation.coreAnalogy}`;
      speakText(speechText, () => setIsSpeaking(false));
    }
  };

  const handleCopy = () => {
    if (!explanation) return;
    const textToCopy = `# ${explanation.title}\n\n${explanation.simplifiedSummary}\n\n### Core Analogy\n${explanation.coreAnalogy}\n\n### Key Breakdown\n${explanation.keyBreakdown
      .map((b) => `${b.stepNumber}. **${b.heading}**: ${b.explanation}`)
      .join("\n")}\n\n### Real-World Application\n${explanation.realWorldApplication}\n\n### Memory Trick\n${explanation.memoryTrick}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!explanation) return;
    onSaveNote({
      title: explanation.title,
      type: "explanation",
      content: `${explanation.simplifiedSummary}\n\nAnalogy: ${explanation.coreAnalogy}\n\nMemory Trick: ${explanation.memoryTrick}`,
      tags: ["Explanation", level],
    });
    setSaved(true);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-6">
      {/* Top Hero Card */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-200 border border-indigo-400/30 mb-3">
            <Lightbulb className="h-3.5 w-3.5 text-amber-300" />
            Step 2 · Concept Explanation (LaMini-Flan-T5-783M)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Explains complex topics in simple, concise, and easy-to-understand language.
          </h1>
          <p className="text-sm sm:text-base text-indigo-200/90 mb-6">
            Powered by LaMini-Flan-T5-783M: an instruction-distilled model designed to demystify complex subjects with intuitive real-world analogies, straightforward breakdowns, and zero fluff.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g., Quantum Superposition, Photosynthesis, Fourier Transform..."
                  className="w-full rounded-2xl bg-white/10 border border-white/20 pl-11 pr-4 py-3 text-sm text-white placeholder:text-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/15 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !topicInput.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Explaining...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Explain Now</span>
                  </>
                )}
              </button>
            </div>

            {/* Depth Level and AI Model Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-indigo-200 font-medium">Audience Level:</span>
                {[
                  { id: "eli5", label: "🧒 ELI5 (Simple)" },
                  { id: "high_school", label: "🏫 High School" },
                  { id: "undergrad", label: "🎓 College Depth" },
                ].map((lvl) => (
                  <button
                    type="button"
                    key={lvl.id}
                    onClick={() => setLevel(lvl.id as any)}
                    className={`rounded-xl px-3 py-1 font-semibold transition-all cursor-pointer ${
                      level === lvl.id
                        ? "bg-white text-indigo-900 shadow-sm"
                        : "bg-white/10 text-indigo-100 hover:bg-white/20"
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-indigo-200 font-medium">AI Model:</span>
                <button
                  type="button"
                  onClick={() => setModelEngine("lamini")}
                  className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 font-bold transition-all cursor-pointer ${
                    modelEngine === "lamini"
                      ? "bg-amber-400 text-slate-950 shadow-md"
                      : "bg-white/10 text-indigo-100 hover:bg-white/20"
                  }`}
                  title="LaMini-Flan-T5-783M distilled model for simple, concise explanations"
                >
                  <span>⚡ LaMini-Flan-T5-783M (Concept Engine)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModelEngine("gemini")}
                  className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 font-bold transition-all cursor-pointer ${
                    modelEngine === "gemini"
                      ? "bg-indigo-400 text-slate-950 shadow-md"
                      : "bg-white/10 text-indigo-100 hover:bg-white/20"
                  }`}
                  title="Google Gemini 1.5 Pro advanced reasoning"
                >
                  <span>✨ Google Gemini 1.5 Pro</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Preset Topics carousel */}
      {!explanation && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Popular Concepts to Explore
            </h3>
            <span className="text-xs text-indigo-600 dark:text-indigo-400">Click any topic</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESET_TOPICS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTopicInput(item.topic);
                  fetchExplanation(item.topic);
                }}
                className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600 transition-all cursor-pointer"
              >
                <span className="text-2xl p-1 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {item.topic}
                  </h4>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Unable to explain this topic</p>
            <p className="text-xs mt-1 text-red-700 dark:text-red-300/80">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      )}

      {/* Explanation Results */}
      {explanation && !loading && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Explanation · {level === "eli5" ? "ELI5 (5yo)" : level === "undergrad" ? "College In-Depth" : "High School"}
                </span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                  {explanation.modelUsed || (modelEngine === "lamini" ? "LaMini-Flan-T5" : "Google Gemini 1.5 Pro")}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {explanation.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleSpeech}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isSpeaking
                    ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-amber-600" /> : <Volume2 className="h-3.5 w-3.5" />}
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

          {/* Quick Summary Card */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/30">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1.5">
              <Brain className="h-4 w-4" />
              Intuitive Overview
            </h3>
            <p className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
              {explanation.simplifiedSummary}
            </p>
          </div>

          {/* Analogy & Memory Hook 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Core Analogy */}
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-amber-100/40 p-5 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-amber-900/20">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2">
                <span className="text-base">💡</span>
                <span>The Golden Analogy</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {explanation.coreAnalogy}
              </p>
            </div>

            {/* Memory Trick */}
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 p-5 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-emerald-900/20">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-2">
                <span className="text-base">🧠</span>
                <span>Memory Hook (How to Remember It)</span>
              </div>
              <p className="text-sm font-semibold leading-relaxed text-emerald-900 dark:text-emerald-200">
                "{explanation.memoryTrick}"
              </p>
            </div>
          </div>

          {/* Step-by-Step Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Step-by-Step Breakdown
            </h3>
            <div className="space-y-3">
              {explanation.keyBreakdown.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white shadow-sm">
                    {step.stepNumber || idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {step.heading}
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {step.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real World Application & Common Pitfalls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Real World */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                <Globe className="h-4 w-4 text-indigo-500" />
                <span>Real-World Application</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {explanation.realWorldApplication}
              </p>
            </div>

            {/* Pitfalls */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Common Pitfalls & Misconceptions</span>
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {explanation.commonPitfalls.map((pitfall, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✕</span>
                    <span>{pitfall}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interactive Checkpoint Comprehension Check */}
          {explanation.checkpointQuestion && (
            <div className="rounded-3xl border border-indigo-200 bg-gradient-to-b from-indigo-50/50 to-white p-5 sm:p-6 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-slate-900">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  <HelpCircle className="h-4 w-4" />
                  Instant Concept Checkpoint
                </span>
                {hasAnswered && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      selectedOption === explanation.checkpointQuestion.correctIndex
                        ? "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                    }`}
                  >
                    {selectedOption === explanation.checkpointQuestion.correctIndex
                      ? "✓ Correct! +10 XP"
                      : "✕ Review Needed"}
                  </span>
                )}
              </div>

              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-4">
                {explanation.checkpointQuestion.question}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {explanation.checkpointQuestion.options.map((opt, oIdx) => {
                  const isCorrect = oIdx === explanation.checkpointQuestion.correctIndex;
                  const isSelected = selectedOption === oIdx;

                  let btnStyle =
                    "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-indigo-600";
                  if (hasAnswered) {
                    if (isCorrect) {
                      btnStyle =
                        "border-green-400 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950/50 dark:text-green-200 ring-2 ring-green-500/30";
                    } else if (isSelected) {
                      btnStyle =
                        "border-red-400 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200";
                    } else {
                      btnStyle = "opacity-50 border-slate-200 dark:border-slate-800";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={hasAnswered}
                      onClick={() => {
                        setSelectedOption(oIdx);
                        setHasAnswered(true);
                      }}
                      className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left text-xs sm:text-sm font-medium transition-all cursor-pointer ${btnStyle}`}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold dark:border-slate-600">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Rationale display */}
              {hasAnswered && (
                <div className="mt-4 rounded-xl bg-slate-100 p-3.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white">Explanation: </span>
                  {explanation.checkpointQuestion.explanation}
                </div>
              )}
            </div>
          )}

          {/* Next Action Prompts */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Ready to reinforce this concept?
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onSendToTutor(explanation.title)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
              >
                <span>Ask AI Tutor Questions</span>
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                onClick={() => onGenerateQuizFromTopic(explanation.title)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <span>Generate 5-Question Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
