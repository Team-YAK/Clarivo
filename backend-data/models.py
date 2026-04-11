from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class SessionBase(BaseModel):
    user_id: str
    path: List[str]
    sentence: str
    confidence: float
    anchor_used: Optional[bool] = False

class SessionCreateRequest(SessionBase):
    pass

class SessionConfirmRequest(BaseModel):
    session_id: str
    audio_url: str

class ProfileUpdateRequest(BaseModel):
    user_id: str
    field: str
    value: Any

class ContextAnswerRequest(BaseModel):
    user_id: str
    question_id: str
    question: str
    answer: str

class FeedbackRequest(BaseModel):
    session_id: str
    user_id: str
    thumbs_up: bool
    correction: Optional[str] = None

class FlagSessionRequest(BaseModel):
    session_id: str
    user_id: str

class CustomButtonAddRequest(BaseModel):
    user_id: str
    label: str
    icon: str
    category: str

class SentenceCacheRequest(BaseModel):
    user_id: str
    path_key: str
    sentence: str
    audio_url: str
    confidence: float

class SentenceInvalidateRequest(BaseModel):
    user_id: str
    path_key: str

class DemoSeedRequest(BaseModel):
    user_id: str = "test_user_qa"

# Response Models

class KnowledgeBreakdown(BaseModel):
    overall: int
    profile: int
    medical: int
    preferences: int
    conversation: int

class SessionModel(BaseModel):
    id: str
    path: List[str]
    sentence: str
    confidence: float
    audio_url: Optional[str] = None
    feedback: Optional[str] = None
    correction: Optional[str] = None
    is_first_occurrence: bool = False
    anchor_used: Optional[bool] = False
    timestamp: str

class PendingQuestion(BaseModel):
    question: str
    question_id: str

class CaregiverPanelResponse(BaseModel):
    last_session: Optional[SessionModel]
    pending_question: Optional[PendingQuestion]
    knowledge_score: int
    knowledge_breakdown: KnowledgeBreakdown
    urgent: bool

class ShortcutItem(BaseModel):
    path: List[str]
    label: str
    icon: str
    tap_count: int

class ShortcutsResponse(BaseModel):
    shortcuts: List[ShortcutItem]

class PredictionItem(BaseModel):
    label: str
    path: List[str]
    icon: str

class PredictionsResponse(BaseModel):
    predictions: List[PredictionItem]

class ProfileResponse(BaseModel):
    profile: Dict[str, Any]
    medical: Dict[str, Any]
    preferences: Dict[str, Any]
    routine: Dict[str, Any]
    voice_id: str
    interface_settings: Dict[str, Any]

class MoodEntry(BaseModel):
    date: str
    score: int
    notes: Optional[str] = None

class TopPathItem(BaseModel):
    path: str
    count: int

class InsightsResponse(BaseModel):
    sessions_by_day: Dict[str, int]
    top_paths: List[TopPathItem]
    sessions_by_period: Dict[str, int]
    mood_log: List[MoodEntry]
