# utils.js Documentation

## Purpose
This file provides essential JavaScript utility functions for the UniQAKNTU frontend. It handles AJAX communication with the Django backend, CSRF token management, MathJax integration, and UI helper functions to streamline frontend development.

## Key Components

### CSRF Token Management

#### `getCookie(name)`
Retrieves a cookie value by name from `document.cookie`.

**Parameters:**
- `name` (string): The name of the cookie to retrieve

**Returns:**
- `string|null`: The decoded cookie value or null if not found

**Usage:**
```javascript
const csrftoken = getCookie('csrftoken');
```

#### `csrftoken`
Module-level constant that stores the CSRF token retrieved from cookies. Used automatically by `apiRequest()` for secure POST/PUT/DELETE requests.

### AJAX Communication

#### `apiRequest(url, method, data, isFormData)`
A wrapper around the Fetch API that handles CSRF tokens, content-type headers, and error handling.

**Parameters:**
- `url` (string): The endpoint URL
- `method` (string, optional): HTTP method (default: 'GET')
- `data` (object|FormData, optional): Request payload
- `isFormData` (boolean, optional): Set to true for multipart/form-data uploads (default: false)

**Returns:**
- `Promise<object|string>`: Parsed JSON response or plain text

**Error Handling:**
- 403: Throws "Forbidden" error (RBAC violation)
- 404: Throws "Resource not found" error
- Other: Throws generic HTTP error with status code

**Usage (JSON):**
```javascript
const response = await apiRequest('/api/v1/questions/1/answers/', 'GET');
```

**Usage (File Upload):**
```javascript
const formData = createFormData({
    current_body: markdownText,
    image: fileInput.files[0],
    pdf_file: pdfFile
});
const response = await apiRequest('/api/v1/questions/1/answers/', 'POST', formData, true);
```

### FormData Helper

#### `createFormData(formDataObj)`
Converts a plain JavaScript object into a FormData instance for file uploads.

**Parameters:**
- `formDataObj` (object): Key-value pairs to convert

**Returns:**
- `FormData`: Ready-to-use FormData object

**Usage:**
```javascript
const formData = createFormData({
    title: 'Exam 1',
    year: 2024
});
```

### MathJax Integration

#### `typesetMathJax(element)`
Triggers MathJax to render LaTeX formulas in the specified element or entire document.

**Parameters:**
- `element` (HTMLElement|null, optional): Specific DOM element to typeset. If null, typesets entire document.

**Usage:**
```javascript
// Typeset entire document
typesetMathJax();

// Typeset specific element after AJAX load
const answerContainer = document.getElementById('answer-123');
typesetMathJax(answerContainer);
```

### DOM Utilities

#### `onDOMReady(callback)`
Executes a callback function when the DOM is fully loaded.

**Parameters:**
- `callback` (function): Function to execute when DOM is ready

**Usage:**
```javascript
onDOMReady(() => {
    console.log('DOM is ready!');
    initializeEditor();
});
```

### UI Notifications

#### `showToast(message, type)`
Displays a Bootstrap toast notification that auto-dismisses after 5 seconds.

**Parameters:**
- `message` (string): Notification text
- `type` (string, optional): Alert type - 'success', 'danger', 'warning', 'info' (default: 'info')

**Usage:**
```javascript
showToast('Answer submitted successfully!', 'success');
showToast('Permission denied. Instructor access required.', 'danger');
```

#### `createToastContainer()`
Creates a fixed-position container for toast notifications in the top-right corner.

**Returns:**
- `HTMLElement`: The created container element

**Internal Use:**
Automatically called by `showToast()` if no container exists.

## Usage

### Including in Templates
```django
{% load static %}
<script src="{% static 'js/utils.js' %}"></script>
```

### Module Export
The utilities are exported for use in module-based systems:
```javascript
const { apiRequest, showToast, typesetMathJax } = require('./utils');
```

### Complete Example: Answer Submission
```javascript
async function submitAnswer(questionId, markdownText, imageFile) {
    try {
        const formData = createFormData({
            current_body: markdownText,
            image: imageFile
        });
        
        const response = await apiRequest(
            `/api/v1/questions/${questionId}/answers/`,
            'POST',
            formData,
            true // isFormData = true for file upload
        );
        
        showToast('Answer submitted successfully!', 'success');
        typesetMathJax(); // Render any math formulas in the new answer
        
    } catch (error) {
        showToast(error.message, 'danger');
    }
}
```

## Integration

### Dependencies
- **Bootstrap 5**: Required for toast notifications (`alert` classes, `btn-close`)
- **MathJax 3**: Required for `typesetMathJax()` functionality
- **Django**: Expected CSRF cookie name is 'csrftoken'

### Related Files
- `templates/base.html`: Includes this script globally
- `static/css/base.css`: Styles for toast container positioning
- `apps/wiki/views.py`: Backend views that handle API requests made by these utilities

### Security Considerations
- CSRF token is automatically included in all non-GET requests
- Token is retrieved from cookies (Django's CSRF protection mechanism)
- File uploads use FormData to properly handle multipart encoding

## Change Log

### Phase 1 - Frontend Infrastructure (Current)
- Initial creation of comprehensive utility library
- Implemented CSRF-aware AJAX wrapper with error handling
- Added FormData helper for file upload support
- Integrated MathJax typesetting for dynamic content
- Created toast notification system for user feedback
- Added DOM ready helper for safe initialization
- Exported functions for module-based usage
