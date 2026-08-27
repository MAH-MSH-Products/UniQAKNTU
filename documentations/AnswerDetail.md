# AnswerDetail Component Documentation

## Overview
The `AnswerDetail` component displays a single answer with full details. It uses the Phase 4 flat endpoint structure to fetch answer data via path parameter.

## File Location
`frontend/src/components/wiki/AnswerDetail.jsx`

## Purpose
This component provides a dedicated view for displaying individual answer details, including:
- Answer content with markdown rendering
- Author information and role badge
- Question reference with link back to question
- Vote information (user's vote if authenticated)
- Jalali timestamps for creation and updates
- Attachment display (images and PDFs)

## Phase 4 Implementation
- Replaces old nested route `/wiki/answers/{id}/`
- Uses flat endpoint: `GET /api/answers/{id}/`
- Implements path parameter for single answer retrieval
- Integrated with Phase 4 routing structure in App.jsx

## Key Components

### Component: AnswerDetail
A functional React component that fetches and displays a single answer.

**Route:** `/answers/:answerId`

**Props from Route:**
| Prop | Type | Source | Description |
|------|------|--------|-------------|
| `answerId` | string | useParams() | The unique identifier of the answer from URL path |

**Internal State:**
- `answer` (Object|null): The fetched answer data
- `loading` (boolean): Loading state during API fetch
- `error` (string|null): Error message if fetch fails
- `user` (Object): Current authenticated user from AuthContext

### Key Functions

#### `fetchAnswer()`
Fetches answer data from API using flat endpoint.

```javascript
const fetchAnswer = async () => {
  try {
    setLoading(true);
    // Use new flat endpoint: GET /api/answers/{id}/
    const response = await getAnswerById(answerId);
    setAnswer(response.data);
  } catch (err) {
    setError(err.message || 'Failed to load answer');
  } finally {
    setLoading(false);
  }
};
```

**Endpoint:** `GET /api/answers/{id}/`
**Authorization:** Bearer token (auto-attached via axios interceptor)

#### `processMarkdown(text)`
Processes markdown text for safe HTML rendering.

**Features:**
- Escapes HTML entities (`&`, `<`, `>`)
- Converts markdown headers (`#`, `##`, `###`)
- Converts bold (`**text**`) and italic (`*text*`)
- Converts inline code (`` `code` ``)
- Preserves line breaks

#### `getStatusBadge()`
Returns status badge component based on answer status.

**Status Values:**
- `APPROVED` → Green badge "✓ Approved"
- `PENDING` → Yellow badge "Pending Review"
- `REJECTED` → Red badge "Rejected"

## Usage

### Route Access
Users access this component via URL:
```
/answers/123
```

### Navigation Links
From other components:
```jsx
import { Link } from 'react-router-dom';

<Link to={`/answers/${answer.id}`}>View Full Answer</Link>
```

## Display Features

### Answer Header
- Component title "Answer Details"
- Answer ID display
- Status badge (Approved/Pending/Rejected)

### Author Information
- Username or name fallback
- Role badge if available (MODERATOR, ADMIN, etc.)

### Question Reference
- Link back to parent question: `/questions/{questionId}/answers`
- Allows navigation to full question context

### Content Rendering
- Markdown-processed text in styled container
- Light background with rounded corners
- Readable font size and line height

### Vote Display
- Shows user's vote if authenticated
- Visual indicators: ↑ (upvote), ↓ (downvote), or "No vote"

### Timestamps
- Creation date in Jalali calendar
- Update date (if different from creation)

### Attachments
- **Image**: Displays inline with max height 400px
- **PDF**: Download/view button with icon

## Dependencies
- React (`useState`, `useEffect`)
- `react-router-dom`: `useParams`, `Link`
- `../../services/api`: `getAnswerById` function
- `../../context/AuthContext`: `useAuth` hook

## Integration Points

### Parent Routes (App.jsx)
```jsx
<Route path="/answers/:answerId" element={<AnswerDetail />} />
```

### Related Components
- `QuestionExplorer.jsx` - Links to AnswerDetail for full view
- `AnswerCard.jsx` - Compact answer preview, links to detail view

## Error Handling

### Loading State
Shows spinner with "Loading answer..." message.

```jsx
<div className="text-center py-5">
  <div className="spinner-border text-primary" role="status">
    <span className="visually-hidden">Loading...</span>
  </div>
  <p className="mt-2">Loading answer...</p>
</div>
```

### Error State
Displays error message with back navigation.

```jsx
<div className="alert alert-danger">
  <h4>Error Loading Answer</h4>
  <p>{error}</p>
  <Link to="/" className="btn btn-primary mt-2">Back to Home</Link>
</div>
```

### Not Found State
Shows info message when answer doesn't exist.

```jsx
<div className="alert alert-info">
  <p>Answer not found.</p>
  <Link to="/" className="btn btn-primary mt-2">Back to Home</Link>
</div>
```

## Styling
Uses Bootstrap 5 utility classes:
- Container layout (`container`, `py-4`)
- Card component (`card`, `card-header`, `card-body`)
- Badge styles (`badge bg-success`, `badge bg-warning`, `badge bg-danger`)
- Button variants (`btn btn-outline-secondary`, `btn btn-outline-primary`)
- Typography helpers (`text-muted`, `small`)
- Spacing utilities (`mb-3`, `mt-4`, `p-3`)
- Flexbox utilities (`d-flex`, `justify-content-between`, `align-items-center`)

## Verification Status
**⚠️ باید چک شود** - This component uses the Phase 4 flat endpoint structure and requires verification against actual backend API responses.

## Testing Checklist
- [ ] Verify answer loads from `GET /api/answers/{id}/`
- [ ] Test loading state display
- [ ] Confirm error handling for invalid IDs
- [ ] Validate not found state for non-existent answers
- [ ] Check markdown rendering accuracy
- [ ] Verify status badge colors and text
- [ ] Test attachment display (images and PDFs)
- [ ] Confirm Jalali timestamp rendering
- [ ] Validate navigation links work correctly
- [ ] ⚠️ باید چک شود - Full integration testing with backend

## Change Log
- **Phase 4**: Initial implementation with flat endpoint structure
  - Uses `GET /api/answers/{id}/` instead of nested paths
  - Integrated with Phase 4 routing in App.jsx
  - Added comprehensive error handling states
  - Implemented markdown processing for content display
