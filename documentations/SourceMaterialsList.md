# SourceMaterialsList Documentation

## Purpose
The `SourceMaterialsList` component displays a paginated grid of all source materials available in the system. It serves as the main landing page for browsing exams, courses, and other academic materials. Each material card shows key information and provides quick access to download PDFs and explore related questions.

## Key Components

### Component Structure
```jsx
const SourceMaterialsList = () => {
  // State management
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({...});
}
```

### Features
- **Grid Layout**: Displays materials in a responsive grid (col-md-6 col-lg-4)
- **Academic Cards**: Uses `.academic-card` styling for consistency
- **Material Information**:
  - Title (or fallback to "Source Material #ID")
  - Year (if available)
  - Created date in Jalali calendar format
- **PDF Downloads**: 
  - "Download Exam PDF" button (if `question_pdf` exists)
  - "Download Official Answers PDF" button (if `answer_pdf` exists)
- **Navigation**: "Explore Questions" button links to `/source-materials/:id/questions`
- **Pagination**: Supports next/previous navigation for large datasets

### API Integration
- **Endpoint**: `GET /api/source-materials/`
- **Response Format**: Paginated response `{ count, next, previous, results }`
- **Utility Functions**: Uses `extractResults()` from `api.js` for standardized parsing

## Usage

### Route Configuration
```jsx
// App.jsx
<Route path="/source-materials" element={<SourceMaterialsList />} />
```

### Access Points
- Direct navigation: `/source-materials`
- Sidebar link: "All Courses" → `/source-materials`
- Footer link: "All Courses" → `/source-materials`

## Dependencies
- **React Hooks**: `useState`, `useEffect`
- **React Router**: `Link` for navigation
- **API Service**: `api` instance and `extractResults` utility
- **Bootstrap Classes**: Grid system, cards, buttons, pagination

## Integration
This component replaces the placeholder `<div>` that was previously at `/source-materials` route. It integrates with:
- `api.js`: For fetching source materials with pagination support
- `App.jsx`: As a routed page component
- `Sidebar.jsx` and `Footer.jsx`: Via updated navigation links

## Change Log
- **Phase 10**: Initial implementation
  - Created dedicated listing page for source materials
  - Implemented card-based grid layout
  - Added PDF download buttons
  - Integrated pagination controls
  - Connected to `/source-materials/:id/questions` route
