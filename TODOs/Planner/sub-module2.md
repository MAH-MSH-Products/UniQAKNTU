# SUB-MODULE 2: Conclusion Plan & Test Analytics (جدول جمع‌بندی)

## 2. Module Architectures

**Module ID:** `conclusion-plan`
**App Name (Django):** `planner` (Extending the base app)
**Domain Boundary:** This module handles the granular tracking of a student's test performance and mastery level. It is the **Single Source of Truth** for all test-related data (resolving previous overlaps with Sub-module 5). It calculates standard exam percentages (accounting for negative marking) and allows students to self-assess their mastery level (0-100%) for specific topics. It explicitly relies on the existing `curriculum` app to provide a hierarchical `Chapter` breakdown to ensure consistent granularity across all planner modules.

**Layers:**
* **Domain:** `ChapterMastery`, `TestRecord`
* **Application:** Percentage calculation logic, Aggregation service for the "Conclusion Grid".
* **Infrastructure:** PostgreSQL relational mapping via Django ORM.
* **Interface:** DRF Views/Serializers (`/api/planner/conclusion-plan/`), React SPA (`ConclusionPlan.jsx`).

**Data Model (Django `planner` app):**

*Note: It is assumed that `SourceMaterialChapter` exists or will be added to the `curriculum` app to provide the necessary granularity.*

1. `ChapterMastery`:
* `id`: UUID / PK
* `student`: ForeignKey to `accounts.User` (Role: STUDENT)
* `chapter`: ForeignKey to `curriculum.SourceMaterialChapter`
* `level`: Integer (1 to 100)
* *Constraint*: `unique_together = ['student', 'chapter']`

2. `TestRecord`:
* `id`: UUID / PK
* `student`: ForeignKey to `accounts.User` (Role: STUDENT)
* `chapter`: ForeignKey to `curriculum.SourceMaterialChapter`
* `test_format`: CharField/Enum (e.g., 'ALL', 'EVEN', 'ODD', '3K', 'HALF1', etc.)
* `test_method`: CharField/Enum ('FEEDBACK', 'WASHBACK')
* `total_tests`: Integer
* `correct_tests`: Integer
* `wrong_tests`: Integer
* *Constraint*: `unique_together = ['student', 'chapter', 'test_format', 'test_method']`

**Folder Placement:**
* Backend: `backend/apps/planner/`
* Frontend: `frontend/src/pages/student/planner/ConclusionPlan/`

**Naming Conventions Table:**

| Concept | Backend (Django) | Frontend (React) | Database (PostgreSQL) | API Contract |
| --- | --- | --- | --- | --- |
| Conclusion Plan | `ConclusionPlanAggregator` | `ConclusionPlan` | N/A (Aggregated) | `conclusion-plan` |
| Mastery Level | `ChapterMastery` | `ChapterMastery` | `planner_chaptermastery` | `mastery` |
| Test Record | `TestRecord` | `TestRecord` | `planner_testrecord` | `test-records` |

---

## 3. API Contracts

```markdown
# Conclusion Plan API Contract
**Module ID:** `conclusion-plan`
**Version:** `v1`
**Base Path:** `/api/planner/conclusion-plan/`
**Owner:** Backend Team 

## Enums
**TestFormat:** `ALL`, `EVEN`, `ODD`, `3K`, `3K_1`, `3K_2`, `4K`, `4K_1`, `4K_2`, `4K_3`, `HALF_1`, `HALF_2`, `IMPORTANT`, `THIRD_1`, `THIRD_2`, `THIRD_3`
**TestMethod:** `FEEDBACK`, `WASHBACK`

## Endpoints

### `GET /api/planner/conclusion-plan/`
**Summary:** Retrieve the aggregated conclusion grid data for the logged-in student, including mastery levels and test records grouped by chapter.
**Auth:** Required (`IsAuthenticated`, Role: `STUDENT`)
**Response 200:**
```json
{
  "results": [
    {
      "chapter": { "id": 1, "title": "فصل اول", "source_material_id": 12 },
      "mastery_level": 85,
      "test_records": [
        {
          "id": "uuid",
          "test_format": "EVEN",
          "test_method": "FEEDBACK",
          "total_tests": 40,
          "correct_tests": 30,
          "wrong_tests": 5,
          "untested_tests": 5,
          "percentage": 68.75
        }
      ]
    }
  ]
}

```

### `POST /api/planner/conclusion-plan/test-records/`

**Summary:** Create or update a test record for a specific chapter, format, and method (Upsert logic).
**Auth:** Required
**Body Schema:**

```json
{
  "chapter_id": 1,
  "test_format": "EVEN",
  "test_method": "FEEDBACK",
  "total_tests": 40,
  "correct_tests": 30,
  "wrong_tests": 5
}

```

**Response 201/200:** Returns the saved `TestRecord` with backend-calculated `percentage` and `untested_tests`.

### `DELETE /api/planner/conclusion-plan/test-records/{id}/`

**Summary:** Delete a specific test record.
**Auth:** Required (Author only)
**Response 204:** No Content.

### `POST /api/planner/conclusion-plan/mastery/`

**Summary:** Set the mastery level for a chapter (Upsert logic).
**Auth:** Required
**Body Schema:**

```json
{
  "chapter_id": 1,
  "level": 85
}

```

**Response 201/200:** Success message.

### `DELETE /api/planner/conclusion-plan/mastery/{chapter_id}/`

**Summary:** Remove the mastery level for a chapter.
**Auth:** Required (Author only)
**Response 204:** No Content.

## TypeScript Types (Frontend Integration)

```typescript
export type TestFormat = 'ALL' | 'EVEN' | 'ODD' | '3K' | '3K_1' /* ... */;
export type TestMethod = 'FEEDBACK' | 'WASHBACK';

export interface TestRecordDTO {
  id: string;
  test_format: TestFormat;
  test_method: TestMethod;
  total_tests: number;
  correct_tests: number;
  wrong_tests: number;
  untested_tests: number; // Backend calculated
  percentage: number; // Backend calculated
}

```

```

---

## 4. Integration Plan (Delegation TODOs)

### Backend TODOs 
- [ ] **Curriculum Extension:** Ensure `SourceMaterialChapter` exists in the `curriculum` app[cite: 24]. If not, create it so books/courses can be divided into chapters. This is mandatory for cross-module consistency.
- [ ] **Models Definition:** Add `ChapterMastery` and `TestRecord` to `apps/planner/models.py`.
- [ ] **Business Logic (Percentage Calculation):** Inside the `TestRecord` model `save()` method, enforce the standard exam percentage calculation: `percentage = ((correct_tests * 3) - wrong_tests) / (total_tests * 3) * 100`. Calculate `untested_tests = total_tests - correct_tests - wrong_tests`.
- [ ] **Upsert Logic:** In the `POST /test-records/` and `POST /mastery/` views, check if a record with the same unique constraints exists. If it does, *update* it instead of creating a duplicate (Upsert pattern) to prevent data anomalies.
- [ ] **ViewSets & Routing:** Implement the endpoints defined in the API contract in `apps/planner/views.py`. Ensure `STUDENT` users can only access/modify their own data[cite: 24].

### Frontend TODOs 
- [ ] **Routing:** Add `/schedule/conclusion-plan` to `App.jsx` protected by `<RequireAuth>`.
- [ ] **Service Layer:** Update `src/services/api.js` with the 5 new endpoints defined in the contract, utilizing the existing Axios interceptor for JWT auth[cite: 24].
- [ ] **Component Structure:** 
    - Create `ConclusionPlan.jsx`.
    - Create `ConclusionForm.jsx` (for the input area with Book, Chapter, Format, Method dropdowns and input fields).
    - Create `ConclusionGrid.jsx` (for the complex data table showing the summary).
- [ ] **Client-Side Calculation:** Implement live preview calculation on `blur` (focus out) for the test inputs before hitting save. Replicate the logic: `percent = (correct * 3 - fault)/ (total * 3) * 100`.
- [ ] **Dynamic Dropdowns:** Fetch source materials via the existing `SourceMaterialsContext`[cite: 24]. When a book is selected, fetch and populate the associated chapters in the second dropdown.
- [ ] **UI/UX Customization:** Apply existing Glassmorphism and custom CSS variables from `src/index.css` to the tables and forms to ensure perfect visual consistency with the rest of AzmoonHub[cite: 24].

---

## 6. Verification Checklist
- [ ] `SourceMaterial` to `Chapter` relationship is securely established and utilized as the primary granularity metric.
- [ ] Formula `((C*3)-W)/(T*3)*100` accurately calculates the percentage both on the frontend preview and the backend database save.
- [ ] Upsert behavior works flawlessly: submitting identical format/method for the same chapter updates the existing row rather than crashing or duplicating.
- [ ] Mastery level strictly validates integers between 1 and 100.
- [ ] The Single Source of Truth architecture is intact: This is the *only* module handling test inputs.

```