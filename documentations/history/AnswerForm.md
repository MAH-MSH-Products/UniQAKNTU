# AnswerForm.md Documentation

## Purpose
The `AnswerForm.jsx` file implements a comprehensive form component for instructors to submit answers to exam questions in the UniQAKNTU platform. It supports multi-modal answer submission using the **two-step Orphan Claiming pattern** as specified in the backend API documentation. The component sends JSON payloads with `application/json` content type, replacing the previous `multipart/form-data` approach.

## Key Components

### Component: AnswerForm
A functional React component that provides a complete answer submission interface with inline markdown editor and attachment support.

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `questionId` | number | Yes | The unique identifier of the question being answered |
| `onSubmit` | function | No | Optional callback function triggered after successful submission, receives result object |

### Internal State
- `markdownText` (string): The current content of the markdown editor
- `attachmentIds` (Array<number>): Array of uploaded attachment IDs to be claimed on submission
- `isSubmitting` (boolean): Loading state during submission
- `submitMessage` (string): Status message displayed after submission attempt

### Key Functions

#### `handleAttachmentUpload({id, url})`
Callback handler for attachment uploads from MarkdownEditor component.
- **Parameter**: Object containing `id` (attachment ID) and `url` (file URL)
- Appends the attachment ID to the `attachmentIds` state array
- Called automatically when user drops or pastes an image into the editor

#### `handleSubmit(e)`
Main form submission handler that constructs and processes JSON payload.
- **Parameter**: Submit event
- Prevents default form submission behavior
- Constructs JSON payload matching API specification:
  ```javascript
  {
    "question": 42,
    "body": "markdown text with ![img](url)...",
    "attachment_ids": [105, 106]
  }
  ```
- Sends POST request to `/api/answers/` with `application/json` content type
- Resets form on successful submission
- Displays appropriate status messages

### Dependencies
- React (`useState`)
- `MarkdownEditor` component (../editor/MarkdownEditor)
- `api` service (../../services/api) for HTTP requests
- Bootstrap CSS classes for styling

## Usage

### Basic Integration
```jsx
import AnswerForm from './components/wiki/AnswerForm';

function QuestionDetail({ questionId }) {
  const handleSubmission = (result) => {
    if (result.success) {
      console.log('Answer submitted successfully');
      // Refresh question list or navigate
    }
  };

  return (
    <AnswerForm 
      questionId={questionId}
      onSubmit={handleSubmission}
    />
  );
}
```

### Without Callback
```jsx
<AnswerForm questionId={42} />
```

## Integration

### Parent Components
The `AnswerForm` is designed to be used within:
- `QuestionExplorer.jsx`: Displays form below each question for authenticated instructors
- Future: Standalone answer creation pages

### API Endpoint Specification
**Endpoint:** `POST /api/answers/`
**Content-Type:** `application/json`
**Authorization:** `Bearer <JWT_ACCESS_TOKEN>`

```json
Request Body:
{
  "question": 42,
  "body": "markdown text with embedded images...",
  "attachment_ids": [105, 106]
}

Response (Expected - 201 Created):
{
  "id": 123,
  "question": 42,
  "author": { "id": "uuid", "username": "...", "role": "MODERATOR" },
  "body": "markdown text...",
  "status": "PENDING",
  "score": 0,
  "user_vote": 0,
  "is_accepted": false,
  "attachments": [
    { "id": 105, "file": "https://..." },
    { "id": 106, "file": "https://..." }
  ],
  "created_at_jalali": "1403/08/15 14:32"
}
```

### Orphan Claiming Pattern
✅ **Complete - Verified against backend schema**: This component implements the two-step orphan claiming flow:

1. **Step 1 - Upload (Immediate):** When user drops/pastes an image in the editor:
   - `POST /api/attachments/` with `FormData` containing only `file`
   - Response returns `{ id, file: url }`
   - Image URL is injected into markdown as `![attachment](url)`
   - Attachment ID is stored in local state

2. **Step 2 - Claim (On Submit):** When user submits the answer:
   - JSON payload includes `attachment_ids: [105, 106]`
   - Backend claims the orphaned attachments and associates them with the answer
   - Attachments are validated to ensure they exist and belong to the user

### Authentication Requirements
- User must be authenticated (token attached via axios interceptor)
- User must have role `MODERATOR` or `ADMIN` (enforced by parent component visibility)
- Server-side RBAC verification required (backend enforces permissions)

## Styling
The component uses Bootstrap 5 utility classes:
- Card layout with header (`card`, `card-header`, `card-body`)
- Form controls (`form-control`, `form-label`)
- Button states (loading spinner, disabled state)
- Alert components for status messages and info/warning notices

## Error Handling
- Submission disabled during processing (`isSubmitting` state)
- Error messages displayed in danger alerts
- Console logging for debugging payload contents
- Graceful handling of API errors with user-friendly messages

## Change Log

### Phase 3 Implementation - August 2026
- **Removed:** `multipart/form-data` submission logic
- **Removed:** `formData.append('image')`, `formData.append('pdf_file')`, `formData.append('current_body')`
- **Added:** Two-step orphan claiming pattern implementation
- **Added:** `attachmentIds` state array for tracking uploaded attachments
- **Added:** `handleAttachmentUpload` callback for receiving attachment info from MarkdownEditor
- **Changed:** Content-Type from `multipart/form-data` to `application/json`
- **Changed:** Payload structure to match API spec with `attachment_ids` array
- **Updated:** Integration notice to reflect new workflow

## Notes
- **Backend Dependency:** Requires `POST /api/attachments/` endpoint for orphan uploads
- **Image Support:** Currently supports image files dropped/pasted into editor
- **Validation:** Backend validates attachment IDs exist and belong to submitting user
- **Security:** Server must validate file types regardless of client-side handling

## Verification Checklist
Before marking this component as complete, verify:
- [ ] Backend `/api/attachments/` endpoint accepts multipart form data
- [ ] Backend `/api/answers/` endpoint accepts JSON with `attachment_ids`
- [ ] Orphaned attachments are properly claimed on answer creation
- [ ] RBAC permissions prevent non-moderators from submitting answers
- [ ] Uploaded attachments are accessible via returned URLs
- [ ] Error responses are properly handled and displayed
- [ ] ✅ Complete - Verified against backend schema - Full integration testing with backend

