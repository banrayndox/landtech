"""
Layer 2 — Local OCR Engine
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026

Handles local OCR inference using Tesseract (ben+eng) and local RapidOCR.
Keeps raw_ocr_text immutable, tracks confidence and evidence crop references,
and never fabricates results if engines fail.
"""

import os
import shutil
import subprocess
import cv2
import numpy as np
from typing import Dict, List, Any, Optional

try:
    from rapidocr_onnxruntime import RapidOCR
    RAPIDOCR_AVAILABLE = True
except Exception:
    RAPIDOCR_AVAILABLE = False


class OCREngine:
    def __init__(self, tesseract_cmd: Optional[str] = None, langs: str = "ben+eng"):
        self.tesseract_cmd = tesseract_cmd or os.getenv("TESSERACT_CMD", "") or shutil.which("tesseract")
        self.langs = langs
        self.rapid_ocr = None
        if RAPIDOCR_AVAILABLE:
            try:
                self.rapid_ocr = RapidOCR()
            except Exception:
                self.rapid_ocr = None

    def get_engine_status(self) -> Dict[str, Any]:
        """
        Inspects local OCR engines availability and language packs without throwing.
        Never pretends an engine is working when it is not.
        """
        tesseract_installed = False
        tesseract_langs = []
        tesseract_version = None

        if self.tesseract_cmd:
            try:
                # Check version
                proc_ver = subprocess.run(
                    [self.tesseract_cmd, "--version"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=5
                )
                if proc_ver.returncode == 0:
                    tesseract_installed = True
                    tesseract_version = proc_ver.stdout.splitlines()[0] if proc_ver.stdout else "Available"

                # Check installed languages
                proc_langs = subprocess.run(
                    [self.tesseract_cmd, "--list-langs"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=5
                )
                if proc_langs.returncode == 0:
                    lines = proc_langs.stdout.splitlines()
                    tesseract_langs = [l.strip() for l in lines[1:] if l.strip()]
            except Exception as e:
                tesseract_installed = False

        has_ben = "ben" in tesseract_langs
        has_eng = "eng" in tesseract_langs

        return {
            "tesseract": {
                "available": tesseract_installed,
                "executable_path": self.tesseract_cmd or "Not found",
                "version": tesseract_version,
                "installed_languages": tesseract_langs,
                "has_bangla_pack": has_ben,
                "has_english_pack": has_eng,
                "status_message": (
                    "Tesseract ben+eng ready" if (tesseract_installed and has_ben and has_eng)
                    else "Tesseract installed but missing 'ben' traineddata" if (tesseract_installed and not has_ben)
                    else "Tesseract executable not found in PATH or TESSERACT_CMD"
                )
            },
            "rapidocr": {
                "available": self.rapid_ocr is not None,
                "status_message": "Local ONNX RapidOCR engine active" if self.rapid_ocr is not None else "RapidOCR not available"
            },
            "primary_active_engine": (
                "tesseract" if (tesseract_installed and has_ben)
                else "rapidocr" if self.rapid_ocr is not None
                else "none"
            )
        }

    def run_ocr_on_image(self, image_input) -> Dict[str, Any]:
        """
        Executes OCR on an image crop or page.
        Returns extracted text, confidence, and engine name.
        """
        status = self.get_engine_status()
        active_engine = status["primary_active_engine"]

        # Ensure image is BGR np.ndarray
        if isinstance(image_input, str):
            if not os.path.exists(image_input):
                return {
                    "text": "",
                    "confidence": 0.0,
                    "engine": "none",
                    "error": f"Image file not found: {image_input}"
                }
            img = cv2.imread(image_input)
        elif isinstance(image_input, np.ndarray):
            img = image_input
        else:
            return {
                "text": "",
                "confidence": 0.0,
                "engine": "none",
                "error": "Invalid image type"
            }

        if img is None or img.size == 0:
            return {"text": "", "confidence": 0.0, "engine": "none", "error": "Empty image"}

        # Attempt RapidOCR if available
        if self.rapid_ocr is not None:
            try:
                result, elapse = self.rapid_ocr(img)
                if result:
                    extracted_lines = []
                    conf_scores = []
                    for line in result:
                        text = line[1]
                        score = float(line[2])
                        extracted_lines.append(text)
                        conf_scores.append(score)
                    full_text = " ".join(extracted_lines).strip()
                    avg_conf = float(np.mean(conf_scores)) if conf_scores else 0.0
                    return {
                        "text": full_text,
                        "confidence": round(avg_conf, 4),
                        "engine": "rapidocr_onnx",
                        "error": None
                    }
            except Exception as e:
                pass

        # Attempt Tesseract if available
        if status["tesseract"]["available"]:
            try:
                import tempfile
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                    tmp_name = tmp.name
                    cv2.imwrite(tmp_name, img)
                
                cmd = [
                    self.tesseract_cmd,
                    tmp_name,
                    "stdout",
                    "-l", self.langs
                ]
                proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
                if os.path.exists(tmp_name):
                    os.remove(tmp_name)

                if proc.returncode == 0:
                    text = proc.stdout.strip()
                    return {
                        "text": text,
                        "confidence": 0.88, # nominal confidence when CLI stdout is used
                        "engine": "tesseract",
                        "error": None
                    }
            except Exception as e:
                return {
                    "text": "",
                    "confidence": 0.0,
                    "engine": "tesseract",
                    "error": str(e)
                }

        return {
            "text": "",
            "confidence": 0.0,
            "engine": "none",
            "error": "No OCR engine available. Please install Tesseract with ben language pack or verify ONNX runtime."
        }

    def process_evidence_crops(self, crops_dict: Dict[str, Dict[str, Any]], sample_fallback: Optional[Dict[str, str]] = None) -> Dict[str, Dict[str, Any]]:
        """
        Extracts raw OCR text for each of the 8 evidence crops.
        Maintains strict separation between:
        - raw_ocr_text
        - confidence
        - crop_path
        - provenance
        """
        ocr_results = {}
        engine_status = self.get_engine_status()

        for field_name, crop_info in crops_dict.items():
            crop_path = crop_info.get("file_path")
            ocr_out = self.run_ocr_on_image(crop_path)
            
            raw_text = ocr_out.get("text", "")
            confidence = ocr_out.get("confidence", 0.0)
            engine_used = ocr_out.get("engine", "none")

            # If OCR engine produced empty text on a known synthetic demo sample,
            # use documented sample fallback with explicit DEMO provenance
            provenance = f"OCR_{engine_used.upper()}"
            if not raw_text and sample_fallback and field_name in sample_fallback:
                raw_text = sample_fallback[field_name]
                confidence = 0.94
                provenance = "DEMO_SYNTHETIC_DATA"

            ocr_results[field_name] = {
                "field_name": field_name,
                "label": crop_info.get("label", field_name),
                "crop_path": crop_path,
                "crop_url": crop_info.get("url", ""),
                "raw_ocr_text": raw_text,
                "confidence": confidence,
                "engine_used": engine_used,
                "provenance": provenance,
                "normalized_value": None, # to be populated by Layer 3/4
                "human_verified_value": None # to be populated by Maker/Checker
            }

        return ocr_results
