export type StudyTab = "qa" | "explain" | "quiz" | "summarize" | "path" | "notebook" | "tech_stack";

export type AIModelEngine = "lamini" | "gemini";

export interface QAResult {
  question: string;
  category: "academic" | "general";
  modelUsed: "LaMini-Flan-T5" | "Google Gemini 1.5 Pro";
  conciseAnswer: string;
  keyPoints: string[];
  formulaOrRule?: string;
  academicContext: string;
  suggestedQuestions: string[];
}

export interface ExplanationResult {
  title: string;
  modelUsed?: string;
  simplifiedSummary: string;
  coreAnalogy: string;
  keyBreakdown: {
    stepNumber: number;
    heading: string;
    explanation: string;
  }[];
  realWorldApplication: string;
  commonPitfalls: string[];
  memoryTrick: string;
  checkpointQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface SummaryResult {
  documentTitle: string;
  quickTLDR: string;
  keyTakeaways: string[];
  glossaryTerms: {
    term: string;
    definition: string;
  }[];
  flashcards: {
    front: string;
    back: string;
  }[];
  cornellNotes: {
    cueColumn: string[];
    notesColumn: string[];
    summary: string;
  };
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
}

export interface QuizResult {
  quizTitle: string;
  estimatedMinutes: number;
  difficulty: string;
  questions: QuizQuestion[];
}

export interface DaySession {
  day: string;
  task: string;
  durationMinutes: number;
  studyTip: string;
  completed?: boolean;
}

export interface WeekModule {
  weekNumber: number;
  phaseTitle: string;
  keyObjectives: string[];
  dailySchedule: DaySession[];
  milestoneCheck: string;
  completed?: boolean;
}

export interface SuggestedResource {
  title: string;
  type: "book" | "course" | "doc" | "video" | "interactive";
  description: string;
  source: string;
}

export interface LearningPathResult {
  planTitle: string;
  overview: string;
  totalEstimatedHours: number;
  weeks: WeekModule[];
  proStudyTips: string[];
  suggestedResources?: SuggestedResource[];
}

export interface TutorMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  quickKeyTakeaway?: string;
  suggestedFollowUps?: string[];
}

export interface SavedNote {
  id: string;
  title: string;
  type: "explanation" | "summary" | "quiz_result" | "path_milestone";
  content: string;
  date: string;
  tags: string[];
}
