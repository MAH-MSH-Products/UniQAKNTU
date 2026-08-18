# AnswerForm.md Documentation

## Purpose
The `AnswerForm.jsx` file implements a comprehensive form component for instructors to submit answers to exam questions in the UniQAKNTU platform. It supports multi-modal answer submission including Markdown text with MathJax formulas, image attachments, and PDF file uploads. The component constructs FormData objects matching the API Endpoint 3.2 specification for multipart form submissions.

## Key Components

### Component: AnswerForm
A functional React component that provides a complete answer submission interface with file upload capabilities.

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `questionId` | number | Yes | The unique identifier of the question being answered |
| `onSubmit` | function | No | Optional callback function triggered after successful submission, receives result object |

### Internal State
- `markdownText` (string): The current content of the markdown editor
- `imageFile` (File|null): Selected image file for attachment
- `pdfFile` (File|null): Selected PDF file for attachment
- `isSubmitting` (boolean): Loading state during submission
- `submitMessage` (string): Status message displayed after submission attempt

### Key Functions

#### `handleImageChange(e)`
Event handler for image file input.
- **Parameter**: File input change event
- Extracts selected file from `e.target.files[0]`
- Validates file selection
- Updates `imageFile` state

#### `handlePdfChange(e)`
Event handler for PDF file input with validation.
- **Parameter**: File input change event
- Validates file type is `application/pdf`
- Displays alert if invalid file type selected
- Updates `pdfFile` state

#### `handleSubmit(e)`
Main form submission handler that constructs and processes FormData.
- **Parameter**: Submit event
- Prevents default form submission behavior
- Constructs `FormData` object matching API Endpoint 3.2:
  ```javascript
  formData.append('current_body', markdownText);
  formData.append('image', imageFile);      // if exists
  formData.append('pdf_file', pdfFile);     // if exists
  ```
- Logs all FormData entries to console for debugging
- Simulates API call with mock success response
- Resets form on successful submission
- Displays appropriate status messages

### Dependencies
- React (`useState`)
- `MarkdownEditor` component (../editor/MarkdownEditor)
- Bootstrap CSS classes for styling
- **API Service**: Requires `api` from `../services/api` for production use (currently mocked)

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

### API Endpoint Specification (Endpoint 3.2)
**Must be verified once backend is complete - باید چک شود**

```
POST /api/v1/questions/:id/answers/
Content-Type: multipart/form-data
Authorization: Token <user_token>

Request Body (FormData):
- current_body: string (Markdown text)
- image: file (optional, image/*)
- pdf_file: file (optional, application/pdf)

Response (Expected):
{
  "id": 123,
  "author": { "name": "...", "title": "..." },
  "current_body": "...",
  "is_verified": false,
  "image": "/media/answers/...",
  "pdf_file": "/media/answers/...",
  "created_at": "2026-08-18T..."
}
```

### Current Mock Implementation
⚠️ **باید چک شود**: The component currently uses mock submission logic. Real API integration requires:

1. Uncomment the API call section in `handleSubmit()`:
   ```javascript
   const response = await api.post(`/questions/${questionId}/answers/`, formData, {
     headers: { 'Content-Type': 'multipart/form-data' }
   });
   ```

2. Backend Endpoint 3.2 must be implemented with:
   - Multipart form data parsing
   - File upload handling (images and PDFs)
   - RBAC verification (`is_instructor` check)
   - Answer model creation with file associations

### Authentication Requirements
- User must be authenticated (token attached via axios interceptor)
- User must have `is_instructor = true` (enforced by parent component visibility)
- Server-side RBAC verification required (must be implemented in backend)

## Styling
The component uses Bootstrap 5 utility classes:
- Card layout with header (`card`, `card-header`, `card-body`)
- Responsive grid for file inputs (`row`, `col-md-6`)
- Form controls (`form-control`, `form-label`)
- Button states (loading spinner, disabled state)
- Alert components for status messages

## Error Handling
- Client-side PDF validation (file type check)
- Submission disabled during processing (`isSubmitting` state)
- Error messages displayed in danger alerts
- Console logging for debugging FormData contents

## Change Log

### Initial Implementation - August 2026
- Created instructor answer submission form
- Integrated MarkdownEditor component
- Implemented dual file upload (image + PDF)
- Added FormData construction matching API spec
- Built mock submission flow with console logging
- Added comprehensive status messaging
- Included backend integration warnings (باید چک شود)

## Notes
- **Backend Dependency**: This component cannot function fully until Backend Phase 3 completes Endpoint 3.2
- **File Size Limits**: Consider implementing client-side file size validation (not yet implemented)
- **Progress Indicators**: Future enhancement could add upload progress bars for large files
- **Multiple Images**: Current spec supports single image; backend may need modification for multiple attachments
- **Security**: Server must validate file types and sizes regardless of client-side checks

## Verification Checklist
Before marking this component as complete, verify:
- [ ] Backend Endpoint 3.2 is implemented and tested
- [ ] Multipart form parsing works correctly on server
- [ ] File uploads are stored and URLs returned properly
- [ ] RBAC permissions prevent non-instructors from submitting
- [ ] Image and PDF files are accessible via returned URLs
- [ ] Error responses are properly handled and displayed
