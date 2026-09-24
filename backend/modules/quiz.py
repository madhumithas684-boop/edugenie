from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import json
from google import genai
from google.genai import types

router = APIRouter(tags=["Quiz Generator"])

class QuizRequest(BaseModel):
    topicOrText: str = Field(..., description="Topic name or study passage to generate quiz from")
    count: int = Field(5, ge=3, le=10, description="Number of questions (3 to 10)")
    difficulty: str = Field("Intermediate", description="Beginner, Intermediate, or Advanced")

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str]  # Exactly 4 options
    correctIndex: int   # 0 to 3
    explanation: str    # Displayed after submission
    hint: str

class QuizResponse(BaseModel):
    quizTitle: str
    sourceType: str
    estimatedMinutes: int
    difficulty: str
    questions: List[QuizQuestion]

@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(req: QuizRequest):
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server.")

    client = genai.Client(api_key=api_key)
    is_passage = len(req.topicOrText.strip()) > 180 or "\n" in req.topicOrText

    system_instruction = f"""You are EduGenie's Quiz Generator.
Generate exactly {req.count} multiple-choice questions based on the given { 'passage' if is_passage else 'topic' }.
Rules:
1. Each question must have EXACTLY four (4) options.
2. Questions must be engaging and test conceptual understanding.
3. Include clear explanations of why the correct option is right and others are wrong.
4. Include a helpful hint for each question."""

    prompt = f"Input: {req.topicOrText}\nCount: {req.count}\nDifficulty: {req.difficulty}"

    try:
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
            )
        )
        data = json.loads(response.text)
        return QuizResponse(
            quizTitle=data.get("quizTitle", "EduGenie Practice Quiz"),
            sourceType="passage" if is_passage else "topic",
            estimatedMinutes=data.get("estimatedMinutes", req.count * 2),
            difficulty=req.difficulty,
            questions=data.get("questions", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
