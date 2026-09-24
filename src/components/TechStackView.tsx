import React, { useState } from "react";
import {
  Server,
  Code2,
  Terminal,
  FileCode,
  Layers,
  Copy,
  Check,
  Download,
  Play,
  Cpu,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Flame,
  Globe
} from "lucide-react";

export const TechStackView: React.FC = () => {
  const [activeFileTab, setActiveFileTab] = useState<"main.py" | "templates/index.html" | "requirements.txt" | "architecture">("main.py");
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const pythonMainPy = `"""
EduGenie - Educational Learning Assistant
Backend: FastAPI (Lightweight Architecture)
Server: Uvicorn
Frontend: HTML/CSS Responsive Templates
AI Models:
  - Google Gemini 1.5 Pro (Q&A, Quizzes, Summaries, Learning Paths)
  - MBZUAI/LaMini-Flan-T5-783M (Concept Explanation)
Cycle: Ask → Understand → Practice → Summarize → Follow a Learning Path
"""

from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import uvicorn

# 1. Google Gemini 1.5 Pro SDK
from google import genai
from google.genai import types

# 2. Hugging Face Transformers for local LaMini-Flan-T5-783M
# Explains complex topics in simple, concise, and easy-to-understand language
from transformers import pipeline

app = FastAPI(
    title="EduGenie",
    description="FastAPI AI Learning Assistant with Gemini 1.5 Pro & LaMini-Flan-T5-783M",
    version="1.0.0"
)

# Setup Jinja2 Templates and Static files
templates = Jinja2Templates(directory="templates")
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize Gemini Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
ai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# Initialize LaMini-Flan-T5-783M Pipeline
print("Loading LaMini-Flan-T5-783M pipeline...")
try:
    lamini_pipeline = pipeline("text2text-generation", model="MBZUAI/LaMini-Flan-T5-783M")
except Exception as e:
    print(f"Local LaMini fallback to Gemini instruction-tuning: {e}")
    lamini_pipeline = None

# Pydantic Schemas
class QARequest(BaseModel):
    question: str
    category: str = "academic"  # "academic" | "general"
    model: str = "gemini"       # Gemini 1.5 Pro by default

class ExplainRequest(BaseModel):
    topic: str
    level: str = "high_school"
    model: str = "lamini"       # LaMini-Flan-T5-783M for concept explanation

class QuizRequest(BaseModel):
    topicOrText: str            # Creates 3 MCQs with 4 options each from topic or passage
    count: int = 3
    difficulty: str = "medium"

class SummarizeRequest(BaseModel):
    text: str
    format: str = "quick_revision"

class PathRequest(BaseModel):
    subject: str
    currentLevel: str = "beginner" # Beginner to Advanced
    timeframeWeeks: int = 4
    hoursPerWeek: int = 5

# Web UI Route (Responsive HTML/CSS Frontend)
@app.get("/", response_class=HTMLResponse)
async def home_view(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "title": "EduGenie - AI Learning Assistant",
            "pipeline": ["Ask", "Understand", "Practice", "Summarize", "Follow Path"]
        }
    )

# 1. Q&A: Smart answers to general knowledge and academic questions (Gemini 1.5 Pro)
@app.post("/api/qa")
async def answer_question(req: QARequest):
    prompt = f"""Answer this {req.category} question smartly and concisely:
Question: {req.question}
Provide:
1. Concise direct answer (2-3 sentences)
2. 3-4 key takeaways
3. Governing formula or fundamental rule (if any)
4. Academic context"""
    
    response = ai_client.models.generate_content(
        model="gemini-1.5-pro",
        contents=prompt
    )
    return {"question": req.question, "modelUsed": "Google Gemini 1.5 Pro", "conciseAnswer": response.text}

# 2. Concept Explanation: Explains complex topics in simple, concise language (LaMini-Flan-T5-783M)
@app.post("/api/explain")
async def explain_concept(req: ExplainRequest):
    if req.model == "lamini" and lamini_pipeline:
        out = lamini_pipeline(f"Explain in simple, concise, easy-to-understand terms with an analogy: {req.topic}", max_length=300)
        return {"topic": req.topic, "modelUsed": "LaMini-Flan-T5-783M", "simplifiedSummary": out[0]["generated_text"]}
    else:
        prompt = f"Explain the complex topic '{req.topic}' in simple, concise, and easy-to-understand language using an everyday analogy for a {req.level} student."
        response = ai_client.models.generate_content(model="gemini-1.5-pro", contents=prompt)
        return {"topic": req.topic, "modelUsed": "Google Gemini 1.5 Pro", "explanation": response.text}

# 3. Quiz Generation: Creates 3 MCQ questions, with 4 options each, from given topic or passage
@app.post("/api/quiz")
async def generate_quiz(req: QuizRequest):
    prompt = f"Create exactly {req.count} (default 3) multiple choice questions, with EXACTLY 4 options each (A, B, C, D) and 1 correct answer, from this text or topic:\n\n{req.topicOrText[:4000]}"
    response = ai_client.models.generate_content(model="gemini-1.5-pro", contents=prompt)
    return {"quizTitle": "3-Question Practice Quiz", "response": response.text}

# 4. Text Summarization: Converts long educational passages into short, clear summaries for quick revision
@app.post("/api/summarize")
async def summarize_content(req: SummarizeRequest):
    prompt = f"Convert this long educational passage into a short, clear summary with bullet takeaways for quick revision:\n\n{req.text[:6000]}"
    response = ai_client.models.generate_content(model="gemini-1.5-pro", contents=prompt)
    return {"summary": response.text}

# 5. Personalized Learning Path: Structured plan from beginner to advanced level, including suggested learning resources
@app.post("/api/learning-path")
async def recommend_path(req: PathRequest):
    prompt = f"Create a structured learning plan from beginner to advanced level for '{req.subject}' across {req.timeframeWeeks} weeks ({req.hoursPerWeek} hrs/week), including curated suggested learning resources (books, videos, docs, courses)."
    response = ai_client.models.generate_content(model="gemini-1.5-pro", contents=prompt)
    return {"subject": req.subject, "roadmap": response.text}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
`;

  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
  <link rel="stylesheet" href="/static/style.css">
  <style>
    :root {
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --bg: #0f172a;
      --card-bg: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 0;
    }
    header {
      border-bottom: 1px solid var(--border);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(10px);
    }
    .brand { font-size: 1.3rem; font-weight: 800; color: #818cf8; }
    .badge {
      background: rgba(79, 70, 229, 0.2);
      color: #c7d2fe;
      border: 1px solid var(--primary);
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .container {
      max-width: 960px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .hero {
      text-align: center;
      margin-bottom: 2rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.5rem;
    }
    .btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn:hover { background: var(--primary-hover); }
    input, textarea, select {
      width: 100%;
      box-sizing: border-box;
      background: #0f172a;
      border: 1px solid var(--border);
      color: white;
      padding: 0.7rem;
      border-radius: 0.5rem;
      margin-top: 0.5rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">EduGenie (Python & FastAPI)</div>
    <div class="badge">Uvicorn + Jinja2 + Gemini 1.5 Pro + LaMini-Flan-T5-783M</div>
  </header>

  <main class="container">
    <div class="hero">
      <h1>EduGenie AI Learning Assistant</h1>
      <p style="color: var(--text-muted)">FastAPI backend with lightweight HTML/CSS frontend: Ask → Understand → Practice → Summarize → Follow a Learning Path</p>
    </div>

    <div class="grid">
      <!-- 1. Q&A Card -->
      <div class="card">
        <h3>⚡ Step 1: Smart Q&A</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem">Answers general knowledge & academic questions (Gemini 1.5 Pro).</p>
        <form action="/api/qa" method="POST">
          <input type="text" name="question" placeholder="Ask your question...">
          <button class="btn" type="submit">Get Answer</button>
        </form>
      </div>

      <!-- 2. Concept Explanation Card -->
      <div class="card">
        <h3>💡 Step 2: Concept Explanation</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem">Explains complex topics simply and concisely (LaMini-Flan-T5-783M).</p>
        <form action="/api/explain" method="POST">
          <input type="text" name="topic" placeholder="e.g. Quantum Superposition">
          <button class="btn" type="submit">Simplify Concept</button>
        </form>
      </div>

      <!-- 3. Quiz Generation Card -->
      <div class="card">
        <h3>❓ Step 3: Quiz Generation</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem">Creates 3 MCQ questions (4 options each) from topic or passage.</p>
        <form action="/api/quiz" method="POST">
          <textarea rows="3" name="topicOrText" placeholder="Paste educational passage or topic..."></textarea>
          <button class="btn" type="submit">Generate 3 MCQs</button>
        </form>
      </div>

      <!-- 4. Text Summarizer Card -->
      <div class="card">
        <h3>📝 Step 4: Text Summarization</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem">Converts long educational passages into short, clear summaries.</p>
        <form action="/api/summarize" method="POST">
          <textarea rows="3" name="text" placeholder="Paste long study notes..."></textarea>
          <button class="btn" type="submit">Summarize for Revision</button>
        </form>
      </div>

      <!-- 5. Recommend Path Card -->
      <div class="card" style="grid-column: 1 / -1">
        <h3>🧭 Step 5: Recommend Learning Path</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem">Generates structured learning plan from beginner to advanced level, with suggested resources.</p>
        <form action="/api/learning-path" method="POST" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <input type="text" name="subject" placeholder="e.g. Machine Learning, Organic Chemistry" style="flex: 2; min-width: 220px; margin: 0;">
          <select name="currentLevel" style="flex: 1; min-width: 140px; margin: 0;">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button class="btn" type="submit" style="white-space: nowrap;">Recommend Path</button>
        </form>
      </div>
    </div>
  </main>
</body>
</html>
`;

  const requirementsTxt = `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
jinja2>=3.1.3
google-genai>=1.0.0
transformers>=4.38.0
torch>=2.2.0
pydantic>=2.6.0
python-multipart>=0.0.9
`;

  const handleCopy = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-400/30 mb-3">
            <Server className="h-3.5 w-3.5 text-emerald-400" />
            Specified Technology Stack Blueprint
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Python, FastAPI, Uvicorn & Jinja2 Architecture
          </h1>
          <p className="text-sm sm:text-base text-indigo-200/90 mb-4">
            EduGenie is architected around the user's exact specification: Python FastAPI lightweight backend running on Uvicorn, Jinja2 templating, responsive HTML/CSS frontend, dual-powered by Google Gemini 1.5 Pro (Q&A, Quizzes, Summaries, Learning Paths) and LaMini-Flan-T5-783M (Concept Explanation).
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
            <div className="rounded-xl bg-white/10 p-2.5 border border-white/10">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Backend</span>
              <span className="font-bold text-white">FastAPI + Python</span>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5 border border-white/10">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Server</span>
              <span className="font-bold text-white">Uvicorn ASGI</span>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5 border border-white/10">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Frontend & UI</span>
              <span className="font-bold text-white">Jinja2 + HTML / CSS</span>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5 border border-white/10">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Primary AI (1.5 Pro)</span>
              <span className="font-bold text-white">Q&A, Quiz, Summary, Path</span>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5 border border-white/10">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Distilled AI (T5)</span>
              <span className="font-bold text-white">LaMini-Flan-T5-783M</span>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5 border border-white/10">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Design & Arch</span>
              <span className="font-bold text-emerald-400">Lightweight & Responsive</span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Browser & Architecture Diagram */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {[
              { id: "main.py", label: "main.py (FastAPI)", icon: Code2 },
              { id: "templates/index.html", label: "templates/index.html (Jinja2)", icon: FileCode },
              { id: "requirements.txt", label: "requirements.txt", icon: Terminal },
              { id: "architecture", label: "Architecture Topology", icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFileTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-indigo-600 shadow-sm dark:bg-indigo-600 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeFileTab !== "architecture" && (
            <button
              onClick={() => {
                const content =
                  activeFileTab === "main.py"
                    ? pythonMainPy
                    : activeFileTab === "templates/index.html"
                    ? htmlTemplate
                    : requirementsTxt;
                handleCopy(activeFileTab, content);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {copiedFile === activeFileTab ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy File</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeFileTab === "main.py" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>FastAPI + Uvicorn + Google GenAI + LaMini-Flan-T5 Transformers pipeline</span>
                <span>Python 3.10+</span>
              </div>
              <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed border border-slate-800 max-h-[500px]">
                {pythonMainPy}
              </pre>
            </div>
          )}

          {activeFileTab === "templates/index.html" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Jinja2 Template rendering semantic HTML5 & modern CSS styling</span>
                <span>HTML5 / CSS3</span>
              </div>
              <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed border border-slate-800 max-h-[500px]">
                {htmlTemplate}
              </pre>
            </div>
          )}

          {activeFileTab === "requirements.txt" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Run `pip install -r requirements.txt` then `uvicorn main:app --reload`</span>
                <span>pip dependencies</span>
              </div>
              <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed border border-slate-800">
                {requirementsTxt}
              </pre>
            </div>
          )}

          {activeFileTab === "architecture" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 dark:border-indigo-900/40 dark:bg-indigo-950/20 space-y-4">
                <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                  Complete Technical System Map
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Layer 1 */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2">
                    <span className="inline-block rounded-md bg-indigo-100 px-2 py-0.5 font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      Frontend Layer
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white">HTML5 + CSS & Jinja2</h4>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Renders interactive educational modules: Q&A, Concept Simplifier, Text Quizzer, Summarizer, and Learning Paths.
                    </p>
                  </div>

                  {/* Layer 2 */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2">
                    <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Server & Framework
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white">FastAPI on Uvicorn</h4>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Asynchronous ASGI server dispatching endpoints: <code>/api/qa</code>, <code>/api/explain</code>, <code>/api/quiz</code>, <code>/api/summarize</code>, and <code>/api/learning-path</code>.
                    </p>
                  </div>

                  {/* Layer 3 */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2">
                    <span className="inline-block rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Cloud + Local AI Integration
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white">Gemini 1.5 Pro & LaMini-Flan-T5</h4>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong>Cloud AI (Gemini 1.5 Pro):</strong> Handles smart Q&A, generating 3-MCQ quizzes, paragraph summarization, and beginner-to-advanced learning plans.<br />
                      <strong>Local AI (LaMini-Flan-T5-783M):</strong> Lightweight local model running efficiently on limited hardware for concise concept explanation.
                    </p>
                  </div>
                </div>

                {/* Modular Architecture Highlight */}
                <div className="rounded-xl border border-indigo-200 bg-white p-4 dark:border-indigo-900/60 dark:bg-slate-900 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Modular Architecture & Lightweight Accessibility
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                    Designed specifically for learners with limited hardware resources: separate modular services handle explanation, Q&A, quizzes, summarization, and learning recommendations. Submissions are dispatched asynchronously to the FastAPI backend, yielding real-time results without heavy client-side computation.
                  </p>
                </div>
              </div>

              {/* Quick Run Guide */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  How to Run the Python & FastAPI Stack Locally
                </span>
                <div className="space-y-2 font-mono text-xs text-slate-800 dark:text-slate-300">
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-slate-400 select-none"># 1. Clone or save files into a directory:</span>
                    <br />
                    mkdir edugemini && cd edugemini
                  </div>
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-slate-400 select-none"># 2. Install dependencies:</span>
                    <br />
                    pip install -r requirements.txt
                  </div>
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-slate-400 select-none"># 3. Launch Uvicorn ASGI Server:</span>
                    <br />
                    uvicorn main:app --reload --port 8000
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
