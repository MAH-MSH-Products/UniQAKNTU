# Home.jsx Documentation

## Purpose

The `Home.jsx` file implements a comprehensive landing page component for the AzmoonHub Nasir application. It serves as the primary entry point for users, showcasing platform features, providing clear calls-to-action, and addressing common user questions through an FAQ section. The component uses modern design patterns with gradient backgrounds, professional iconography, and fully localized content.

## Key Components

### Home Component

```javascript
const Home = () => {
  const { t } = useTranslation();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  // ...
};
```

A functional React component that renders a multi-section landing page with state management for FAQ accordion functionality.

**Props:** None

**State Management:**
- Uses `useTranslation()` hook from react-i18next for all text translations
- Uses `useState` hook to manage FAQ accordion open/closed state

### Section Structure

#### 1. Hero Section

**Purpose:** Create a strong first impression with clear value proposition and primary CTAs.

**Features:**
- Large heading (`hero_title`)
- Descriptive sub-heading (`hero_subtitle`)
- Two CTA buttons:
  - Primary: "Browse Courses" (with gradient background)
  - Secondary: "Sign In" (outline style)

**Styling:**
- Subtle gradient background (`var(--gradient-subtle)`)
- Bottom border for visual separation
- Centered text layout

#### 2. Features Grid Section

**Purpose:** Highlight key platform differentiators in a scannable 3-column layout.

**Features:**
- **Feature 1: MathJax Support**
  - Icon: `FiEdit3`
  - Title: `feature_1_title`
  - Description: `feature_1_description`

- **Feature 2: Verified Answers**
  - Icon: `FiCheckCircle`
  - Title: `feature_2_title`
  - Description: `feature_2_description`

- **Feature 3: PDF Attachments**
  - Icon: `FiFileText`
  - Title: `feature_3_title`
  - Description: `feature_3_description`

**Styling:**
- Uses `academic-card` utility class
- Icons styled with secondary color
- Responsive grid layout (`col-md-4`)

#### 3. CTA Banner Section

**Purpose:** Encourage instructor sign-ups with a prominent call-to-action.

**Features:**
- Full-width banner with gradient background
- Title: `cta_title`
- Subtitle: `cta_subtitle`
- Button linking to `/support` (Role Request page)

**Styling:**
- Primary gradient background (`var(--gradient-primary)`)
- White text for contrast
- Rounded corners (`borderRadius: '8px'`)

#### 4. FAQ Section

**Purpose:** Address common user questions to reduce support burden.

**Features:**
- 4 static FAQs managed via state
- Custom accordion implementation
- Questions/Answers sourced from translation files

**FAQ Topics:**
1. How to become a verified instructor
2. How to write mathematical formulas
3. Uploading solution documents
4. Reporting content errors

**Styling:**
- Uses Bootstrap accordion structure
- Custom styling to match academic theme
- Gradient background on active items

## Usage

### Route Configuration

```javascript
// In App.jsx
import Home from './pages/Home';

<Route path="/" element={<Home />} />
```

### Bootstrap CSS Requirement

Ensure Bootstrap CSS is imported (handled in component):
```javascript
import 'bootstrap/dist/css/bootstrap.min.css';
```

## Integration Points

### i18n Integration

Uses react-i18next for internationalization:
```javascript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
// Usage: {t('home.hero_title')}, {t('home.feature_1_title')}, etc.
```

### react-router-dom Integration

Uses Link component for navigation:
```javascript
import { Link } from 'react-router-dom';

<Link to="/courses">{t('home.browse_courses')}</Link>
<Link to="/login">{t('home.sign_in')}</Link>
<Link to="/support">{t('home.cta_button')}</Link>
```

### react-icons Integration

Uses Feather icons via react-icons:
```javascript
import { FiCheckCircle, FiFileText, FiEdit3, FiChevronDown } from 'react-icons/fi';

<FiEdit3 />  // MathJax feature
<FiCheckCircle />  // Verified answers feature
<FiFileText />  // PDF attachments feature
```

## Styling

### CSS Variables Used

- `--gradient-primary`: Primary gradient for CTA banner and buttons
- `--gradient-subtle`: Subtle gradient for hero section and FAQ active states
- `--primary-color`: Headings and text colors
- `--secondary-color`: Icon colors and accent elements
- `--border-color`: Section separators
- `--card-background`: Card backgrounds
- `--text-muted`: Secondary text

### Bootstrap Classes Used

- `container-fluid`, `container`: Layout containers
- `py-5`, `mb-5`: Padding/margin utilities
- `row`, `col-lg-8`, `col-md-4`: Grid system
- `justify-content-center`, `text-center`: Flexbox alignment
- `display-4`, `fw-bold`, `lead`: Typography
- `d-flex`, `gap-3`, `flex-wrap`: Flexbox utilities
- `btn-primary`, `btn-outline-secondary`, `btn-lg`: Button styles
- `academic-card`: Custom card utility class
- `accordion`, `accordion-item`, `accordion-button`, `accordion-body`: Accordion components
- `text-muted`, `text-white`: Text colors

## Translation Keys Used

| Key | English | Persian |
|-----|---------|---------|
| `home.hero_title` | Your Gateway to Academic Excellence | دروازه شما به تعالی تحصیلی |
| `home.hero_subtitle` | Access verified exam solutions... | دسترسی به راه‌حل‌های امتحانی تایید شده... |
| `home.features_title` | Why Choose AzmoonHub Nasir? | چرا آزمون‌هاب نصیر را انتخاب کنید؟ |
| `home.feature_1_title` | MathJax Support | پشتیبانی از MathJax |
| `home.feature_1_description` | Write and render complex... | فرمول‌های ریاضی پیچیده را با دقت... |
| `home.feature_2_title` | Verified Answers | پاسخ‌های تایید شده |
| `home.feature_2_description` | All solutions are provided... | تمامی راه‌حل‌ها توسط اساتید... |
| `home.feature_3_title` | PDF Attachments | پیوست‌های PDF |
| `home.feature_3_description` | Upload and access detailed... | فایل‌های PDF و تصاویر راه‌حل‌ها... |
| `home.cta_title` | Join Our Instructors Community | به جامعه اساتید ما بپیوندید |
| `home.cta_subtitle` | Become a verified contributor... | به عنوان یک مدرس تایید شده شوید... |
| `home.cta_button` | Request Instructor Role | درخواست نقش استادی |
| `home.faq_title` | Frequently Asked Questions | سوالات متداول |
| `home.faq_1_question` | How do I become a verified instructor? | چگونه می‌توانم به یک استاد تایید شده تبدیل شوم؟ |
| `home.faq_1_answer` | Submit a role request... | یک درخواست نقش از طریق مرکز پشتیبانی... |
| `home.faq_2_question` | How can I write mathematical formulas? | چگونه می‌توانم فرمول‌های ریاضی بنویسم؟ |
| `home.faq_2_answer` | Our platform supports MathJax syntax... | پلتفرم ما از نحو MathJax پشتیبانی می‌کند... |
| `home.faq_3_question` | Can I upload solution documents? | آیا می‌توانم اسناد راه‌حل آپلود کنم؟ |
| `home.faq_3_answer` | Yes! Verified instructors can attach... | بله! اساتید تایید شده می‌توانند... |
| `home.faq_4_question` | What if I find an error in an answer? | اگر خطایی در یک پاسخ پیدا کنم چه کار کنم؟ |
| `home.faq_4_answer` | Use the Content Report feature... | از ویژگی گزارش محتوا استفاده کنید... |

## Expected DOM Structure

```html
<div class="container-fluid">
  <!-- Hero Section -->
  <section style="background: var(--gradient-subtle);">
    <div class="container">
      <div class="row justify-content-center text-center">
        <div class="col-lg-8">
          <h1>Your Gateway to Academic Excellence</h1>
          <p class="lead">Access verified exam solutions...</p>
          <div class="d-flex gap-3">
            <a href="/courses" class="btn btn-primary btn-lg">Browse Courses</a>
            <a href="/login" class="btn btn-outline-secondary btn-lg">Sign In</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="container">
    <h2>Why Choose AzmoonHub Nasir?</h2>
    <div class="row g-4">
      <div class="col-md-4">
        <div class="academic-card">
          <div><svg><!-- Edit3 icon --></svg></div>
          <h5>MathJax Support</h5>
          <p>Write and render complex...</p>
        </div>
      </div>
      <!-- Additional feature columns -->
    </div>
  </section>

  <!-- CTA Banner -->
  <section class="container" style="background: var(--gradient-primary);">
    <div class="row align-items-center">
      <div class="col-md-8 text-white">
        <h3>Join Our Instructors Community</h3>
        <p>Become a verified contributor...</p>
      </div>
      <div class="col-md-4">
        <a href="/support" class="btn btn-light btn-lg">Request Instructor Role</a>
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section id="faq" class="container">
    <h2>Frequently Asked Questions</h2>
    <div class="col-lg-8">
      <div class="accordion">
        <div class="accordion-item academic-card">
          <h2 class="accordion-header">
            <button class="accordion-button">How do I become a verified instructor?</button>
          </h2>
          <div class="accordion-collapse collapse show">
            <div class="accordion-body">Submit a role request...</div>
          </div>
        </div>
        <!-- Additional FAQ items -->
      </div>
    </div>
  </section>
</div>
```

## Dependencies

- **React**: Functional component with hooks
- **react-router-dom**: `Link` component for navigation
- **react-i18next**: `useTranslation` hook for translations
- **react-icons/fi**: Feather icons for feature illustrations
- **Bootstrap**: CSS framework for styling and responsive layout

## State Management

### FAQ Accordion State

```javascript
const [openFaqIndex, setOpenFaqIndex] = useState(0);
```

**Behavior:**
- Tracks which FAQ item is currently expanded
- Clicking an already-open FAQ closes it (sets to `-1`)
- Clicking a closed FAQ opens it and closes others

**Toggle Logic:**
```javascript
onClick={() => setOpenFaqIndex(openFaqIndex === index ? -1 : index)}
```

## Change Log

- **Phase 9 - Initial Implementation**:
  - Completely redesigned landing page from basic welcome message
  - Added Hero section with gradient background and dual CTAs
  - Implemented 3-column Features grid with react-icons
  - Created CTA banner with gradient background
  - Built custom FAQ accordion with state management
  - Integrated comprehensive translation keys for EN/FA
  - Applied academic-card styling throughout
  - Ensured professional appearance with no emojis
