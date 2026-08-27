# ModerationDashboard Documentation

## Purpose
The `ModerationDashboard` component provides a centralized interface for users with MODERATOR or ADMIN roles to review and manage pending content across the platform. It displays three categories of items requiring moderation: pending questions, pending answers, and suggested edits.

## Key Components

### State Management
- **activeTab**: Tracks the currently selected tab ('questions', 'answers', or 'edits')
- **pendingQuestions**: Array of pending question objects
- **pendingAnswers**: Array of pending answer objects
- **suggestedEdits**: Array of suggested edit objects
- **loading**: Boolean indicating data fetch status
- **error**: Error message string if data fetch fails

### Data Fetching Functions
- **fetchPendingQuestions()**: Calls `GET /api/questions/?status=PENDING` to retrieve pending questions
- **fetchPendingAnswers()**: Calls `GET /api/answers/?status=PENDING` to retrieve pending answers
- **fetchSuggestedEdits()**: Calls `GET /api/suggested-edits/` to retrieve all suggested edits

### Action Handlers
- **handleApprove(type, id)**: Sends POST request to appropriate approve endpoint
  - Question: `POST /api/questions/{id}/approve/`
  - Answer: `POST /api/answers/{id}/approve/`
  - Edit: `POST /api/suggested-edits/{id}/approve/`
- **handleReject(type, id)**: Sends POST request to appropriate reject endpoint
  - Question: `POST /api/questions/{id}/reject/`
  - Answer: `POST /api/answers/{id}/reject/`
  - Edit: `POST /api/suggested-edits/{id}/reject/`

### Render Functions
- **renderQuestionItem(question)**: Displays question card with title, body preview, author, date, and action buttons
- **renderAnswerItem(answer)**: Displays answer card with body preview, author, date, and action buttons
- **renderEditItem(edit)**: Displays suggested edit card with content type, proposed text preview, suggester, date, and action buttons

## Usage

### Import
```jsx
import ModerationDashboard from './pages/admin/ModerationDashboard';
```

### Route Configuration
```jsx
<Route element={<RequireInstructor />}>
  <Route element={<MainLayout />}>
    <Route path="/admin/moderation" element={<ModerationDashboard />} />
  </Route>
</Route>
```

### Access Control
- Only accessible to users with `canModerate` flag (MODERATOR or ADMIN roles)
- Users without proper permissions see an access denied message
- Component automatically refreshes data after approve/reject actions

## Integration

### API Endpoints Used
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/questions/` | GET | Fetch pending questions with `?status=PENDING` |
| `/api/answers/` | GET | Fetch pending answers with `?status=PENDING` |
| `/api/suggested-edits/` | GET | Fetch all suggested edits |
| `/api/questions/{id}/approve/` | POST | Approve pending question |
| `/api/questions/{id}/reject/` | POST | Reject pending question |
| `/api/answers/{id}/approve/` | POST | Approve pending answer |
| `/api/answers/{id}/reject/` | POST | Reject pending answer |
| `/api/suggested-edits/{id}/approve/` | POST | Approve suggested edit |
| `/api/suggested-edits/{id}/reject/` | POST | Reject suggested edit |

### Context Dependencies
- **useAuth**: Provides `user`, `canModerate` for role-based access control
- **useTranslation**: Provides i18n translation function `t()`

### Response Format Expected
```json
// Questions/Answers
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 42,
      "title": "Question title",
      "body": "Markdown content...",
      "status": "PENDING",
      "author": { "id": "uuid", "username": "user123" },
      "created_at_jalali": "1403/08/15 14:32"
    }
  ]
}

// Suggested Edits
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 15,
      "content_type": "question",
      "proposed_text": "New improved text...",
      "suggested_by": { "id": "uuid", "username": "user456" },
      "created_at_jalali": "1403/08/16 09:10"
    }
  ]
}
```

## Change Log
- **Phase 9**: Initial implementation of ModerationDashboard component
  - Created tabbed interface for questions, answers, and suggested edits
  - Implemented approve/reject functionality for all content types
  - Added role-based access control using `canModerate` flag
  - Integrated with backend moderation endpoints
