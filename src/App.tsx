import React, { useState, useEffect } from "react";
import { StudyTab, SavedNote } from "./types";
import { Header } from "./components/Header";
import { LearningPipelineBanner } from "./components/LearningPipelineBanner";
import { QAView } from "./components/QAView";
import { ExplanationView } from "./components/ExplanationView";
import { SummarizerView } from "./components/SummarizerView";
import { QuizView } from "./components/QuizView";
import { LearningPathView } from "./components/LearningPathView";
import { NotebookView } from "./components/NotebookView";
import { TechStackView } from "./components/TechStackView";

const INITIAL_NOTEBOOK: SavedNote[] = [
  {
    id: "welcome-note",
    title: "Welcome to EduGenie Study Hub!",
    type: "explanation",
    content: "EduGenie helps students Ask → Understand → Practice → Summarize → Follow a Learning Path:\n\n1. Question & Answer (Q&A): Smart answers to general knowledge & academic questions (Gemini 1.5 Pro)\n2. Concept Explanation: Simple, concise plain-language breakdowns (LaMini-Flan-T5-783M)\n3. Quiz Generation: Creates 3 MCQs with 4 options each from given topic or passage (Gemini 1.5 Pro)\n4. Text Summarization: Converts long educational passages into short, clear summaries (Gemini 1.5 Pro)\n5. Personalized Learning Path: Structured plan from beginner to advanced with suggested resources (Gemini 1.5 Pro)",
    date: new Date().toLocaleDateString(),
    tags: ["EduGenie", "LaMini-Flan-T5", "Gemini1.5Pro"],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<StudyTab>("qa");
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("edugemini_theme") === "dark" ||
        (!localStorage.getItem("edugemini_theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  const [notes, setNotes] = useState<SavedNote[]>(() => {
    try {
      const saved = localStorage.getItem("edugemini_notes");
      return saved ? JSON.parse(saved) : INITIAL_NOTEBOOK;
    } catch {
      return INITIAL_NOTEBOOK;
    }
  });

  const [streak, setStreak] = useState<number>(() => {
    try {
      const s = localStorage.getItem("edugemini_streak");
      return s ? Number(s) : 3;
    } catch {
      return 3;
    }
  });

  // Cross-view state handoffs
  const [qaPrefillQuery, setQaPrefillQuery] = useState<string>("");
  const [quizPrefillTopic, setQuizPrefillTopic] = useState<string>("");

  // Sync dark class on document root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("edugemini_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("edugemini_theme", "light");
    }
  }, [isDark]);

  // Persist notes
  useEffect(() => {
    try {
      localStorage.setItem("edugemini_notes", JSON.stringify(notes));
    } catch {
      // storage limit handle
    }
  }, [notes]);

  const toggleDark = () => {
    setIsDark((prev) => !prev);
  };

  const handleSaveNote = (newNote: Omit<SavedNote, "id" | "date">) => {
    const note: SavedNote = {
      ...newNote,
      id: `note-${Date.now()}`,
      date: new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    setNotes((prev) => [note, ...prev]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotes = () => {
    if (confirm("Are you sure you want to clear your study notebook?")) {
      setNotes([]);
    }
  };

  // Handoff to Q&A
  const handleSendToQA = (query: string) => {
    setQaPrefillQuery(query);
    setActiveTab("qa");
  };

  // Handoff to Quiz from Explanation or Summarizer
  const handleGenerateQuizFromTopicOrText = (text: string) => {
    setQuizPrefillTopic(text);
    setActiveTab("quiz");
  };

  // Handoff from Path to Explain
  const handleExplainTopic = (topic: string) => {
    setActiveTab("explain");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Header bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={notes.length}
        streak={streak}
        isDark={isDark}
        toggleDark={toggleDark}
      />

      {/* Learning Cycle Pipeline Ribbon */}
      <LearningPipelineBanner
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Study Hub Container */}
      <main className="flex-1 pb-16">
        {activeTab === "qa" && (
          <QAView
            initialQuestion={qaPrefillQuery}
            onSaveNote={handleSaveNote}
            onSendToExplain={handleExplainTopic}
          />
        )}

        {activeTab === "explain" && (
          <ExplanationView
            onSaveNote={handleSaveNote}
            onSendToTutor={handleSendToQA}
            onGenerateQuizFromTopic={handleGenerateQuizFromTopicOrText}
          />
        )}

        {activeTab === "quiz" && (
          <QuizView
            initialTopic={quizPrefillTopic}
            onSaveNote={handleSaveNote}
            onSendToTutor={handleSendToQA}
          />
        )}

        {activeTab === "summarize" && (
          <SummarizerView
            onSaveNote={handleSaveNote}
            onGenerateQuizFromText={handleGenerateQuizFromTopicOrText}
            onSendToTutor={handleSendToQA}
          />
        )}

        {activeTab === "path" && (
          <LearningPathView
            onSaveNote={handleSaveNote}
            onSendToTutor={handleSendToQA}
            onExplainTopic={handleExplainTopic}
          />
        )}

        {activeTab === "notebook" && (
          <NotebookView
            notes={notes}
            onDeleteNote={handleDeleteNote}
            onClearAll={handleClearAllNotes}
            onSendToTutor={handleSendToQA}
          />
        )}

        {activeTab === "tech_stack" && (
          <TechStackView />
        )}
      </main>

      {/* Minimalistic footer */}
      <footer className="border-t border-slate-200/80 bg-white/50 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} EduGenie · Dual AI Engine: Google Gemini 1.5 Pro & LaMini-Flan-T5-783M</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>FastAPI Backend + HTML/CSS Frontend</span>
            <span>·</span>
            <span>Ask → Understand → Practice → Summarize → Follow a Learning Path</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
