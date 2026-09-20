# SUB-MODULE 4: Community & Leaderboard (گیمیفیکیشن، رتبه‌بندی و نظرات کاربران)


## 2. Module Architectures

**Module ID:** `community-leaderboard`
**App Name (Django):** `community`
**Domain Boundary:** This module owns the social, motivational, and competitive aspects of the platform. It handles the submission, moderation, and voting of user opinions/reviews (`Opinions`), as well as the aggregation and caching of the top student rankings (`Leaderboard`) based on their study hours and test counts. It explicitly reads from the `planner` app to generate rankings but does not modify study data.

**Layers:**

* **Domain:** `StudentOpinion`, `OpinionVote`, `LeaderboardAggregation`
* **Application:** Voting logic (preventing duplicate votes, calculating net score), Leaderboard caching strategy (Celery + Redis).
* **Infrastructure:** PostgreSQL (for opinions), Redis (for storing pre-calculated leaderboards), Django Celery Beat (for periodic leaderboard updates).
* **Interface:** DRF Views/Serializers (`/api/community/`), React SPA Components (`Leaderboard.jsx`, `CommunityOpinions.jsx`).

**Data Model (Django `community` app):**

1. `StudentOpinion`:
* `id`: UUID / PK
* `author`: ForeignKey to `accounts.User` (Role: STUDENT)
* `text`: TextField
* `is_anonymous`: Boolean (Default: False)
* `status`: CharField (Choices: 'PENDING', 'APPROVED', 'REJECTED', Default: 'PENDING')
* `likes`: IntegerField (Default: 0)
* `dislikes`: IntegerField (Default: 0)
* `created_at`: DateTimeField


2. `OpinionVote`:
* `id`: UUID / PK
* `opinion`: ForeignKey to `StudentOpinion`
* `user`: ForeignKey to `accounts.User`
* `vote_type`: IntegerField (Choices: 1 for Like, -1 for Dislike)
* *Constraint*: `unique_together = ['opinion', 'user']`



*(Note: The Leaderboard does not need a persistent database model; it relies on Redis caches updated by querying the `planner_weeklyperformance` table).*

**Folder Placement:**

* Backend: `backend/apps/community/`
* Frontend: `frontend/src/components/dashboard/community/`

**Naming Conventions Table:**

| Concept | Backend (Django) | Frontend (React) | Database (PostgreSQL/Redis) | API Contract |
| --- | --- | --- | --- | --- |
| Student Opinion | `StudentOpinion` | `OpinionCard` | `community_studentopinion` | `opinions` |
| Opinion Vote | `OpinionVote` | `OpinionVote` | `community_opinionvote` | `opinions/{id}/vote` |
| Leaderboard | `LeaderboardService` | `LeaderboardGrid` | `redis:leaderboard:*` | `leaderboard` |

---

## 3. API Contracts

```markdown
# Community & Leaderboard API Contract
**Module ID:** `community-leaderboard`
**Version:** `v1`
**Base Path:** `/api/community/`
**Owner:** Backend Team (Mohammad Sajjad)

## Envelope
Standard paginated DRF response for lists, standard JSON object for details.

## Endpoints

### `GET /api/community/leaderboard/`
**Summary:** Retrieves the top 10 students based on total study hours and total tests. Data should be served directly from Redis cache.
**Auth:** Required (`IsAuthenticated`)
**Query Params:** `period=day|week|month|three_months` (Required)
**Response 200:**
```json
{
  "total_active_users": 3972,
  "period": "week",
  "results": [
    {
      "rank": 1,
      "user_id": "uuid",
      "username": "فاطمه",
      "avatar_url": "https://...",
      "major": "مهندسی فناوری اطلاعات",
      "total_study_hours": "62:15",
      "average_daily_hours": "08:54",
      "total_tests": 150,
      "average_daily_tests": 21
    }
  ]
}

```

### `GET /api/community/opinions/`

**Summary:** List approved community opinions. Supports sorting by top (likes-dislikes) or recent.
**Auth:** Required
**Query Params:** `?sort=top|recent`, `?page=1`
**Response 200:**

```json
{
  "count": 142,
  "next": "...",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "author": { "username": "ابوطالب", "avatar_url": "..." },
      "is_anonymous": false,
      "text": "شش تا از مهمترین جمله های من...",
      "likes": 35,
      "dislikes": 2,
      "user_vote": 0, 
      "created_at_jalali": "1403/04/17 13:12:46"
    }
  ]
}

```

### `POST /api/community/opinions/`

**Summary:** Submit a new opinion to the moderation queue.
**Auth:** Required (Role: `STUDENT`)
**Body Schema:**

```json
{
  "text": "تجربه من در این هفته...",
  "is_anonymous": true
}

```

**Response 201:**

```json
{
  "message": "Opinion submitted successfully and is pending approval.",
  "status": "PENDING"
}

```

### `POST /api/community/opinions/{id}/vote/`

**Summary:** Cast or toggle a vote on an opinion.
**Auth:** Required
**Body Schema:**

```json
{
  "value": 1 
}

```

*Note: Sending `1` when already liked removes the like (sets to `0`). Sending `-1` when liked switches it to `-1` (dislike).*
**Response 200:**

```json
{
  "likes": 36,
  "dislikes": 2,
  "user_vote": 1
}

```

## TypeScript Types (Frontend Integration)

```typescript
export type LeaderboardPeriod = 'day' | 'week' | 'month' | 'three_months';

export interface LeaderboardEntryDTO {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  major: string;
  total_study_hours: string;
  average_daily_hours: string;
  total_tests: number;
  average_daily_tests: number;
}

export interface OpinionDTO {
  id: string;
  author: { username: string; avatar_url: string | null } | null;
  is_anonymous: boolean;
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
- [ ] **App Creation:** Run `python manage.py startapp community`. Add to `INSTALLED_APPS`.
- [ ] **Models:** Define `StudentOpinion` and `OpinionVote`. Ensure cascading deletes work correctly if a user is deleted.
- [ ] **Leaderboard Caching Task (Celery):** 
    - Write a `celery_tasks.py` script inside `planner` or `community` that runs every 1 hour via Celery Beat.
    - The task must query the `WeeklyPerformance` and `SubjectPerformanceRecord` tables, calculate total hours and tests for `day`, `week`, `month`, and `three_months`, sort the top 10, and save the serialized JSON arrays into Redis keys (e.g., `leaderboard:week`).
- [ ] **Leaderboard View:** Implement the `GET /leaderboard/` endpoint to fetch directly from Redis. **Do not query the DB in this view** to ensure ultra-low latency.
- [ ] **Opinions View:** Implement the ViewSet for Opinions. Override the `get_queryset` to only return `status='APPROVED'` opinions unless the user is an `ADMIN`.
- [ ] **Voting Logic:** Implement the `/vote/` action. Use `F()` expressions to atomically update `likes` and `dislikes` counters in the DB to prevent race conditions.
- [ ] **Admin Approval:** Add the `StudentOpinion` model to the Django Admin panel (and eventually the React `AdminSupportPanel`) so moderators can approve/reject pending opinions.

### Frontend TODOs (Assignee: Mohammad Amin)
- [ ] **Service Layer:** Update `src/services/api.js` with `getLeaderboard(period)`, `getOpinions(params)`, `submitOpinion(data)`, and `voteOpinion(id, value)`.
- [ ] **Component: LeaderboardGrid:** 
    - Create `src/components/dashboard/community/LeaderboardGrid.jsx`.
    - Implement a Tabbed interface for `روز` (Day), `هفته` (Week), `ماه` (Month), and `سه ماه` (3-Months)[cite: 8].
    - Map the raw HTML table structure (using classes like `.kc_table`, `.table-vmiddle`) into the React component. Use the provided CSS variables for styling.
- [ ] **Component: OpinionsList:**
    - Create `src/components/dashboard/community/OpinionsList.jsx`.
    - Extract the raw HTML CSS classes (`.each_opinion`, `.like`, `.dislike`) from `app.min.1.css` and `app.min.2.css` into a module-specific CSS file or map them to existing utility variables in `index.css`.
    - Implement the voting buttons. Use local state to optimistically update the like/dislike counters instantly when the user clicks, reverting if the API call fails.
- [ ] **Component: OpinionForm:**
    - Create `src/components/dashboard/community/OpinionForm.jsx`.
    - Include a toggle for "Submit Anonymously" (ارسال به صورت ناشناس).
- [ ] **Translations:** Extract hardcoded strings (e.g., "نظرات برتر ماه", "جدول رتبه بندی ده نفر برتر روز", "رشته", "تعداد تست") into `fa/translation.json` under a new `"community"` namespace.

---

## 6. Verification Checklist
- [ ] **Performance:** The Leaderboard endpoint responds in < 50ms because it reads purely from Redis cache.
- [ ] **Celery Execution:** The periodic task successfully computes correct study hour sums based on historical data.
- [ ] **Atomicity:** Concurrent votes on the same opinion do not corrupt the `likes` / `dislikes` count (tested via atomic DB updates).
- [ ] **Privacy:** If an opinion is marked `is_anonymous=True`, the API strictly returns `author: null` to the frontend.
- [ ] **Styling:** The frontend correctly utilizes the extracted CSS properties from the provided `.zip` assets (like `.bgm-blue`, `.badge`, `.each_opinion`) ensuring visual parity with the raw HTML mockups.

***
