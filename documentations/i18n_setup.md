# i18n Setup Documentation

## Purpose

This document describes the internationalization (i18n) system implemented in the UniQAKNTU frontend application. The system provides full support for both English (LTR) and Persian/Farsi (RTL) languages using `react-i18next`.

The i18n system enables:
- Dynamic language switching between English and Persian
- Automatic RTL/LTR layout direction switching based on the selected language
- Centralized translation management through JSON files
- Consistent translation keys across all components

---

## Key Components

### 1. i18n Configuration File (`src/i18n.js`)

The main configuration file that initializes i18next with the following features:

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
```

**Configuration Options:**
- **Language Detector**: Automatically detects browser language preference
- **Fallback Language**: English ('en') is used as fallback
- **Detection Order**: localStorage → navigator → htmlTag
- **Caching**: Selected language is cached in localStorage

### 2. Translation Files

#### English (`src/locales/en/translation.json`)
Contains all English translations organized by namespace:
- `app`: Application-level strings (title, welcome, description)
- `nav`: Navigation-related strings (brand, login, logout, welcome)
- `sidebar`: Sidebar navigation items
- `home`: Home page content
- `login`: Login form labels and messages
- `common`: Reusable common strings (loading, error, submit, cancel)
- `pages`: Page titles and headings

#### Persian (`src/locales/fa/translation.json`)
Contains all Persian (Farsi) translations with the same structure as English.

### 3. RTL/LTR Direction Handling (`src/App.jsx`)

The App component handles automatic direction switching:

```javascript
useEffect(() => {
  const handleLanguageChange = (lng) => {
    document.documentElement.dir = lng === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  handleLanguageChange(i18n.language);
  i18n.on('languageChanged', handleLanguageChange);

  return () => {
    i18n.off('languageChanged', handleLanguageChange);
  };
}, []);
```

**How it works:**
1. On initial load, sets the HTML `dir` attribute based on detected language
2. Listens for language change events
3. Updates `dir="rtl"` for Persian and `dir="ltr"` for English
4. Also updates the `lang` attribute for accessibility

### 4. Language Switcher (`src/components/layout/Navbar.jsx`)

A button group in the navbar allows users to switch languages:

```javascript
const handleLanguageChange = (lng) => {
  i18n.changeLanguage(lng);
};
```

**Features:**
- Two buttons: "EN" and "FA"
- Active language is highlighted with different styling
- Calling `i18n.changeLanguage()` triggers:
  - Translation update in all components
  - RTL/LTR direction switch via App.jsx listener
  - Language persistence in localStorage

---

## Usage

### Using Translations in Components

Import the `useTranslation` hook and use the `t()` function:

```javascript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('app.welcome')}</h1>
      <button>{t('common.submit')}</button>
    </div>
  );
};
```

### Adding New Translations

1. **Add keys to both translation files:**

   `src/locales/en/translation.json`:
   ```json
   {
     "my_new_section": {
       "new_key": "English text here"
     }
   }
   ```

   `src/locales/fa/translation.json`:
   ```json
   {
     "my_new_section": {
       "new_key": "متن فارسی اینجا"
     }
   }
   ```

2. **Use the translation key in your component:**
   ```javascript
   {t('my_new_section.new_key')}
   ```

### Best Practices

1. **Always use translation keys** instead of hardcoded strings
2. **Organize keys by feature/component** (e.g., `sidebar.*`, `login.*`)
3. **Keep both language files in sync** - add translations to both EN and FA
4. **Use descriptive key names** that indicate the context
5. **Test both languages** after adding new translations
6. **Verify RTL layout** when adding Persian translations

---

## Integration

### Files Modified/Created for i18n

| File | Purpose |
|------|---------|
| `src/i18n.js` | i18next configuration |
| `src/locales/en/translation.json` | English translations |
| `src/locales/fa/translation.json` | Persian translations |
| `src/App.jsx` | RTL/LTR direction handling |
| `src/components/layout/Navbar.jsx` | Language switcher + translations |
| `src/components/layout/Sidebar.jsx` | Sidebar translations |
| `src/pages/Home.jsx` | Home page translations |
| `src/pages/Login.jsx` | Login page translations |

### Dependencies

Installed via npm:
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

| Package | Purpose |
|---------|---------|
| `i18next` | Core i18n framework |
| `react-i18next` | React bindings for i18next |
| `i18next-browser-languagedetector` | Browser language detection |

---

## Change Log

- **Initial Implementation**: Phase 7 - i18n Localization
  - Created i18n configuration with English and Persian support
  - Implemented RTL/LTR automatic switching
  - Added language switcher to Navbar
  - Refactored existing components (Home, Login, Sidebar, Navbar) to use translations

---

## Testing Checklist

When testing the i18n implementation:

- [ ] Verify English is the default/fallback language
- [ ] Test language switcher (EN ↔ FA) in Navbar
- [ ] Confirm RTL layout activates when Persian is selected
- [ ] Confirm LTR layout activates when English is selected
- [ ] Check that language preference persists after page refresh
- [ ] Verify all translated components display correctly in both languages
- [ ] Test on mobile devices for proper RTL layout rendering

---

## Accessibility Notes

- The `lang` attribute on `<html>` element helps screen readers pronounce content correctly
- RTL layout ensures proper text alignment and reading order for Persian users
- All interactive elements maintain their functionality in both directions
