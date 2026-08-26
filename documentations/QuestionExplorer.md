# QuestionExplorer Component Documentation

## Overview
The `QuestionExplorer` component displays a list of questions for a specific exam (source material) with their answers. It has been updated in Phase 2 to implement the pagination adapter pattern and standardized data contract.

## File Location
`frontend/src/components/wiki/QuestionExplorer.jsx`

## API Data Contract Alignment

### API Endpoint Used
- **GET `/api/questions/?source_material={examId}&status=APPROVED`**
  - Filters questions by source material (exam)
  - Only shows APPROVED questions for public visibility
  - Returns paginated response: `{ count, next, previous, results }`

### Response Transformer Usage (Step 2.1 & 2.2)
```javascript
// Uses extractResults utility from api.js
const results = api.extractResults 
  ? api.extractResults(response) 
  : (response.data?.results || []);
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
      const results = api.extractResults 
        ? api.extractResults(response) 
        : (response.data?.results || []);
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
        const results = api.extractResults 
          ? api.extractResults(response) 
          : (response.data?.results || []);
        setQuestions(results);
      })
      .catch(error => console.error('Failed to refetch questions:', error))
      .finally(() => setLoading(false));
  }
};
```

## Features

### Question Display
- Question number or ID fallback
- Markdown text rendering with MathJax support
- Status badge (Approved/Pending Review)
- Jalali timestamp display

### Answers Section
- Renders AnswerCard components for each answer
- Shows "No answers" message when empty
- Displays answer count

### Instructor Features
- AnswerForm displayed only for instructors
- Automatic refresh after answer submission

## Props
| Prop | Type | Description |
|------|------|-------------|
| examId | number | The ID of the exam (source material) to fetch questions for |

## Dependencies
- React (`useState`, `useEffect`)
- `../../services/api` - API client with extractResults utility
- `./AnswerCard` - Child component for rendering answers
- `./AnswerForm` - Child component for instructor answer submission
- `../../context/AuthContext` - Authentication context for role checking

## Verification Status
**باید چک شود** - This component has been updated to match Phase 2 data contract. Requires verification against actual backend API responses.

## Related Files
- `services/api.js` - API client with response transformers
- `components/wiki/AnswerCard.jsx` - Child component for answer display
- `components/wiki/AnswerForm.jsx` - Form for submitting answers
- `API.md` - API endpoint specifications
- `FIXING_TODO.md` - Phase 2 implementation checklist

## Testing Checklist
- [ ] Verify questions load from API endpoint
- [ ] Confirm status=APPROVED filter is applied
- [ ] Test extractResults utility integration
- [ ] Validate status badge display
- [ ] Check Jalali date rendering
- [ ] Test answer submission and refresh flow
- [ ] Verify instructor-only AnswerForm visibility
