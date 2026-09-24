from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import json
from google import genai
from google.genai import types

router = APIRouter(tags=["Question & Answer"])

class QARequest(BaseModel):
    question: str = Field(..., description="Student's academic question")
    subject: str = Field("General Knowledge", description="Mathematics, Science, Computer Science, English, or General Knowledge")

class QAResponse(BaseModel):
    question: str
    subject: str
    answer: str
    keyPoints: List[str]
    formulaOrRule: Optional[str] = None
    examples: List[str] = []
    suggestedQuestions: List[str] = []

@router.post("/qa", response_model=QAResponse)
async def answer_academic_question(req: QARequest):
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server.")

    client = genai.Client(api_key=api_key)

    system_instruction = f"""You are EduGenie's Academic Question & Answer tutor.
Provide a clear, accurate, and student-friendly answer to questions in {req.subject}.
Include:
- Student-friendly direct answer.
- 3 to 5 key points for quick revision.
- Governing formulas, scientific laws, or grammar/syntax rules.
- Concrete student-friendly examples.
- 3 follow-up exploration questions."""

    prompt = f"Student Question: {req.question}\nSubject: {req.subject}"

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
        return QAResponse(
            question=req.question,
            subject=req.subject,
            answer=data.get("answer", ""),
            keyPoints=data.get("keyPoints", []),
            formulaOrRule=data.get("formulaOrRule", "N/A"),
            examples=data.get("examples", []),
            suggestedQuestions=data.get("suggestedQuestions", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
