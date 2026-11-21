# Comparison of Application Capabilities vs README.md

This document compares the features described in **README.md** with the actual implementation in the codebase (backend NestJS API and Angular frontend).

| # | Feature (README) | Implemented? | Implementation Details / Notes |
|---|------------------|--------------|--------------------------------|
| 1 | **Upload & formal‑technical analysis of a request** – user uploads a file, local AI model analyses content, extracts key data, checks legal compliance. | **Partial** | - Frontend component `document-create` allows file upload and parses JSON/TXT files to extract title, content, author, tags. \n- The parsed data is sent to the backend via `POST /documents` which creates a `Document` record. \n- No AI model integration is present in the current code; analysis is limited to similarity checking (see feature 2). |
| 2 | **Search archive & recommend department** – system searches local knowledge base, shows similar cases, recommends appropriate city departments. | **Implemented** | - Backend endpoint `POST /documents/check-similarity` (see `DocumentsController.checkSimilarity`) implements similarity analysis against stored documents and returns `SimilarityCheckResult` with matched documents and `suggestedDepartments`. \n- Frontend `document-create` calls this endpoint (`documentService.checkSimilarity`) and automatically populates the recommended department and notes. |
| 3 | **Integrated request calendar & deadline management** – interactive table with calendar, auto‑calculates statutory response deadline, highlights urgent requests. | **Missing** | - No calendar UI or table view is present in the repository. The backend stores `terminOdpowiedzi` in document metadata but there is no component that displays a chronological list or visual calendar. |
| 4 | **Aggregation of departmental data & generation of response draft** – collects information from departments, AI generates complete draft letter. | **Partial** | - Backend provides `POST /documents/:id/generate-response` which creates a draft response (`generateResponseModel`) using a template and inserts detected sensitive fields. \n- The draft is generated, but there is no UI for aggregating data from multiple departments before generation. |
| 5 | **Semi‑automatic anonymization** – highlights sensitive personal data in the draft, user confirms or rejects anonymization. | **Implemented** | - `DocumentsService.generateResponseModel` calls `detectSensitiveData` to identify emails, phone numbers, etc., and creates `SensitiveField[]` (`dane_podlegajace_anonimizacji`). \n- The draft includes anonymized placeholders; however, UI for user confirmation of each field is not implemented. |
| 6 | **Export & human‑controlled finalisation** – exported draft can be edited; system does not send any correspondence automatically. | **Implemented** | - The backend returns the draft response and anonymized preview. Export functionality is not explicitly present (no file‑download endpoint), but the data can be retrieved via the API and presumably exported by the client.

---

## Summary
- Core AI‑assisted similarity search and department recommendation (feature 2) is fully functional.
- Draft generation with anonymization (features 4 & 5) exists, though UI interactions are limited.
- File upload and basic parsing (feature 1) are present, but the AI analysis step is absent.
- Calendar view, request aggregation UI, and explicit export mechanisms (features 3 & 6) are not implemented.

*No source files were modified.*
