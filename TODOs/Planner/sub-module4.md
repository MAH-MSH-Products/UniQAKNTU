# SUB-MODULE 4: Community & Leaderboard (گیمیفیکیشن، رتبه‌بندی و نظرات کاربران)

## 2. Module Architectures

**Module ID:** `community-leaderboard`
**App Name (Django):** `community`
**Domain Boundary:** This module is the strict **Owner** of the social, motivational, and competitive aspects of the platform (resolving the previous domain overlap with Sub-module 3). It exclusively handles the submission, moderation, and voting of user opinions/reviews (`Opinions`). It also handles the aggregation and caching of the top student rankings (`Leaderboard`). 
*Crucial Boundary Rule:* To calculate rankings, this module performs **read-only queries** against the `planner` app's data. It does not own or modify any study data, and relies on Celery and Redis to isolate performance-heavy ranking calculations from the main application flow.

**Layers:**
* **Domain:** `StudentOpinion`, `OpinionVote`, `LeaderboardAggregation`
* **Application:** Voting logic (atomic updates to prevent race conditions), Leaderboard caching strategy (Celery + Redis).
* **Infrastructure:** PostgreSQL (for opinions), Redis (for storing pre-calculated leaderboards), Django Celery Beat (for periodic leaderboard updates).
* **Interface:** DRF Views/Serializers (`/api/community/`), React SPA Components (`LeaderboardGrid.jsx`, `CommunityOpinions.jsx`).

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

*(Note: The Leaderboard does not need a persistent database model; it is a materialized view stored in Redis caches).*

**Folder Placement:**
* Backend: `backend/apps/community/`
* Frontend: `frontend/src/components/dashboard/community/` (Exported for use in Sub-module 3's Dashboard)

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
**Owner:** Backend Team 

## Endpoints

### `GET /api/community/leaderboard/`
**Summary:** Retrieves the top 10 students based on total study hours and total tests. Data is served directly from the Redis cache.
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

### Backend TODOs 
- [ ] **App Creation:** Run `python manage.py startapp community`. Register it in `INSTALLED_APPS`.
- [ ] **Models:** Define `StudentOpinion` and `OpinionVote`. Add constraints to prevent multiple votes per user per opinion.
- [ ] **Leaderboard Caching Task (Celery):** 
    - Write a `tasks.py` script inside `community` that runs every 1 hour via Celery Beat.
    - The task must query the `planner` app's models (`StudyActivity` and `TestRecord`), calculate aggregations for `day`, `week`, `month`, and `three_months`, sort the top 10, and save the serialized JSON directly into Redis keys (e.g., `leaderboard:week`).
- [ ] **Leaderboard View:** Implement `GET /leaderboard/` to fetch directly from Redis. **Strict Rule:** Do not query the PostgreSQL DB in this view to guarantee ultra-low latency.
- [ ] **Opinions View:** Implement the ViewSet. Override `get_queryset` to only return `status='APPROVED'` opinions unless the requestor is an `ADMIN`. If `is_anonymous` is True, strip the `author` data before serializing.
- [ ] **Voting Atomicity:** Use Django's `F()` expressions when incrementing/decrementing `likes` and `dislikes` in the `vote/` endpoint to prevent race conditions during high concurrency.

### Frontend TODOs 
- [ ] **Service Layer:** Update `src/services/api.js` with `getLeaderboard(period)`, `getOpinions(params)`, `submitOpinion(data)`, and `voteOpinion(id, value)`.
- [ ] **Component Modularization:** 
    - Create `src/components/dashboard/community/LeaderboardGrid.jsx`.
    - Create `src/components/dashboard/community/OpinionsList.jsx`.
    - Export these so they can be seamlessly imported by Sub-module 3 (`StudentDashboard.jsx`).
- [ ] **Leaderboard UI:** Implement a Tabbed interface for `روز` (Day), `هفته` (Week), `ماه` (Month), and `سه ماه` (3-Months). Map the raw HTML table structure into standard React components utilizing existing CSS variables.
- [ ] **Opinions UI:** Implement the voting buttons. Use local React state to optimistically update the like/dislike counters instantly when the user clicks, reverting the UI state if the API call fails.
- [ ] **Translations:** Extract hardcoded strings (e.g., "نظرات برتر ماه", "جدول رتبه بندی") into `fa/translation.json` under the `"community"` namespace.

---

## 6. Verification Checklist
- [ ] **Module Boundaries:** The `community` app successfully owns these features and isolates them from the core `planner` app.
- [ ] **Performance:** The Leaderboard endpoint responds in < 50ms because it executes purely against the Redis cache.
- [ ] **Atomicity:** Concurrent votes on the same opinion do not corrupt the `likes`/`dislikes` count (tested via atomic `F()` DB updates).
- [ ] **Privacy:** If an opinion is marked `is_anonymous=True`, the API strictly guarantees the frontend receives `author: null`.

```