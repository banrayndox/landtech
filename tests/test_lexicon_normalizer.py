"""
Tests for Layer 3: Lexicon Normalizer & Visual Confusion Matrix
BhumiLens AI + BhumiGuard
"""

import pytest
from src.lexicon_normalizer import LexiconNormalizer


def test_gazetteer_confusion_correction():
    # Specification requirement: 'গাজীপুর মদর' -> 'গাজীপুর সদর'
    normalizer = LexiconNormalizer()
    res = normalizer.test_confusion_matrix_pair("গাজীপুর মদর")
    assert res["suggested_correction"] == "গাজীপুর সদর"
    assert res["is_corrected"] is True
    assert res["weighted_distance"] <= 0.5


def test_confusion_groups_membership():
    normalizer = LexiconNormalizer()
    # ব, র, ক confusion group
    assert normalizer.are_visually_confused("ব", "র") is True
    assert normalizer.are_visually_confused("ব", "ক") is True
    # ণ, ন confusion group
    assert normalizer.are_visually_confused("ণ", "ন") is True
    # unrelated characters should not be confused
    assert normalizer.are_visually_confused("ক", "ল") is False


def test_weighted_vs_standard_distance():
    normalizer = LexiconNormalizer()
    # Substitution within confusion group costs 0.20
    dist_confused = normalizer.weighted_edit_distance("বর", "রর")
    # Substitution outside confusion group costs 1.0
    dist_normal = normalizer.weighted_edit_distance("বর", "জর")
    assert dist_confused < dist_normal
    assert round(dist_confused, 2) == 0.20
    assert round(dist_normal, 2) == 1.00


def test_deed_type_normalization():
    normalizer = LexiconNormalizer()
    res = normalizer.normalize_text("বেল এওয়াজে হেবা দলিল")
    assert res["normalized_suggestion"] == "বেল এওয়াজে হেবা দলিল"
    assert res["confidence"] >= 0.95
