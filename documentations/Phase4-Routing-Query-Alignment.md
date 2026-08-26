# Phase 4: Routing & Query Parameter Alignment - Implementation Documentation

## Overview
This document details the implementation of Phase 4 from FIXING_TODO.md, which replaces nested REST paths with flat endpoints and query parameters to align the frontend with the backend API structure.

## Objective
Replace nested REST paths with flat endpoints + query parameters as specified in the backend API schema.

---

## Route Mapping Table

| Old Frontend Route | New Backend Endpoint | Query Parameter | Status |
|-------------------|----------------------|-----------------|--------|
| `/curriculum/courses/` | `/api/source-materials/` | None | ✅ Implemented |
| `/curriculum/courses/{id}/exams/` | `/api/source-materials/` | `?id={id}` (retrieve single) | ✅ Implemented |
| `/wiki/questions/{id}/answers/` | `/api/answers/` | `?question={id}` | ✅ Implemented |
| `/wiki/answers/{id}/` | `/api/answers/{id}/` | None (path param) | ✅ Implemented |

---

## Files Modified/Created

### 1. `frontend/src/services/api.js`
**Changes:**
- Added Phase 4 specific API functions for flat endpoint access
- Exported helper functions for source materials and answers

**New Functions:**
```javascript
// Source Materials (replaces /curriculum/courses/)
export const getSourceMaterials = (params = {}) => {
  return api.get('/source-materials', { params });
};

export const getSourceMaterialById = (id) => {
  return api.get('/source-materials', { params: { id } });
};

// Answers (replaces /wiki/questions/{id}/answers/)
export const getAnswersByQuestionId = (questionId) => {
  return api.get('/answers', { params: { question: questionId } });
};

export const getAnswerById = (id) => {
  return api.get(`/answers/${id}/`);
};
```

**Expected Result:** All API calls now use flat endpoints with query parameters instead of nested paths.

---

### 2. `frontend/src/context/SourceMaterialsContext.jsx` (NEW)
**Purpose:** Global cache for source materials to populate dropdowns in forms.

**Features:**
- Caches source materials list on app initialization
- Provides `useSourceMaterials` hook for components
- Supports manual refresh via `refreshMaterials()`
- Includes `getMaterialById()` for looking up materials by ID

**Implementation:**
```javascript
export const SourceMaterialsProvider = ({ children }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMaterials = async () => {
    const response = await getSourceMaterials();
    const results = response.data?.results || response.data || [];
    setMaterials(results);
  };

  // ... rest of implementation
};
```

**Expected Result:** Source materials are fetched once and cached globally, available to all components via context.

---

### 3. `frontend/src/App.jsx`
**Changes:**
- Wrapped routes with `SourceMaterialsProvider`
- Added new routes for Phase 4 structure:
  - `/source-materials` - List all source materials
  - `/source-materials/:id` - Single source material detail
  - `/questions/:questionId/answers` - Question explorer with answers
  - `/answers/:answerId` - Single answer detail view
- Removed old `/courses` route

**Route Structure:**
```jsx
<SourceMaterialsProvider>
  <Routes>
    {/* Public Routes */}
    <Route path="/source-materials" element={<SourceMaterialsList />} />
    <Route path="/source-materials/:id" element={<SourceMaterialDetail />} />
    
    {/* Protected Routes */}
    <Route path="/questions/:questionId/answers" element={<QuestionExplorer />} />
    <Route path="/answers/:answerId" element={<AnswerDetail />} />
  </Routes>
</SourceMaterialsProvider>
```

**Expected Result:** Application routing now matches the flat endpoint structure of the backend.

---

### 4. `frontend/src/components/wiki/QuestionExplorer.jsx`
**Changes:**
- Imported `extractResults` utility from api.js
- Imported `useSourceMaterials` hook from context
- Updated to use standardized response parsing
- Added Phase 4 verification notice

**Key Updates:**
```javascript
import api, { getAnswersByQuestionId, getSourceMaterials, extractResults } from '../../services/api';
import { useSourceMaterials } from '../../context/SourceMaterialsContext';

// In component:
const { materials } = useSourceMaterials();
const results = extractResults(response);
```

**Expected Result:** Component uses cached source materials and standardized response parsing.

---

### 5. `frontend/src/components/wiki/AnswerForm.jsx`
**Changes:**
- Integrated `useSourceMaterials` hook
- Added source materials dropdown (disabled, for reference)
- Updated documentation with Phase 4 notes

**Implementation:**
```javascript
const { materials, loading: materialsLoading } = useSourceMaterials();

// Dropdown showing cached materials
<select disabled title="Source material is set at question level">
  {materials.map(material => (
    <option key={material.id} value={material.id}>
      {material.title || material.name}
    </option>
  ))}
</select>
```

**Expected Result:** Form has access to cached source materials for potential future use in question creation.

---

### 6. `frontend/src/components/wiki/AnswerDetail.jsx` (NEW)
**Purpose:** Display single answer details using flat endpoint structure.

**Features:**
- Fetches answer via `GET /api/answers/{id}/`
- Displays full answer content with markdown rendering
- Shows author information, status badges, timestamps
- Handles image and PDF attachments
- Links back to parent question

**Implementation:**
```javascript
const { answerId } = useParams();

useEffect(() => {
  const fetchAnswer = async () => {
    const response = await getAnswerById(answerId);
    setAnswer(response.data);
  };
  fetchAnswer();
}, [answerId]);
```

**Expected Result:** Users can view individual answer details at `/answers/{answerId}` route.

---

## Verification Checklist

### Step 4.1: Route Mapping ✅
- [x] `/curriculum/courses/` → `/api/source-materials/`
- [x] `/curriculum/courses/{id}/exams/` → `/api/source-materials/?id={id}`
- [x] `/wiki/questions/{id}/answers/` → `/api/answers/?question={id}`
- [x] `/wiki/answers/{id}/` → `/api/answers/{id}/`

### Step 4.2: Update Service Calls ✅
- [x] Replaced `GET /wiki/questions/${qid}/answers/` with `GET /api/answers/?question=${qid}`
- [x] Replaced `GET /curriculum/courses/` with `GET /api/source-materials/`
- [x] Cached `source-materials` list in global context (`SourceMaterialsContext`)

---

## Testing Notes

### باید چک شود (Needs Verification):
1. **API Integration:** Verify that all new endpoints work correctly with the backend
2. **Context Caching:** Confirm that source materials are properly cached and accessible across components
3. **Route Navigation:** Test that all new routes render correctly and handle edge cases (404, loading states)
4. **Answer Detail Page:** Verify the new AnswerDetail component displays all answer fields correctly

### Manual Testing Steps:
1. Navigate to `/source-materials` - should show list of all source materials
2. Navigate to `/source-materials/1` - should show details for source material with ID 1
3. Navigate to `/questions/5/answers` - should show answers for question 5
4. Navigate to `/answers/10` - should show details for answer 10
5. Check browser dev tools Network tab to verify flat endpoint URLs are being called

---

## Dependencies

- React Router DOM (for routing)
- Axios (for API calls)
- Bootstrap (for UI components)
- react-i18next (for translations, if applicable)

---

## Related Documentation

- `FIXING_TODO.md` - Phase 4 specification
- `API.md` - Backend API endpoints reference
- `FRONTEND_WORKFLOW_GUIDE.md` - Frontend integration methodology
- `AGENT_CONSTRAINTS.md` - Development constraints and requirements

---

## Author Information

- **Developer:** Mohammad Amin Haji Alirezaei (`mahajialirezaei`)
- **Email:** m.a.hajialirezaei05@gmail.com
- **Branch:** `feature/fe-routing-query-alignment-fixing-phase_4`
- **Date:** 2024

---

## Status

**Phase 4 Implementation: ✅ COMPLETE**

All target files have been updated according to the specifications in FIXING_TODO.md. The frontend now uses flat endpoints with query parameters instead of nested REST paths, aligning with the backend API structure.

⚠️ **Note:** This implementation must be verified against the actual backend endpoints. Tag: **باید چک شود**
