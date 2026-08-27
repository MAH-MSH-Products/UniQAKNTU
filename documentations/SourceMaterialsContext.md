# SourceMaterialsContext Documentation

## Overview
The `SourceMaterialsContext` provides a global store for caching source materials (courses, textbooks, etc.) across the application. It was created in Phase 4 to eliminate redundant API calls and provide consistent data for dropdown menus in forms.

## File Location
`frontend/src/context/SourceMaterialsContext.jsx`

## Purpose
This context implements the Phase 4 caching requirement:
> "Cache `source-materials` list in a global store or context to populate dropdowns in `QuestionForm`."

**Key Benefits:**
- Fetches source materials once on app initialization
- Eliminates redundant API calls across components
- Provides consistent data for all dropdown menus
- Supports manual refresh when new materials are created
- Enables quick lookup by ID without additional API calls

## Key Components

### Context Object
```javascript
const SourceMaterialsContext = createContext();
```

### Custom Hook: useSourceMaterials()
Provides access to source materials context with error handling.

**Usage:**
```javascript
import { useSourceMaterials } from '../context/SourceMaterialsContext';

function MyComponent() {
  const { materials, loading, error, refreshMaterials, getMaterialById } = useSourceMaterials();
  // ...
}
```

**Throws Error If:**
- Used outside of `SourceMaterialsProvider`

### Provider Component: SourceMaterialsProvider
Wraps application components to provide cached source materials.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `children` | ReactNode | Child components that need access to source materials |

**Internal State:**
- `materials` (Array): Cached array of source material objects
- `loading` (boolean): Loading state during initial fetch
- `error` (string|null): Error message if fetch fails

**Methods:**
- `refreshMaterials()` - Manually refresh the cached materials
- `getMaterialById(id)` - Get single material from cache by ID

## API Integration

### Endpoint Used
```
GET /api/source-materials/
```

**Response Format:**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    { "id": 1, "title": "Calculus I", "type": "COURSE", ... },
    { "id": 2, "title": "Physics I", "type": "COURSE", ... }
  ]
}
```

### Fetch Logic
```javascript
const fetchMaterials = async () => {
  try {
    setLoading(true);
    setError(null);
    const response = await getSourceMaterials();
    // Handle both paginated and non-paginated responses
    const results = response.data?.results || response.data || [];
    setMaterials(results);
  } catch (err) {
    console.error('Failed to fetch source materials:', err);
    setError(err.message || 'Failed to load source materials');
    setMaterials([]);
  } finally {
    setLoading(false);
  }
};
```

**Features:**
- Handles paginated responses (`response.data.results`)
- Handles non-paginated responses (`response.data`)
- Falls back to empty array on error
- Sets appropriate loading and error states

## Usage Examples

### Basic Usage in Component
```jsx
import { useSourceMaterials } from '../../context/SourceMaterialsContext';

function QuestionForm() {
  const { materials, loading, error } = useSourceMaterials();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <select name="source_material">
      <option value="">Select source material</option>
      {materials.map(material => (
        <option key={material.id} value={material.id}>
          {material.title || material.name}
        </option>
      ))}
    </select>
  );
}
```

### Using getMaterialById()
```jsx
import { useSourceMaterials } from '../../context/SourceMaterialsContext';

function MaterialDisplay({ materialId }) {
  const { getMaterialById } = useSourceMaterials();
  const material = getMaterialById(materialId);
  
  if (!material) return <div>Material not found</div>;
  
  return <h3>{material.title}</h3>;
}
```

### Manual Refresh After Creation
```jsx
import { useSourceMaterials } from '../../context/SourceMaterialsContext';

function CreateMaterialForm() {
  const { refreshMaterials } = useSourceMaterials();
  
  const handleSubmit = async (data) => {
    await api.post('/source-materials/', data);
    // Refresh cache to include new material
    await refreshMaterials();
  };
  
  // ...
}
```

### Checking Loading State
```jsx
function SourceMaterialDropdown() {
  const { materials, loading, error } = useSourceMaterials();
  
  if (loading) {
    return (
      <div className="alert alert-info">
        <small>Loading source materials...</small>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-danger">
        Error: {error}
      </div>
    );
  }
  
  return (
    <select>
      {materials.map(m => (
        <option key={m.id} value={m.id}>{m.title}</option>
      ))}
    </select>
  );
}
```

## Integration Points

### App.jsx
The provider is wrapped around all routes at the top level:

```jsx
import { SourceMaterialsProvider } from './context/SourceMaterialsContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SourceMaterialsProvider>
          <Routes>
            {/* All routes have access to source materials */}
          </Routes>
        </SourceMaterialsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### Components Using This Context
- `AnswerForm.jsx` - Displays source materials in dropdown (read-only)
- Future: `QuestionForm.jsx` - Populate source material dropdown
- Future: Any component needing source material reference

## Dependencies
- React (`createContext`, `useContext`, `useState`, `useEffect`)
- `../services/api`: `getSourceMaterials` function

## Error Handling

### Context Not Found
Throws error if `useSourceMaterials()` is called outside provider:
```javascript
if (!context) {
  throw new Error('useSourceMaterials must be used within a SourceMaterialsProvider');
}
```

### API Fetch Error
- Sets error state with user-friendly message
- Falls back to empty materials array
- Logs detailed error to console for debugging

### Empty Materials
- Returns empty array instead of undefined
- Components should handle `materials.length === 0` case

## Performance Considerations

### Single Fetch on Mount
- Materials are fetched once when app loads
- Subsequent component renders use cached data
- No redundant API calls across components

### Manual Refresh Only
- Cache doesn't auto-refresh (prevents unnecessary calls)
- Components can call `refreshMaterials()` when needed
- Typical use case: after creating new source material

### Memory Usage
- Stores entire materials array in memory
- Suitable for small to medium datasets (< 1000 items)
- For large datasets, consider pagination or virtualization

## Styling
No built-in styling - components implement their own UI using:
- Bootstrap classes (recommended)
- Custom CSS
- Inline styles

## Verification Status
**⚠️ باید چک شود** - This context was created in Phase 4 and requires verification against actual backend API responses.

## Testing Checklist
- [ ] Verify materials fetch from `GET /api/source-materials/`
- [ ] Test loading state display
- [ ] Confirm error handling for failed API calls
- [ ] Validate `getMaterialById()` returns correct material
- [ ] Test `refreshMaterials()` updates cache
- [ ] Verify context works across different components
- [ ] Check behavior with empty materials array
- [ ] ⚠️ باید چک شود - Full integration testing with backend

## Change Log
- **Phase 4**: Initial implementation
  - Created context for global source materials caching
  - Implemented `useSourceMaterials` hook
  - Added `refreshMaterials` and `getMaterialById` utilities
  - Integrated with App.jsx provider hierarchy
