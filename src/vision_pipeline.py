"""
Layer 1 — Vision Pipeline
BhumiLens AI + BhumiGuard
LandTech Innovation Hackathon 2026

Handles document classification (STAMP_DEED_DOLIL vs TABULAR_KHATIAN_PORCHA),
morphological shadow removal, CLAHE enhancement, clean binarization,
circular official seal detection, spatial segmentation, table-cell extraction,
PII masking, and 8 evidence field crops.
"""

import os
import cv2
import numpy as np
from typing import Dict, List, Tuple, Any, Optional

class VisionPipeline:
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = output_dir
        self.processed_dir = os.path.join(output_dir, "processed")
        self.crops_dir = os.path.join(output_dir, "crops")
        os.makedirs(self.processed_dir, exist_ok=True)
        os.makedirs(self.crops_dir, exist_ok=True)

    def load_image(self, image_path_or_bytes) -> np.ndarray:
        """Load image from file path or raw bytes into BGR numpy array."""
        if isinstance(image_path_or_bytes, bytes):
            nparr = np.frombuffer(image_path_or_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif isinstance(image_path_or_bytes, str):
            if not os.path.exists(image_path_or_bytes):
                raise FileNotFoundError(f"Image file not found: {image_path_or_bytes}")
            img = cv2.imread(image_path_or_bytes, cv2.IMREAD_COLOR)
        elif isinstance(image_path_or_bytes, np.ndarray):
            img = image_path_or_bytes.copy()
        else:
            raise ValueError("Unsupported image input type")

        if img is None:
            raise ValueError("Failed to decode image")
        return img

    def remove_shadows(self, bgr_image: np.ndarray) -> np.ndarray:
        """
        Morphological background illumination subtraction.
        Uses morphological dilation/closing with 15x15 kernel to estimate uneven shadow background.
        """
        # Split channels for color fidelity
        channels = cv2.split(bgr_image)
        norm_channels = []
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        for ch in channels:
            # Dilate to create background illumination model
            dilated = cv2.dilate(ch, kernel)
            # Median blur to smooth illumination model
            bg = cv2.medianBlur(dilated, 21)
            # Difference and normalized division
            diff = 255 - cv2.absdiff(ch, bg)
            norm = cv2.normalize(diff, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8UC1)
            norm_channels.append(norm)
        
        shadow_removed = cv2.merge(norm_channels)
        return shadow_removed

    def clean_binarize(self, bgr_image: np.ndarray) -> np.ndarray:
        """
        CLAHE enhancement followed by Gaussian denoising and adaptive Gaussian thresholding.
        Produces clean, crisp black-and-white binary image.
        """
        gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
        
        # CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        
        # Denoise using bilateral filter to preserve edges
        denoised = cv2.bilateralFilter(enhanced, d=7, sigmaColor=50, sigmaSpace=50)
        
        # Adaptive Gaussian thresholding (kernel size 21, constant 11)
        binarized = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 11
        )
        return binarized

    def detect_grid_density(self, binarized: np.ndarray) -> float:
        """
        Measures horizontal and vertical grid line density to classify document.
        Tabular Khatian/Porcha has dense grid lines; Stamp Deed has minimal grid lines.
        """
        inv_bin = cv2.bitwise_not(binarized)
        h, w = binarized.shape[:2]

        # Horizontal kernel (width // 30)
        h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (max(15, w // 30), 1))
        h_lines = cv2.morphologyEx(inv_bin, cv2.MORPH_OPEN, h_kernel)

        # Vertical kernel (height // 30)
        v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(15, h // 30)))
        v_lines = cv2.morphologyEx(inv_bin, cv2.MORPH_OPEN, v_kernel)

        grid = cv2.bitwise_or(h_lines, v_lines)
        grid_pixel_ratio = float(np.sum(grid > 0)) / float(h * w)
        return grid_pixel_ratio

    def classify_document(self, binarized: np.ndarray) -> str:
        """Classify document into STAMP_DEED_DOLIL or TABULAR_KHATIAN_PORCHA."""
        density = self.detect_grid_density(binarized)
        # Threshold: if grid lines occupy > 0.8% of image area, classify as TABULAR_KHATIAN_PORCHA
        if density > 0.008:
            return "TABULAR_KHATIAN_PORCHA"
        return "STAMP_DEED_DOLIL"

    def detect_circular_seals(self, bgr_image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detects circular government / sub-registry stamps and seals using Hough Circles
        and contour circularity analysis (4 * pi * Area / Perimeter^2).
        """
        gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (9, 9), 2)
        h, w = gray.shape

        seals = []
        min_radius = int(min(h, w) * 0.03)
        max_radius = int(min(h, w) * 0.20)

        circles = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=1.2,
            minDist=min_radius * 2,
            param1=80,
            param2=45,
            minRadius=min_radius,
            maxRadius=max_radius
        )

        if circles is not None:
            circles = np.uint16(np.around(circles))
            for pt in circles[0, :]:
                cx, cy, r = int(pt[0]), int(pt[1]), int(pt[2])
                # Check bounds
                x1 = max(0, cx - r)
                y1 = max(0, cy - r)
                x2 = min(w, cx + r)
                y2 = min(h, cy + r)

                # Compute circularity inside ROI
                roi = gray[y1:y2, x1:x2]
                if roi.size == 0:
                    continue
                _, thresh = cv2.threshold(roi, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
                contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                circularity = 0.85 # baseline confidence for detected Hough circle
                if contours:
                    c = max(contours, key=cv2.contourArea)
                    perimeter = cv2.arcLength(c, True)
                    area = cv2.contourArea(c)
                    if perimeter > 0:
                        circ = 4 * np.pi * area / (perimeter * perimeter)
                        circularity = min(0.99, max(0.5, circ))

                seals.append({
                    "center": (cx, cy),
                    "radius": r,
                    "bbox": [x1, y1, x2 - x1, y2 - y1],
                    "confidence": round(float(circularity), 3),
                    "type": "OFFICIAL_CIRCULAR_SEAL"
                })

        return seals

    def apply_pii_masking(self, bgr_image: np.ndarray, mask_names: bool = True) -> np.ndarray:
        """
        Applies subtle privacy redaction overlay for public hackathon demonstration.
        Does not destroy deed structure, masks specific sensitive party identifiers.
        """
        masked = bgr_image.copy()
        h, w = masked.shape[:2]

        if mask_names:
            # Mask party NID / personal identifier zones in metadata region
            y1, y2 = int(h * 0.28), int(h * 0.32)
            x1, x2 = int(w * 0.45), int(w * 0.85)
            # Blur region
            roi = masked[y1:y2, x1:x2]
            blurred_roi = cv2.GaussianBlur(roi, (25, 25), 0)
            masked[y1:y2, x1:x2] = blurred_roi
            cv2.putText(
                masked, "[DEMO PII MASKED]", (x1 + 10, y1 + 22),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 200), 1, cv2.LINE_AA
            )

        return masked

    def segment_zones(self, bgr_image: np.ndarray) -> Dict[str, Tuple[int, int, int, int]]:
        """
        Five-zone spatial segmentation for deeds:
        1. Zone 1: Header / Stamp serial area (top 0-25%)
        2. Zone 2: Metadata / Parties (25-45%)
        3. Zone 3: Description / Tafsil & Dag-Khatian (45-75%)
        4. Zone 4: Financial / Stamp duty math (75-100%, left half)
        5. Zone 5: Registration / Endorsement & seal (75-100%, right half)
        """
        h, w = bgr_image.shape[:2]
        return {
            "zone_1_header_stamp": (0, 0, w, int(h * 0.25)),
            "zone_2_parties_meta": (0, int(h * 0.25), w, int(h * 0.20)),
            "zone_3_tafsil_land": (0, int(h * 0.45), w, int(h * 0.30)),
            "zone_4_stamp_duty": (0, int(h * 0.75), int(w * 0.50), int(h * 0.25)),
            "zone_5_registration": (int(w * 0.50), int(h * 0.75), int(w * 0.50), int(h * 0.25))
        }

    def extract_evidence_crops(self, bgr_image: np.ndarray, doc_id: str) -> Dict[str, Dict[str, Any]]:
        """
        Extracts the 8 required evidence field crops:
        1. stamp_serial_no
        2. stamp_duty_math
        3. copy_issue_date
        4. deed_number_year
        5. deed_type_and_value
        6. land_area
        7. location_mouza_thana
        8. registration_date
        """
        h, w = bgr_image.shape[:2]
        crop_specs = {
            "stamp_serial_no": {
                # Top header stamp serial area (usually top right or top center)
                "box": (int(w * 0.55), int(h * 0.05), int(w * 0.40), int(h * 0.10)),
                "label": "Stamp Serial No / স্ট্যাম্প সিরিয়াল নং"
            },
            "stamp_duty_math": {
                # Financial calculation zone (bottom left)
                "box": (int(w * 0.05), int(h * 0.78), int(w * 0.45), int(h * 0.12)),
                "label": "Stamp Duty Math / স্ট্যাম্প শুল্ক হিসাব"
            },
            "copy_issue_date": {
                # Certified copy issue date (bottom right margin or header)
                "box": (int(w * 0.55), int(h * 0.88), int(w * 0.40), int(h * 0.08)),
                "label": "Certified Copy Issue Date / নকল সরবরাহের তারিখ"
            },
            "deed_number_year": {
                # Deed number & execution year (top left header or registry header)
                "box": (int(w * 0.05), int(h * 0.05), int(w * 0.45), int(h * 0.10)),
                "label": "Deed Number & Year / দলিল নম্বর ও সাল"
            },
            "deed_type_and_value": {
                # Deed classification and stated value (upper middle)
                "box": (int(w * 0.10), int(h * 0.26), int(w * 0.80), int(h * 0.10)),
                "label": "Deed Type & Stated Value / দলিলের প্রকৃতি ও মূল্য"
            },
            "land_area": {
                # Land area specification (middle land details)
                "box": (int(w * 0.10), int(h * 0.48), int(w * 0.80), int(h * 0.12)),
                "label": "Land Area / হস্তান্তরিত জমির পরিমাণ"
            },
            "location_mouza_thana": {
                # Mouza, Thana, District location
                "box": (int(w * 0.10), int(h * 0.62), int(w * 0.80), int(h * 0.11)),
                "label": "Location (Mouza/Thana/District) / মৌজা, থানা ও জেলা"
            },
            "registration_date": {
                # Registration date (sub-registry endorsement bottom right)
                "box": (int(w * 0.55), int(h * 0.78), int(w * 0.40), int(h * 0.10)),
                "label": "Registration Date / রেজিস্ট্রেশন তারিখ"
            }
        }

        crops_info = {}
        for field_name, spec in crop_specs.items():
            x, y, cw, ch = spec["box"]
            x = max(0, min(x, w - 1))
            y = max(0, min(y, h - 1))
            cw = max(10, min(cw, w - x))
            ch = max(10, min(ch, h - y))

            crop_img = bgr_image[y:y+ch, x:x+cw]
            crop_filename = f"{doc_id}_{field_name}.png"
            crop_path = os.path.join(self.crops_dir, crop_filename)
            cv2.imwrite(crop_path, crop_img)

            # Web accessible relative URL
            rel_url = f"/api/documents/crops/{crop_filename}"
            crops_info[field_name] = {
                "field_name": field_name,
                "label": spec["label"],
                "box": [x, y, cw, ch],
                "file_path": crop_path,
                "url": rel_url
            }

        return crops_info

    def extract_tabular_cells(self, binarized: np.ndarray, doc_id: str) -> List[Dict[str, Any]]:
        """
        Extracts grid cells for TABULAR_KHATIAN_PORCHA documents using morphological line filters.
        """
        inv_bin = cv2.bitwise_not(binarized)
        h, w = binarized.shape[:2]

        h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (max(15, w // 25), 1))
        h_lines = cv2.morphologyEx(inv_bin, cv2.MORPH_OPEN, h_kernel)

        v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(15, h // 25)))
        v_lines = cv2.morphologyEx(inv_bin, cv2.MORPH_OPEN, v_kernel)

        table_grid = cv2.bitwise_and(h_lines, v_lines)
        contours, _ = cv2.findContours(cv2.bitwise_or(h_lines, v_lines), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        cells = []
        cell_idx = 0
        min_cell_area = (w * h) * 0.0005
        max_cell_area = (w * h) * 0.15

        for c in contours:
            x, y, cw, ch = cv2.boundingRect(c)
            area = cw * ch
            if min_cell_area < area < max_cell_area and cw > 20 and ch > 15:
                cell_idx += 1
                cell_filename = f"{doc_id}_cell_{cell_idx:02d}.png"
                cell_path = os.path.join(self.crops_dir, cell_filename)
                cell_img = binarized[y:y+ch, x:x+cw]
                cv2.imwrite(cell_path, cell_img)
                cells.append({
                    "cell_id": cell_idx,
                    "bbox": [x, y, cw, ch],
                    "file_path": cell_path,
                    "url": f"/api/documents/crops/{cell_filename}"
                })
                if cell_idx >= 16:  # limit to primary representative cells
                    break

        return cells

    def process_document(self, image_input, doc_id: str) -> Dict[str, Any]:
        """
        Executes full Layer 1 Vision Pipeline:
        1. Load image
        2. Generate Stage 1: Anonymized Input
        3. Generate Stage 2: Shadow Removed
        4. Generate Stage 3: Clean Binarized
        5. Detect document classification (STAMP_DEED_DOLIL or TABULAR_KHATIAN_PORCHA)
        6. Detect circular government seals
        7. Extract 8 evidence field crops
        8. Extract tabular cells if Khatian
        9. Persist processed images and return structured metadata
        """
        raw_bgr = self.load_image(image_input)

        # Stage 1: Anonymized Input
        stage1_anonymized = self.apply_pii_masking(raw_bgr)
        stage1_filename = f"{doc_id}_stage1_anonymized.png"
        stage1_path = os.path.join(self.processed_dir, stage1_filename)
        cv2.imwrite(stage1_path, stage1_anonymized)

        # Stage 2: Shadow Removed
        stage2_shadow_removed = self.remove_shadows(stage1_anonymized)
        stage2_filename = f"{doc_id}_stage2_shadow_removed.png"
        stage2_path = os.path.join(self.processed_dir, stage2_filename)
        cv2.imwrite(stage2_path, stage2_shadow_removed)

        # Stage 3: Clean Binarized
        stage3_binarized = self.clean_binarize(stage2_shadow_removed)
        stage3_filename = f"{doc_id}_stage3_clean_binarized.png"
        stage3_path = os.path.join(self.processed_dir, stage3_filename)
        cv2.imwrite(stage3_path, stage3_binarized)

        # Classification
        classification = self.classify_document(stage3_binarized)

        # Circular Seal Detection
        detected_seals = self.detect_circular_seals(stage1_anonymized)
        seal_status = {
            "seal_detected": len(detected_seals) > 0,
            "seals_count": len(detected_seals),
            "seals": detected_seals,
            "status_label": "OFFICIAL_SEAL_VERIFIED" if len(detected_seals) > 0 else "NO_SEAL_DETECTED"
        }

        # 8 Evidence Crops
        crops = self.extract_evidence_crops(stage1_anonymized, doc_id)

        # Tabular Cells if Khatian
        table_cells = []
        if classification == "TABULAR_KHATIAN_PORCHA":
            table_cells = self.extract_tabular_cells(stage3_binarized, doc_id)

        # Spatial Zones
        zones = self.segment_zones(raw_bgr)

        return {
            "doc_id": doc_id,
            "classification": classification,
            "seal_status": seal_status,
            "image_stages": {
                "stage1_anonymized": {
                    "title": "Anonymized Input / বেনামীকৃত মূল চিত্র",
                    "file_path": stage1_path,
                    "url": f"/api/documents/processed/{stage1_filename}"
                },
                "stage2_shadow_removed": {
                    "title": "Shadow Removed / ছায়া অপসারিত চিত্র",
                    "file_path": stage2_path,
                    "url": f"/api/documents/processed/{stage2_filename}"
                },
                "stage3_clean_binarized": {
                    "title": "Clean Binarized / পরিষ্কার দ্বিমুখী চিত্র",
                    "file_path": stage3_path,
                    "url": f"/api/documents/processed/{stage3_filename}"
                }
            },
            "crops": crops,
            "table_cells": table_cells,
            "zones": zones
        }
