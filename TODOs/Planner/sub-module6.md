# SUB-MODULE 6: Reports (گزارشات)

## 2. Module Architectures

**Module ID:** `student-reports`
**App Name (Django):** `planner` (Reporting Service)
**Domain Boundary:** This module is responsible for formatting, presenting, and exporting the student's study data into coherent, read-only reports. It serves both structured JSON data for in-app viewing (React tables) and compiled PDF documents for downloading. 
*Crucial Boundary Resolution:* To eliminate redundant database queries and overlapping logic with Sub-module 7 (Analytics), this module **does not perform its own database aggregations**. Instead, it acts as a consumer of the shared `CoreAnalyticsEngine` (introduced in Sub-module 7), taking the raw aggregated data and formatting it strictly for document generation and tabular display.

**Layers:**
* **Domain:** `Report` (Virtual/Aggregated entity, not a DB table).
* **Application:** `ReportFormattingService` (Transforms core analytics data into report structures), `PdfExportService` (Converts HTML/Data to PDF).
* **Infrastructure:** PDF Generation Library (e.g., `WeasyPrint` or `pdfkit`).
* **Interface:** DRF Views/Serializers (`/api/planner/reports/`), React SPA (`ReportsList.jsx`, `ReportViewer.jsx`).

**Data Model (Django `planner` app):**
*No new persistent database tables are created for this module. It relies entirely on existing data aggregated via `CoreAnalyticsEngine` from:*
1. `StudyActivity` (from Sub-module 5)
2. `TestRecord` & `ChapterMastery` (from Sub-module 2)

**Folder Placement:**
* Backend: `backend/apps/planner/services/report_service.py` & `backend/apps/planner/views/report_views.py`
* Frontend: `frontend/src/pages/student/planner/Reports/`

**Naming Conventions Table:**

| Concept | Backend (Django) | Frontend (React) | Database (PostgreSQL) | API Contract |
| --- | --- | --- | --- | --- |
| Reports Hub | `ReportViewSet` | `ReportsList` | N/A | `reports` |
| Weekly Report | `WeeklyReportDTO` | `WeeklyReportView` | N/A | `reports/weekly` |
| Performed Report | `PerformedReportDTO` | `PerformedReportView` | N/A | `reports/performed` |
| Conclusion Report | `ConclusionReportDTO` | `ConclusionReportView` | N/A | `reports/conclusion` |
| Full Report | `FullReportDTO` | `FullReportView` | N/A | `reports/full` |

---

## 3. API Contracts

```markdown
# Student Reports API Contract
**Module ID:** `student-reports`
**Version:** `v1`
**Base Path:** `/api/planner/reports/`
**Owner:** Backend Team 

## Overview
All endpoints support two response types based on the `Accept` header or a `?format=pdf` query parameter:
1. `application/json`: Returns the raw structured data for rendering in React tables.
2. `application/pdf`: Returns a generated PDF blob for download.

## Endpoints

### `GET /api/planner/reports/weekly/`
**Summary:** Generates the scheduled weekly study plan report.
**Auth:** Required (`IsAuthenticated`, Role: `STUDENT`)
**Query Params:** `week_id` (or `start_date` / `end_date`)
**Response 200 (JSON):**
```json
{
  "report_title": "گزارش برنامه هفتگی روزانه",
  "week_start": "2026-09-20",
  "week_end": "2026-09-26",
  "data": {
    "chapters": [
      {
        "chapter_title": "گراف",
        "allocated_minutes": 120
      }
    ]
  }
}

```

**Response 200 (PDF):** Binary PDF Stream (`application/pdf`).

### `GET /api/planner/reports/performed/`

**Summary:** Generates the actually performed weekly study report.
**Auth:** Required
**Query Params:** `week_id` (or `start_date` / `end_date`)
**Response 200 (JSON/PDF):** Structured tabular data or PDF stream.

### `GET /api/planner/reports/conclusion/`

**Summary:** Generates the conclusion/summary report (mastery and test percentages).
**Auth:** Required
**Query Params:** `week_id` (or `start_date` / `end_date`)
**Response 200 (JSON/PDF):** Structured tabular data or PDF stream.

### `GET /api/planner/reports/full/`

**Summary:** Generates a comprehensive report combining Weekly, Performed, and Conclusion data.
**Auth:** Required
**Query Params:** `week_id` (or `start_date` / `end_date`)
**Response 200 (JSON/PDF):** Structured tabular data or PDF stream.

## TypeScript Types (Frontend Integration)

```typescript
export type ReportFormat = 'json' | 'pdf';

export interface ReportBaseDTO {
  report_title: string;
  week_start: string;
  week_end: string;
  generated_at: string;
}

export interface FullReportDTO extends ReportBaseDTO {
  scheduled_data: any;
  performed_data: any;
  conclusion_data: any;
}

```

```

---

## 4. Integration Plan (Delegation TODOs)

### Backend TODOs 
- [ ] **Service Integration:** Create `ReportFormattingService` in the `planner` app. This service must inject the `CoreAnalyticsEngine` to fetch raw data, avoiding duplicate `annotate()` or `aggregate()` queries on the database.
- [ ] **PDF Generation Engine:** Integrate `WeasyPrint` (or `pdfkit`). Create Django HTML templates (`.html` files) that mirror the React views for these reports. These templates will be fed the data from `ReportFormattingService` to generate PDFs.
- [ ] **Content Negotiation:** Implement the 4 read-only GET endpoints. Configure them to check the `Accept` header or `?format=pdf` query parameter to decide whether to return `JsonResponse` or `FileResponse` (PDF).
- [ ] **RTL Font Support:** Ensure the PDF generation server environment includes the required Persian fonts (`IRANSans`) and that the CSS within the PDF templates utilizes `dir="rtl"` to prevent text inversion.

### Frontend TODOs 
- [ ] **Routing:** Add `/reports` to `App.jsx` protected by `<RequireAuth>`. Add dynamic sub-routes for the viewer (e.g., `/reports/view/:type/:timestamp`).
- [ ] **Main Component:** Create `ReportsList.jsx`. Replicate the UI showing the available report types with their respective `مشاهده` (View) and `دانلود PDF` (Download) buttons.
- [ ] **Viewer Component:** Create `ReportViewer.jsx`. This component fetches the JSON version of the report and renders it in a styled HTML table format for in-app viewing (matching the raw HTML `.table-report` class structures).
- [ ] **PDF Download Handler:** Implement an API utility function that triggers a file download when the user clicks the PDF button, passing `Accept: application/pdf`, handling the binary blob response, and prompting a browser file save.

---

## 6. Verification Checklist
- [ ] **DRY Architecture:** The module successfully utilizes `CoreAnalyticsEngine` and contains zero direct database aggregation queries.
- [ ] **Content Negotiation:** The endpoints correctly return JSON or PDF based on the request headers/params.
- [ ] **PDF Quality:** Generated PDFs correctly render RTL Persian text and use the correct fonts without visual distortion.
- [ ] **Blob Handling:** Frontend download buttons correctly prompt a file save dialog and handle binary streams without crashing or attempting to parse as JSON.

```