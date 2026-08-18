# QuestionExplorer.md Documentation

## Purpose
The `QuestionExplorer.jsx` file implements a comprehensive component for displaying exam questions with their associated instructor answers in the UniQAKNTU platform. It fetches and renders a list of questions for a specific exam, displays all submitted answers for each question using AnswerCard components, and provides an integrated AnswerForm for instructors to contribute new answers. The component currently uses mock data matching API Endpoint 2.3 (Questions) and Endpoint 3.1 (Answers) structures, with clear markers for future backend integration.

## Key Components

### Component: QuestionExplorer
A functional React component that serves as the main interface for browsing exam questions and viewing/submitting answers.

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `examId` | number | Yes | The unique identifier of the exam to fetch questions for |

### Internal State
- `questions` (Array): List of question objects with nested answers
- `loading` (boolean): Loading state during data fetching
- `isInstructor` (boolean): User's instructor status from AuthContext

### Mock Data Structure

#### Question Object (Endpoint 2.3)
```javascript
{
  id: number,              // Unique question identifier
  question_number: number, // Sequential question number
  text: string             // Question text with MathJax formulas
}
```

#### Answer Object (Endpoint 3.1)
```javascript
{
  id: number,              // Unique answer identifier
  author: {                // Instructor information
    name: string,
    title: string
  },
  current_body: string,    // Markdown content
  is_verified: boolean,    // Verification status
  image: string|null,      // Image attachment URL
  pdf_file: string|null    // PDF attachment URL
}
```

### Key Functions

#### `fetchQuestions()`
Effect hook that loads questions when component mounts or examId changes.
- **Current Implementation**: Uses hardcoded mock data with simulated delay
- **Production**: Must be replaced with actual API call to Endpoint 2.3
- Sets loading state during fetch operation
- Populates questions array on success

#### `handleAnswerSubmit(result)`
Callback function triggered when instructor submits an answer.
- Logs submission result to console
- Placeholder for UI refresh logic (refetch questions or optimistic update)
- Passed to AnswerForm component via onSubmit prop

### Child Components

#### AnswerCard
- Renders individual answer cards for each submitted answer
- Displays author info, verification badge, markdown content, and attachments
- Imported from `./AnswerCard`

#### AnswerForm
- Provides answer submission interface for instructors
- Conditionally rendered only when user has instructor privileges
- Imported from `./AnswerForm`

### Dependencies
- React (`useState`, `useEffect`)
- `AnswerCard` component
- `AnswerForm` component
- `useAuth` hook from `../../context/AuthContext`
- Bootstrap CSS classes for styling

## Usage

### Basic Integration
```jsx
import QuestionExplorer from './components/wiki/QuestionExplorer';

function ExamDetailPage({ examId }) {
  return (
    <div>
      <h1>Exam Questions</h1>
      <QuestionExplorer examId={examId} />
    </div>
  );
}
```

### With Route Parameters
```jsx
import { useParams } from 'react-router-dom';
import QuestionExplorer from './components/wiki/QuestionExplorer';

function ExamPage() {
  const { examId } = useParams();
  
  return <QuestionExplorer examId={parseInt(examId)} />;
}
```

## Integration

### Parent Components
The `QuestionExplorer` is designed to be used within:
- Exam detail pages
- Course navigation flows
- Future: Student dashboard for quick access to exam questions

### API Endpoints (Must be verified - باید چک شود)

#### Endpoint 2.3: Get Questions for Exam
```
GET /api/v1/exams/:id/questions/
Authorization: Token <user_token>

Response:
[
  {
    "id": 1,
    "question_number": 1,
    "text": "Calculate $$T(n) = 2T(n/2) + O(n)$$",
    "answers": [
      {
        "id": 101,
        "author": { "name": "Dr. Smith", "title": "Professor" },
        "current_body": "## Solution...",
        "is_verified": true,
        "image": null,
        "pdf_file": "/media/answers/sol.pdf"
      }
    ]
  }
]
```

#### Endpoint 3.1: Get Answers for Question
May be called separately or included in questions endpoint:
```
GET /api/v1/questions/:id/answers/
```

### Current Mock Implementation
⚠️ **باید چک شود**: The component currently uses mock data. Real API integration requires:

1. Uncomment API call in `fetchQuestions()`:
   ```javascript
   const response = await api.get(`/exams/${examId}/questions/`);
   setQuestions(response.data);
   ```

2. Backend Endpoint 2.3 must be implemented with:
   - Question model filtering by exam ID
   - Prefetching of related answers (or separate endpoint calls)
   - Proper serialization of answer data including file URLs
   - RBAC enforcement (students can read, instructors can write)

3. Handle nested data structure:
   - Option A: Backend returns questions with nested answers array
   - Option B: Frontend makes separate API calls for each question's answers

### Authentication & Authorization
- **Read Access**: All authenticated users can view questions and answers
- **Write Access**: Only users with `is_instructor = true` see AnswerForm
- **Server-Side RBAC**: Backend must verify instructor status before allowing answer submission

### MathJax Integration
Questions and answers containing mathematical formulas are automatically rendered:
- Question text processed with inline math replacement
- AnswerCard components handle their own MathJax typesetting
- Ensure MathJax script is loaded in application entry point

## Styling
Uses Bootstrap 5 utility classes:
- Card layouts for questions and answers
- Spinner component for loading states
- Alert components for empty states and warnings
- Responsive spacing utilities (`mb-3`, `mt-4`, `py-5`)
- Text color utilities (`text-primary`, `text-muted`)

## Change Log

### Initial Implementation - August 2026
- Created question explorer component with mock data
- Implemented question list rendering with numbering
- Integrated AnswerCard for displaying answers
- Added conditional AnswerForm rendering for instructors
- Built loading and empty state handling
- Included comprehensive backend integration warnings (باید چک شود)
- Added mock data examples with mathematical formulas

## Notes
- **Backend Dependency**: Component requires both Endpoint 2.3 and 3.1 to be fully functional
- **Performance Consideration**: For exams with many questions, consider pagination or virtual scrolling
- **Data Structure**: Current mock assumes nested answers; backend may return flat structure requiring client-side grouping
- **Error Handling**: Basic error logging implemented; production should add user-friendly error messages
- **MathJax Timing**: Answers trigger their own typesetting; questions use inline replacement

## Verification Checklist
Before marking this component as complete, verify:
- [ ] Backend Endpoint 2.3 returns correct question structure
- [ ] Answers are properly associated with questions
- [ ] Loading state displays during data fetching
- [ ] Empty state shows when no questions exist
- [ ] Instructors see AnswerForm below each question
- [ ] Non-instructors do not see AnswerForm
- [ ] Mathematical formulas render correctly in questions and answers
- [ ] Answer submission triggers UI update
- [ ] Error states handled gracefully

## Error Handling
- Network errors logged to console
- Loading state prevents premature rendering
- Empty questions array displays informative message
- Missing answers show encouragement to contribute
- MathJax errors isolated to prevent UI crashes

## Future Enhancements
- **Pagination**: Support for large question sets
- **Filtering**: Sort questions by answered/unanswered status
- **Search**: Text search within questions and answers
- **Collapsible Answers**: Toggle visibility of individual answers
- **Answer Count Badge**: Show number of answers per question in header
- **Direct Navigation**: Jump to specific question number via URL hash
