# MarkdownEditor.md Documentation

## Purpose
The `MarkdownEditor.jsx` file provides a controlled rich text editor component specifically designed for instructors to write and edit answers in the UniQAKNTU platform. It features live Markdown preview with integrated MathJax mathematical formula rendering, enabling instructors to compose answers containing both formatted text and complex mathematical expressions. 

**Phase 3 Update:** The component now supports the **two-step Orphan Claiming pattern** for file attachments. When users drop or paste images into the editor, they are immediately uploaded to the backend as orphan attachments, and the returned URL is injected into the markdown text.

## Key Components

### Component: MarkdownEditor
A functional React component that implements a split-pane editor with:
- **Editor Pane**: A textarea input for writing raw Markdown syntax with drag-and-drop and paste support
- **Preview Pane**: A live preview panel that renders the Markdown output with MathJax formulas and embedded images

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | string | No (default: '') | The current markdown content (controlled component) |
| `onChange` | function | No | Callback function triggered when content changes, receives new value as parameter |
| `onAttachmentUpload` | function | No | Optional callback triggered when an attachment is uploaded, receives `{id, url}` object |

### Internal State
- `preview` (string): The processed HTML content for display in the preview pane
- `isUploading` (boolean): Loading state during attachment upload
- `textareaRef` (ref): Reference to the textarea element for cursor manipulation

### Key Functions

#### `renderMathJax()`
Triggers MathJax typesetting on the preview pane to render mathematical formulas.
- Checks for `window.MathJax.typesetPromise` availability
- Calls `typesetPromise()` to asynchronously render all math expressions
- Handles both inline math `$...$` and display math `$$...$$`

#### `processMarkdown(text)`
Converts raw Markdown text to HTML with proper escaping and formatting.
- **Input**: Raw markdown string
- **Output**: HTML string ready for rendering
- **Supported Syntax**:
  - Headers: `# H1`, `## H2`, `### H3`
  - Bold: `**text**`
  - Italic: `*text*`
  - Inline code: `` `code` ``
  - Images: `![alt](url)` → rendered as `<img>` tags
  - Line breaks: Newlines converted to `<br>`
  - HTML escaping: Prevents XSS by escaping `&`, `<`, `>`

#### `handleChange(e)`
Event handler for textarea input changes.
- Extracts new value from event target
- Invokes parent's `onChange` callback if provided

#### `insertAtCursor(textToInsert)`
Inserts text at the current cursor position in the textarea.
- **Parameter**: Text string to insert (e.g., `![attachment](url)`)
- Preserves cursor position after insertion
- Updates the value via `onChange` callback

#### `uploadAttachment(file)`
Uploads a file as an orphan attachment to the backend.
- **Parameter**: File object (image)
- Sends `POST /api/attachments/` with `FormData` containing only `file` field
- Returns `{ id, url }` on success
- Calls `onAttachmentUpload` callback if provided
- Sets `isUploading` state during upload

#### `handleDrop(e)`
Handles drag-and-drop file events on the editor.
- Prevents default browser behavior
- Extracts files from `dataTransfer.files`
- Filters for image files only
- Triggers `uploadAttachment` and inserts markdown on success

#### `handlePaste(e)`
Handles clipboard paste events in the editor.
- Iterates through clipboard items
- Detects image items (`item.type.startsWith('image/')`)
- Prevents default paste for images
- Triggers `uploadAttachment` and inserts markdown on success

### Dependencies
- React (`useState`, `useEffect`, `useRef`)
- `api` service (../../services/api) for HTTP requests
- Bootstrap CSS classes for styling (`form-control`, `form-label`, etc.)
- Global `window.MathJax` object (must be loaded in the application)

## Usage

### Basic Integration
```jsx
import MarkdownEditor from './components/editor/MarkdownEditor';

function AnswerForm() {
  const [content, setContent] = useState('');
  const [attachmentIds, setAttachmentIds] = useState([]);

  const handleAttachmentUpload = ({ id, url }) => {
    setAttachmentIds(prev => [...prev, id]);
  };

  return (
    <MarkdownEditor 
      value={content} 
      onChange={setContent}
      onAttachmentUpload={handleAttachmentUpload}
    />
  );
}
```

### With Initial Content
```jsx
<MarkdownEditor 
  value={'# Initial Header\n\nStart writing here...'} 
  onChange={(newValue) => console.log(newValue)} 
/>
```

### Example Markdown Input
```markdown
# Solution

Using the **Master Theorem**:

$$T(n) = aT(n/b) + f(n)$$

Where:
- $a = 2$
- $b = 2$
- $f(n) = O(n)$

Therefore: $T(n) = \Theta(n \log n)$

![diagram](https://example.com/image.png)
```

## Integration

### Parent Components
The `MarkdownEditor` is designed to be used within form components, specifically:
- `AnswerForm.jsx`: Primary usage for instructor answer submission
- Future: Question forms, edit forms for revising existing answers

### MathJax Setup
For proper math rendering, ensure MathJax is loaded in your application. Add to `index.html`:

```html
<script>
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']]
  },
  svg: {
    fontCache: 'global'
  }
};
</script>
<script type="text/javascript" id="MathJax-script" async
  src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js">
</script>
```

### Orphan Attachment API Integration
⚠️ **باید چک شود**: The component integrates with the backend attachment endpoint:

**Upload Endpoint:** `POST /api/attachments/`
**Content-Type:** `multipart/form-data`
**Request Body:**
```
FormData {
  file: <binary_file>
}
```
**Response (201 Created):**
```json
{
  "id": 105,
  "file": "https://cdn.example.com/attachments/abc123.png",
  "uploader": "uuid",
  "content_type": null,
  "object_id": null
}
```

The component:
1. Uploads immediately on drop/paste
2. Injects `![attachment](url)` into markdown at cursor position
3. Notifies parent component via `onAttachmentUpload` callback with `{id, url}`
4. Parent stores `id` in state array for later submission

### Styling
The component uses inline styles combined with Bootstrap utility classes:
- Flexbox layout for side-by-side panes
- Fixed height (400px) with overflow handling
- Monospace font for editor textarea
- Light gray background for preview pane
- Upload indicator shown during file upload

## Change Log

### Phase 3 Implementation - August 2026
- **Added:** `useRef` import for textarea reference
- **Added:** `api` service import for HTTP requests
- **Added:** `isUploading` state for upload feedback
- **Added:** `onAttachmentUpload` prop for parent notification
- **Added:** `insertAtCursor` function for cursor-aware text insertion
- **Added:** `uploadAttachment` function for orphan upload pattern
- **Added:** `handleDrop` function for drag-and-drop support
- **Added:** `handlePaste` function for clipboard image paste
- **Updated:** `processMarkdown` to render images as `<img>` tags
- **Updated:** Textarea with `ref`, `onDrop`, `onDragOver`, `onPaste` handlers
- **Updated:** Preview pane shows uploading indicator during upload

### Initial Implementation - August 2026
- Created split-pane Markdown editor with live preview
- Integrated MathJax for mathematical formula rendering
- Implemented basic Markdown parsing (headers, bold, italic, code)
- Added controlled component pattern with `value` and `onChange` props
- Configured responsive design using Bootstrap flexbox classes

## Notes
- The component does not include advanced Markdown features like tables, task lists, or code syntax highlighting (may be added in future iterations)
- MathJax rendering occurs with a 100ms delay after content updates to ensure DOM is ready
- For production use, consider adding debouncing to reduce MathJax re-rendering frequency on rapid typing
- **File Type Support:** Currently only supports image files for drop/paste (not PDFs or other formats)
- **Backend Dependency:** Requires `/api/attachments/` endpoint to be implemented and accessible

## Verification Checklist
Before marking this component as complete, verify:
- [ ] Backend `/api/attachments/` endpoint exists and accepts multipart form data
- [ ] Image drop triggers immediate upload and markdown injection
- [ ] Image paste from clipboard triggers immediate upload and markdown injection
- [ ] `onAttachmentUpload` callback is called with correct `{id, url}` object
- [ ] MathJax renders formulas correctly in preview pane
- [ ] Images are rendered in preview pane
- [ ] Upload indicator is shown during file upload
- [ ] ⚠️ باید چک شود - Full integration testing with backend

