import express from "express";
import dotenv from "dotenv";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google GenAI client (must be server-side)
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const MODEL_NAME = "gemini-3.8-flash";

async function generateContentWithRetry(params: any, maxRetries = 2): Promise<any> {
  const models = [MODEL_NAME, "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || "");
        const isTransient =
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("429") ||
          msg.includes("RESOURCE_EXHAUSTED");

        if (isTransient && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
          continue;
        }
        break; // try next fallback model
      }
    }
  }

  throw lastError;
}

// 1. Concise Q&A Endpoint (Academic & General questions - powered by Gemini 1.5 Pro)
app.post("/api/qa", async (req, res) => {
  try {
    const { question, category = "academic", model = "gemini" } = req.body;
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "Please provide a valid question." });
    }

    const isLamini = model === "lamini";
    const modelLabel = isLamini ? "LaMini-Flan-T5-783M" : "Google Gemini 1.5 Pro";

    const systemInstruction = isLamini
      ? `You are executing the LaMini-Flan-T5-783M model persona (an instruction-distilled, compact language model trained for concise, straightforward, and zero-fluff answers).
Your goal: Deliver direct, high-yield, and concise answers to ${category} questions without unnecessary filler.
Provide crisp bullet points, precise formulas or rules where relevant, and clear conceptual grounding.`
      : `You are Google Gemini 1.5 Pro, an advanced reasoning model.
Your goal: Provide a smart, academically rigorous, highly articulate, yet direct and concise answer to the student's question in ${category} (academic or general knowledge).
Include crisp conceptual points, fundamental formulas/rules, and academic context.`;

    const prompt = `Question: "${question.trim()}"
Category: ${category}
Mode: Smart Concise Q&A Answer

Provide:
1. conciseAnswer: A smart, high-clarity, direct answer in 2-3 sentences.
2. keyPoints: 3 to 4 crisp, essential takeaways/facts answering the question.
3. formulaOrRule: Any governing mathematical formula, scientific theorem, economic principle, or fundamental rule (or "N/A" if purely conceptual).
4. academicContext: 1-2 sentences on why this concept matters academically or practically.
5. suggestedQuestions: 3 related concise follow-up questions the user might ask next.`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conciseAnswer: { type: Type.STRING },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            formulaOrRule: { type: Type.STRING },
            academicContext: { type: Type.STRING },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["conciseAnswer", "keyPoints", "formulaOrRule", "academicContext", "suggestedQuestions"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      question: question.trim(),
      category,
      modelUsed: modelLabel,
      ...parsed,
    });
  } catch (error: any) {
    console.error("QA error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate answer. Please try again.",
    });
  }
});

// 2. Concept Explanation Endpoint (Explains complex topics in simple, concise, and easy-to-understand language using LaMini-Flan-T5-783M)
app.post("/api/explain", async (req, res) => {
  try {
    const { topic, level = "high_school", format = "balanced", model = "lamini" } = req.body;
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "Please provide a valid topic to explain." });
    }

    const isLamini = model === "lamini";
    const modelLabel = isLamini ? "LaMini-Flan-T5-783M" : "Google Gemini 1.5 Pro";

    const systemInstruction = isLamini
      ? `You are executing the LaMini-Flan-T5-783M model persona: a specialized instruction-tuned compact language model renowned for explaining complex topics in simple, concise, and easy-to-understand language.
Target audience level: ${level}.
Keep the explanation intuitive, direct, accessible, and free of unnecessary cognitive overload. Use a memorable, vivid everyday analogy.`
      : `You are Google Gemini 1.5 Pro.
Your mission is to explain complex topics in simple, concise, and easy-to-understand language with intuitive multi-perspective depth.
Target audience level: ${level}.
Tone/Format: ${format}.`;

    const prompt = `Simplify and explain the following difficult topic:
Topic: "${topic.trim()}"

Provide:
1. title: A catchy, clear headline
2. simplifiedSummary: 2-3 sentence intuitive overview
3. coreAnalogy: A creative, memorable real-world analogy that makes the concept click instantly
4. keyBreakdown: An array of 3-5 core breakdown steps/components with step title and explanation
5. realWorldApplication: How this concept is actually used in real life / modern industry / nature
6. commonPitfalls: 2 common misunderstandings or mistakes students make and why they are wrong
7. memoryTrick: A mnemonic, rhyme, or mental visual hook to remember it forever
8. checkpointQuestion: A quick comprehension check with question, 4 multiple choice options, correct index (0-3), and rationale`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            simplifiedSummary: { type: Type.STRING },
            coreAnalogy: { type: Type.STRING },
            keyBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  heading: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["stepNumber", "heading", "explanation"],
              },
            },
            realWorldApplication: { type: Type.STRING },
            commonPitfalls: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            memoryTrick: { type: Type.STRING },
            checkpointQuestion: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ["question", "options", "correctIndex", "explanation"],
            },
          },
          required: [
            "title",
            "simplifiedSummary",
            "coreAnalogy",
            "keyBreakdown",
            "realWorldApplication",
            "commonPitfalls",
            "memoryTrick",
            "checkpointQuestion",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      ...parsed,
      modelUsed: modelLabel,
    });
  } catch (error: any) {
    console.error("Explain error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate explanation. Please try again.",
    });
  }
});

// 2. Text Summarization Endpoint
app.post("/api/summarize", async (req, res) => {
  try {
    const { text, format = "bullet_points", targetLength = "medium" } = req.body;
    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return res.status(400).json({ error: "Please provide study text to summarize (at least 10 characters)." });
    }

    const systemInstruction = `You are an elite academic notes summarizer. Transform study notes, textbook chapters, or academic articles into high-yield, structured study digests.
Summary format requested: ${format} (options: bullet_points, executive, flashcards, cornell).
Target depth/length: ${targetLength}.`;

    const prompt = `Summarize and structure the following study material:
"""
${text.slice(0, 15000)}
"""

Produce structured JSON with:
- documentTitle: concise descriptive title
- quickTLDR: 2 sentence high-level summary
- keyTakeaways: array of 4-7 primary concepts/bullets (crisp, high-yield)
- glossaryTerms: array of key technical terms with term and concise definition
- flashcards: array of 3-6 flashcards (front: question/concept, back: concise answer)
- cornellNotes: { cueColumn: string[], notesColumn: string[], summary: string }`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentTitle: { type: Type.STRING },
            quickTLDR: { type: Type.STRING },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            glossaryTerms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ["term", "definition"],
              },
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                },
                required: ["front", "back"],
              },
            },
            cornellNotes: {
              type: Type.OBJECT,
              properties: {
                cueColumn: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                notesColumn: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                summary: { type: Type.STRING },
              },
              required: ["cueColumn", "notesColumn", "summary"],
            },
          },
          required: [
            "documentTitle",
            "quickTLDR",
            "keyTakeaways",
            "glossaryTerms",
            "flashcards",
            "cornellNotes",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Summarize error:", error);
    return res.status(500).json({
      error: error.message || "Failed to summarize text. Please try again.",
    });
  }
});

// 3. Quiz Generation Endpoint - Creates 3 MCQ questions, with 4 options each, from a given topic or passage (powered by Gemini 1.5 Pro)
app.post("/api/quiz", async (req, res) => {
  try {
    const { topicOrText, count = 3, difficulty = "medium" } = req.body;
    if (!topicOrText || typeof topicOrText !== "string" || !topicOrText.trim()) {
      return res.status(400).json({ error: "Please enter a topic or paste study notes." });
    }

    const numQuestions = Math.min(Math.max(Number(count) || 3, 3), 10);

    const systemInstruction = `You are a certified exam author and test-prep master powered by Google Gemini 1.5 Pro.
Generate exactly ${numQuestions} high-quality multiple-choice questions (MCQs) strictly based on the given topic or passage.
CRITICAL FORMAT REQUIREMENT: Each question must have EXACTLY 4 options (A, B, C, D) and exactly 1 correct index (0, 1, 2, or 3).
Difficulty: ${difficulty}.
Make sure questions test genuine conceptual understanding. Distractors (wrong options) should be plausible common misconceptions.`;

    const prompt = `Create a ${numQuestions}-question MCQ practice quiz (each question having EXACTLY 4 options) from the following content:
"""
${topicOrText.slice(0, 10000)}
"""

Return structured JSON with:
- quizTitle: Engaging quiz title
- estimatedMinutes: number
- difficulty: string
- questions: array of exactly ${numQuestions} questions, each with:
  - id: integer (1, 2, ...)
  - question: clear question text
  - options: array of EXACTLY 4 distinct options
  - correctIndex: integer from 0 to 3
  - explanation: comprehensive explanation of why the correct option is right
  - hint: subtle clue to help the learner`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quizTitle: { type: Type.STRING },
            estimatedMinutes: { type: Type.INTEGER },
            difficulty: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  hint: { type: Type.STRING },
                },
                required: ["id", "question", "options", "correctIndex", "explanation", "hint"],
              },
            },
          },
          required: ["quizTitle", "estimatedMinutes", "difficulty", "questions"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Quiz error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate quiz. Please try again.",
    });
  }
});

// 4. Personalized Learning Path Endpoint - Structured plan from beginner to advanced level, including suggested learning resources
app.post("/api/learning-path", async (req, res) => {
  try {
    const { subject, currentLevel = "beginner", targetGoal = "mastery", timeframeWeeks = 4, hoursPerWeek = 5 } = req.body;
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({ error: "Please provide a subject or exam goal." });
    }

    const systemInstruction = `You are a world-class academic curriculum designer and personalized learning coach powered by Google Gemini 1.5 Pro.
Create an achievable, structured learning path from ${currentLevel} to advanced level tailored to the student's background, available hours, and goal.
Structure it into progressive weekly phases with concrete daily activities, milestones, and suggested learning resources (books, documentation, video lectures, practice sites).`;

    const prompt = `Design a personalized study roadmap from beginner to advanced level for:
Subject: "${subject.trim()}"
Current Student Level: "${currentLevel}"
Target Goal: "${targetGoal}"
Timeframe: ${timeframeWeeks} weeks
Weekly Study Time: ${hoursPerWeek} hours/week

Provide structured JSON with:
- planTitle: Inspiring plan title
- overview: 2-3 sentences outlining the pedagogical strategy from beginner to advanced
- totalEstimatedHours: integer
- weeks: array of weekly modules (matching ${timeframeWeeks} weeks), each with:
  - weekNumber: integer
  - phaseTitle: descriptive theme of the week
  - keyObjectives: array of 3-4 bullet goals
  - dailySchedule: array of 5 daily sessions with day ('Day 1', 'Day 2', etc), task, durationMinutes, and studyTip
  - milestoneCheck: key checkpoint or self-test project
- proStudyTips: array of 3 expert learning tips for this specific subject
- suggestedResources: array of 4-6 high-quality learning resources (textbooks, official documentation, video playlists, interactive sandboxes, online courses) with title, type ("book", "course", "doc", "video", or "interactive"), description, and source/author`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            overview: { type: Type.STRING },
            totalEstimatedHours: { type: Type.INTEGER },
            weeks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  weekNumber: { type: Type.INTEGER },
                  phaseTitle: { type: Type.STRING },
                  keyObjectives: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  dailySchedule: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        day: { type: Type.STRING },
                        task: { type: Type.STRING },
                        durationMinutes: { type: Type.INTEGER },
                        studyTip: { type: Type.STRING },
                      },
                      required: ["day", "task", "durationMinutes", "studyTip"],
                    },
                  },
                  milestoneCheck: { type: Type.STRING },
                },
                required: ["weekNumber", "phaseTitle", "keyObjectives", "dailySchedule", "milestoneCheck"],
              },
            },
            proStudyTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedResources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING },
                  description: { type: Type.STRING },
                  source: { type: Type.STRING },
                },
                required: ["title", "type", "description", "source"],
              },
            },
          },
          required: ["planTitle", "overview", "totalEstimatedHours", "weeks", "proStudyTips", "suggestedResources"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Learning path error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate learning path. Please try again.",
    });
  }
});

// 5. Interactive Learning Assistant Q&A Chat Endpoint
app.post("/api/tutor-chat", async (req, res) => {
  try {
    const { messages, tutorStyle = "interactive", currentSubject = "General" } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided." });
    }

    const styleInstructions = {
      interactive: "Warm, encouraging, step-by-step guidance. Use intuitive analogies and invite the student to try the next step.",
      socratic: "Use the Socratic method: guide the student by asking thoughtful questions that help them discover the answer themselves.",
      concise: "Direct, precise, highly efficient academic answer with bullet points and code/math blocks where helpful.",
      eli5: "Explain like the user is new to the topic. Simple words, zero jargon, fun mental pictures.",
    };

    const chosenStyle = (styleInstructions as any)[tutorStyle] || styleInstructions.interactive;

    const systemInstruction = `You are EduGemini, an elite 1-on-1 virtual tutor in ${currentSubject}.
Style: ${chosenStyle}
Formatting rules:
- Use clean Markdown with headers, bold keywords, code blocks or math formulas where appropriate.
- Be encouraging and patient.
- At the end of every response, provide 3 short, relevant follow-up questions or next exploration steps the student can click on.
Provide your response strictly in JSON format matching the schema.`;

    // Map conversation history
    const conversationPrompt = messages.map((m: any) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.text}`).join("\n\n");
    const fullPrompt = `${conversationPrompt}\n\nTutor, respond to the last student query in full detail and suggest 3 natural follow-up questions.`;

    const response = await generateContentWithRetry({
      contents: fullPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyMarkdown: { type: Type.STRING },
            quickKeyTakeaway: { type: Type.STRING },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["replyMarkdown", "quickKeyTakeaway", "suggestedFollowUps"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Tutor chat error:", error);
    return res.status(500).json({
      error: error.message || "Failed to respond. Please try again.",
    });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "EduGemini", hasKey: Boolean(apiKey) });
});

// Setup dev server / static serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduGemini server listening on port ${PORT} (dev: ${isDev})`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
