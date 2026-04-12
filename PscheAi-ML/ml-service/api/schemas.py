from pydantic import BaseModel, Field, validator
from typing import List, Dict

class StressRequest(BaseModel):
    answers: List[str] = Field(..., min_items=8, max_items=8)

    @validator("answers", each_item=True)
    def validate_each_answer(cls, value):
        if not value or not value.strip():
            raise ValueError("Each answer must be a non-empty string")
        if len(value.strip()) < 3:
            raise ValueError("Each answer must contain meaningful text")
        return value.strip()


class StressResponse(BaseModel):
    overall_stress: float
    external_domains: Dict[str, float]
    interpretation: str
    top_indicators: List[str]