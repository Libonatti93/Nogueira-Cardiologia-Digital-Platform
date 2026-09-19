from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl

RagType = Literal["avatar", "offer", "signals"]


class ApplicationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=80)
    description: str = Field(default="", max_length=500)
    publication_url: str = ""


class RagDocumentCreate(BaseModel):
    rag_type: RagType
    title: str = Field(min_length=2, max_length=180)
    content: str = Field(min_length=2, max_length=30000)
    metadata: dict[str, Any] = Field(default_factory=dict)
    source_url: HttpUrl | None = None
    source_name: str | None = Field(default=None, max_length=120)
    observed_at: str | None = None


class PipelineStart(BaseModel):
    topic_hint: str = Field(default="", max_length=240)
    force_demo_signal: bool = False


class AvatarProfile(BaseModel):
    age_range: str
    predominant_gender: str
    common_habits: list[str]
    common_concerns: list[str]
    average_income: str
    education_level: str
    professions: list[str]
    learning_interests: list[str]
    social_networks: list[str]
    technology_awareness: str
    ai_usage: str
    usual_search_channels: list[str]


class OfferProfile(BaseModel):
    overview: dict[str, Any]
    target_audience: dict[str, Any]
    characteristics: dict[str, Any]
    benefits_results: dict[str, Any]
    quality_trust: dict[str, Any]
    pricing: dict[str, Any]
    purchase_delivery: dict[str, Any]
    warranty_cancellation: dict[str, Any]
    safety_risks: dict[str, Any]
    comparison: dict[str, Any]
    after_sales: dict[str, Any]


class AuditCriterion(BaseModel):
    key: str
    label: str
    score: float = Field(ge=0, le=10)
    weight: float = Field(gt=0, le=1)
    evidence: str
    recommendation: str = ""


class AuditResult(BaseModel):
    score: float = Field(ge=0, le=10)
    approved: bool
    criteria: list[AuditCriterion]
    blockers: list[str] = Field(default_factory=list)
    summary: str
