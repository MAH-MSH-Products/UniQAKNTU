# AnswerCard Component Documentation

## Overview
The `AnswerCard` component displays a single answer to a question with comprehensive support for the backend API data contract. It has been updated in Phase 2 to align with the standardized response format.

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
  updated_at_jalali: string      // Persian Shamsi update timestamp
}
```

## Key Changes from Previous Implementation

### 1. Status Field Mapping (Step 2.3)
**Before:** Used boolean `is_verified` field
**After:** Uses enum `status` field

```javascript
// Old implementation
{is_verified && <span className="badge bg-success">✓ Verified</span>}

// New implementation
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

## Features

### Markdown Processing
- Basic markdown parsing (headers, bold, italic, code)
- HTML escaping for security
- MathJax integration for mathematical formulas

### Attachment Support
- Image attachments with responsive sizing
- PDF file download links
- Optional PDF embed preview (commented out)

### Status Badges
- **Approved** (green badge): Content is publicly visible
- **Pending Review** (yellow badge): Awaiting moderator approval
- **Rejected** (red badge): Content was rejected by moderator

## Usage Example

```jsx
import AnswerCard from './components/wiki/AnswerCard';

// In parent component
<AnswerCard answer={answerData} />
```

## Dependencies
- React (`useEffect` hook)
- Bootstrap CSS classes
- Bootstrap Icons (`bi-arrow-up`, `bi-arrow-down`, `bi-file-pdf`)
- MathJax (for formula rendering)

## Verification Status
**باید چک شود** - This component has been updated to match the Phase 2 data contract. Requires verification against actual backend API responses.

## Related Files
- `services/api.js` - API client with response transformers
- `components/wiki/QuestionExplorer.jsx` - Parent component that renders AnswerCard
- `API.md` - API endpoint specifications
- `FIXING_TODO.md` - Phase 2 implementation checklist

## Testing Checklist
- [ ] Verify status badges display correctly for all three states
- [ ] Confirm Jalali dates render properly
- [ ] Test vote display with user_vote values: 1, -1, 0
- [ ] Validate author role display for STUDENT, MODERATOR, ADMIN
- [ ] Check MathJax formula rendering
- [ ] Test image and PDF attachment display
