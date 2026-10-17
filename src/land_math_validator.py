"""
Layer 5 — Land Mathematics & Chronology Validator
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026

Deterministic land-math validation:
1. Stamp duty arithmetic equation validation (e.g. ১০০+১০০+১০০+১০০+৫০=৪৫০ -> PASS)
2. Date chronology verification (Certified Copy Issue Date >= Registration Date >= Execution Date)
3. Authoritative 16-Ana share converter:
   S_dec = Ana/16 + Gonda/320 + Kora/1280 + Kranti/3840
   Example: 4 Ana, 10 Gonda, 2 Kora, 0 Kranti -> 28.2813%
4. Bangladeshi land unit conversions (Decimal/Shatak, Katha, Bigha, Acre).
"""

import re
from datetime import datetime
from typing import Dict, Any, Optional, Tuple

BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯"
ASCII_DIGITS = "0123456789"
TO_ASCII_MAP = str.maketrans(BENGALI_DIGITS, ASCII_DIGITS)
TO_BENGALI_MAP = str.maketrans(ASCII_DIGITS, BENGALI_DIGITS)


def to_ascii_digits(text: str) -> str:
    """Converts Bengali numerals to ASCII numerals."""
    if not text:
        return ""
    return str(text).translate(TO_ASCII_MAP)


def to_bengali_digits(text: str) -> str:
    """Converts ASCII numerals to Bengali numerals."""
    if not text:
        return ""
    return str(text).translate(TO_BENGALI_MAP)


class LandMathValidator:
    @staticmethod
    def validate_stamp_duty_math(equation_str: str) -> Dict[str, Any]:
        """
        Parses and validates stamp duty equation.
        Example input: '১০০+১০০+১০০+১০০+৫০=৪৫০' or '100+100+100+100+50=450'
        Returns status PASS/FAIL with parsed arithmetic breakdown.
        """
        if not equation_str or not equation_str.strip():
            return {
                "equation": equation_str,
                "status": "FAIL",
                "reason": "EMPTY_EQUATION",
                "calculated_sum": 0,
                "stated_total": 0,
                "is_valid": False
            }

        ascii_eq = to_ascii_digits(equation_str).replace(" ", "")
        
        # Split on '='
        if "=" not in ascii_eq:
            return {
                "equation": equation_str,
                "status": "FAIL",
                "reason": "MISSING_EQUALS_SIGN",
                "calculated_sum": 0,
                "stated_total": 0,
                "is_valid": False
            }

        parts = ascii_eq.split("=")
        lhs = parts[0]
        rhs = parts[1]

        # Extract numbers on LHS
        lhs_tokens = re.findall(r"\d+", lhs)
        if not lhs_tokens:
            return {
                "equation": equation_str,
                "status": "FAIL",
                "reason": "INVALID_LHS_TOKENS",
                "calculated_sum": 0,
                "stated_total": 0,
                "is_valid": False
            }

        lhs_numbers = [int(tok) for tok in lhs_tokens]
        calculated_sum = sum(lhs_numbers)

        # Extract RHS total
        rhs_tokens = re.findall(r"\d+", rhs)
        if not rhs_tokens:
            return {
                "equation": equation_str,
                "status": "FAIL",
                "reason": "INVALID_RHS_TOTAL",
                "calculated_sum": calculated_sum,
                "stated_total": 0,
                "is_valid": False
            }

        stated_total = int(rhs_tokens[0])
        is_valid = (calculated_sum == stated_total)

        return {
            "equation": equation_str,
            "parsed_lhs_components": lhs_numbers,
            "calculated_sum": calculated_sum,
            "stated_total": stated_total,
            "status": "PASS" if is_valid else "FAIL",
            "is_valid": is_valid,
            "discrepancy": calculated_sum - stated_total
        }

    @staticmethod
    def parse_bangla_or_iso_date(date_str: str) -> Optional[datetime]:
        """Parses dates in formats like DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD."""
        if not date_str:
            return None
        clean_date = to_ascii_digits(date_str).strip()
        # Common date formats in Bangladesh land documents
        formats = [
            "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y",
            "%Y-%m-%d", "%Y/%m/%d",
            "%d/%m/%y", "%d-%m-%y"
        ]
        for fmt in formats:
            try:
                return datetime.strptime(clean_date, fmt)
            except ValueError:
                continue
        return None

    @classmethod
    def validate_date_chronology(
        cls,
        registration_date_str: str,
        copy_issue_date_str: str,
        execution_date_str: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validates legal chronological order:
        Execution Date <= Registration Date <= Certified Copy Issue Date.
        Example: Reg: 28/10/2001, Copy: 11/03/2010 -> PASS.
        """
        reg_dt = cls.parse_bangla_or_iso_date(registration_date_str)
        copy_dt = cls.parse_bangla_or_iso_date(copy_issue_date_str)
        exec_dt = cls.parse_bangla_or_iso_date(execution_date_str) if execution_date_str else None

        if not reg_dt:
            return {
                "status": "FAIL",
                "reason": "UNPARSEABLE_REGISTRATION_DATE",
                "is_valid": False,
                "message": "রেজিস্ট্রেশন তারিখ সঠিকভাবে পাঠোদ্ধার করা যায়নি।"
            }

        if not copy_dt:
            return {
                "status": "FAIL",
                "reason": "UNPARSEABLE_COPY_ISSUE_DATE",
                "is_valid": False,
                "message": "নকল সরবরাহের তারিখ সঠিকভাবে পাঠোদ্ধার করা যায়নি।"
            }

        # Check 1: Copy issue date must be >= registration date
        if copy_dt < reg_dt:
            days_diff = (reg_dt - copy_dt).days
            return {
                "status": "FAIL",
                "reason": "ANACHRONISTIC_COPY_DATE",
                "is_valid": False,
                "registration_date": reg_dt.strftime("%d/%m/%Y"),
                "copy_issue_date": copy_dt.strftime("%d/%m/%Y"),
                "days_discrepancy": -days_diff,
                "message": f"কালক্রম অসঙ্গতি: নকল সরবরাহের তারিখ ({copy_dt.strftime('%d/%m/%Y')}) রেজিস্ট্রেশনের তারিখের ({reg_dt.strftime('%d/%m/%Y')}) পূর্বে হতে পারে না।"
            }

        # Check 2: If execution date is present, it must be <= registration date
        if exec_dt and exec_dt > reg_dt:
            return {
                "status": "FAIL",
                "reason": "ANACHRONISTIC_EXECUTION_DATE",
                "is_valid": False,
                "message": "দলিল সম্পাদনের তারিখ রেজিস্ট্রেশন তারিখের পরে হতে পারে না।"
            }

        delta_days = (copy_dt - reg_dt).days
        return {
            "status": "PASS",
            "is_valid": True,
            "registration_date": reg_dt.strftime("%d/%m/%Y"),
            "copy_issue_date": copy_dt.strftime("%d/%m/%Y"),
            "days_after_registration": delta_days,
            "message": f"কালক্রম বৈধ: দলিল রেজিস্ট্রেশনের {delta_days} দিন পর নকল গৃহীত হয়েছে।"
        }

    @staticmethod
    def calculate_16_ana_share(
        ana: float,
        gonda: float,
        kora: float,
        kranti: float,
        til: float = 0.0
    ) -> Dict[str, Any]:
        """
        Authoritative 16-Ana share conversion using formula:
        S_dec = Ana/16 + Gonda/320 + Kora/1280 + Kranti/3840
        (Optional Til addition: Til/76800)
        Example: 4 Ana, 10 Gonda, 2 Kora, 0 Kranti -> 28.2813%
        """
        # Range validation
        if not (0 <= ana <= 16):
            raise ValueError(f"Ana must be between 0 and 16. Received: {ana}")
        if not (0 <= gonda < 20):
            raise ValueError(f"Gonda must be between 0 and 19. Received: {gonda}")
        if not (0 <= kora < 4):
            raise ValueError(f"Kora must be between 0 and 3. Received: {kora}")
        if not (0 <= kranti < 3):
            raise ValueError(f"Kranti must be between 0 and 2. Received: {kranti}")
        if not (0 <= til < 20):
            raise ValueError(f"Til must be between 0 and 19. Received: {til}")

        # Exact formula computation
        s_dec = (
            (ana / 16.0) +
            (gonda / 320.0) +
            (kora / 1280.0) +
            (kranti / 3840.0) +
            (til / 76800.0)
        )

        percentage = s_dec * 100.0

        return {
            "ana": ana,
            "gonda": gonda,
            "kora": kora,
            "kranti": kranti,
            "til": til,
            "share_decimal": round(s_dec, 6),
            "share_percentage": round(percentage, 4),
            "formatted_percentage": f"{round(percentage, 4):.4f}%",
            "is_valid": (0.0 <= s_dec <= 1.000001)
        }

    @staticmethod
    def convert_land_units(decimal_val: float) -> Dict[str, float]:
        """
        Converts decimal/shatak area to other traditional Bangladeshi land units:
        1 Decimal = 435.6 sqft
        1 Katha = 1.65 Decimal (approx standard)
        1 Bigha = 33 Decimal
        1 Acre = 100 Decimal
        """
        dec = float(decimal_val)
        return {
            "decimal_shatak": round(dec, 4),
            "sqft": round(dec * 435.6, 2),
            "sqm": round(dec * 40.4686, 2),
            "katha": round(dec / 1.65, 4),
            "bigha": round(dec / 33.0, 4),
            "acre": round(dec / 100.0, 4)
        }
