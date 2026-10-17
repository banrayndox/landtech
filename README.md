# BhumiLens AI + BhumiGuard
### Bangla Land Record Digitization & Double-Selling Fraud Prevention
**LandTech Innovation Hackathon 2026 | Full-Stack Implementation**

---

## 1. Project Overview & Objective

**BhumiLens AI + BhumiGuard** is an offline-first, on-premise GovTech platform engineered for Bangladesh Upazila Land Offices and Sub-Registry Offices. The system solves two critical national land administration challenges without relying on external cloud AI APIs:

1. **P1 — BhumiLens AI (Digitization Studio)**: Digitizes old handwritten and printed Bangla land deeds (দলিল), non-judicial stamp deeds, and Khatian/Porcha records (CS, SA, RS, BS) into structured, verifiable digital assets through an immutable 7-layer computer vision and OCR pipeline.
2. **P3 — BhumiGuard (Fraud Engine & UTXO Lock)**: Enforces deterministic land mathematics, ownership chain validation, forged Khatian detection, and concurrency-safe atomic quota locks to prevent double-selling fraud.

> **LEGAL TITLE DISCLAIMER (NON-GOAL COMPLIANCE)**:  
> *Digitized record for search/indexing and operational validation only. Does NOT establish legal title or confer ownership.*

---

## 2. System Architecture

```text
                               +------------------------------------------------------+
                               |             React 19 PWA Frontend                    |
                               |  (Vite + Tailwind CSS + Lucide Icons + PWA Offline)  |
                               +--------------------------+---------------------------+
                                                          | HTTP REST / JSON
                                                          v
                               +------------------------------------------------------+
                               |             FastAPI Python Backend                   |
                               |  (RBAC, JWT Security, Pydantic, Concurrency Locks)   |
                               +-----------+------------------------------+-----------+
                                           |                              |
            +------------------------------+                              +------------------------------+
            |                                                                                            |
            v                                                                                            v
+-------------------------------+                                                      +-------------------------------+
|     MongoDB Database          |                                                      |     SQLite Audit Ledger       |
|  - Users & Roles              |                                                      |  - Immutable Hash-Chain       |
|  - Auth Sessions & Status     |                                                      |  - Documents Ledger           |
|  - System Configurations      |                                                      |  - UTXO Plot Quota Locks      |
+-------------------------------+                                                      +-------------------------------+
                                           |
                                           v
                       +---------------------------------------+
                       |   Seven-Layer Processing Pipeline     |
                       |  1. Vision Pipeline (Shadow/Binarize) |
                       |  2. OCR Engine (Tesseract/RapidOCR)   |
                       |  3. Lexicon Normalizer (Confusion)    |
                       |  4. SLM Gatekeeper (7 Mandatory Flds) |
                       |  5. Land Math (Stamp & 16-Ana Share)  |
                       |  6. Fraud Engine (UTXO Double-Selling)|
                       |  7. Database Audit (SHA-256 Hash Link)|
                       +---------------------------------------+
```

### Database Separation
- **MongoDB** is authoritative for **user identity, authentication, account status (`ACTIVE`, `PENDING_APPROVAL`, `DEACTIVATED`), and session tracking**.
- **SQLite** (`outputs/bhumilens_gov_records.db`) is authoritative for the **local immutable audit ledger, raw OCR evidence, SHA-256 hash chains, and atomic plot quota locks**.

---

## 3. Seven-Layer Document Processing Pipeline

| Layer | Source Module | Capabilities |
| :--- | :--- | :--- |
| **Layer 1: Vision** | `src/vision_pipeline.py` | Morphological shadow removal, CLAHE enhancement, clean binarization, document classification (`STAMP_DEED_DOLIL` vs `TABULAR_KHATIAN_PORCHA`), circular official seal detection, 5-zone spatial segmentation, 8 evidence field crops, demo PII masking. |
| **Layer 2: OCR** | `src/ocr_engine.py` | Local Tesseract `ben+eng` LSTM with RapidOCR ONNX fallback. Preserves immutable raw OCR text, confidence scores, and crop links. Honest dependency status reporting (no fake OCR). |
| **Layer 3: Lexicon** | `src/lexicon_normalizer.py` | 13 visual confusion groups for Bangla glyphs (e.g. `ব/র/ক`, `ণ/ন`, `ম/স`). Weighted Levenshtein edit distance and land gazetteer matching (`গাজীপুর মদর` $\rightarrow$ `গাজীপুর সদর`). |
| **Layer 4: Gatekeeper**| `src/slm_schema_gatekeeper.py` | Audits 7 mandatory fields: Deed Number, Deed Type, Deed Value, Land Area, Mouza, Dag Number, Khatian Number. Flags missing fields with exact required Bangla warning message. Supports Page 2 / Tafsil supplement with provenance tracking. |
| **Layer 5: Land Math** | `src/land_math_validator.py` | Deterministic stamp duty equation parsing (`১০০+১০০+১০০+১০০+৫০=৪৫০` $\rightarrow$ PASS). Legal chronology validation (`Certified Copy Date >= Registration Date >= Execution Date`). Authoritative 16-Ana share calculation ($S_{dec} = \frac{Ana}{16} + \frac{Gonda}{320} + \frac{Kora}{1280} + \frac{Kranti}{3840}$). |
| **Layer 6: Fraud** | `src/p3_fraud_engine.py` | Master plot quota enforcement: $\text{Available Quota} = \text{Total Master Area} - \text{Mutated Sold Area} - \text{Pending Locks}$. Three core checks: `CHAIN_BREAK_CHECK`, `FORGED_KHATIAN_CHECK`, `UTXO_DOUBLE_SELLING_LOCK`. Atomic concurrency-safe reservations. |
| **Layer 7: Audit** | `src/database_audit.py` | Enforces Maker-Checker separation of duties (prohibits self-approval). Computes SHA-256 block hash: $H_n = \text{SHA256}(H_{n-1} \parallel \text{doc\_id} \parallel \text{CanonicalJSON} \parallel \text{State} \parallel \text{Actor\_ID})$. Cryptographic tamper verification and authorized JSON/CSV exports. |

---

## 4. Role-Based Access Control (RBAC)

- **ADMIN**: Manages user accounts, approves/rejects pending registrations, assigns Maker/Checker roles, monitors system diagnostic health.
- **MAKER**: Ingests deed scans, reviews 3 image stages and 8 evidence crops, edits human-verified fields with provenance, and submits records for Checker review (`MAKER_VERIFIED_PENDING_CHECKER`). Cannot approve their own record.
- **CHECKER**: Reviews Maker submissions, compares raw OCR against verified fields and crop evidence, approves and locks records (`CHECKER_APPROVED_LOCKED`) or returns for correction. Cannot approve a record they submitted as Maker.

---

## 5. Quick Start & Local Setup

### Prerequisites
- Python 3.11+
- Node.js v18+ & npm
- MongoDB Server (community edition running on `localhost:27017`)

### 1. Clone & Install Backend Dependencies
```bash
# In the root repository directory
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Seed Demo Accounts & Benchmark Records
Run the automated seed script to populate synthetic accounts and the benchmark deed `DOLIL_2001_20078`:
```bash
python seed_demo.py
```
**Pre-Configured Demo Credentials**:
- **Admin**: `admin@landtech.gov.bd` / `Admin@LandTech2026!`
- **Maker**: `maker@landtech.gov.bd` / `Maker@LandTech2026!`
- **Checker**: `checker@landtech.gov.bd` / `Checker@LandTech2026!`

### 4. Run the Backend Server
```bash
python run_backend.py
```
- API Base URL: `http://localhost:8000`
- Swagger Interactive Documentation: `http://localhost:8000/docs`
- Health Diagnostics Endpoint: `http://localhost:8000/api/health`

### 5. Install & Run React Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
- Web Application URL: `http://localhost:5173`

---

## 6. Automated Testing & Verification

Run the full pytest suite covering all 7 pipeline layers, RBAC rules, and API integration:
```bash
pytest tests/ -v
```

### Test Results Summary
- **Total Tests**: 34 passed
- **Coverage**:
  - `tests/test_auth_and_rbac.py`: Registration, duplicate check, password hashing, role permissions, self-approval prevention.
  - `tests/test_database_audit.py`: SHA-256 hash-chain formula, state transitions, tamper detection, JSON/CSV exports with disclaimer.
  - `tests/test_fraud_engine.py`: Plot quota boundary calculations, atomic locking, 5 benchmark transactions (`TX_01` to `TX_05`), fraud reason codes.
  - `tests/test_land_math.py`: Stamp duty arithmetic parsing, date chronology validation, 16-Ana share formula and boundaries.
  - `tests/test_lexicon_normalizer.py`: 13 visual confusion groups, weighted edit distance, land gazetteer matching (`গাজীপুর মদর` $\rightarrow$ `গাজীপুর সদর`).
  - `tests/test_vision_pipeline.py`: Classification, shadow removal, clean binarization, circular seal detection, 8 evidence field crops, 7-field gatekeeper.
  - `tests/test_api_integration.py`: End-to-end FastAPI client tests for all endpoints.

---

## 7. Frontend Production Build & PWA Verification

To test the production build and verify the Progressive Web App (PWA) manifest and service worker:
```bash
cd frontend
npm run build
```
- PWA Manifest: `frontend/dist/manifest.webmanifest`
- Offline Service Worker: `frontend/dist/sw.js` (generated via `vite-plugin-pwa`)

---

## 8. Offline Deployment & Air-Gap Compliance

- **Zero Cloud AI Dependency**: All OCR inference, image processing, and verification logic execute locally on CPU/local GPU.
- **Tesseract Configuration**: To enable Tesseract OCR for Bangla in offline mode, install Tesseract and download `ben.traineddata` and `eng.traineddata` into the `tessdata` folder. Set `TESSERACT_CMD` in `.env` if not in PATH.
- **Local SLM (Ollama)**: For grammar-constrained structured extraction, run Ollama locally (`ollama run phi3:mini`) and configure `OLLAMA_BASE_URL=http://localhost:11434` in `.env`.
