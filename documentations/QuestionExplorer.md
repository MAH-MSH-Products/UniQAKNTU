# QuestionExplorer Component Documentation

## Overview
The `QuestionExplorer` component displays a list of questions for a specific exam (source material) with their answers. It has been updated in Phase 2 to implement the pagination adapter pattern and standardized data contract, and in Phase 7 to integrate voting functionality for questions and comments section.

## File Location
`frontend/src/components/wiki/QuestionExplorer.jsx`

## API Data Contract Alignment

### API Endpoints Used
- **GET `/api/questions/?source_material={examId}&status=APPROVED`**
  - Filters questions by source material (exam)
  - Only shows APPROVED questions for public visibility
  - Returns paginated response: `{ count, next, previous, results }`

- **POST `/api/questions/{id}/vote/`** (Phase 7)
  - Payload: `{ "value": 1 }` for upvote, `{ "value": -1 }` for downvote
  - Response: `{ "score": N, "user_vote": V }`

### Response Transformer Usage (Step 2.1 & 2.2)
```javascript
// Uses extractResults utility from api.js
const results = extractResults(response);
```

## Key Changes from Previous Implementation

### 1. Removed Mock Data
**Before:** Used hardcoded mock questions array
**After:** Fetches real data from API endpoint

### 2. API Integration with Response Adapter
```javascript
useEffect(() => {
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Fetch questions filtered by source_material and status=APPROVED
      const response = await api.get(`/questions/?source_material=${examId}&status=APPROVED`);
      
      // Use extractResults utility for standardized parsing
      const results = extractResults(response);
      setQuestions(results);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  if (examId) {
    fetchQuestions();
  }
}, [examId]);
```

### 3. Status Badge Display (Step 2.3)
```jsx
{question.status && (
  <span className={`badge ms-2 ${question.status === 'APPROVED' ? 'bg-success' : 'bg-warning'}`}>
    {question.status === 'APPROVED' ? 'Approved' : 'Pending Review'}
  </span>
)}
```

### 4. Jalali Date Timestamps (Step 2.3)
```jsx
{question.created_at_jalali && (
  <small className="text-muted d-block mt-2">
    Asked: {question.created_at_jalali}
  </small>
)}
```

### 5. Updated Answer Submission Handler
```javascript
const handleAnswerSubmit = (result) => {
  console.log('Answer submitted:', result);
  // Refetch questions to show updated answers
  if (examId) {
    setLoading(true);
    api.get(`/questions/?source_material=${examId}&status=APPROVED`)
      .then(response => {
        const results = extractResults(response);
        setQuestions(results);
      })
      .catch(error => console.error('Failed to refetch questions:', error))
      .finally(() => setLoading(false));
  }
};
```

### 6. Phase 7: Voting & Comments Integration

#### Step 7.1: Question Voting API Integration
Implemented upvote/downvote functionality for questions using the backend voting endpoint.

**State Management:**
```javascript
const [votingQuestionId, setVotingQuestionId] = useState(null);
const [voteError, setVoteError] = useState(null);
```

**Voting Handler:**
```javascript
const handleQuestionVote = async (questionId, value) => {
  if (!isAuthenticated) {
    alert('Please login to vote');
    return;
  }

  setVotingQuestionId(questionId);
  setVoteError(null);

  try {
    const response = await api.post(`/questions/${questionId}/vote/`, { value });
    
    // Update local state with the returned vote info
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { ...q, user_vote: response.data.user_vote || value }
        : q
    ));
  } catch (err) {
    console.error('Failed to vote:', err);
    setVoteError(
      err.response?.data?.message ||
      'Failed to vote. Please try again.'
    );
  } finally {
    setVotingQuestionId(null);
  }
};
```

**UI Buttons:**
- Upvote button: Green filled when active, outline otherwise
- Downvote button: Red filled when active, outline otherwise
- Disabled state during voting operation (per question)
- Login prompt for unauthenticated users

**Endpoint:** `POST /api/questions/{id}/vote/`
**Payload:** `{ "value": 1 }` for upvote, `{ "value": -1 }` for downvote
**Response:** `{ "score": N, "user_vote": V }`

#### Step 7.2: Comments Section Integration
Integrated `CommentSection` component at the bottom of each question card.

```jsx
<CommentSection targetType="questions" targetId={question.id} />
```

**Features:**
- Displays list of existing comments for the question
- Shows author name and Jalali timestamp
- Allows authenticated users to post new comments
- Real-time UI update after successful comment submission

## Features

### Question Display
- Question number or ID fallback
- Markdown text rendering with MathJax support
- Status badge (Approved/Pending Review)
- Jalali timestamp display
- Voting buttons (Phase 7)

### Answers Section
- Renders AnswerCard components for each answer
- Shows "No answers" message when empty
- Displays answer count

### Instructor Features
- AnswerForm displayed only for instructors
- Automatic refresh after answer submission

### Voting System (Phase 7)
- Upvote/Downvote buttons for each question
- Visual feedback for current vote state
- Authentication gate (login required)
- Loading state per question during API call
- Error handling with user-friendly messages

### Comments Section (Phase 7)
- Reusable CommentSection component
- Integrated at bottom of each question
- Comment list with author and timestamp
- Comment form for authenticated users
- Real-time updates on new comments

## Props
| Prop | Type | Description |
|------|------|-------------|
| examId | number | The ID of the exam (source material) to fetch questions for |

## Dependencies
- React (`useState`, `useEffect`)
- `../../services/api` - API client with extractResults utility
- `./AnswerCard` - Child component for rendering answers
- `./AnswerForm` - Child component for instructor answer submission
- `./CommentSection` - Child component for comments (Phase 7)
- `../../context/AuthContext` - Authentication context for role checking

## Verification Status
**باید چک شود** - This component has been updated for Phase 7 Voting & Comments system. Requires verification against actual backend API responses for:
- `POST /api/questions/{id}/vote/` endpoint behavior
- `GET /api/questions/{id}/comments/` endpoint response format
- `POST /api/questions/{id}/comments/` endpoint submission
- Real-time UI updates after voting and commenting

## Related Files
- `services/api.js` - API client with response transformers
- `components/wiki/AnswerCard.jsx` - Child component for answer display
- `components/wiki/AnswerForm.jsx` - Form for submitting answers
- `components/wiki/CommentSection.jsx` - Comments section component (Phase 7)
- `API.md` - API endpoint specifications
- `FIXING_TODO.md` - Phase 7 implementation checklist

## Testing Checklist
- [ ] Verify questions load from API endpoint
- [ ] Confirm status=APPROVED filter is applied
- [ ] Test extractResults utility integration
- [ ] Validate status badge display
- [ ] Check Jalali date rendering
- [ ] Test answer submission and refresh flow
- [ ] Verify instructor-only AnswerForm visibility
- [ ] **Phase 7.1**: Verify upvote button toggles correctly
- [ ] **Phase 7.1**: Verify downvote button toggles correctly
- [ ] **Phase 7.1**: Verify voting requires authentication
- [ ] **Phase 7.1**: Verify vote state updates after API response
- [ ] **Phase 7.1**: Verify voting one question doesn't affect others
- [ ] **Phase 7.2**: Verify comments load correctly for each question
- [ ] **Phase 7.2**: Verify comment form appears for authenticated users
- [ ] **Phase 7.2**: Verify new comment appears immediately after submission
- [ ] **Phase 7.2**: Verify login prompt for unauthenticated users
