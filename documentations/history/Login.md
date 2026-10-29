# Login.jsx Documentation

## Purpose

The `Login.jsx` file implements a modern, full-screen gradient-based authentication page for the AzmoonHub Nasir application. It provides a visually appealing login interface with centered layout, avatar icon, minimalist input fields, and prominent call-to-action button. The component uses react-i18next for internationalization (English/Persian) and integrates with AuthContext for authentication state management.

## Key Components

### Login Component

```javascript
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  // ...
};
```

A functional React component that renders a gradient-based login form with state management for form inputs and authentication status.

**Props:** None

**State Management:**
- Uses `useTranslation()` hook from react-i18next for all text translations
- Uses `useState` hooks for username, password, rememberMe, error, and loading states
- Uses `useAuth()` context for authentication logic
- Uses `useNavigate()` for programmatic navigation

### Visual Structure

#### 1. Auth Container
- Full-screen gradient background using `--auth-gradient` CSS variable
- Centered content layout using flexbox
- Takes up 100vh height

#### 2. Auth Box
- Glassmorphism effect with semi-transparent background
- Backdrop blur filter for modern appearance
- Rounded corners (16px border-radius)
- Maximum width of 420px
- Subtle border and shadow effects

#### 3. Avatar Icon
- Circular container with user icon
- Uses `FiUser` from react-icons/fi
- White color on semi-transparent background
- 80x80 pixels size

#### 4. Input Fields
- Minimalist design with bottom border only
- Transparent background
- Icons inside input line (FiMail for username, FiLock for password)
- White text color for contrast
- Focus state highlights border to white

#### 5. Options Row
- "Remember me" checkbox on left
- "Forgot Password?" link on right
- Semi-transparent white text

#### 6. Submit Button
- Wide, solid dark blue button
- Hover effect with lift animation
- Loading spinner during submission

#### 7. Footer Link
- Registration prompt with link to `/register`
- Centered alignment

## Usage

### Route Configuration

```javascript
// In App.jsx
import Login from './pages/Login';

<Route path="/login" element={<Login />} />
```

### CSS Requirements

Ensure `index.css` contains the auth-related styles:
```css
.auth-container { /* Full-screen gradient */ }
.auth-box { /* Glassmorphism card */ }
.auth-avatar { /* Circular icon container */ }
.auth-input-group { /* Input wrapper */ }
.auth-button { /* Submit button */ }
```

## Integration Points

### i18n Integration

Uses react-i18next for internationalization:
```javascript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
// Usage: {t('login.title_short')}, {t('login.username')}, etc.
```

### AuthContext Integration

Uses AuthContext for authentication logic:
```javascript
import { useAuth } from '../context/AuthContext';

const { login, isAuthenticated } = useAuth();
const result = await login(username, password);
```

### react-router-dom Integration

Uses navigation and Link components:
```javascript
import { useNavigate, Link } from 'react-router-dom';

const navigate = useNavigate();
navigate('/'); // After successful login
<Link to="/register">Register here</Link>
<Link to="/forgot-password">Forgot Password?</Link>
```

### react-icons Integration

Uses Feather icons via react-icons:
```javascript
import { FiUser, FiMail, FiLock, FiCheck } from 'react-icons/fi';

<FiUser />  // Avatar icon
<FiMail />  // Username input icon
<FiLock />  // Password input icon
```

## Styling

### CSS Variables Used

- `--auth-gradient`: Primary gradient for background (linear-gradient 135deg, #4A90E2 to #003366)
- `--primary-color`: Dark blue for button background
- `--transition`: Smooth transition for hover effects

### Custom CSS Classes

| Class | Purpose |
|-------|---------|
| `.auth-container` | Full-screen gradient background wrapper |
| `.auth-box` | Glassmorphism card container |
| `.auth-avatar` | Circular user icon container |
| `.auth-title` | Page title styling |
| `.auth-input-group` | Input field wrapper with icon |
| `.auth-input-icon` | Absolute positioned input icon |
| `.auth-input` | Minimalist input field |
| `.auth-options` | Remember me & forgot password row |
| `.auth-checkbox` | Checkbox label styling |
| `.auth-link` | Link styling |
| `.auth-button` | Submit button |
| `.auth-footer` | Footer text with registration link |
| `.auth-error` | Error message display |

## Translation Keys Used

| Key | English | Persian |
|-----|---------|---------|
| `login.title_short` | LOGIN | ورود |
| `login.username` | Username or Email | نام کاربری یا ایمیل |
| `login.password` | Password | رمز عبور |
| `login.logging_in` | Logging in... | در حال ورود... |
| `login.login_button` | LOGIN | ورود |
| `login.remember_me` | Remember me | مرا به خاطر بسپار |
| `login.forgot_password` | Forgot Password? | رمز عبور را فراموش کرده‌اید؟ |
| `nav.dont_have_account` | Don't have an account? | حساب کاربری ندارید؟ |
| `nav.register_here` | Register here | اینجا ثبت‌نام کنید |

## Expected DOM Structure

```html
<div class="auth-container">
  <div class="auth-box">
    <div class="auth-avatar">
      <svg><!-- User icon --></svg>
    </div>
    
    <h1 class="auth-title">LOGIN</h1>
    
    <div class="auth-error" role="alert">Error message</div>
    
    <form>
      <div class="auth-input-group">
        <svg class="auth-input-icon"><!-- Mail icon --></svg>
        <input class="auth-input" placeholder="Username or Email" />
      </div>
      
      <div class="auth-input-group">
        <svg class="auth-input-icon"><!-- Lock icon --></svg>
        <input class="auth-input" placeholder="Password" type="password" />
      </div>
      
      <div class="auth-options">
        <label class="auth-checkbox">
          <input type="checkbox" />
          Remember me
        </label>
        <a href="/forgot-password" class="auth-link">Forgot Password?</a>
      </div>
      
      <button class="auth-button" type="submit">LOGIN</button>
    </form>
    
    <div class="auth-footer">
      Don't have an account? <a href="/register">Register here</a>
    </div>
  </div>
</div>
```

## Dependencies

- **React**: Functional component with hooks (useState)
- **react-router-dom**: `useNavigate`, `Link` components
- **react-i18next**: `useTranslation` hook for translations
- **react-icons/fi**: Feather icons (FiUser, FiMail, FiLock, FiCheck)
- **Bootstrap**: CSS framework (imported but minimal usage)
- **AuthContext**: Custom context for authentication state

## Authentication Flow

1. User enters username/email and password
2. Clicks LOGIN button
3. `handleSubmit` is called:
   - Prevents default form submission
   - Clears any previous errors
   - Sets loading state to true
   - Calls `login(username, password)` from AuthContext
   - On success: navigates to home page (`/`)
   - On failure: displays error message
   - Sets loading state to false
4. If already authenticated, redirects to home immediately

## Change Log

- **Phase 10 - Complete Redesign**:
  - Completely redesigned from Bootstrap card layout to modern gradient UI
  - Added full-screen gradient background (--auth-gradient)
  - Implemented glassmorphism auth-box with backdrop blur
  - Added circular avatar icon with FiUser
  - Changed inputs to minimalist bottom-border style
  - Integrated icons inside input fields
  - Added "Remember me" checkbox option
  - Added "Forgot Password?" link
  - Updated all text to use translation keys
  - Applied new CSS classes (.auth-container, .auth-box, etc.)
  - Maintained AuthContext integration for login logic
