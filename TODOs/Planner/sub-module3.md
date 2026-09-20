Here is the detailed architectural design, API contract, and strict delegation TODOs for the third sub-module: **Dashboard & Tools (داشبورد)**.

As requested, I am acting as the Senior Software Architect assigning tasks. **No source code is generated in this step**, only the blueprints and task breakdowns.

---

# SUB-MODULE 3: Dashboard & Student Tools (داشبورد)

## 2. Module Architectures

**Module ID:** `student-dashboard`
**App Name (Django):** `planner` (extended) & `community` (new, for opinions)
**Domain Boundary:** This module serves as the central hub for the student. It aggregates data from the study planner, provides utility widgets (Stopwatch, Persian Calendar, Exam Countdown), handles daily personal notes, enables consultation bookings, and introduces a gamified Leaderboard and Community Opinions section.

**Layers:**

* **Domain:** `DailyNote`, `ConsultationBooking`, `StudentOpinion`, `LeaderboardAggregation`
* **Application:** Aggregation services for charts and leaderboards, Voting logic for opinions.
* **Infrastructure:** PostgreSQL relational mapping via Django ORM, Redis for caching leaderboard data (performance critical).
* **Interface:** DRF Views/Serializers (`/api/planner/dashboard/`, `/api/community/opinions/`), React SPA (`StudentDashboard.jsx`).

**Data Model (Django apps):**

1. `DailyNote` (in `planner` app):
* `id`: UUID / PK
* `student`: ForeignKey to `User`
* `date`: DateField (Unique per student)
* `text`: TextField


2. `ConsultationBooking` (in `planner` app):
* `id`: UUID / PK
* `student`: ForeignKey to `User`
* `day_of_week`: Integer (1 to 7)


* `time_slot`: TimeField


* `created_at`: DateTimeField


3. `StudentOpinion` (in `community` app):
* `id`: UUID / PK
* `student`: ForeignKey to `User`
* `text`: TextField


* `likes`: Integer (Default: 0)


* `dislikes`: Integer (Default: 0)


* `is_anonymous`: Boolean


* `status`: Enum ('PENDING', 'APPROVED', 'REJECTED')


4. `OpinionVote` (in `community` app):
* `opinion`: ForeignKey to `StudentOpinion`
* `user`: ForeignKey to `User`
* `vote_type`: Integer (1 for Like, -1 for Dislike)
* *Constraint*: `unique_together = ['opinion', 'user']`



**Folder Placement:**

* Backend: `backend/apps/planner/`, `backend/apps/community/`
* Frontend: `frontend/src/pages/student/dashboard/StudentDashboard.jsx`

**Naming Conventions Table:**

| Concept | Backend (Django) | Frontend (React) | Database (PostgreSQL) | API Contract |
| --- | --- | --- | --- | --- |
| Dashboard Summary | `DashboardAggregator` | `DashboardSummary` | N/A | `dashboard/summary` |
| Daily Note | `DailyNote` | `DailyNote` | `planner_dailynote` | `dashboard/notes` |
| Consultation | `ConsultationBooking` | `Consultation` | `planner_consultation` | `dashboard/consultations` |
| Leaderboard | `LeaderboardService` | `Leaderboard` | N/A (Redis Cached) | `dashboard/leaderboard` |
| Community Opinion | `StudentOpinion` | `Opinion` | `community_studentopinion` | `community/opinions` |

---

## 3. API Contracts

```markdown
# Student Dashboard & Community API Contract
**Module ID:** `student-dashboard`
**Version:** `v1`
**Base Path:** `/api/planner/dashboard/` & `/api/community/`
**Owner:** Backend Team (Mohammad Sajjad)

## Endpoints

### `GET /api/planner/dashboard/summary/`
**Summary:** Retrieves aggregated data for the dashboard (Motivational quote, countdown, user records, chart summaries)[cite: 8].
**Auth:** Required (`IsAuthenticated`, Role: `STUDENT`)
**Response 200:**
```json
{
  "quote": "شروع کردن و تسلیم نشدن...",
  "countdown": {
    "target_name": "Master's Exam",
    "days": 227, "hours": 7, "minutes": 15
  },
  "records": {
    "total_study_hours": "120:30",
    "max_daily_study": "08:15",
    "total_tests": 1450,
    "max_daily_tests": 120
  },
  "today_tasks": {
    "has_reviews": false,
    "has_studies": false
  }
}

```

### `GET /api/planner/dashboard/leaderboard/`

**Summary:** Retrieves the top 10 students based on study hours and tests.
**Query Params:** `?period=day|week|month|three_months`
**Response 200:**

```json
{
  "total_active_users": 3972,
  "results": [
    {
      "rank": 1,
      "user": { "username": "سحر", "avatar": "url..." },
      "major": "مهندسی کامپیوتر",
      "study_hours": "06:45",
      "test_count": 12
    }
  ]
}

```

### `POST /api/planner/dashboard/notes/`

**Summary:** Upsert today's daily note.
**Body Schema:** `{ "text": "یادداشت شما ..." }`
**Response 200/201:** Returns saved note object.

### `POST /api/planner/dashboard/consultations/`

**Summary:** Book a weekly consultation slot.
**Body Schema:** `{ "day_of_week": 1, "time_slot": "09:00:00" }`
**Response 201:** `{ "message": "Consultation booked successfully." }`

### `GET /api/community/opinions/`

**Summary:** List approved community opinions, ordered by highest score (likes - dislikes).
**Query Params:** `?period=week|month`, `?page=1`
**Response 200:**

```json
{
  "count": 50, "next": "...", "previous": null,
  "results": [
    {
      "id": "uuid",
      "author": { "username": "ابوطالب", "avatar": "url..." },
      "text": "شش تا از مهمترین...",
      "likes": 35,
      "dislikes": 2,
      "user_vote": 1,
      "created_at_jalali": "1403/04/17"
    }
  ]
}

```

### `POST /api/community/opinions/{id}/vote/`

**Summary:** Cast a like or dislike on an opinion.
**Body Schema:** `{ "value": 1 }` // 1 for like, -1 for dislike
**Response 200:** `{ "likes": 36, "dislikes": 2, "user_vote": 1 }`

## TypeScript Types (Frontend Integration)

```typescript
export interface DashboardSummaryDTO {
  quote: string;
  countdown: { days: number; hours: number; minutes: number; target_name: string };
  records: Record<string, any>;
  today_tasks: { has_reviews: boolean; has_studies: boolean };
}

export interface OpinionDTO {
  id: string;
  author: { username: string; avatar: string };
  text: string;
  likes: number;
  dislikes: number;
  user_vote: 1 | -1 | 0;
  created_at_jalali: string;
}

```

```

---

## 4. Integration Plan (Delegation TODOs)

### Backend TODOs (Assignee: Mohammad Sajjad)
- [ ] **App Creation:** Create the `community` app for handling social features (`StudentOpinion`, `OpinionVote`) to keep `planner` focused strictly on study data. Register it in `INSTALLED_APPS`.
- [ ] **Models:** Implement `DailyNote`, `ConsultationBooking` (in `planner`), and `StudentOpinion`, `OpinionVote` (in `community`). 
- [ ] **Aggregation Service (Leaderboard):** Create a service in `planner/services.py` that queries `WeeklyPerformance` and `SubjectPerformanceRecord` to calculate top users. **CRITICAL:** Use Redis caching for this endpoint to prevent heavy DB loads, as leaderboards require sorting across the entire user base[cite: 8].
- [ ] **Voting Logic:** Implement the `vote/` endpoint using the exact same logic currently used for `Questions` and `Answers` in the `wiki` app (toggle vote on double click, calculate score)[cite: 8, 9].
- [ ] **Admin/Moderator Approval:** Ensure `StudentOpinion` defaults to `status="PENDING"`. Only return `status="APPROVED"` to the `GET` endpoint. Add moderation capabilities to the existing `AdminSupportPanel`.
- [ ] **Routing:** Add `/api/planner/dashboard/` and `/api/community/` routers.

### Frontend TODOs (Assignee: Mohammad Amin)
- [ ] **Routing:** Add `/panel/dashboard` to `App.jsx` protected by `<RequireAuth>`. Make this the default redirect after a successful login.
- [ ] **Component Structure:**
    - Create `StudentDashboard.jsx`.
    - Extract sub-components to keep the file clean: `<LeaderboardWidget/>`, `<PersonalRecordsWidget/>`, `<StopwatchWidget/>`, `<CommunityOpinionsWidget/>`.
- [ ] **Client-Side Widgets (No Backend required):**
    - Implement the **Stopwatch** entirely in React state (Start, Stop, Reset)[cite: 8].
    - Implement the **Persian Calendar** using a React-compatible Jalali calendar library (e.g., `react-multi-date-picker` with Persian locale)[cite: 8].
- [ ] **Charts Integration:** Integrate `Chart.js` (or `Recharts` for better React compatibility). Create reusable chart components for "Activity Pie Chart" and "Bar Charts" based on the HTML mockup[cite: 8]. *Note: For Sprint 2, mock the chart data if the backend analytics endpoints are not yet fully formulated.*
- [ ] **Styling & Assets:** 
    - Convert all raw inline styles and jQuery logic into scoped CSS/Styled Components or standard CSS variables.
    - Implement the `[data-theme="dark"]` overrides for the leaderboard grid and opinion cards.
- [ ] **i18n Localization:** Add translations for "ده نفر برتر روز", "شروع کردن و تسلیم نشدن", "ثبت ساعت مشاوره", etc., in the locale files.

---

## 6. Verification Checklist
- [ ] Leaderboard queries are cached in Redis and perform efficiently without triggering N+1 query problems in Django.
- [ ] The Voting mechanism for Opinions correctly prevents users from voting multiple times on the same item.
- [ ] The Stopwatch component does not cause the entire Dashboard layout to re-render every second (use appropriate React referencing or isolated state).
- [ ] Daily Note properly upserts based on `request.user` and `timezone.now().date()`.
- [ ] UI layout behaves responsively on mobile, shifting the 3-column layout into a single vertical stack.

***
