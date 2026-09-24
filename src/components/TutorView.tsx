import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { TutorMessage, SavedNote } from "../types";
import { speakText, stopSpeaking } from "../utils/speech";
import {
  MessageSquareCode,
  Send,
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Edit3,
  Loader2,
  HelpCircle,
  Lightbulb,
  GraduationCap
} from "lucide-react";

interface TutorViewProps {
  initialQuery?: string;
  onSaveNote: (note: Omit<SavedNote, "id" | "date">) => void;
}

const SUBJECT_PRESETS = [
  { id: "STEM", label: "STEM & Physics", icon: "⚛️" },
  { id: "Coding", label: "Computer Science", icon: "💻" },
  { id: "Biology", label: "Biology & Med", icon: "🧬" },
  { id: "Economics", label: "Economics & Math", icon: "📈" },
  { id: "General", label: "General Studies", icon: "🎓" },
];

export const TutorView: React.FC<TutorViewProps> = ({
  initialQuery = "",
  onSaveNote,
}) => {
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hello! I'm your **EduGemini 1-on-1 Learning Assistant**. Ask me to explain a tricky step, review a concept, or test your reasoning. You can also pick a subject or switch to **Socratic Mode** where I guide you with questions!",
      timestamp: "Just now",
      suggestedFollowUps: [
        "Explain Euler's identity in simple terms",
        "How do transformers in AI process attention?",
        "Why does fractional reserve banking work?",
      ],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [tutorStyle, setTutorStyle] = useState<"interactive" | "socratic" | "concise" | "eli5">("interactive");
  const [currentSubject, setCurrentSubject] = useState("General");
  const [loading, setLoading] = useState(false);

  // Scratchpad
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [scratchpadText, setScratchpadText] = useState("");

  // Speech states
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle external initial query
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim());
    }
  }, [initialQuery]);

  // Web speech recognition setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsRecording(false);
        };

        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please type your question.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || loading) return;

    stopSpeaking();
    setSpeakingMessageId(null);

    const userMessage: TutorMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/tutor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, text: m.text })),
          tutorStyle,
          currentSubject,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get tutor response");
      }

      const data = await res.json();
      const modelMessage: TutorMessage = {
        id: `m-${Date.now()}`,
        role: "model",
        text: data.replyMarkdown || "Here is what you need to know.",
        quickKeyTakeaway: data.quickKeyTakeaway,
        suggestedFollowUps: data.suggestedFollowUps,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMessage: TutorMessage = {
        id: `err-${Date.now()}`,
        role: "model",
        text: `**I encountered a hiccup:** ${err.message || "Please try asking again."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (speakingMessageId === msgId) {
      stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      setSpeakingMessageId(msgId);
      speakText(text, () => setSpeakingMessageId(null));
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToNotebook = (msg: TutorMessage) => {
    onSaveNote({
      title: `Tutor Discussion: ${msg.quickKeyTakeaway || msg.text.slice(0, 40)}...`,
      type: "explanation",
      content: msg.text,
      tags: ["TutorChat", currentSubject],
    });
    setSavedId(msg.id);
    setTimeout(() => setSavedId(null), 2500);
  };

  const handleClearChat = () => {
    stopSpeaking();
    setSpeakingMessageId(null);
    setMessages([
      {
        id: "reset",
        role: "model",
        text: "New session started! What topic or homework problem are we tackling today?",
        timestamp: "Just now",
        suggestedFollowUps: [
          "Help me understand recursion with a visual example",
          "Can you give me a practice problem on Bayes Theorem?",
          "Explain the difference between DNA and RNA",
        ],
      },
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Top Controller Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Interactive AI Tutor
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Subject: <span className="font-semibold text-indigo-600">{currentSubject}</span> · Style:{" "}
                <span className="font-semibold capitalize">{tutorStyle}</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScratchpad(!showScratchpad)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                showScratchpad
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{showScratchpad ? "Hide Scratchpad" : "Chalkboard"}</span>
            </button>

            <button
              onClick={handleClearChat}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Subjects & Pedagogy Styles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Subject Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Subject:</span>
            {SUBJECT_PRESETS.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setCurrentSubject(sub.label)}
                className={`rounded-xl px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  currentSubject === sub.label
                    ? "bg-indigo-600 text-white font-bold"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <span>{sub.icon}</span> {sub.label}
              </button>
            ))}
          </div>

          {/* Tutoring Style Mode */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Tutor Mode:</span>
            {[
              { id: "interactive", label: "Interactive" },
              { id: "socratic", label: "Socratic (Questions)" },
              { id: "concise", label: "Concise" },
              { id: "eli5", label: "ELI5" },
            ].map((style) => (
              <button
                key={style.id}
                onClick={() => setTutorStyle(style.id as any)}
                className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                  tutorStyle === style.id
                    ? "bg-amber-400 text-slate-950 font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat window and optional scratchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat message stream */}
        <div
          className={`${
            showScratchpad ? "lg:col-span-2" : "lg:col-span-3"
          } rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col h-[580px]`}
        >
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const isSpeaking = speakingMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm mt-0.5">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 space-y-2 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-slate-50 border border-slate-100 text-slate-900 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-100 rounded-bl-none shadow-sm"
                    }`}
                  >
                    {/* Key takeaway badge if present */}
                    {!isUser && msg.quickKeyTakeaway && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs font-semibold text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200 flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>{msg.quickKeyTakeaway}</span>
                      </div>
                    )}

                    {/* Message markdown content */}
                    <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none break-words">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>

                    {/* Suggested follow-up prompt chips */}
                    {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Suggested Next Questions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedFollowUps.map((chip, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => handleSend(chip)}
                              className="rounded-xl border border-indigo-200 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                            >
                              💡 {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer action tools */}
                    <div className="flex items-center justify-between pt-1 text-[11px] opacity-75">
                      <span>{msg.timestamp}</span>

                      {!isUser && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSpeak(msg.id, msg.text)}
                            title={isSpeaking ? "Stop Voice" : "Read aloud"}
                            className="p-1 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {isSpeaking ? (
                              <VolumeX className="h-3.5 w-3.5 text-amber-500" />
                            ) : (
                              <Volume2 className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            title="Copy reply"
                            className="p-1 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleSaveToNotebook(msg)}
                            title="Save to notebook"
                            className="p-1 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {savedId === msg.id ? (
                              <BookmarkCheck className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Bookmark className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 shadow-sm mt-0.5">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 items-center text-slate-500 text-xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 dark:bg-slate-800">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                  <span>EduGemini is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat input box */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-colors cursor-pointer ${
                  isRecording
                    ? "border-red-500 bg-red-50 text-red-600 animate-pulse dark:bg-red-950/40"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                }`}
                title="Voice input"
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask your tutor anything or describe where you are stuck..."
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
              />

              <button
                type="submit"
                disabled={loading || !inputPrompt.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Scratchpad chalkboard side drawer */}
        {showScratchpad && (
          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-5 shadow-sm text-white flex flex-col h-[580px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-base">📝</span>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Chalkboard / Scratchpad
                </h3>
              </div>
              <button
                onClick={() => setScratchpadText("")}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Clear
              </button>
            </div>
            <p className="text-[11px] text-slate-400 my-2">
              Jot down rough math steps, formulas, code snippets, or notes while conversing.
            </p>
            <textarea
              value={scratchpadText}
              onChange={(e) => setScratchpadText(e.target.value)}
              placeholder="e.g. Formula: F = ma&#10;Step 1: calculate net acceleration&#10;Step 2: integrate with respect to time..."
              className="flex-1 w-full rounded-2xl bg-slate-950/80 border border-slate-800 p-3 text-xs font-mono text-amber-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
            />
            <div className="pt-3 flex justify-between items-center">
              <span className="text-[10px] text-slate-500">
                {scratchpadText.length} characters
              </span>
              <button
                onClick={() => handleSend(`Here are my scratchpad notes: \n"""\n${scratchpadText}\n"""\nCan you check my reasoning?`)}
                disabled={!scratchpadText.trim()}
                className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Send to Tutor for Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
