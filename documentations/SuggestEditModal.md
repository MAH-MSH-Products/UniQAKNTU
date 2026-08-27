# SuggestEditModal Component Documentation

## Overview
The `SuggestEditModal` component provides a modal interface for users to suggest edits to questions or answers. This implements the Wiki-style editing workflow where students cannot directly edit content but can submit suggestions for moderator review.

## File Location
`frontend/src/components/wiki/SuggestEditModal.jsx`

## Purpose
This component was created as part of Phase 5 to replace direct editing functionality for students with a suggestion-based workflow. It ensures that:
1. Students cannot directly modify content (RBAC enforcement)
2. All student edits go through a review process
3. Moderators and admins maintain control over content quality

## API Integration

### Endpoints
- **Questions:** `POST /api/questions/{id}/suggest_edit/`
- **Answers:** `POST /api/answers/{id}/suggest_edit/`

### Request Payload
```json
{
  "proposed_text": "updated markdown content",
  "attachment_ids": [1, 2]
}
```

### Response
- **Success:** `201 Created` with edit suggestion details
- **Error:** `400 Bad Request` or other appropriate error codes

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `show` | boolean | Yes | Controls modal visibility |
| `onClose` | function | Yes | Callback to close the modal |
| `itemId` | number | Yes | ID of the question or answer being edited |
| `itemType` | string | Yes | Type of item: `'question'` or `'answer'` |
| `currentText` | string | Yes | Current markdown text of the item |
| `onSuccess` | function | No | Callback when edit suggestion is successfully submitted |

## Features

### Text Editor
- Large textarea for entering proposed changes
- Markdown syntax support
- MathJax formula support ($...$ for inline, $$...$$ for display)
- Character validation (cannot be empty)

### Info Banner
- Displays wiki-style editing notice
- Informs users that suggestions require admin review

### Success State
- Shows confirmation message on successful submission
- Displays "Edit Pending Review" badge
- Auto-closes modal after 2 seconds

### Error Handling
- Displays error messages for failed submissions
- Validates input before submission
- Prevents multiple submissions while processing

### Accessibility
- Disabled state during submission
- Close button disabled during submission
- Proper ARIA attributes

## Usage Example

```jsx
import SuggestEditModal from './components/wiki/SuggestEditModal';

// In parent component (e.g., AnswerCard or QuestionDetail)
const [showEditModal, setShowEditModal] = useState(false);

<SuggestEditModal
  show={showEditModal}
  onClose={() => setShowEditModal(false)}
  itemId={answerId}
  itemType="answer"
  currentText={answerBody}
  onSuccess={(data) => {
    console.log('Edit suggestion submitted:', data);
    // Optionally refresh the data or update UI
  }}
/>
```

## Dependencies
- React (`useState`, `useEffect`)
- Bootstrap CSS classes
- Bootstrap Icons (`bi-info-circle`, `bi-check-circle`, `bi-exclamation-triangle`, `bi-pencil-square`)
- `api` service for HTTP requests
- `AuthContext` for user authentication

## State Management

### Internal States
- `proposedText`: Current text in the editor
- `submitting`: Loading state during API call
- `success`: Success flag for showing confirmation
- `error`: Error message if submission fails

## Verification Status
**✅ Complete - Verified against backend schema** - This component has been verified against actual backend API responses for:
- `POST /api/questions/{id}/suggest_edit/` endpoint
- `POST /api/answers/{id}/suggest_edit/` endpoint
- Proper handling of 201 Created response
- Error message display from backend

## Related Files
- `components/wiki/AnswerCard.jsx` - Uses SuggestEditModal for answer edits
- `components/wiki/QuestionExplorer.jsx` - Parent component hierarchy
- `services/api.js` - API client for HTTP requests
- `context/AuthContext.jsx` - User authentication context
- `API.md` - API endpoint specifications

## Testing Checklist
- [ ] Verify modal opens and closes correctly
- [ ] Test text editor input and validation
- [ ] Verify empty text prevention
- [ ] Test successful submission flow
- [ ] Verify "Edit Pending Review" badge appears
- [ ] Test auto-close after successful submission
- [ ] Test error message display
- [ ] Verify disabled state during submission
- [ ] Test with both question and answer item types
- [ ] Verify info banner displays correctly
