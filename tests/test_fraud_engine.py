"""
Tests for Layer 6: P3 UTXO Double-Selling & Fraud Prevention Engine
BhumiLens AI + BhumiGuard
"""

import pytest
from src.p3_fraud_engine import FraudEngine


@pytest.fixture(autouse=True)
def setup_fraud_engine():
    engine = FraudEngine()
    engine.reset_demo_plot()
    yield engine
    engine.reset_demo_plot()


def test_initial_quota(setup_fraud_engine):
    engine = setup_fraud_engine
    quota = engine.get_plot_quota("GZ-SDR-JL14-KH402-DAG105")
    assert quota["total_master_area"] == 30.0
    assert quota["mutated_sold_area"] == 0.0
    assert quota["available_quota"] == 30.0


def test_five_benchmark_transactions(setup_fraud_engine):
    engine = setup_fraud_engine

    # TX_01: First Valid Partial Sale 18.0 Dec -> ALLOWED, leaves 12.0 Dec
    tx1 = engine.execute_benchmark_transaction("TX_01")
    assert tx1["decision"] == "ALLOWED"
    assert tx1["available_quota_after"] == 12.0
    assert tx1["spec_meta"]["benchmark_match"] is True

    # TX_02: Double-Selling Oversell Attempt 20.0 Dec -> BLOCKED
    tx2 = engine.execute_benchmark_transaction("TX_02")
    assert tx2["decision"] == "BLOCKED"
    assert tx2["reason_code"] == "UTXO_DOUBLE_SELLING_LOCK"
    assert tx2["available_quota_after"] == 12.0

    # TX_03: Broken Ownership Chain Fraud -> BLOCKED
    tx3 = engine.execute_benchmark_transaction("TX_03")
    assert tx3["decision"] == "BLOCKED"
    assert tx3["reason_code"] == "CHAIN_BREAK_CHECK"

    # TX_04: Forged Khatian Record Fraud -> BLOCKED
    tx4 = engine.execute_benchmark_transaction("TX_04")
    assert tx4["decision"] == "BLOCKED"
    assert tx4["reason_code"] == "FORGED_KHATIAN_CHECK"

    # TX_05: Valid Sale of Remaining Quota 12.0 Dec -> ALLOWED, leaves 0.0 Dec
    tx5 = engine.execute_benchmark_transaction("TX_05")
    assert tx5["decision"] == "ALLOWED"
    assert tx5["available_quota_after"] == 0.0


def test_custom_oversell_blocked(setup_fraud_engine):
    engine = setup_fraud_engine
    # Request 35.0 Decimal when total is 30.0
    res = engine.process_transaction(
        plot_key="GZ-SDR-JL14-KH402-DAG105",
        seller_name="মোহাম্মদ রফিকুল ইসলাম",
        buyer_name="নতুন ক্রেতা",
        requested_area=35.0,
        claimed_master_area=30.0
    )
    assert res["decision"] == "BLOCKED"
    assert res["reason_code"] == "UTXO_DOUBLE_SELLING_LOCK"
