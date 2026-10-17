"""
P3 Fraud Engine & Double-Selling Simulator Endpoints
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from backend.app.core.permissions import get_current_user
from backend.app.schemas.fraud_schemas import ProposedSaleRequest
from backend.app.db.sqlite_audit import get_fraud_engine

router = APIRouter(prefix="/api/fraud", tags=["Fraud Simulator"])


@router.get("/plot-quota/{plot_key}")
def get_plot_quota(plot_key: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieves authoritative quota and current state of master plot."""
    fe = get_fraud_engine()
    quota = fe.get_plot_quota(plot_key)
    if "error" in quota:
        raise HTTPException(status_code=404, detail=quota["error"])
    return quota


@router.post("/verify-sale")
def verify_custom_sale(payload: ProposedSaleRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Evaluates proposed land transaction against:
    1. CHAIN_BREAK_CHECK
    2. FORGED_KHATIAN_CHECK
    3. UTXO_DOUBLE_SELLING_LOCK
    Reserves quota atomically if valid.
    """
    fe = get_fraud_engine()
    result = fe.process_transaction(
        plot_key=payload.plot_key,
        seller_name=payload.seller_name,
        buyer_name=payload.buyer_name,
        requested_area=payload.requested_area,
        claimed_master_area=payload.claimed_master_area,
        tx_code="CUSTOM"
    )
    return result


@router.post("/demo-tx/{tx_code}")
def execute_benchmark_transaction(tx_code: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Executes one of the five deterministic benchmark simulator transactions (TX_01 to TX_05).
    """
    fe = get_fraud_engine()
    try:
        return fe.execute_benchmark_transaction(tx_code.upper())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/history/{plot_key}")
def get_transaction_history(plot_key: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieves immutable transaction audit history for a plot."""
    fe = get_fraud_engine()
    return fe.get_transaction_history(plot_key)


@router.post("/reset-demo")
def reset_demo_plot(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Resets plot quota and clears previous demo transactions for a clean demo."""
    fe = get_fraud_engine()
    fe.reset_demo_plot()
    return {"message": "Demo plot quota reset to initial 30.0 Decimal available."}
