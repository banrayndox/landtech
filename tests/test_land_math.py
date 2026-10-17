"""
Tests for Layer 5: Land Mathematics & Chronology Validator
BhumiLens AI + BhumiGuard
"""

import pytest
from src.land_math_validator import LandMathValidator


def test_stamp_duty_math_valid():
    # Example equation from spec: ১০০+১০০+১০০+১০০+৫০=৪৫০
    res = LandMathValidator.validate_stamp_duty_math("১০০+১০০+১০০+১০০+৫০=৪৫০")
    assert res["status"] == "PASS"
    assert res["is_valid"] is True
    assert res["calculated_sum"] == 450
    assert res["stated_total"] == 450


def test_stamp_duty_math_invalid():
    # Intentionally incorrect total: 100+100+50 = 300 (actual 250)
    res = LandMathValidator.validate_stamp_duty_math("১০০+১০০+৫০=৩০০")
    assert res["status"] == "FAIL"
    assert res["is_valid"] is False
    assert res["calculated_sum"] == 250
    assert res["stated_total"] == 300
    assert res["discrepancy"] == -50


def test_date_chronology_valid():
    # Valid: Reg date 28/10/2001, Copy issue date 11/03/2010
    res = LandMathValidator.validate_date_chronology(
        registration_date_str="28/10/2001",
        copy_issue_date_str="11/03/2010"
    )
    assert res["status"] == "PASS"
    assert res["is_valid"] is True
    assert res["days_after_registration"] > 0


def test_date_chronology_anachronistic_failure():
    # Invalid: Copy date is before registration date
    res = LandMathValidator.validate_date_chronology(
        registration_date_str="28/10/2005",
        copy_issue_date_str="11/03/2001"
    )
    assert res["status"] == "FAIL"
    assert res["is_valid"] is False
    assert res["reason"] == "ANACHRONISTIC_COPY_DATE"


def test_16_ana_share_spec_example():
    # Spec example: 4 Ana, 10 Gonda, 2 Kora, 0 Kranti -> 28.2813%
    res = LandMathValidator.calculate_16_ana_share(ana=4, gonda=10, kora=2, kranti=0)
    assert res["is_valid"] is True
    assert res["formatted_percentage"] == "28.2813%"
    assert round(res["share_percentage"], 4) == 28.2813


def test_16_ana_share_boundaries():
    # 16 Ana (full plot) -> 100%
    full = LandMathValidator.calculate_16_ana_share(ana=16, gonda=0, kora=0, kranti=0)
    assert full["formatted_percentage"] == "100.0000%"

    # 8 Ana (half plot) -> 50%
    half = LandMathValidator.calculate_16_ana_share(ana=8, gonda=0, kora=0, kranti=0)
    assert half["formatted_percentage"] == "50.0000%"

    # Invalid range should raise ValueError
    with pytest.raises(ValueError):
        LandMathValidator.calculate_16_ana_share(ana=17, gonda=0, kora=0, kranti=0)
