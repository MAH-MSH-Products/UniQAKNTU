# AnswerCard.md Documentation

## Purpose
The `AnswerCard.jsx` file provides a display component for rendering individual instructor answers to exam questions in the UniQAKNTU platform. It supports rich content presentation including formatted Markdown text with MathJax mathematical formulas, author information with verification badges, image attachments, and PDF file download links. The component is designed to consume answer objects matching the API Endpoint 3.1 response structure.

## Key Components

### Component: AnswerCard
A functional React component that renders a single answer card with complete metadata and attachments.

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `answer` | Object | Yes | Complete answer object matching API Endpoint 3.1 structure |

### Answer Object Structure
```javascript
{
  id: number,                    // Unique answer identifier
  author: {                      // Author information
    name: string,                // Instructor's display name
    title: string                // Academic title (e.g., "Professor")
  },
  current_body: string,          // Markdown content of the answer
  is_verified: boolean,          // Whether answer is verified by system
  image: string|null,            // URL to attached image (optional)
  pdf_file: string|null          // URL to attached PDF (optional)
}
```

### Internal Functions

#### `processMarkdown(text)`
Converts raw Markdown text to HTML for safe rendering.
- **Input**: Raw markdown string from `current_body`
- **Output**: HTML string with proper escaping
- **Supported Syntax**:
  - Headers: `# H1`, `## H2`, `### H3`
  - Bold: `**text**` → `<strong>text</strong>`
  - Italic: `*text*` → `<em>text</em>`
  - Inline code: `` `code` `` → `<code>code</code>`
  - Line breaks: Newlines → `<br>`
  - HTML escaping: Prevents XSS attacks

#### `useEffect` Hook
Triggers MathJax typesetting when component mounts or content updates.
- Checks for `window.MathJax.typesetPromise` availability
- Calls `typesetPromise()` to render mathematical formulas
- Dependency array: `[current_body]` ensures re-render on content change

### Rendered Elements

#### Header Section
- Author name with optional academic title
- Green "✓ Verified" badge if `is_verified === true`

#### Content Section
- Processed Markdown HTML with MathJax formulas
- Proper line height and font sizing for readability

#### Attachments
- **Image**: Renders `<img>` tag with responsive sizing (max-height: 400px)
- **PDF**: Provides download/view button with external link
- Optional iframe preview (commented out for future use)

### Dependencies
- React (`useEffect`)
- Bootstrap CSS classes for styling
- Global `window.MathJax` object for formula rendering

## Usage

### Basic Integration
```jsx
import AnswerCard from './components/wiki/AnswerCard';

function QuestionDetail({ question }) {
  return (
    <div>
      {question.answers.map(answer => (
        <AnswerCard key={answer.id} answer={answer} />
      ))}
    </div>
  );
}
```

### With Single Answer
```jsx
const answerData = {
  id: 101,
  author: { name: 'Dr. Smith', title: 'Professor' },
  current_body: '## Solution\n\n$$E = mc^2$$',
  is_verified: true,
  image: '/media/answers/diagram.png',
  pdf_file: '/media/answers/solution.pdf'
};

<AnswerCard answer={answerData} />
```

### Example Answer with Math
```javascript
const answer = {
  id: 1,
  author: { name: 'Prof. Johnson', title: 'Associate Professor' },
  current_body: `
### Solution using Master Theorem

$$T(n) = aT(n/b) + f(n)$$

Where:
- $a = 2$ (number of subproblems)
- $b = 2$ (division factor)
- $f(n) = O(n)$ (combination cost)

**Result**: $T(n) = \\Theta(n \\log n)$
  `,
  is_verified: false,
  image: '/media/answers/recursion_tree.png',
  pdf_file: null
};
```

## Integration

### Parent Components
The `AnswerCard` is designed to be used within:
- `QuestionExplorer.jsx`: Renders list of answers for each question
- Future: Answer detail pages, user profile answer histories

### API Endpoint Specification (Endpoint 3.1)
Expected response structure from backend:

```
GET /api/v1/questions/:id/answers/

Response:
[
  {
    "id": 101,
    "author": {
      "name": "Dr. Smith",
      "title": "Professor"
    },
    "current_body": "## Solution...",
    "is_verified": true,
    "image": "/media/answers/img123.png",
    "pdf_file": "/media/answers/pdf456.pdf",
    "created_at": "2026-08-18T10:30:00Z"
  }
]
```

### MathJax Integration
For proper mathematical rendering:
1. Ensure MathJax script is loaded in `index.html` or main layout
2. Component automatically triggers typesetting on mount and content changes
3. Supports both inline `$...$` and display `$$...$$` math modes

### Styling
Uses Bootstrap 5 utility classes:
- Card layout (`card`, `card-header`, `card-body`)
- Flexbox utilities for header alignment (`d-flex`, `justify-content-between`)
- Badge component for verification status (`badge bg-success`)
- Responsive image handling (`img-fluid`, `rounded`)
- Button styling for PDF links (`btn btn-outline-primary btn-sm`)

## Change Log

### Initial Implementation - August 2026
- Created answer display card component
- Implemented Markdown parsing with HTML escaping
- Integrated MathJax for mathematical formula rendering
- Added author information with verification badge
- Implemented image attachment rendering
- Added PDF download link functionality
- Configured responsive design with Bootstrap

## Notes
- **Security**: All user-generated content is HTML-escaped before rendering to prevent XSS attacks
- **Performance**: MathJax typesetting occurs asynchronously to avoid blocking UI
- **Accessibility**: Consider adding alt text validation for images in future iterations
- **PDF Preview**: Currently only provides download link; iframe preview available but commented out
- **Multiple Images**: Current API spec supports single image; component can be extended for gallery view

## Verification Checklist
Before marking this component as complete, verify:
- [ ] Markdown rendering displays correctly (headers, bold, italic, code)
- [ ] MathJax formulas render properly (both inline and display modes)
- [ ] Verified badge appears only when `is_verified === true`
- [ ] Images load and display with correct sizing
- [ ] PDF links open/download correctly
- [ ] Author name and title display properly
- [ ] XSS protection prevents script injection via markdown

## Error Handling
- Missing author name defaults to "Unknown Author"
- Missing `current_body` defaults to empty string
- Missing `is_verified` defaults to `false`
- Null/undefined image/pdf handled gracefully (not rendered)
- MathJax errors logged to console without breaking UI
