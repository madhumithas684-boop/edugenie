from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import json
from google import genai
from google.genai import types

router = APIRouter(tags=["Learning Recommendations"])

class LearningPathRequest(BaseModel):
    topic: str = Field(..., description="Subject or skill to learn")
    currentKnowledgeLevel: str = Field("Beginner", description="Beginner, Intermediate, or Advanced")
    timeframeWeeks: Optional[int] = Field(4, description="Target weeks")
    hoursPerWeek: Optional[int] = Field(5, description="Hours available per week")

class LearningResource(BaseModel):
    title: str
    type: str
    description: str
    urlHint: Optional[str] = None

class TopicItem(BaseModel):
    order: int
    title: str
    level: str
    estimatedHours: int
    summary: str
    keyConcepts: List[str]
    resources: List[LearningResource]

class LearningPathResponse(BaseModel):
    planTitle: str
    topic: str
    currentKnowledgeLevel: str
    overview: str
    totalEstimatedHours: int
    estimatedStudyTime: str
    topics: List[TopicItem]
    usefulResources: List[LearningResource]
    proStudyTips: List[str]

@router.post("/learn/recommendations", response_model=LearningPathResponse)
async def generate_learning_recommendations(req: LearningPathRequest):
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server.")

    client = genai.Client(api_key=api_key)

    system_instruction = f"""You are EduGenie's Chief Learning Architect.
Create a structured learning path from {req.currentKnowledgeLevel} to Advanced for: {req.topic}.
Requirements:
1. Ordered sequence of topics (beginner -> advanced).
2. For each topic: title, difficulty level, estimated study time in hours, concise summary, key concepts, and high-quality resources.
3. Total estimated study time.
4. Useful overall learning resources and expert tips."""

    prompt = f"Topic: {req.topic}\nCurrent Knowledge Level: {req.currentKnowledgeLevel}\nTimeframe: {req.timeframeWeeks} weeks"

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
        return LearningPathResponse(
            planTitle=data.get("planTitle", f"Mastery Path for {req.topic}"),
            topic=req.topic,
            currentKnowledgeLevel=req.currentKnowledgeLevel,
            overview=data.get("overview", ""),
            totalEstimatedHours=data.get("totalEstimatedHours", 25),
            estimatedStudyTime=data.get("estimatedStudyTime", f"{req.timeframeWeeks} weeks (~{req.hoursPerWeek} hrs/week)"),
            topics=data.get("topics", []),
            usefulResources=data.get("usefulResources", []),
            proStudyTips=data.get("proStudyTips", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
