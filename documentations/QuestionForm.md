# QuestionForm Component Documentation

## Overview
The `QuestionForm` component provides a form interface for students to submit new questions to the platform. It implements the two-step Orphan Claiming pattern for attachments and includes multi-select tag picker functionality introduced in Phase 8.

## File Location
`frontend/src/components/wiki/QuestionForm.jsx`

## Features

### Source Material Selection
- Dropdown populated from `SourceMaterialsContext` (cached globally)
- Required field - must be selected before submission
- Pre-selection supported via `examId` prop

### Phase 8: Tags & Categories Integration
- Fetches all tag categories on mount via `GET /api/tags/categories/`
- Fetches all tags on mount via `GET /api/tags/`
- Displays tags grouped by category (if categories exist)
- Multi-select checkbox interface for tag selection
- Visual feedback showing selected tag count
- Fallback to flat list if no categories are available

### Markdown Editor Integration
- Uses `MarkdownEditor` component for rich text editing
- Supports MathJax formulas
- Handles image/file uploads via orphan claiming pattern

### Two-Step Orphan Claiming Pattern
1. **Upload First**: When user drops/pastes an image, it's immediately uploaded to `POST /api/attachments/`
2. **Claim on Submit**: Attachment IDs are collected and sent with question submission

### Form Submission Payload
```json
{
  "title": "Question", // Extracted from first 100 chars of markdown or default
  "body": "markdown string...",
  "source_material": 12,        // integer ID (required)
  "tag_ids": [4, 7],            // integer IDs (optional, multi-select)
  "attachment_ids": [101, 102]  // orphan IDs from uploads
}
```

## API Endpoints Used

### On Mount (useEffect)
- `GET /api/tags/categories/` - Fetch all tag categories
- `GET /api/tags/` - Fetch all tags

### On Submit
- `POST /api/questions/` - Create new question with status `PENDING`

### Response Handling
- Success: Shows success message, resets form, calls `onSubmit` callback
- Error: Displays error message from API response

## Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| examId | number | Pre-selected exam/source material ID | `''` |
| onSubmit | function | Callback on successful submission | `undefined` |

## State Variables

### Form State
- `markdownText` - Content of the markdown editor
- `attachmentIds` - Array of uploaded attachment IDs
- `isSubmitting` - Loading state during submission
- `submitMessage` - Success/error message display

### Phase 8: Tags State
- `tags` - Array of all available tags
- `tagCategories` - Array of tag categories
- `selectedTagIds` - Array of selected tag IDs
- `selectedSourceMaterial` - Selected source material ID
- `loadingTags` - Loading state for tags fetch

## Component Structure

```jsx
<div className="question-form-container card">
  <div className="card-header">Ask a New Question</div>
  <div className="card-body">
    <form>
      {/* Source Material Dropdown */}
      <select id="source-material">...</select>
      
      {/* Tags Multi-Select */}
      <div className="tags-container">
        {tagCategories.map(category => (
          <div key={category.id}>
            <h6>{category.name}</h6>
            {tags.filter(...).map(tag => (
              <label className="badge">
                <input type="checkbox" />
                {tag.value}
              </label>
            ))}
          </div>
        ))}
      </div>
      
      {/* Markdown Editor */}
      <MarkdownEditor ... />
      
      {/* Submit Button */}
      <button type="submit">Submit Question</button>
    </form>
  </div>
</div>
```

## Dependencies
- React (`useState`, `useEffect`)
- `../editor/MarkdownEditor` - Rich text editor component
- `../../services/api` - API client with `getTags`, `getTagCategories`
- `../../context/SourceMaterialsContext` - Global source materials cache

## Integration Points

### Source Materials Context
Uses cached source materials from `SourceMaterialsContext` to populate dropdown without additional API calls.

### Markdown Editor
Receives `onAttachmentUpload` callback to collect attachment IDs as files are uploaded.

### Parent Components
Can be used standalone or embedded in pages like:
- Home page (for quick question asking)
- Exam detail pages (for exam-specific questions)
- User dashboard

## Verification Status
**⚠️ باید چک شود** - This component has been created for Phase 8 Tags & Categories integration. Requires verification against actual backend API responses for:
- `GET /api/tags/categories/` endpoint response format
- `GET /api/tags/` endpoint response format
- `POST /api/questions/` payload acceptance with `tag_ids` array
- Tag display grouping by category
- Multi-select checkbox behavior

## Related Files
- `services/api.js` - API functions for tags and categories
- `components/wiki/QuestionExplorer.jsx` - Displays questions with tags (Phase 8)
- `components/editor/MarkdownEditor.jsx` - Markdown editor with file upload
- `context/SourceMaterialsContext.jsx` - Source materials caching
- `API.md` - API endpoint specifications
- `FIXING_TODO.md` - Phase 8 implementation checklist

## Testing Checklist
- [ ] Verify tags load on component mount
- [ ] Verify tag categories load correctly
- [ ] Test tag selection/deselection toggling
- [ ] Confirm selected tag count updates
- [ ] Test source material dropdown population
- [ ] Verify form validation (source material required)
- [ ] Test attachment upload flow
- [ ] Verify submission payload structure
- [ ] Test success message display
- [ ] Test error handling
- [ ] **Phase 8**: Verify tags are grouped by category when categories exist
- [ ] **Phase 8**: Verify fallback to flat list when no categories
- [ ] **Phase 8**: Verify `tag_ids` array is sent correctly in POST request
- [ ] ⚠️ باید چک شود - Full integration testing with backend

## Change Log
- **Phase 8** (Current): Initial creation with tags and categories integration
  - Added `getTags` and `getTagCategories` API calls
  - Implemented multi-select tag picker UI
  - Added tag grouping by category
  - Included `tag_ids` in submission payload
  - Added source material selection requirement
