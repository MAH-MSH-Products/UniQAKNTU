# CommentSection Documentation

## Purpose

The `CommentSection` component is a reusable React component that provides commenting functionality for both questions and answers in the UniQAKNTU platform. It enables authenticated users to view existing comments and post new comments on questions or answers.

This component was implemented as part of **Phase 7: Voting & Comments System Integration** (Step 7.2) to support the backend's comment API endpoints.

## Key Components

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `targetType` | string | Yes | Specifies the target type: either `'questions'` or `'answers'` |
| `targetId` | number | Yes | The unique identifier of the question or answer to display comments for |

### State Variables

- `comments` (array): Stores the list of fetched comments
- `loading` (boolean): Indicates whether comments are being fetched
- `newComment` (string): Holds the text of the comment being composed
- `submitting` (boolean): Indicates whether a comment submission is in progress
- `error` (string|null): Stores error messages for display

### Functions

#### `fetchComments()`
- **Trigger**: Called on component mount via `useEffect`
- **API**: `GET /api/{targetType}/{targetId}/comments/`
- **Purpose**: Fetches existing comments for the specified target
- **Response Handling**: Uses pagination adapter pattern to extract results from `{ count, next, previous, results }`

#### `handleSubmitComment(e)`
- **Trigger**: Form submission
- **API**: `POST /api/{targetType}/{targetId}/comments/`
- **Payload**: `{ "body": "comment text" }`
- **Purpose**: Submits a new comment and appends it to the local state list
- **Authentication Check**: Requires user to be authenticated; shows alert if not logged in

## Usage

### Basic Usage

```jsx
import CommentSection from './CommentSection';

// For a question
<CommentSection targetType="questions" targetId={question.id} />

// For an answer
<CommentSection targetType="answers" targetId={answer.id} />
```

### Integration Examples

#### In AnswerCard.jsx
```jsx
<CommentSection targetType="answers" targetId={id} />
```

#### In QuestionExplorer.jsx
```jsx
<CommentSection targetType="questions" targetId={question.id} />
```

## Input/Output Specifications

### Comment Object Structure

```javascript
{
  id: number,              // Unique comment identifier
  author_name: string,     // Display name of the comment author
  body: string,            // The comment text content
  created_at_jalali: string // Persian Shamsi timestamp
}
```

### API Endpoints Used

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/questions/{id}/comments/` | Fetch question comments | No |
| POST | `/api/questions/{id}/comments/` | Post question comment | Yes |
| GET | `/api/answers/{id}/comments/` | Fetch answer comments | No |
| POST | `/api/answers/{id}/comments/` | Post answer comment | Yes |

## Dependencies

- **React**: Core framework (useState, useEffect hooks)
- **axios**: Via the `api` service instance with JWT interceptors
- **AuthContext**: Provides `user`, `isAuthenticated` state
- **Bootstrap**: CSS classes for styling (btn, form-control, alert, etc.)
- **Bootstrap Icons**: Icon classes (`bi-chat-left-text`, `bi-send`, `bi-lock`)

## Integration

### With Authentication System
The component integrates with `AuthContext` to:
- Check if user is authenticated before allowing comment submission
- Show login prompt for unauthenticated users
- Display appropriate UI states based on authentication status

### With API Service
Uses the centralized `api` service which provides:
- Automatic JWT token attachment via request interceptor
- Automatic token refresh on 401 responses
- Base URL configuration (`/api/`)

### With Parent Components
- **AnswerCard**: Renders at the bottom of each answer card
- **QuestionExplorer**: Renders at the bottom of each question card

## Features

1. **Comment Display**: Shows list of comments with author name and Jalali timestamp
2. **Real-time Updates**: Appends new comments to the list immediately after successful submission
3. **Loading States**: Displays spinner while fetching or submitting comments
4. **Error Handling**: Shows user-friendly error messages for failed operations
5. **Authentication Gating**: Hides comment form for unauthenticated users with login prompt
6. **Form Validation**: Prevents empty comment submission
7. **Responsive Design**: Uses Bootstrap classes for consistent styling

## Styling

The component uses Bootstrap 5 classes for consistent UI:
- `comment-section`: Main container
- `comments-list`: List container for comments
- `comment-item`: Individual comment card with border separator
- `comment-form`: Textarea and submit button container
- Alert variants for info, warning, and error states

## Change Log

- **Phase 7 (Current)**: Initial implementation
  - Created reusable CommentSection component
  - Integrated with questions and answers API endpoints
  - Added authentication checks and error handling
  - Implemented real-time comment list updates
