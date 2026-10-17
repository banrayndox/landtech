"""
Fraud & Sandbox Pydantic Schemas
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ProposedSaleRequest(BaseModel):
    plot_key: str = Field(..., json_schema_extra={"example": "GZ-SDR-JL14-KH402-DAG105"})
    seller_name: str
    buyer_name: str
    requested_area: float = Field(..., gt=0.0)
    claimed_master_area: float = Field(..., gt=0.0)
    deed_type: Optional[str] = "সাফ-কবলা দলিল"


class ConfusionTestRequest(BaseModel):
    input_text: str = Field(..., json_schema_extra={"example": "গাজীপুর মদর"})


class AnaCalcRequest(BaseModel):
    ana: float = Field(..., ge=0.0, le=16.0)
    gonda: float = Field(..., ge=0.0, lt=20.0)
    kora: float = Field(..., ge=0.0, lt=4.0)
    kranti: float = Field(..., ge=0.0, lt=3.0)
    til: Optional[float] = Field(default=0.0, ge=0.0, lt=20.0)


class StampMathValidationRequest(BaseModel):
    equation: str = Field(..., json_schema_extra={"example": "১০০+১০০+১০০+১০০+৫০=৪৫০"})


class ChronologyValidationRequest(BaseModel):
    registration_date: str = Field(..., json_schema_extra={"example": "28/10/2001"})
    copy_issue_date: str = Field(..., json_schema_extra={"example": "11/03/2010"})
    execution_date: Optional[str] = None
