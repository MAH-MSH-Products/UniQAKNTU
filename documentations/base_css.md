# base.css Documentation

## Purpose
This file contains the custom CSS styles for the UniQAKNTU platform. It extends Bootstrap 5 with project-specific styling to create a cohesive, professional educational interface optimized for displaying mathematical content and exam Q&A.

## Key Components

### CSS Custom Properties (Variables)
Defined in `:root` for consistent theming across the application:
- `--primary-color`: #2c3e50 (Dark blue-gray for navbar and headers)
- `--secondary-color`: #3498db (Bright blue for primary actions)
- `--accent-color`: #e74c3c (Red for alerts and important elements)
- `--light-bg`: #f8f9fa (Light gray background)
- `--border-color`: #dee2e6 (Subtle borders)
- `--text-dark`: #212529 (Primary text color)
- `--text-muted`: #6c757d (Secondary text color)

### Global Reset
- Removes default margins and padding
- Applies `box-sizing: border-box` for predictable layout calculations
- Sets base typography with Segoe UI font family
- Establishes comfortable line-height (1.6) for readability

### Navigation Styles
- **Navbar**: Fixed dark background with increased padding for spacious feel
- **Brand**: Bold, large font (1.5rem) for clear identification
- Responsive adjustments for mobile viewports

### Layout Components
- **Container Fluid**: Generous horizontal padding (2rem) for content breathing room
- **Sidebar**: White background with right border, full viewport height minus navbar
  - Used for course/exam navigation hierarchy
  - Collapses on mobile devices

### UI Components
- **Cards**: Subtle border, rounded corners (0.5rem), soft shadow for depth
- **Buttons**: Custom primary button styling with hover state transition
- **File Upload Areas**: Dashed border with hover effect for drag-and-drop UX
  - Smooth color transition on hover
  - Centered text alignment

### MathJax Integration
- `.mathjax-preview`: Dedicated class for formula preview areas
  - White background with border
  - Proper spacing and rounded corners

### Responsive Design
Breakpoint at 768px (tablet/mobile):
- Sidebar converts from vertical to horizontal layout
- Border changes from right-side to bottom-side
- Navbar padding reduces for compact mobile header

## Usage

### Including in Templates
```django
{% load static %}
<link rel="stylesheet" href="{% static 'css/base.css' %}">
```

### Using CSS Variables
```css
.button {
    background-color: var(--secondary-color);
    color: white;
}
```

### File Upload Area Example
```html
<div class="file-upload-area">
    <p>Drag and drop files here or click to browse</p>
</div>
```

### MathJax Preview Example
```html
<div class="mathjax-preview">
    $$E = mc^2$$
</div>
```

## Integration

### Dependencies
- **Bootstrap 5.3.2**: This CSS builds upon Bootstrap's foundation
- Loaded after Bootstrap CSS in `base.html` to ensure proper cascade

### Related Files
- `templates/base.html`: Includes this stylesheet via `{% static %}` tag
- `static/js/utils.js`: JavaScript that may dynamically apply these classes
- `config/settings.py`: STATICFILES_DIRS configuration must include the static directory

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS custom properties require ES6+ browser support
- Fallback colors can be added for legacy browser support if needed

## Change Log

### Phase 1 - Frontend Infrastructure (Current)
- Initial creation of comprehensive base stylesheet
- Defined CSS custom properties for consistent theming
- Implemented responsive sidebar layout for course navigation
- Added specialized styles for file upload interfaces
- Created MathJax preview component styling
- Established mobile-first responsive breakpoints
