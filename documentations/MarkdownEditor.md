# MarkdownEditor.md Documentation

## Purpose
The `MarkdownEditor.jsx` file provides a controlled rich text editor component specifically designed for instructors to write and edit answers in the UniQAKNTU platform. It features live Markdown preview with integrated MathJax mathematical formula rendering, enabling instructors to compose answers containing both formatted text and complex mathematical expressions.

## Key Components

### Component: MarkdownEditor
A functional React component that implements a split-pane editor with:
- **Editor Pane**: A textarea input for writing raw Markdown syntax
- **Preview Pane**: A live preview panel that renders the Markdown output with MathJax formulas

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | string | No (default: '') | The current markdown content (controlled component) |
| `onChange` | function | No | Callback function triggered when content changes, receives new value as parameter |

### Internal State
- `preview` (string): The processed HTML content for display in the preview pane

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
  - Line breaks: Newlines converted to `<br>`
  - HTML escaping: Prevents XSS by escaping `&`, `<`, `>`

#### `handleChange(e)`
Event handler for textarea input changes.
- Extracts new value from event target
- Invokes parent's `onChange` callback if provided

### Dependencies
- React (`useState`, `useEffect`)
- Bootstrap CSS classes for styling (`form-control`, `form-label`, etc.)
- Global `window.MathJax` object (must be loaded in the application)

## Usage

### Basic Integration
```jsx
import MarkdownEditor from './components/editor/MarkdownEditor';

function AnswerForm() {
  const [content, setContent] = useState('');

  return (
    <MarkdownEditor 
      value={content} 
      onChange={setContent} 
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
```

## Integration

### Parent Components
The `MarkdownEditor` is designed to be used within form components, specifically:
- `AnswerForm.jsx`: Primary usage for instructor answer submission
- Future: Edit forms for revising existing answers

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

### Styling
The component uses inline styles combined with Bootstrap utility classes:
- Flexbox layout for side-by-side panes
- Fixed height (400px) with overflow handling
- Monospace font for editor textarea
- Light gray background for preview pane

## Change Log

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
