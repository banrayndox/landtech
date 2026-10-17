"""
Scientific Sandbox API Endpoints
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

from fastapi import APIRouter, HTTPException
from backend.app.schemas.fraud_schemas import ConfusionTestRequest, AnaCalcRequest
from src.lexicon_normalizer import LexiconNormalizer
from src.land_math_validator import LandMathValidator

router = APIRouter(prefix="/api/sandbox", tags=["Scientific Sandbox"])
normalizer = LexiconNormalizer()


@router.post("/confusion-matrix")
def test_confusion_matrix(payload: ConfusionTestRequest):
    """
    Tests Bangla visual confusion matrix with weighted edit distance.
    Example input: 'গাজীপুর মদর' -> 'গাজীপুর সদর'
    """
    return normalizer.test_confusion_matrix_pair(payload.input_text)


@router.post("/ana-calculator")
def calculate_ana_share(payload: AnaCalcRequest):
    """
    Authoritative 16-Ana share converter:
    S_dec = Ana/16 + Gonda/320 + Kora/1280 + Kranti/3840
    Example: 4 Ana, 10 Gonda, 2 Kora, 0 Kranti -> 28.2813%
    """
    try:
        return LandMathValidator.calculate_16_ana_share(
            ana=payload.ana,
            gonda=payload.gonda,
            kora=payload.kora,
            kranti=payload.kranti,
            til=payload.til or 0.0
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
