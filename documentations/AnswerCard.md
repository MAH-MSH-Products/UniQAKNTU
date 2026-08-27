# AnswerCard Component Documentation

## Overview
The `AnswerCard` component displays a single answer to a question with comprehensive support for the backend API data contract. It has been updated in Phase 2 to align with the standardized response format, and in Phase 5 to implement Wiki-style editing workflow and RBAC enforcement.

## File Location
`frontend/src/components/wiki/AnswerCard.jsx`

## API Data Contract Alignment

### Props Structure (API Endpoint 3.1 - Answers)
```javascript
{
  id: number,                    // Unique answer identifier
  author: {                      // Author information
    username: string,
    role: 'STUDENT' | 'MODERATOR' | 'ADMIN'
  },
  body: string,                  // Markdown content (replaces current_body)
  status: 'PENDING' | 'APPROVED' | 'REJECTED',  // Status enum (replaces is_verified)
  image: string | null,          // URL to attached image
  pdf_file: string | null,       // URL to attached PDF
  user_vote: 1 | -1 | 0,         // User's vote value
  created_at_jalali: string,     // Persian Shamsi timestamp (replaces created_at)
  updated_at_jalali: string,     // Persian Shamsi update timestamp
  is_accepted: boolean           // Whether this answer is accepted by question author
}
```

### Additional Props for Phase 5
```javascript
{
  question: Object,              // Parent question object (for accept button verification)
  onAcceptSuccess: Function      // Callback when answer is accepted
}
```

## Key Changes from Previous Implementation

### 1. Status Field Mapping (Step 2.3)
**Before:** Used boolean `is_verified` field
**After:** Uses enum `status` field

```javascript
const getStatusBadge = () => {
  if (status === 'APPROVED') return <span className="badge bg-success">✓ Approved</span>;
  if (status === 'PENDING') return <span className="badge bg-warning">Pending Review</span>;
  if (status === 'REJECTED') return <span className="badge bg-danger">Rejected</span>;
};
```

### 2. Date Field Mapping (Step 2.3)
**Before:** Used `created_at`, `updated_at` (ISO 8601 UTC)
**After:** Uses `created_at_jalali`, `updated_at_jalali` (Persian Shamsi)

```javascript
{created_at_jalali && (
  <small className="text-muted d-block mb-2">
    Posted: {created_at_jalali}
    {updated_at_jalali && updated_at_jalali !== created_at_jalali && (
      <span className="ms-2">• Updated: {updated_at_jalali}</span>
    )}
  </small>
)}
```

### 3. Vote Display Using user_vote (Step 2.3)
**Before:** Client-side vote calculation
**After:** Uses server-provided `user_vote` field

```javascript
const getVoteDisplay = () => {
  if (user_vote === 1) return <span className="text-success"><i className="bi bi-arrow-up"></i> Upvoted</span>;
  if (user_vote === -1) return <span className="text-danger"><i className="bi bi-arrow-down"></i> Downvoted</span>;
};
```

### 4. Author Role Display
**Before:** Used `author.name` and `author.title`
**After:** Uses `author.username` and `author.role` enum

```javascript
{author?.username || author?.name || 'Unknown Author'}
{author?.role && (
  <small className="text-muted ms-2">
    ({author.role === 'ADMIN' ? 'Admin' : author.role === 'MODERATOR' ? 'Moderator' : 'Student'})
  </small>
)}
```

### 5. Phase 5: Wiki-Style Edit Workflow & RBAC Enforcement

#### Step 5.1: Disable Direct Editing for Students
Students cannot directly edit answers. Only MODERATOR and ADMIN roles can directly edit.

```javascript
// Check if user can directly edit (MODERATOR or ADMIN only)
const canDirectEdit = ['MODERATOR', 'ADMIN'].includes(userRole);

// Students can only suggest edits
const canSuggestEdit = user && userRole === 'STUDENT';
```

**Backend Constraint:** `PUT/PATCH` to `/api/answers/{id}/` will return `403 Forbidden` for students.

#### Step 5.2: Implement Suggest Edit Flow
Students submit edit suggestions via `SuggestEditModal` component instead of direct editing.

**Endpoint:** `POST /api/answers/{id}/suggest_edit/`

**Payload:**
```json
{
  "proposed_text": "updated markdown",
  "attachment_ids": [1, 2]
}
```

**UI Behavior:** On successful submission (201 Created), displays "Edit Pending Review" badge.

#### Step 5.3: Accept Answer Restriction
Only the original question author can accept answers.

**Endpoint:** `POST /api/answers/{id}/accept/`

**Constraint:** Frontend verifies `question.author.id === currentUser.id` before rendering the accept button.

## Features

### Markdown Processing
- Basic markdown parsing (headers, bold, italic, code)
- HTML escaping for security
- MathJax integration for mathematical formulas

### Attachment Support
- Image attachments with responsive sizing
- PDF file download links

### Status Badges
- **Approved** (green badge): Content is publicly visible
- **Pending Review** (yellow badge): Awaiting moderator approval
- **Rejected** (red badge): Content was rejected by moderator

### Accepted Answer Badge
- **Accepted Answer** (green badge with check icon): Answer accepted by question author

### Role-Based Edit Controls
- **MODERATOR/ADMIN**: Direct edit button (pencil icon)
- **STUDENT**: Suggest edit button (pencil-square icon)
- **Question Author**: Accept answer button (check-circle icon)

## Usage Example

```jsx
import AnswerCard from './components/wiki/AnswerCard';

// In parent component (e.g., QuestionExplorer)
<AnswerCard 
  answer={answerData}
  question={questionData}
  onAcceptSuccess={(data) => {
    console.log('Answer accepted:', data);
    // Refresh question data if needed
  }}
/>
```

## Dependencies
- React (`useEffect`, `useState` hooks)
- Bootstrap CSS classes
- Bootstrap Icons
- MathJax (for formula rendering)
- `SuggestEditModal` component (Phase 5)
- `api` service for HTTP requests
- `AuthContext` for user authentication

## Verification Status
**باید چک شود** - This component has been updated for Phase 5 Wiki-style editing and RBAC enforcement. Requires verification against actual backend API responses for:
- `POST /api/answers/{id}/suggest_edit/` endpoint
- `POST /api/answers/{id}/accept/` endpoint
- 403 Forbidden response for student direct edit attempts

## Related Files
- `services/api.js` - API client with response transformers
- `components/wiki/SuggestEditModal.jsx` - Modal for suggesting edits (Phase 5.2)
- `components/wiki/QuestionExplorer.jsx` - Parent component that renders AnswerCard
- `context/AuthContext.jsx` - User authentication and role management
- `API.md` - API endpoint specifications
- `FIXING_TODO.md` - Phase 5 implementation checklist

## Testing Checklist
- [ ] Verify status badges display correctly for all three states (APPROVED, PENDING, REJECTED)
- [ ] Confirm Jalali dates render properly
- [ ] Test vote display with user_vote values: 1, -1, 0
- [ ] Validate author role display for STUDENT, MODERATOR, ADMIN
- [ ] Check MathJax formula rendering
- [ ] Test image and PDF attachment display
- [ ] **Phase 5.1**: Verify students cannot see direct edit button
- [ ] **Phase 5.1**: Verify MODERATOR/ADMIN can see direct edit button
- [ ] **Phase 5.2**: Verify students can open suggest edit modal
- [ ] **Phase 5.2**: Verify edit suggestion submission works
- [ ] **Phase 5.3**: Verify only question author sees accept button
- [ ] **Phase 5.3**: Verify accept button works and updates UI
