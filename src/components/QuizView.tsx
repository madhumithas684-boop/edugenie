import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { QuizResult, SavedNote } from "../types";
import {
  HelpCircle,
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Timer,
  Lightbulb,
  Check,
  Flame
} from "lucide-react";

interface QuizViewProps {
  initialTopic?: string;
  onSaveNote: (note: Omit<SavedNote, "id" | "date">) => void;
  onSendToTutor: (query: string) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  initialTopic = "",
  onSaveNote,
  onSendToTutor,
}) => {
  const [inputMode, setInputMode] = useState<"text" | "topic">("text");
  const [topicOrText, setTopicOrText] = useState(initialTopic);
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizResult | null>(null);

  const SAMPLE_PASSAGES = [
    {
      title: "🌿 Cellular Respiration (Biology)",
      text: "Cellular respiration is a set of metabolic reactions that take place in the cells of organisms to convert biochemical energy from nutrients into adenosine triphosphate (ATP), and then release waste products. Catabolic reactions include glycolysis, the citric acid cycle (Krebs cycle), and oxidative phosphorylation. Glycolysis occurs in the cytosol without oxygen, producing a net 2 ATP and 2 NADH. The citric acid cycle takes place in the mitochondrial matrix, producing NADH and FADH2 which donate electrons to the electron transport chain located in the inner mitochondrial membrane, driving ATP synthesis via chemiosmosis.",
    },
    {
      title: "⚛️ Newton's Laws & Momentum (Physics)",
      text: "Newton's First Law states that an object will remain at rest or in uniform motion in a straight line unless acted upon by an external force (inertia). Newton's Second Law defines force as the time rate of change of momentum, commonly written as F = ma for constant mass. Newton's Third Law states that for every action, there is an equal and opposite reaction. Linear momentum (p = mv) is conserved in any closed system where no net external force acts, a principle vital in analyzing collisions.",
    },
    {
      title: "🤖 Transformer Self-Attention (AI)",
      text: "The Transformer architecture relies on multi-head self-attention mechanisms to compute representations of sequences without recurrence or convolutions. Given an input sequence, query (Q), key (K), and value (V) vectors are computed via linear projections. Scaled dot-product attention computes Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V. This permits every token in the input to attend directly to every other token simultaneously, eliminating the sequential bottleneck of RNNs and enabling massive parallel training on modern GPU clusters.",
    },
  ];

  // Quiz running state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [saved, setSaved] = useState(false);

  // Sync if initialTopic changes externally
  useEffect(() => {
    if (initialTopic) {
      setTopicOrText(initialTopic);
    }
  }, [initialTopic]);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (quiz && !quizSubmitted) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quiz, quizSubmitted]);

  const handleGenerateQuiz = async (overrideTopic?: string) => {
    const target = overrideTopic || topicOrText;
    if (!target.trim()) return;

    setLoading(true);
    setError(null);
    setQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setRevealedHints({});
    setQuizSubmitted(false);
    setSecondsElapsed(0);
    setSaved(false);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicOrText: target,
          count: questionCount,
          difficulty,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate quiz");
      }

      const data: QuizResult = await res.json();
      setQuiz(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate quiz questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const toggleHint = () => {
    setRevealedHints((prev) => ({
      ...prev,
      [currentQuestionIndex]: !prev[currentQuestionIndex],
    }));
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    return quiz.questions.reduce((acc, q, idx) => {
      return selectedAnswers[idx] === q.correctIndex ? acc + 1 : acc;
    }, 0);
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    const score = calculateScore();
    const total = quiz?.questions.length || 1;
    const percentage = (score / total) * 100;

    if (percentage >= 70) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleSaveQuizReport = () => {
    if (!quiz) return;
    const score = calculateScore();
    onSaveNote({
      title: `${quiz.quizTitle} (Score: ${score}/${quiz.questions.length})`,
      type: "quiz_result",
      content: `Completed quiz in ${Math.floor(secondsElapsed / 60)}m ${secondsElapsed % 60}s.\nScore: ${score}/${quiz.questions.length} (${Math.round((score / quiz.questions.length) * 100)}%)\nDifficulty: ${quiz.difficulty}`,
      tags: ["Quiz", quiz.difficulty],
    });
    setSaved(true);
  };

  const currentQ = quiz?.questions[currentQuestionIndex];
  const allAnswered = quiz ? quiz.questions.every((_, idx) => selectedAnswers[idx] !== undefined) : false;

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-200 border border-indigo-400/30 mb-3">
            <HelpCircle className="h-3.5 w-3.5 text-amber-300" />
            Step 3 · Quiz Generation (Gemini 1.5 Pro)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Creates 3 MCQ questions, with 4 options each, from a given topic or passage.
          </h1>
          <p className="text-sm sm:text-base text-indigo-200/90 mb-4">
            Powered by Google Gemini 1.5 Pro. Paste any educational passage, article excerpt, or topic name to instantly generate 3 high-yield multiple-choice questions with 4 options each, instant grading, hints, and step-by-step explanations.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-indigo-200 font-medium mr-1">Input Source:</span>
            <button
              type="button"
              onClick={() => setInputMode("text")}
              className={`rounded-xl px-3 py-1 font-bold transition-all cursor-pointer ${
                inputMode === "text"
                  ? "bg-amber-400 text-slate-950 shadow-md"
                  : "bg-white/10 text-indigo-100 hover:bg-white/20"
              }`}
            >
              📄 From Given Text / Passage
            </button>
            <button
              type="button"
              onClick={() => setInputMode("topic")}
              className={`rounded-xl px-3 py-1 font-bold transition-all cursor-pointer ${
                inputMode === "topic"
                  ? "bg-amber-400 text-slate-950 shadow-md"
                  : "bg-white/10 text-indigo-100 hover:bg-white/20"
              }`}
            >
              🎯 From Concept / Subject
            </button>
          </div>
        </div>
      </div>

      {/* Generator Form */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        {/* If text mode, show quick sample passages */}
        {inputMode === "text" && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Load Sample Educational Passage (Click to try):
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PASSAGES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopicOrText(sample.text)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/70 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-700 transition-colors cursor-pointer"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 block">
            {inputMode === "text"
              ? "Paste Educational Text / Reading Passage"
              : "Enter Subject / Topic Name"}
          </label>
          <textarea
            rows={inputMode === "text" ? 5 : 3}
            value={topicOrText}
            onChange={(e) => setTopicOrText(e.target.value)}
            placeholder={
              inputMode === "text"
                ? "Paste a paragraph, textbook section, or lecture summary here to generate questions directly from the text..."
                : "e.g. Thermodynamics laws, JavaScript Closures, or Organic Chemistry..."
            }
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:border-indigo-500 font-mono text-xs sm:text-sm"
          />
        </div>

        {/* Configurations row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Number of questions */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Questions:</span>
              {[3, 5, 8].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`rounded-lg px-2.5 py-1 font-bold transition-colors cursor-pointer ${
                    questionCount === num
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Difficulty */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Difficulty:</span>
              {[
                { id: "easy", label: "Easy" },
                { id: "medium", label: "Medium" },
                { id: "hard", label: "Hard" },
              ].map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setDifficulty(diff.id as any)}
                  className={`rounded-lg px-2.5 py-1 font-bold transition-colors cursor-pointer ${
                    difficulty === diff.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleGenerateQuiz()}
            disabled={loading || !topicOrText.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Crafting Quiz...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Generate Quiz</span>
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
            <p className="font-semibold">Quiz Generation Failed</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Active Quiz Runner */}
      {quiz && !quizSubmitted && currentQ && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          {/* Top Bar: Progress and Timer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {quiz.quizTitle} · {quiz.difficulty.toUpperCase()}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </span>
                <span className="text-xs text-slate-400">
                  ({Object.keys(selectedAnswers).length}/{quiz.questions.length} answered)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Timer className="h-3.5 w-3.5 text-indigo-500" />
                <span>
                  {Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, "0")}
                </span>
              </div>

              <button
                type="button"
                onClick={toggleHint}
                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 transition-colors cursor-pointer"
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <span>{revealedHints[currentQuestionIndex] ? "Hide Hint" : "Need Hint?"}</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Hint alert */}
          {revealedHints[currentQuestionIndex] && currentQ.hint && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              <span className="font-bold">💡 Hint: </span>
              {currentQ.hint}
            </div>
          )}

          {/* Question Text */}
          <div className="py-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.question}
            </h3>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-100"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-slate-700"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium leading-relaxed flex-1">
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation between questions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Previous
            </button>

            {/* Question dots */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] px-1">
              {quiz.questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === currentQuestionIndex
                      ? "w-6 bg-indigo-600"
                      : selectedAnswers[idx] !== undefined
                      ? "w-2.5 bg-indigo-300 dark:bg-indigo-700"
                      : "w-2.5 bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              ))}
            </div>

            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-5 py-2 text-xs font-bold text-white hover:bg-green-700 shadow-sm transition-colors cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Finish & Submit</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz Submitted Score & Comprehensive Review */}
      {quiz && quizSubmitted && (
        <div className="space-y-6">
          {/* Score card */}
          {(() => {
            const score = calculateScore();
            const total = quiz.questions.length;
            const percentage = Math.round((score / total) * 100);

            return (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center space-y-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 mb-1">
                  <Trophy className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    Quiz Completed!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    You scored <span className="font-bold text-indigo-600 dark:text-indigo-400">{score}</span> out of{" "}
                    <span className="font-bold">{total}</span> ({percentage}%) in{" "}
                    {Math.floor(secondsElapsed / 60)}m {secondsElapsed % 60}s.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleSaveQuizReport}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                      saved
                        ? "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {saved ? <BookmarkCheck className="h-3.5 w-3.5 text-green-600" /> : <Bookmark className="h-3.5 w-3.5" />}
                    <span>{saved ? "Saved in Notebook" : "Save Result"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAnswers({});
                      setCurrentQuestionIndex(0);
                      setQuizSubmitted(false);
                      setSecondsElapsed(0);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retake Quiz</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Answer Review & Deep Explanations
            </h3>

            {quiz.questions.map((q, idx) => {
              const userAnswer = selectedAnswers[idx];
              const isCorrect = userAnswer === q.correctIndex;

              return (
                <div
                  key={idx}
                  className={`rounded-2xl border p-5 space-y-3 ${
                    isCorrect
                      ? "border-green-200 bg-green-50/40 dark:border-green-950/60 dark:bg-green-950/20"
                      : "border-red-200 bg-red-50/40 dark:border-red-950/60 dark:bg-red-950/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {q.question}
                      </h4>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 ${
                        isCorrect
                          ? "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300"
                      }`}
                    >
                      {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      <span>{isCorrect ? "Correct" : "Incorrect"}</span>
                    </span>
                  </div>

                  {/* Options review */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, optIdx) => {
                      const isThisCorrect = optIdx === q.correctIndex;
                      const wasSelected = userAnswer === optIdx;

                      let itemStyle = "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
                      if (isThisCorrect) {
                        itemStyle = "border-green-400 bg-green-100 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-200 font-bold";
                      } else if (wasSelected && !isCorrect) {
                        itemStyle = "border-red-400 bg-red-100 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200 line-through";
                      }

                      return (
                        <div key={optIdx} className={`rounded-xl border p-2.5 flex items-center gap-2 ${itemStyle}`}>
                          <span className="font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                          <span>{opt}</span>
                          {isThisCorrect && <span className="ml-auto text-green-700 dark:text-green-300 text-[10px]">✓ Answer</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation box */}
                  <div className="rounded-xl bg-white/80 p-3.5 text-xs text-slate-700 dark:bg-slate-900/80 dark:text-slate-300 leading-relaxed border border-slate-200/80 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white">Explanation: </span>
                    {q.explanation}
                  </div>

                  {/* Ask tutor button if missed */}
                  {!isCorrect && (
                    <button
                      onClick={() =>
                        onSendToTutor(
                          `I missed this question on ${quiz.quizTitle}: "${q.question}". The correct answer is "${q.options[q.correctIndex]}". Can you explain the intuition to me?`
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      <span>Ask AI Tutor to break this down</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
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
