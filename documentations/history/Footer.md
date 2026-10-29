# Footer.jsx Documentation

## Purpose

The `Footer.jsx` file implements a comprehensive multi-column responsive footer component for the AzmoonHub Nasir application. It provides users with quick navigation links, brand information, social media connections, and resource access points. The footer features a subtle gradient top border for visual emphasis and uses professional iconography from react-icons.

## Key Components

### Footer Component

```javascript
const Footer = () => {
  const { t } = useTranslation();
  // ...
};
```

A functional React component that renders a 3-column footer layout with localized text content.

**Props:** None

**State Management:**
- Uses `useTranslation()` hook from react-i18next for all text translations

### Column Structure

#### Column 1: Brand Information
- Displays the AzmoonHub Nasir logo (`azHubNasir.png`)
- Shows brand name with primary color styling
- Includes platform description
- Social media links using react-icons:
  - Twitter (`FaTwitter`)
  - LinkedIn (`FaLinkedin`)
  - Instagram (`FaInstagram`)

#### Column 2: Quick Links
- All Courses (`/courses`)
- My Tickets (`/support/tickets`)
- Reports (`/admin/reports`)

#### Column 3: Resources
- FAQ (`/#faq`)
- Documentation (`/documentations`)
- Contact Us (`/support`)

### Styling Features

**Gradient Top Border:**
```jsx
borderTop: '4px solid var(--gradient-primary)'
```

**Hover Effects:**
All links include inline hover handlers that transition colors from `var(--text-secondary)` to `var(--secondary-color)`.

**Responsive Layout:**
- Uses Bootstrap's grid system (`col-md-4`)
- Columns stack vertically on mobile devices (`mb-4 mb-md-0`)

### Copyright Section

A horizontal rule separator followed by centered copyright text at the bottom of the footer.

## Usage

### Import in MainLayout

```javascript
import Footer from './Footer';

const MainLayout = () => {
  return (
    <div className="d-flex flex-column">
      <Navbar />
      <div className="d-flex flex-grow-1">
        {/* Sidebar and main content */}
      </div>
      <Footer />
    </div>
  );
};
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
// Usage: {t('footer.brand_name')}, {t('footer.quick_links_title')}, etc.
```

### react-router-dom Integration

Uses Link component for internal navigation:
```javascript
import { Link } from 'react-router-dom';

<Link to="/courses">{t('footer.all_courses')}</Link>
```

### react-icons Integration

Uses FontAwesome icons via react-icons:
```javascript
import { FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';

<FaTwitter />
```

### Asset Integration

Logo imported from assets directory:
```javascript
import logo from '../assets/azHubNasir.png';

<img src={logo} alt="AzmoonHub Nasir" height="35" />
```

## Styling

### CSS Variables Used

- `--gradient-primary`: Primary gradient for top border
- `--card-background`: Footer background color
- `--primary-color`: Brand name and heading colors
- `--secondary-color`: Social media icons and link hover states
- `--text-secondary`: Default link color
- `--border-color`: Horizontal rule color

### Bootstrap Classes Used

- `mt-auto`: Margin top auto for sticky footer behavior
- `container`: Centered container
- `row`: Flexbox row
- `col-md-4`: 4-column width on medium+ screens
- `mb-4`, `mb-md-0`: Margin bottom utilities
- `d-flex`, `align-items-center`, `gap-3`: Flexbox utilities
- `fw-bold`: Font weight bold
- `text-muted`: Muted text color
- `small`: Small font size
- `text-decoration-none`: Remove underline from links
- `text-md-end`: Text alignment on medium+ screens

## Translation Keys Used

| Key | English | Persian |
|-----|---------|---------|
| `footer.brand_name` | AzmoonHub Nasir | آزمون‌هاب نصیر |
| `footer.description` | The premier platform... | پلتفرم برتر برای یادگیری مشارکتی... |
| `footer.quick_links_title` | Quick Links | لینک‌های سریع |
| `footer.all_courses` | All Courses | همه درس‌ها |
| `footer.my_tickets` | My Tickets | تیکت‌های من |
| `footer.reports` | Reports | گزارش‌ها |
| `footer.resources_title` | Resources | منابع |
| `footer.faq` | FAQ | سوالات متداول |
| `footer.documentation` | Documentation | مستندات |
| `footer.contact_us` | Contact Us | تماس با ما |
| `footer.copyright` | © 2025 AzmoonHub Nasir... | © ۲۰۲۵ آزمون‌هاب نصیر... |

## Expected DOM Structure

```html
<footer style="border-top: 4px solid var(--gradient-primary);">
  <div class="container">
    <div class="row">
      <!-- Column 1: Brand -->
      <div class="col-md-4">
        <div class="d-flex align-items-center">
          <img src="azHubNasir.png" height="35" />
          <span>AzmoonHub Nasir</span>
        </div>
        <p>Platform description...</p>
        <div class="d-flex gap-3">
          <a href="twitter.com"><svg>...</svg></a>
          <a href="linkedin.com"><svg>...</svg></a>
          <a href="instagram.com"><svg>...</svg></a>
        </div>
      </div>
      
      <!-- Column 2: Quick Links -->
      <div class="col-md-4">
        <h6>Quick Links</h6>
        <ul class="list-unstyled">
          <li><a href="/courses">All Courses</a></li>
          <li><a href="/support/tickets">My Tickets</a></li>
          <li><a href="/admin/reports">Reports</a></li>
        </ul>
      </div>
      
      <!-- Column 3: Resources -->
      <div class="col-md-4">
        <h6>Resources</h6>
        <ul class="list-unstyled">
          <li><a href="/#faq">FAQ</a></li>
          <li><a href="/documentations">Documentation</a></li>
          <li><a href="/support">Contact Us</a></li>
        </ul>
      </div>
    </div>
    
    <hr />
    <div class="row">
      <div class="col-12 text-center">
        <p>© 2025 AzmoonHub Nasir. All rights reserved.</p>
      </div>
    </div>
  </div>
</footer>
```

## Dependencies

- **React**: Functional component
- **react-router-dom**: `Link` component for internal navigation
- **react-i18next**: `useTranslation` hook for translations
- **react-icons/fa**: FontAwesome icons (Twitter, LinkedIn, Instagram)
- **Bootstrap**: CSS framework for styling

## Change Log

- **Phase 9 - Initial Implementation**: 
  - Created multi-column responsive footer component
  - Integrated azHubNasir.png logo
  - Added social media links with react-icons
  - Implemented gradient top border styling
  - Added comprehensive translation keys for EN/FA
  - Integrated with MainLayout component
