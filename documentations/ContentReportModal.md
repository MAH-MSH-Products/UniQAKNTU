# ContentReportModal.jsx Documentation

## Purpose
The `ContentReportModal.jsx` component is a reusable modal that allows users to report errors or issues with questions and answers in the UniQAKNTU platform. It provides a user-friendly interface for submitting content reports that are sent to administrators for review.

This component is part of Phase 6 (UI Implementation - Support & Admin Dashboards) of the UniQAKNTU project.

## Key Components

### State Management
- **reason**: String containing the user's reason for reporting the content
- **loading**: Boolean indicating if a report submission is in progress
- **status**: Object containing feedback message type ('success' or 'error') and message text

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | boolean | Yes | - | Controls whether the modal is visible |
| `onClose` | function | Yes | - | Callback function to close the modal |
| `questionId` | number/string | Yes | - | ID of the question being reported |
| `answerId` | number/string | No | null | ID of the answer being reported (optional) |

### Functions

#### `handleSubmit(e)`
- **Purpose**: Handles form submission and sends the report to the API
- **API Endpoint**: `POST /support/reports/` (Endpoint 4.5)
- **Payload Structure**:
  ```javascript
  {
    question_id: questionId,
    answer_id: answerId, // optional
    reason: reason
  }
  ```
- **Validation**: Ensures reason field is not empty before submission
- **Mock Data**: Uses temporary mock data until backend is ready

#### `handleClose()`
- **Purpose**: Closes the modal and resets all state
- **Actions**: Clears reason input, resets status message, calls onClose prop

## Usage

### Basic Example
```jsx
import ContentReportModal from './components/support/ContentReportModal';

// In your component:
const [isModalOpen, setIsModalOpen] = useState(false);

<button onClick={() => setIsModalOpen(true)}>
  Report Error
</button>

<ContentReportModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  questionId={105}
  answerId={42}
/>
```

### Reporting a Question Only (No Answer)
```jsx
<ContentReportModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  questionId={98}
  // answerId is optional, omit if reporting question itself
/>
```

## Integration

### API Integration Points (باید چک شود)

The following API endpoint needs to be verified and integrated when the backend is ready:

1. **Endpoint 4.5** - `POST /support/reports/`
   - Used in `handleSubmit()` to submit content reports
   - Payload: `{ question_id, answer_id (optional), reason }`
   - Currently using mock data with console.log
   - **Tag**: باید چک شود

### Mock API Call
```javascript
console.log('Mock API Call - Content Report:', {
  question_id: questionId,
  answer_id: answerId,
  reason: reason
});
```

### Actual API Call (When Backend Ready)
```javascript
const response = await api.post('/support/reports/', payload);
```

## Styling

### Bootstrap Classes Used
- `modal-backdrop fade show` - Modal backdrop overlay
- `modal fade show d-block` - Modal container
- `modal-dialog` - Modal dialog wrapper
- `modal-content` - Modal content area
- `modal-header` - Header section with title and close button
- `modal-body` - Main content area
- `modal-footer` - Footer section with action buttons
- `btn-close` - Close button (X icon)
- `form-control` - Form input styling
- `alert alert-success/alert-danger` - Status messages
- `btn btn-secondary/btn-danger` - Button styling

### Custom Styles
- Inline `zIndex` styles to ensure proper modal layering

## Dependencies

### React Hooks
- `useState` - For managing modal state and form data

### Services
- `api` - From `../../services/api` for making HTTP requests (currently mocked)

### Parent Component Requirements
The parent component must:
1. Manage the `isOpen` state
2. Provide an `onClose` callback handler
3. Pass the `questionId` of the content being reported
4. Optionally pass `answerId` if reporting a specific answer

## Change Log

- **2026-08-17**: Initial creation of ContentReportModal component for Phase 6
  - Implemented reusable modal component with Bootstrap styling
  - Added props for questionId and optional answerId
  - Implemented form validation for reason field
  - Added success/error feedback messages
  - Integrated with mock API for development
  - Marked API integration point with "باید چک شود" tag
