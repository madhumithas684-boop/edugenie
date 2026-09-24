from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import os
import json
from google import genai
from google.genai import types

router = APIRouter(tags=["Text Summarizer"])

class SummarizeRequest(BaseModel):
    text: str = Field(..., description="Educational text to summarize")

class GlossaryItem(BaseModel):
    term: str
    definition: str

class FlashcardItem(BaseModel):
    front: str
    back: str

class CornellNotes(BaseModel):
    cueColumn: List[str]
    notesColumn: List[str]
    summary: str

class SummarizeResponse(BaseModel):
    documentTitle: str
    conciseSummary: str
    quickRevisionKeyPoints: List[str]
    glossaryTerms: Optional[List[GlossaryItem]] = []
    flashcards: Optional[List[FlashcardItem]] = []
    cornellNotes: Optional[CornellNotes] = None

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(req: SummarizeRequest):
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server.")

    client = genai.Client(api_key=api_key)

    system_instruction = """You are EduGenie's High-Yield Educational Text Summarizer.
Convert lengthy educational text into:
1. A concise, easy-to-understand summary.
2. 5-8 important key points for quick revision.
3. Key glossary terms with definitions.
4. Active recall flashcards.
5. Cornell notes format."""

    prompt = f"Educational Text:\n{req.text[:15000]}"

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
        return SummarizeResponse(
            documentTitle=data.get("documentTitle", "Educational Summary"),
            conciseSummary=data.get("conciseSummary", ""),
            quickRevisionKeyPoints=data.get("quickRevisionKeyPoints", []),
            glossaryTerms=data.get("glossaryTerms", []),
            flashcards=data.get("flashcards", []),
            cornellNotes=data.get("cornellNotes", None)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
