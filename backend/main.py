"""
EduGenie - AI-Powered Learning Assistant
FastAPI Backend with modular routers for:
- Q&A (POST /qa)
- Concept Explanation (POST /explain)
- Quiz Generator (POST /quiz)
- Text Summarizer (POST /summarize)
- Learning Recommendations (POST /learn/recommendations)
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import module routers
from modules.qa import router as qa_router
from modules.explanation import router as explanation_router
from modules.quiz import router as quiz_router
from modules.summarizer import router as summarizer_router
from modules.learning_path import router as learning_path_router

app = FastAPI(
    title="EduGenie API",
    description="Student-friendly AI Learning Assistant powered by Google Gemini",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount separate modules
app.include_router(qa_router)
app.include_router(explanation_router)
app.include_router(quiz_router)
app.include_router(summarizer_router)
app.include_router(learning_path_router)

@app.get("/health")
def health_check():
    has_key = bool(os.getenv("GEMINI_API_KEY"))
    return {"status": "ok", "service": "EduGenie FastAPI Backend", "hasKey": has_key}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
