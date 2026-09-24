from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import os
import json
from google import genai
from google.genai import types

router = APIRouter(tags=["Concept Explanation"])

class ExplainRequest(BaseModel):
    topic: str = Field(..., description="Difficult topic to explain")
    difficulty: str = Field("Beginner", description="Beginner, Intermediate, or Advanced")

class ExampleItem(BaseModel):
    title: str
    scenario: str
    explanation: str

class StepItem(BaseModel):
    stepNumber: int
    heading: str
    explanation: str

class ExplainResponse(BaseModel):
    topic: str
    difficulty: str
    title: str
    simplifiedExplanation: str
    coreAnalogy: str
    examples: List[ExampleItem] = []
    keyBreakdown: List[StepItem] = []
    realWorldApplication: str
    commonPitfalls: List[str] = []
    memoryTrick: str

@router.post("/explain", response_model=ExplainResponse)
async def explain_concept(req: ExplainRequest):
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server.")

    client = genai.Client(api_key=api_key)

    system_instruction = f"""You are EduGenie's Concept Simplifier.
Explain difficult topics in simple, intuitive language tailored to difficulty level: {req.difficulty}.
- Beginner: Use everyday terminology, no jargon, vivid analogies, simple examples.
- Intermediate: Core academic terms, structured mechanism breakdown.
- Advanced: Rigorous theoretical foundations, edge cases, real-world systems.
Include real-life examples, core breakdown steps, and memory tricks."""

    prompt = f"Topic: {req.topic}\nDifficulty: {req.difficulty}"

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
        return ExplainResponse(
            topic=req.topic,
            difficulty=req.difficulty,
            title=data.get("title", req.topic),
            simplifiedExplanation=data.get("simplifiedExplanation", ""),
            coreAnalogy=data.get("coreAnalogy", ""),
            examples=data.get("examples", []),
            keyBreakdown=data.get("keyBreakdown", []),
            realWorldApplication=data.get("realWorldApplication", ""),
            commonPitfalls=data.get("commonPitfalls", []),
            memoryTrick=data.get("memoryTrick", "")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
