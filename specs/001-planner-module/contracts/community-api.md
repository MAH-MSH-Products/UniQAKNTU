# API Contract: Community & Leaderboard

**Base Path**: `/api/community/`
**Authentication**: JWT Bearer (required for all endpoints)
**Version**: v1
**Date**: 2026-09-23

## Conventions

- **Naming**: snake_case for JSON payloads
- **Pagination**: All list endpoints return `{ count, next, previous, results }` with page size = 20
- **Timestamps**: Every response includes both ISO 8601 and Persian Jalali (`*_jalali`) timestamps
- **Content Visibility**: 
  - `APPROVED` opinions visible to all authenticated users
  - `PENDING` opinions visible only to author + MODERATOR/ADMIN
  - `REJECTED` opinions visible only to MODERATOR/ADMIN
- **Anonymity**: When `is_anonymous=true`, `author` field is stripped (returns null) per FR-022

---

## Leaderboard Endpoints

### `GET /api/community/leaderboard/`

**Summary**: Retrieve top 10 students based on study hours and tests. Data served directly from Redis cache.

**Auth**: Required (`IsAuthenticated`)

**Query Parameters**:
- `period` (required): `day` | `week` | `month` | `three_months`

**Response 200**:
```json
{
  "total_active_users": 3972,
  "period": "week",
  "cached_at": "2026-09-23T10:00:00Z",
  "cached_at_jalali": "1403/07/02 10:00:00",
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
    },
    {
      "rank": 2,
      "user_id": "uuid",
      "username": "محمد",
      "avatar_url": "https://...",
      "major": "مهندسی کامپیوتر",
      "total_study_hours": "58:30",
      "average_daily_hours": "08:21",
      "total_tests": 142,
      "average_daily_tests": 20
    }
  ]
}
```

**Performance**:
- FR-019: This endpoint MUST serve exclusively from Redis cache (no PostgreSQL queries)
- Target: <50ms response time (99th percentile)
- Redis Key Pattern: `leaderboard:{period}` (e.g., `leaderboard:week`)
- Updated hourly via Celery Beat task

**Error 503** (Redis Unavailable):
```json
{
  "detail": "Leaderboard temporarily unavailable. Please try again later."
}
```

---

## Opinion Endpoints

### `GET /api/community/opinions/`

**Summary**: List approved community opinions. Supports sorting and pagination.

**Auth**: Required

**Query Parameters**:
- `sort` (optional): `top` (likes-dislikes DESC) | `recent` (created_at DESC) - default: `recent`
- `page` (optional): Page number for pagination
- `status` (optional, MODERATOR/ADMIN only): `PENDING` | `APPROVED` | `REJECTED` - default: `APPROVED`

**Response 200**:
```json
{
  "count": 142,
  "next": "http://api/community/opinions/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "author": {
        "username": "ابوطالب",
        "avatar_url": "https://..."
      },
      "is_anonymous": false,
      "text": "شش تا از مهمترین جمله های من...",
      "status": "APPROVED",
      "likes": 35,
      "dislikes": 2,
      "user_vote": 1,
      "created_at": "2026-09-20T14:30:00Z",
      "created_at_jalali": "1403/06/29 14:30:00"
    },
    {
      "id": "uuid",
      "author": null,
      "is_anonymous": true,
      "text": "تجربه‌ی من در این هفته...",
      "status": "APPROVED",
      "likes": 28,
      "dislikes": 1,
      "user_vote": 0,
      "created_at": "2026-09-21T09:15:00Z",
      "created_at_jalali": "1403/06/30 09:15:00"
    }
  ]
}
```

**Field Notes**:
- `user_vote`: `1` (liked), `-1` (disliked), `0` (no vote or neutral)
- `author`: `null` when `is_anonymous=true` per FR-022
- `status`: Only included in MODERATOR/ADMIN responses

**Filtering for Students**:
- Default: Only `APPROVED` opinions returned
- Students cannot see `PENDING` or `REJECTED` opinions (except their own pending)

**Filtering for MODERATOR/ADMIN**:
- Can filter by `?status=PENDING` to view moderation queue
- Can filter by `?status=REJECTED` to view rejected opinions

---

### `GET /api/community/opinions/{id}/`

**Summary**: Retrieve a single opinion detail.

**Auth**: Required

**Path Parameters**:
- `id`: Opinion UUID

**Response 200**: Same structure as list item above

**Error 403** (Permission Denied):
```json
{
  "detail": "You do not have permission to view this opinion."
}
```

**Visibility Rules**:
- APPROVED: all authenticated users
- PENDING: author + MODERATOR/ADMIN only
- REJECTED: MODERATOR/ADMIN only

---

### `POST /api/community/opinions/`

**Summary**: Submit a new opinion to the moderation queue.

**Auth**: Required (Role: `STUDENT`)

**Request Body**:
```json
{
  "text": "تجربه من در این هفته...",
  "is_anonymous": true
}
```

**Validation**:
- `text`: Required, min_length=10, max_length=5000
- `is_anonymous`: Optional, default=false

**Response 201**:
```json
{
  "id": "uuid",
  "message": "Opinion submitted successfully and is pending approval.",
  "status": "PENDING"
}
```

**Workflow**:
- All new opinions start with `status=PENDING`
- Requires MODERATOR/ADMIN approval to become visible to community
- Author can see their own PENDING opinions in `/opinions/` list

---

### `PATCH /api/community/opinions/{id}/`

**Summary**: Update opinion status (MODERATOR/ADMIN only).

**Auth**: Required (Role: `MODERATOR` | `ADMIN`)

**Path Parameters**:
- `id`: Opinion UUID

**Request Body**:
```json
{
  "status": "APPROVED"
}
```

**Allowed Transitions**:
- `PENDING` → `APPROVED`
- `PENDING` → `REJECTED`
- No transitions from `APPROVED` or `REJECTED` (final states)

**Response 200**:
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "updated_at": "2026-09-23T10:00:00Z"
}
```

**Error 400** (Invalid Transition):
```json
{
  "status": ["Cannot change status from APPROVED to REJECTED."]
}
```

---

### `DELETE /api/community/opinions/{id}/`

**Summary**: Delete an opinion.

**Auth**: Required

**Permission**:
- Author can delete their own opinions (any status)
- MODERATOR/ADMIN can delete any opinion

**Response 204**: No Content

---

### `POST /api/community/opinions/{id}/vote/`

**Summary**: Cast or toggle a vote on an opinion. Uses atomic F() expressions per FR-021.

**Auth**: Required

**Path Parameters**:
- `id`: Opinion UUID

**Request Body**:
```json
{
  "value": 1
}
```

**Vote Values**:
- `1`: Like
- `-1`: Dislike
- `0`: Remove vote (neutral)

**Vote Toggle Logic**:
All transitions handled:
- Neutral → Like: Create vote, increment likes
- Neutral → Dislike: Create vote, increment dislikes
- Like → Neutral: Delete vote, decrement likes
- Dislike → Neutral: Delete vote, decrement dislikes
- Like → Dislike: Update vote, decrement likes, increment dislikes
- Dislike → Like: Update vote, decrement dislikes, increment likes

**Response 200**:
```json
{
  "likes": 36,
  "dislikes": 2,
  "user_vote": 1
}
```

**Atomicity**:
- FR-021: Counter updates use Django F() expressions
- SC-009: 100 simultaneous votes result in accurate counts (no race conditions)
- Wrapped in `@transaction.atomic()` for consistency

**Error 404** (Opinion Not Found):
```json
{
  "detail": "Not found."
}
```

---

## Moderation Queue (MODERATOR/ADMIN only)

### `GET /api/community/opinions/moderation-queue/`

**Summary**: Retrieve all PENDING opinions for moderation.

**Auth**: Required (Role: `MODERATOR` | `ADMIN`)

**Response 200**:
```json
{
  "count": 12,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "author": {
        "username": "علی",
        "avatar_url": "https://..."
      },
      "is_anonymous": false,
      "text": "تجربه‌ی من...",
      "status": "PENDING",
      "likes": 0,
      "dislikes": 0,
      "created_at": "2026-09-23T09:30:00Z",
      "created_at_jalali": "1403/07/02 09:30:00"
    }
  ]
}
```

**Note**: This is equivalent to `GET /api/community/opinions/?status=PENDING` but more explicit for moderation workflows.

---

## TypeScript Types (Frontend Integration)

```typescript
// Leaderboard
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

export interface LeaderboardResponseDTO {
  total_active_users: number;
  period: LeaderboardPeriod;
  cached_at: string;
  cached_at_jalali: string;
  results: LeaderboardEntryDTO[];
}

// Opinions
export type OpinionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type VoteValue = 1 | -1 | 0;

export interface OpinionAuthorDTO {
  username: string;
  avatar_url: string | null;
}

export interface OpinionDTO {
  id: string;
  author: OpinionAuthorDTO | null;
  is_anonymous: boolean;
  text: string;
  status?: OpinionStatus;
  likes: number;
  dislikes: number;
  user_vote: VoteValue;
  created_at: string;
  created_at_jalali: string;
}

export interface CreateOpinionDTO {
  text: string;
  is_anonymous?: boolean;
}

export interface VoteRequestDTO {
  value: VoteValue;
}

export interface VoteResponseDTO {
  likes: number;
  dislikes: number;
  user_vote: VoteValue;
}

export interface UpdateOpinionStatusDTO {
  status: OpinionStatus;
}
```

---

## Business Rules

### Leaderboard Calculation (Celery Task)

**Task Name**: `community.tasks.recalculate_leaderboard`

**Schedule**: Hourly (every hour at :00 via Celery Beat)

**Algorithm**:
1. For each period (day, week, month, three_months):
   - Calculate date range boundaries
   - Aggregate `StudyActivity` from `planner` app:
     - `total_study_hours = SUM(duration_minutes) / 60`
     - `average_daily_hours = total_study_hours / days_in_period`
   - Aggregate `TestRecord` from `planner` app:
     - `total_tests = COUNT(DISTINCT test records created in period)`
     - `average_daily_tests = total_tests / days_in_period`
2. Sort by `total_study_hours DESC`, then `total_tests DESC`
3. Take top 10 students
4. Serialize to JSON
5. Store in Redis:
   - Key: `leaderboard:{period}`
   - Value: JSON string
   - No TTL (persists until next update)

**Cross-App Data Access**:
```python
from django.apps import apps

StudyActivity = apps.get_model('planner', 'StudyActivity')
TestRecord = apps.get_model('planner', 'TestRecord')

# Read-only queries (no modifications)
activities = StudyActivity.objects.filter(
    daily_log__date__gte=start_date,
    daily_log__date__lte=end_date
).values('daily_log__student').annotate(
    total_minutes=Sum('duration_minutes')
)
```

### Opinion Moderation Workflow

**State Machine**:
```
┌─────────┐
│ PENDING │ (initial state)
└────┬────┘
     │
     ├──► APPROVED (by MODERATOR/ADMIN)
     │
     └──► REJECTED (by MODERATOR/ADMIN)
```

**Permissions**:
- STUDENT: Can create opinions (auto-PENDING), view own PENDING, edit/delete own
- MODERATOR: Can approve/reject any PENDING, view all statuses, delete any
- ADMIN: Same as MODERATOR

**Notifications** (Future Enhancement):
- When opinion approved: notify author
- When opinion rejected: notify author with reason (requires adding `rejection_reason` field)

---

## Performance & Caching

### Leaderboard Performance

**Requirements**:
- FR-019: Serve exclusively from Redis (no PostgreSQL queries in GET endpoint)
- SC-008: <50ms response time (99th percentile)

**Implementation**:
```python
# views.py
def get(self, request):
    period = request.query_params.get('period', 'week')
    cache_key = f'leaderboard:{period}'
    
    data = cache.get(cache_key)
    if data is None:
        return Response(
            {"detail": "Leaderboard temporarily unavailable."},
            status=503
        )
    
    return Response(json.loads(data))
```

**Fallback Strategy**:
- If Redis unavailable: return 503 with retry message
- Never fallback to live PostgreSQL queries (prevents performance degradation per spec)

### Opinion List Performance

**Optimization**:
- Use `select_related('author')` for author data
- Index on (`status`, `created_at`) for filtered sorting
- Index on (`likes`, `dislikes`) for top sorting
- Pagination prevents unbounded result sets

**Caching**:
- Consider short TTL cache (5-10 minutes) for approved opinions list
- Invalidate on new approval or vote

---

## Error Handling

### Common Error Responses

**401 Unauthorized**:
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden** (Insufficient Permissions):
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found**:
```json
{
  "detail": "Not found."
}
```

**429 Too Many Requests**:
```json
{
  "detail": "Request was throttled. Expected available in 60 seconds."
}
```

**503 Service Unavailable** (Redis Down):
```json
{
  "detail": "Leaderboard temporarily unavailable. Please try again later."
}
```

---

## Rate Limiting

**Recommendations**:
- Vote endpoint: 60 requests/minute per user (prevent spam voting)
- Opinion creation: 5 requests/hour per user (prevent spam submissions)
- Leaderboard: No rate limit (served from cache, minimal cost)

---

## Testing Checklist

- [ ] **Leaderboard**: Verify Redis-only serving (no DB queries in GET endpoint)
- [ ] **Leaderboard**: Load test 100 concurrent requests < 50ms response time
- [ ] **Voting**: Test 100 simultaneous votes → accurate final counts (SC-009)
- [ ] **Voting**: Test all transition paths (6 transitions)
- [ ] **Anonymity**: Verify `author=null` when `is_anonymous=true` (FR-022)
- [ ] **Moderation**: Verify PENDING opinions invisible to non-authors
- [ ] **Permissions**: Verify STUDENT cannot access moderation endpoints
- [ ] **Celery**: Verify hourly task updates all 4 period caches
