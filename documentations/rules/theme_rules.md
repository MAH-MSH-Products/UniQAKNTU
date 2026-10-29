# UniQAKNTU Theme & Styling Architecture Rules

## 1. Executive Summary & Purpose
This document establishes the official Design System, Multi-Theme Color Architecture, and Typography standards for the **UniQAKNTU (AzmoonHub Nasir)** platform. Adherence to these rules is mandatory for all frontend contributors and AI agents to ensure visual consistency, accessibility (WCAG AA), responsive fluid adaptation, and seamless RTL/LTR bi-directional compatibility.

---

## 2. Typography System & Local Font Integration

### 2.1 Local Sovereign Font Assets (`frontend/src/assets/fonts/`)
To guarantee high performance, eliminate CDN vulnerabilities, and support offline/intranet university campus deployments, all fonts are hosted locally:

```
frontend/src/assets/fonts/
├── iranyekan-regular.woff   # Primary body font (Weight: 400)
├── iranyekan-medium.woff    # Interactive/Navigation font (Weight: 500)
├── iranyekan-bold.woff      # Headings & Emphasis font (Weight: 700)
└── cube.woff                # Specialized display / geometric / icon glyph font
```

### 2.2 Font Declarations (`frontend/src/index.css`)
Fonts are registered with `font-display: swap` to prevent Flash of Invisible Text (FOIT):

```css
@font-face {
  font-family: 'IRANYekan';
  src: url('./assets/fonts/iranyekan-regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'IRANYekan';
  src: url('./assets/fonts/iranyekan-medium.woff') format('woff');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'IRANYekan';
  src: url('./assets/fonts/iranyekan-bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'CubeDisplay';
  src: url('./assets/fonts/cube.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

### 2.3 Font Family Stacks & Usage Rules
* **Primary System Stack**:
  ```css
  --font-primary: 'IRANYekan', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  ```
* **Persian Text (RTL)**:
  - Must render using `IRANYekan`.
  - Body text: `400` (Regular) with `line-height: 1.6` - `1.7`.
  - Interactive controls / Badges: `500` (Medium).
  - Headings (`h1` - `h6`): `700` (Bold) with `line-height: 1.3` - `1.4`.
* **Technical English Terms**:
  - Academic & domain terms (e.g., *Markdown*, *MathJax*, *Context*, *Token*, *API*) embedded within Persian sentences must automatically fall back to clean sans-serif system glyphs without font distortion.
* **Mathematical & Scientific Content**:
  - Rendered via **MathJax 3** SVG output (`tex-svg.js`) configured in `index.html`. Formulas must inherit surrounding baseline font size and dynamic theme colors.
* **Code Blocks & Monospace**:
  - `font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;` with high contrast against the theme background.

---

## 3. Multi-Theme Color Architecture

UniQAKNTU implements a dynamic theme tokens system driven by CSS Custom Properties on the root `<html>` element. The application supports **Light Mode** (default daily academic reading) and **Dark Mode** (reduced eye fatigue, high contrast).

### 3.1 Design Tokens Specification

| Token | Light Theme (`:root`) | Dark Theme (`[data-theme="dark"]`) | Role & Intent |
| :--- | :--- | :--- | :--- |
| `--bg-body` | `#F4F5F7` | `#121212` | Viewport & page canvas background |
| `--bg-card` | `#FFFFFF` | `#1E1E1E` | Elevated surface (Cards, Modals, Panels) |
| `--bg-input` | `#FFFFFF` | `#2A2B2D` | Form inputs, dropdowns, and textareas |
| `--bg-hover` | `#E9ECEF` | `#2C2D30` | Interactive item hover/active background |
| `--text-main` | `#212529` | `#E4E6EB` | High-contrast primary typography |
| `--text-muted` | `#6C757D` | `#B0B3B8` | Secondary labels, captions, metadata |
| `--text-inverse` | `#FFFFFF` | `#121212` | Inverted text for solid primary buttons |
| `--border-color` | `#DEE2E6` | `#3A3B3C` | Subtle dividers and card perimeter borders |
| `--border-dark` | `#CED4DA` | `#4E4F50` | Input borders and prominent borders |
| `--shadow-sm` | `0 2px 4px rgba(0,0,0,0.04)` | `0 2px 6px rgba(0,0,0,0.4)` | Subtle elevation shadow |
| `--shadow-md` | `0 6px 12px rgba(0,0,0,0.08)` | `0 8px 16px rgba(0,0,0,0.6)` | Modals, floating elements, hovered cards |
| `--primary-blue` | `#0A95FF` | `#3B82F6` | Primary action buttons, brand focus |
| `--primary-hover` | `#0074CC` | `#60A5FA` | Primary element hover state |
| `--accent-orange` | `#F48024` | `#F97316` | StackOverflow-style accent, active indicator |
| `--nav-bg` | `#FFFFFF` | `#18191A` | Fixed top navigation bar |
| `--sidebar-bg` | `#F8F9FA` | `#18191A` | Secondary navigation drawer / sidebar |
| `--nav-border` | `#DEE2E6` | `#3A3B3C` | Header/Sidebar separation border |
| `--footer-bg` | `#18191A` | `#18191A` | Platform footer background |
| `--footer-text` | `#B0B3B8` | `#B0B3B8` | Platform footer body text |
| `--footer-border` | `#3A3B3C` | `#3A3B3C` | Platform footer divider border |

### 3.2 Brand Asset Palette Integration
The project assets directory (`frontend/src/assets/`) contains dual brand logos for flexible theme rendering:
* `azHubNasir.png` / `azHubNasir-Orange.png`: Standard brand logo featuring the Nasir orange accent.
* `azHubNasir-blue.png` / `azHubNasir-wide-blue.png`: Blue variant suited for high-clarity or inverted contexts.
* Deep Ocean Blue (`#023E8A`) and Vibrant Turquoise (`#00B4D8`) form the foundation of brand graphics and hero banners.

### 3.3 Theme Hydration & Reactivity Cycle
```
[User Action / OS Preference]
             │
             ▼
[Navbar.jsx Theme Toggle] ──► Updates localStorage('theme')
             │
             ▼
[HTML Root Attribute] ──────► document.documentElement.setAttribute('data-theme', theme)
             │
             ▼
[CSS Cascade Engine] ──────► Instant token re-evaluation without page reload
```

---

## 4. Universal Spacing System (8px Baseline Grid)

To eliminate visual dissonance and ensure strict mathematical rhythm, all padding, margins, and layout dimensions must be multiples of **0.5rem (8px)**:

```css
--space-xs:  0.25rem;  /* 4px  - micro gaps, badge padding */
--space-sm:  0.5rem;   /* 8px  - tight padding, list gaps */
--space-md:  1.0rem;   /* 16px - standard card inner padding, form gaps */
--space-lg:  1.5rem;   /* 24px - section gaps, card gutters */
--space-xl:  2.0rem;   /* 32px - container padding, large headers */
--space-2xl: 3.0rem;   /* 48px - hero sections, page vertical dividers */
--space-3xl: 4.0rem;   /* 64px - major section boundaries */
```

### Strict Spacing Directives:
* **NO Magic Numbers**: Hardcoded pixel values such as `margin: 17px;` or `padding: 13px;` are strictly rejected in PR review.
* **Gap over Margin**: Prefer CSS Flexbox and Grid `gap` properties (e.g., `gap: var(--space-md);` or Bootstrap `gap-3`) to avoid margin-collapse bugs.

---

## 5. Logical Properties & Bi-directional (RTL/LTR) Rules

UniQAKNTU supports both Persian (RTL) and English (LTR). To avoid duplicate style sheets or broken layouts, physical directional properties are strictly prohibited.

### 5.1 Mapping Table

| Physical Property (❌ Forbidden) | Logical Property (✅ Required) | Bootstrap 5 Logical Class |
| :--- | :--- | :--- |
| `margin-left` | `margin-inline-start` | `ms-*` |
| `margin-right` | `margin-inline-end` | `me-*` |
| `padding-left` | `padding-inline-start` | `ps-*` |
| `padding-right` | `padding-inline-end` | `pe-*` |
| `left: 0;` | `inset-inline-start: 0;` | `start-0` |
| `right: 0;` | `inset-inline-end: 0;` | `end-0` |
| `text-align: left;` | `text-align: start;` | `text-start` |
| `text-align: right;` | `text-align: end;` | `text-end` |
| `border-left` | `border-inline-start` | `border-start` |
| `border-right` | `border-inline-end` | `border-end` |

---

## 6. Micro-Interactions, Elevation & Motion Guidelines

### 6.1 Transition Baseline
All interactive elements (buttons, links, navigation tabs, cards) share a unified easing function:
```css
--transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
```

### 6.2 Elevation & Lift Hover Effect
Cards, academic question boxes, and interactive list items must provide visual feedback upon hover:
```css
.card:hover,
.academic-card:hover,
.list-group-item:hover,
.widget-item:hover {
  border-color: var(--accent-orange) !important;
  /* Top accent indicator + elevation shadow */
  box-shadow: inset 0 3px 0 0 var(--accent-orange), var(--shadow-md) !important;
  transform: translateY(-3px);
  z-index: 2;
}
```

### 6.3 RTL-Aware Directional Highlights
Dropdown items and navigation highlights must respect reading direction:
```css
/* LTR Indicator */
.dropdown-item:hover {
  background-color: var(--bg-hover) !important;
  color: var(--accent-orange) !important;
  box-shadow: inset 3px 0 0 0 var(--accent-orange) !important;
  transform: translateX(-2px);
}

/* RTL Inversion */
html[dir="rtl"] .dropdown-item:hover {
  box-shadow: inset -3px 0 0 0 var(--accent-orange) !important;
  transform: translateX(2px);
}
```

---

## 7. Quality Assurance & Verification Checklist

Before submitting code affecting the UI:
1. [ ] **Theme Switch Test**: Does the component look readable in both Light (`:root`) and Dark (`[data-theme="dark"]`) modes?
2. [ ] **No Hardcoded Hex Colors in JSX**: Are all colors referencing CSS variables (`var(--...)`) or Bootstrap semantic classes?
3. [ ] **Typography Compliance**: Is `IRANYekan` applied for Persian text and are technical terms rendering cleanly?
4. [ ] **Bi-directional Verification**: Did you toggle between Persian (RTL) and English (LTR) to ensure no flipped alignment or clipping occurs?
5. [ ] **Spacing Grid Compliance**: Are all margins and paddings using the 8px grid tokens (`--space-*`)?
