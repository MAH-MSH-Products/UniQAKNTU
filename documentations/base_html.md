# base.html Documentation

## Purpose
This file serves as the base template for all pages in the UniQAKNTU platform. It provides a consistent layout structure including navigation, footer, and common assets (CSS/JS) that are shared across the entire application.

## Key Components

### HTML Structure
- **DOCTYPE declaration**: HTML5 standard
- **Language attribute**: Set to English (`lang="en"`)
- **Viewport meta tag**: Ensures responsive design on mobile devices
- **Title block**: Dynamic title with default "UniQAKNTU"

### CSS Resources
1. **Bootstrap 5.3.2 CDN**: Primary CSS framework for responsive design and components
2. **Custom CSS (`static/css/base.css`)**: Project-specific styles including:
   - Color variables (primary, secondary, accent colors)
   - Navigation styling
   - Sidebar layout for course navigation
   - Card components
   - File upload area styling
   - Responsive breakpoints
3. **MathJax CDN**: For rendering LaTeX mathematical formulas in questions and answers

### Navigation Bar
- **Brand**: Links to home page ("/")
- **Menu Items**:
  - Home: Main landing page
  - Admin Panel: Django admin interface ("/admin/")
- **User Authentication State**:
  - Shows username when logged in
  - Displays "Instructor" badge if `user.is_instructor` is True (RBAC indicator)
  - Login/Logout links based on authentication state

### Main Content Area
- **Messages Framework**: Displays Django success/error messages using Bootstrap alerts
- **Content Block**: Template inheritance point for page-specific content

### Footer
- Copyright notice with dynamic year
- Platform identification

### JavaScript Resources
1. **Bootstrap 5.3.2 Bundle JS**: Includes Popper.js for dropdowns and modals
2. **Custom Utilities (`static/js/utils.js`)**: Provides:
   - CSRF token handling for AJAX requests
   - `apiRequest()` wrapper function for fetch API
   - FormData helper for file uploads
   - MathJax typesetting utilities
   - Toast notification system
   - DOM ready helper

## Usage

### Template Inheritance
All other templates should extend this base template:

```django
{% extends 'base.html' %}

{% block title %}Page Title{% endblock %}

{% block content %}
    <!-- Page-specific content -->
{% endblock %}

{% block extra_css %}
    <!-- Additional CSS specific to this page -->
{% endblock %}

{% block extra_js %}
    <!-- Additional JavaScript specific to this page -->
{% endblock %}
```

### Static Files Loading
The template uses Django's `{% load static %}` tag to serve custom CSS and JS files from the `static/` directory. Ensure `STATIC_URL` and `STATICFILES_DIRS` are properly configured in `settings.py`.

### MathJax Integration
Mathematical formulas can be written using LaTeX syntax:
- Inline: `$...$` or `\(...\)`
- Display: `$$...$$` or `\[...\]`

MathJax automatically renders these on page load. For dynamically loaded content, call `typesetMathJax(element)` from `utils.js`.

## Integration

### Dependencies
- **Bootstrap 5.3.2**: Loaded via CDN for consistency and ease of setup
- **MathJax 3**: Loaded via CDN for mathematical formula rendering
- **Django Contrib Messages**: Used for displaying flash messages

### Related Files
- `static/css/base.css`: Custom styles referenced in this template
- `static/js/utils.js`: JavaScript utilities referenced in this template
- `config/settings.py`: Contains STATIC_URL, STATICFILES_DIRS, MEDIA_URL configurations

## Change Log

### Phase 1 - Frontend Infrastructure (Current)
- Added `{% load static %}` tag for static file serving
- Integrated `static/css/base.css` for custom styling
- Integrated `static/js/utils.js` for AJAX and MathJax utilities
- Updated navigation to show Instructor badge for RBAC visualization
- Changed hardcoded URLs from template tags to direct paths for flexibility
- Enhanced navbar with role-based display
