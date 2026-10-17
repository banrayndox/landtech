"""
Layer 3 — Lexicon Normalizer & Visual Confusion Matrix
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026

Implements the 13 Bangla visual confusion groups, weighted Levenshtein edit distance,
and configurable land-office gazetteer matching (Districts, Thanas, Mouzas, Deed Types).
Preserves raw OCR text and keeps suggestions distinct from verified values.
"""

import re
from typing import Dict, List, Tuple, Any, Optional, Set

# 13 Visual Confusion Groups for Bangla OCR
CONFUSION_GROUPS: List[Set[str]] = [
    {'ব', 'র', 'ক'},          # Group 1: Triangular loop glyphs
    {'ণ', 'ন'},              # Group 2: Retroflex vs alveolar nasal
    {'ড', 'ড়', 'র'},          # Group 3: Nukta variants and loop
    {'ৎ', 'ত'},              # Group 4: Khanda-ta vs Ta
    {'ই', 'ঈ'},              # Group 5: Short vs long I
    {'উ', 'ঊ'},              # Group 6: Short vs long U
    {'া', 'ো'},              # Group 7: Aa-kar vs O-kar split
    {'শ', 'ষ', 'স', 'ম'},     # Group 8: Sibilants & rounded conjunct loop confusion (includes ম/স OCR ligature)
    {'য', 'য়'},              # Group 9: Ya vs Antasthya Ya
    {'হ', 'ভ'},              # Group 10: Downward hook confusion
    {'খ', 'থ'},              # Group 11: Top loop opening confusion
    {'ঘ', 'ধ'},              # Group 12: Top bar closure confusion
    {'০', 'o', 'O', '0', '১', '1', '৪', '8'}  # Group 13: Numeric/alpha glyph confusion
]

# Configurable Land Records Gazetteer
DEFAULT_GAZETTEER = {
    "districts": [
        "গাজীপুর", "ঢাকা", "ময়মনসিংহ", "নারায়ণগঞ্জ", "নরসিংদী", "মানিকগঞ্জ",
        "মুন্সিগঞ্জ", "টাঙ্গাইল", "কিশোরগঞ্জ", "কুমিল্লা", "চট্টগ্রাম", "সিলেট",
        "রাজশাহী", "খুলনা", "বরিশাল", "রংপুর", "দিনাজপুর", "বগুড়া", "ফরিদপুর"
    ],
    "thanas": [
        "গাজীপুর সদর", "কালিয়াকৈর", "শ্রীপুর", "কাশিমপুর", "টঙ্গী", "কাপাসিয়া",
        "কালীগঞ্জ", "জয়দেবপুর", "সাভার", "ধামরাই", "মিরপুর", "ধানমন্ডি", "গুলশান",
        "উত্তরা", "কোতোয়ালী", "তেজগাঁও", "কেরানীগঞ্জ"
    ],
    "mouzas": [
        "বারেন্ডা", "কাশিমপুর", "দেওয়াইর", "বাইমাইল", "সালনা", "জয়দেবপুর",
        "কোনাবাড়ী", "বোর্ডবাজার", "ভোগড়া", "চান্দনা", "মালেকের বাড়ী", "মির্জাপুর"
    ],
    "deed_types": [
        "বেল এওয়াজে হেবা দলিল",
        "সাফ-কবলা দলিল",
        "দানপত্র দলিল",
        "বন্টননামা দলিল",
        "হেবা বিল এওয়াজ দলিল",
        "অসিয়তনামা দলিল",
        "না-দাবী দলিল",
        "বায়নাপত্র দলিল",
        "বন্ধকী দলিল"
    ]
}


class LexiconNormalizer:
    def __init__(self, gazetteer: Optional[Dict[str, List[str]]] = None):
        self.confusion_groups = CONFUSION_GROUPS
        self.gazetteer = gazetteer or DEFAULT_GAZETTEER
        # Precompute character confusion lookup
        self.confusion_lookup: Dict[str, Set[str]] = {}
        for group in self.confusion_groups:
            for char in group:
                if char not in self.confusion_lookup:
                    self.confusion_lookup[char] = set()
                self.confusion_lookup[char].update(group)

    def are_visually_confused(self, char1: str, char2: str) -> bool:
        """Returns True if char1 and char2 belong to the same confusion group."""
        if char1 == char2:
            return True
        return char2 in self.confusion_lookup.get(char1, set())

    def weighted_edit_distance(self, s1: str, s2: str) -> float:
        """
        Calculates Levenshtein distance with reduced cost for visually confused glyphs.
        - Exact match: 0.0
        - Visually confused glyph substitution: 0.20
        - Standard substitution: 1.0
        - Insertion / Deletion: 1.0
        """
        n, m = len(s1), len(s2)
        dp = [[0.0] * (m + 1) for _ in range(n + 1)]

        for i in range(n + 1):
            dp[i][0] = float(i)
        for j in range(m + 1):
            dp[0][j] = float(j)

        for i in range(1, n + 1):
            c1 = s1[i - 1]
            for j in range(1, m + 1):
                c2 = s2[j - 1]
                if c1 == c2:
                    cost = 0.0
                elif self.are_visually_confused(c1, c2):
                    cost = 0.20  # Discounted cost for visual confusion
                else:
                    cost = 1.0

                dp[i][j] = min(
                    dp[i - 1][j] + 1.0,       # deletion
                    dp[i][j - 1] + 1.0,       # insertion
                    dp[i - 1][j - 1] + cost   # substitution
                )

        return dp[n][m]

    def find_best_gazetteer_match(self, input_text: str, category: Optional[str] = None) -> Tuple[Optional[str], float]:
        """
        Finds the closest match in the land gazetteer using weighted edit distance.
        Returns (best_match, distance).
        """
        clean_input = input_text.strip()
        if not clean_input:
            return None, float("inf")

        candidates = []
        if category and category in self.gazetteer:
            candidates = self.gazetteer[category]
        else:
            for cat_list in self.gazetteer.values():
                candidates.extend(cat_list)

        best_match = None
        min_dist = float("inf")

        for cand in candidates:
            dist = self.weighted_edit_distance(clean_input, cand)
            if dist < min_dist:
                min_dist = dist
                best_match = cand

        return best_match, min_dist

    def normalize_text(self, raw_text: str, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Takes raw OCR text, performs gazetteer matching and visual confusion correction.
        Input example: 'গাজীপুর মদর' -> 'গাজীপুর সদর'
        """
        clean_text = raw_text.strip()
        if not clean_text:
            return {
                "raw_text": raw_text,
                "normalized_suggestion": "",
                "distance": 0.0,
                "confidence": 0.0,
                "matched_category": None,
                "is_corrected": False
            }

        # Check exact match first
        for cat, items in self.gazetteer.items():
            if clean_text in items:
                return {
                    "raw_text": raw_text,
                    "normalized_suggestion": clean_text,
                    "distance": 0.0,
                    "confidence": 0.99,
                    "matched_category": cat,
                    "is_corrected": False
                }

        # Sub-phrase matching (e.g. if raw text has 'থানা: গাজীপুর মদর')
        best_cand, best_dist = None, float("inf")
        matched_cat = None

        search_cats = [category] if category and category in self.gazetteer else list(self.gazetteer.keys())
        for cat in search_cats:
            for item in self.gazetteer[cat]:
                # Direct weighted distance
                d = self.weighted_edit_distance(clean_text, item)
                if d < best_dist:
                    best_dist = d
                    best_cand = item
                    matched_cat = cat

        # Compute normalized similarity confidence: 1.0 - (dist / max(len(text), len(match)))
        max_len = max(len(clean_text), len(best_cand or "")) if best_cand else 1
        conf = max(0.0, min(1.0, 1.0 - (best_dist / (max_len * 1.2))))

        # Only suggest if distance is reasonably small (e.g., <= 2.5 weighted distance)
        should_correct = (best_dist <= 2.5 and best_cand != clean_text)
        suggestion = best_cand if should_correct else clean_text

        return {
            "raw_text": raw_text,
            "normalized_suggestion": suggestion,
            "distance": round(best_dist, 3),
            "confidence": round(conf, 3),
            "matched_category": matched_cat,
            "is_corrected": should_correct
        }

    def test_confusion_matrix_pair(self, input_text: str) -> Dict[str, Any]:
        """
        Dedicated method for the Tab 4 Bangla Confusion-Matrix Sandbox.
        Demonstrates weighted confusion distance and suggestion.
        """
        result = self.normalize_text(input_text)
        return {
            "input_text": input_text,
            "suggested_correction": result["normalized_suggestion"],
            "weighted_distance": result["distance"],
            "confidence": result["confidence"],
            "matched_category": result["matched_category"],
            "is_corrected": result["is_corrected"],
            "confusion_groups_involved": [
                [c for c in group]
                for group in self.confusion_groups
                if any(ch in input_text for ch in group)
            ]
        }
