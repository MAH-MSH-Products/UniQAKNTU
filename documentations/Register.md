# Register.jsx Documentation

## Purpose
The `Register.jsx` file implements the user registration page for the AzmoonHub Nasir platform. It provides a modern, gradient-based UI that matches the aesthetic of the Login page. It captures new user details (username, email, password) and performs client-side validation before attempting registration.

## Key Components
- **Register Component**: A functional React component serving as the standalone registration page.
- **Form State**: Manages `username`, `email`, `password`, and `confirmPassword` using a consolidated state object.
- **Client-Side Validation**: Ensures that the `password` and `confirmPassword` fields match before submission.
- **i18n Integration**: Utilizes `useTranslation` from `react-i18next` for internationalized text rendering.

## Usage
This component is used as a standalone page route (without `MainLayout`) in `App.jsx`:
```javascript
<Route element="{<Register" path="/register"/>} />

```

## Integration

* **react-router-dom**: Uses `Link` for navigation to the login page and `useNavigate` for redirecting the user upon successful registration.
* **react-icons**: Uses `FiUser`, `FiMail`, and `FiLock` for input field iconography.
* **CSS Classes**: Relies on the same global authentication utility classes defined in `index.css` (e.g., `.auth-container`, `.auth-box`, `.auth-input-group`).
* ⚠️ **باید چک شود (Pending Integration)**: The current `handleSubmit` function logs the payload to the console and simulates a network delay. Once the Backend Authentication API is fully developed to accept new registrations, the mock API call must be replaced with the actual `api.post('/auth/register/', formData)` request.
