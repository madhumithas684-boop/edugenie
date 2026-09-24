import React, { useState } from "react";
import { SummaryResult, SavedNote } from "../types";
import {
  FileText,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  RotateCw,
  Columns,
  List,
  Layers,
  HelpCircle,
  Loader2,
  AlertTriangle,
  ArrowRight,
  BookOpen
} from "lucide-react";

interface SummarizerViewProps {
  onSaveNote: (note: Omit<SavedNote, "id" | "date">) => void;
  onGenerateQuizFromText: (text: string) => void;
  onSendToTutor: (query: string) => void;
}

const SAMPLE_TEXTS = [
  {
    title: "Cellular Respiration & ATP Production",
    category: "Biology",
    text: `Cellular respiration is a set of metabolic reactions and processes that take place in the cells of organisms to convert biochemical energy from nutrients into adenosine triphosphate (ATP), and then release waste products. The catabolic reactions involved include glycolysis, the citric acid cycle (Krebs cycle), and oxidative phosphorylation via the electron transport chain.

Glycolysis occurs in the cytosol and does not require oxygen (anaerobic). During glycolysis, one six-carbon glucose molecule is broken down into two three-carbon pyruvate molecules, netting 2 ATP and 2 NADH. In the presence of oxygen, pyruvate moves into the mitochondrial matrix, where it is converted into Acetyl-CoA.

Acetyl-CoA enters the Krebs cycle, releasing CO2 while producing NADH, FADH2, and 2 additional ATP per glucose molecule. Finally, oxidative phosphorylation occurs along the inner mitochondrial membrane. Electrons from NADH and FADH2 travel along proteins of the electron transport chain, pumping protons (H+) into the intermembrane space. This creates an electrochemical proton gradient that drives ATP synthase to produce approximately 26 to 28 ATP molecules through chemiosmosis. Thus, one glucose molecule yields roughly 30 to 32 ATP molecules in total under aerobic conditions.`,
  },
  {
    title: "Operating Systems: Concurrency & Deadlocks",
    category: "Computer Science",
    text: `In modern operating systems, concurrency refers to executing multiple instruction sequences simultaneously. Multithreading allows programs to perform concurrent operations within a shared memory space, greatly improving responsiveness and resource utilization. However, concurrent access to shared mutable resources introduces race conditions, where the outcome depends on the non-deterministic scheduling order of threads.

To ensure mutual exclusion, synchronization primitives such as mutex locks, semaphores, and condition variables are employed. If synchronization is designed improperly, processes can enter a deadlock—a state where each process in a set is permanently waiting for a resource held by another process in the set.

According to Coffman's conditions, a deadlock can occur if and only if four conditions hold simultaneously:
1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.
2. Hold and Wait: A process must be holding at least one resource while waiting to acquire additional resources held by other processes.
3. No Preemption: Resources cannot be forcibly seized; they can only be released voluntarily by the holding process.
4. Circular Wait: A closed chain of processes exists such that each process holds at least one resource needed by the next process in the chain.
Operating systems mitigate deadlocks through prevention, avoidance (such as Dijkstra's Banker's algorithm), detection, or recovery via process termination.`,
  },
];

export const SummarizerView: React.FC<SummarizerViewProps> = ({
  onSaveNote,
  onGenerateQuizFromText,
  onSendToTutor,
}) => {
  const [inputText, setInputText] = useState("");
  const [activeFormat, setActiveFormat] = useState<"cornell" | "bullets" | "flashcards" | "glossary">("cornell");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);

  // Flashcards state
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSummarize = async (contentToSummarize?: string) => {
    const target = contentToSummarize || inputText;
    if (!target.trim() || target.trim().length < 10) return;

    setLoading(true);
    setError(null);
    setSaved(false);
    setFlippedCards({});

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: target,
          format: activeFormat,
          targetLength: "medium",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate summary");
      }

      const data: SummaryResult = await res.json();
      setSummary(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to summarize text.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCardFlip = (idx: number) => {
    setFlippedCards((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSave = () => {
    if (!summary) return;
    onSaveNote({
      title: summary.documentTitle || "Study Notes Summary",
      type: "summary",
      content: `${summary.quickTLDR}\n\nKey Takeaways:\n${summary.keyTakeaways.map((t) => `• ${t}`).join("\n")}`,
      tags: ["Summary", "Notes"],
    });
    setSaved(true);
  };

  const handleCopy = () => {
    if (!summary) return;
    const text = `# ${summary.documentTitle}\n\n## Quick TL;DR\n${summary.quickTLDR}\n\n## Key Takeaways\n${summary.keyTakeaways
      .map((t) => `- ${t}`)
      .join("\n")}\n\n## Glossary\n${summary.glossaryTerms
      .map((g) => `**${g.term}**: ${g.definition}`)
      .join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-200 border border-indigo-400/30 mb-3">
            <FileText className="h-3.5 w-3.5 text-amber-300" />
            Step 4 · Text Summarization (Gemini 1.5 Pro)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Converts long educational passages into short, clear summaries for quick revision.
          </h1>
          <p className="text-sm sm:text-base text-indigo-200/90 mb-6">
            Powered by Google Gemini 1.5 Pro. Paste lecture notes, research articles, or textbook chapters. EduGenie converts long passages into concise TL;DR overviews, high-yield takeaways, flashcards, and Cornell notes for rapid review.
          </p>

          {/* Quick sample chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-indigo-200 font-medium">Try a sample text:</span>
            {SAMPLE_TEXTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(sample.text);
                  handleSummarize(sample.text);
                }}
                className="rounded-xl bg-white/10 px-3 py-1 text-indigo-100 hover:bg-white/20 border border-white/10 transition-colors cursor-pointer"
              >
                📄 {sample.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Text Box */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            Paste Study Material or Notes
          </label>
          <span className="text-xs text-slate-400">
            {inputText.trim() ? `${inputText.trim().split(/\s+/).length} words` : "0 words"}
          </span>
        </div>

        <textarea
          rows={6}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste textbook sections, lecture transcripts, syllabus articles, or personal study notes here..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:border-indigo-500"
        />

        {/* Action Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Powered by Google Gemini 1.5 Pro</span>
          </div>

          <button
            onClick={() => handleSummarize()}
            disabled={loading || inputText.trim().length < 10}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Summarizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Summarize Notes</span>
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
            <p className="font-semibold">Summarization Error</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Output */}
      {summary && !loading && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Summary Results
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {summary.documentTitle}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy All"}</span>
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
                <span>{saved ? "Saved" : "Save in Notebook"}</span>
              </button>
            </div>
          </div>

          {/* Quick TL;DR Card */}
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/40 p-5 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-amber-900/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1.5 flex items-center gap-1.5">
              <span>⚡</span> Executive TL;DR
            </h3>
            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
              {summary.quickTLDR}
            </p>
          </div>

          {/* Format View Switcher Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
            {[
              { id: "cornell", label: "Cornell Notes View", icon: Columns },
              { id: "bullets", label: "Core Takeaways", icon: List },
              { id: "flashcards", label: `Interactive Flashcards (${summary.flashcards.length})`, icon: Layers },
              { id: "glossary", label: `Glossary (${summary.glossaryTerms.length})`, icon: HelpCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFormat === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFormat(tab.id as any)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cornell Notes Tab */}
          {activeFormat === "cornell" && summary.cornellNotes && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cue Column */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-3">
                    Cue Column / Key Questions
                  </h4>
                  <ul className="space-y-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {summary.cornellNotes.cueColumn.map((cue, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{cue}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Notes Column */}
                <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                    Concise Study Notes
                  </h4>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                    {summary.cornellNotes.notesColumn.map((note, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-slate-400 font-bold">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Summary Column */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/80">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-1.5">
                  Summary Synthesis
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {summary.cornellNotes.summary}
                </p>
              </div>
            </div>
          )}

          {/* Bullets Tab */}
          {activeFormat === "bullets" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                High-Yield Key Takeaways
              </h3>
              <div className="space-y-2.5">
                {summary.keyTakeaways.map((takeaway, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                      {i + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
                      {takeaway}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flashcards Tab */}
          {activeFormat === "flashcards" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Click any card to flip between Question and Answer</span>
                <span>{summary.flashcards.length} Flashcards</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.flashcards.map((card, idx) => {
                  const isFlipped = flippedCards[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCardFlip(idx)}
                      className={`group min-h-[160px] rounded-2xl border p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 select-none shadow-sm hover:shadow-md ${
                        isFlipped
                          ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/40"
                          : "border-slate-200 bg-white hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-900"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isFlipped
                                ? "bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200"
                                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            }`}
                          >
                            {isFlipped ? "Answer" : "Question"}
                          </span>
                          <RotateCw className="h-3.5 w-3.5 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                          {isFlipped ? card.back : card.front}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Card #{idx + 1}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
                          Tap to {isFlipped ? "see question" : "reveal answer"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Glossary Tab */}
          {activeFormat === "glossary" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary.glossaryTerms.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                    {item.term}
                  </h4>
                  <p className="mt-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {item.definition}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Next Steps Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Transform these notes into active practice:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onGenerateQuizFromText(inputText)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
              >
                <span>Generate Quiz from Notes</span>
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                onClick={() => onSendToTutor(`Help me master this topic: ${summary.documentTitle}`)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <span>Discuss with Tutor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
