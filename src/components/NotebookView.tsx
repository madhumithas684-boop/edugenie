import React, { useState } from "react";
import { SavedNote } from "../types";
import {
  BookmarkCheck,
  Search,
  Trash2,
  Download,
  Share2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  Tag,
  Copy,
  Check
} from "lucide-react";

interface NotebookViewProps {
  notes: SavedNote[];
  onDeleteNote: (id: string) => void;
  onClearAll: () => void;
  onSendToTutor: (query: string) => void;
}

export const NotebookView: React.FC<NotebookViewProps> = ({
  notes,
  onDeleteNote,
  onClearAll,
  onSendToTutor,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])));

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag ? n.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const handleExportMarkdown = () => {
    if (notes.length === 0) return;
    const markdownContent = notes
      .map(
        (n) =>
          `# ${n.title}\n*Saved on: ${n.date} | Type: ${n.type}*\n\n${n.content}\n\n---\n`
      )
      .join("\n\n");

    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EduGemini_StudyNotes_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyNote = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-200 border border-indigo-400/30 mb-3">
            <BookmarkCheck className="h-3.5 w-3.5 text-amber-300" />
            Personal Study Notebook
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Your centralized knowledge hub.
          </h1>
          <p className="text-sm sm:text-base text-indigo-200/90 mb-4">
            All your saved topic breakdowns, high-yield summaries, flashcards, and completed quiz scores safely stored for quick revision and export.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleExportMarkdown}
              disabled={notes.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-40 transition-colors cursor-pointer shadow-md"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export as Markdown</span>
            </button>

            {notes.length > 0 && (
              <button
                onClick={onClearAll}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20 border border-red-400/20 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Notebook</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Tag Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved notes, topics..."
            className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Tag pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setSelectedTag(null)}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                selectedTag === null
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              All ({notes.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? "bg-indigo-600 text-white font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800 space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No notes found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Save explanations, summaries, or completed quiz reports by clicking the bookmark button throughout EduGemini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {note.type.replace("_", " ")}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <button
                      onClick={() => handleCopyNote(note.id, `${note.title}\n\n${note.content}`)}
                      title="Copy note"
                      className="p-1 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {copiedId === note.id ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      title="Delete note"
                      className="p-1 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                  {note.title}
                </h4>

                <div className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line line-clamp-5 leading-relaxed font-normal">
                  {note.content}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>{note.date}</span>
                <button
                  onClick={() => onSendToTutor(`Let's review my notes on: "${note.title}". Here are the details: \n${note.content}`)}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Review with Tutor</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
