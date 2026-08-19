# TODO - UniQAKNTU Project Tasks (React + Django REST Architecture)

## Overview
This document outlines the strict task distribution for the UniQAKNTU Open Exam Wiki project. 
The architecture has been migrated to a Decoupled Monorepo (Django REST API backend + React frontend) with a new Support/Ticketing system.
Frontend: Mohammad Amin Haji Alirezaei | Backend: Mohammad Sajjad Hamidifard.

## Phase 1: Architecture Decoupling & Foundation [Completed]
- [x] **[Both]** Split repository into `backend/` and `frontend/` directories.
- [x] **[Backend - MohammadSajjad]** Update `requirements.txt` with `djangorestframework`, `django-cors-headers`, and `django-simple-history`.
- [x] **[Frontend - Mohammad Amin]** Initialize React project (Vite/CRA) in the `frontend/` directory.
    - **Implementation Date**: August 2026
    - **Tech Stack**: Vite + React 19
    - **Documentation**: `documentations/frontend-setup.md`
    - **Verification**: ✅ Complete - Vite project scaffolded with React template, dependencies installed successfully

## Phase 2: Database Models & Support System Setup
**Goal:** Establish the backend schema for the new support system and configure audit logging.
- [ ] **[Backend - MohammadSajjad]** Configure DRF and CORS in `backend/config/settings.py` to allow requests from the React development server.
- [ ] **[Backend - MohammadSajjad]** Create the `support` app with the following models:
    - `Ticket`: fields (`user`, `title`, `description`, `status` [Open/In-progress/Closed], `category` [Role Request/Error Report/General Support], `created_at`).
    - `TicketReply`: fields (`ticket`, `user`, `message`, `created_at`).
    - `Report`: fields (`user`, `question` [FK], `answer` [FK, optional], `reason`, `status`).
- [ ] **[Backend - MohammadSajjad]** Register `django-simple-history` on `User`, `RoleRequest`, `Ticket`, and `Report` models to maintain strict audit trails in Django Admin.
- [ ] **[Backend - MohammadSajjad]** Update Django Admin panels to display Inline replies for Tickets and Reports.

## Phase 3: Core REST API Refactoring
**Goal:** Convert all existing Django Views to pure JSON REST API endpoints.
- [ ] **[Backend - MohammadSajjad]** `Auth API`: Implement Token-based or JWT authentication endpoints (`/api/v1/auth/login/`, `/api/v1/auth/user/` for fetching `is_instructor` and `is_staff` status).
- [ ] **[Backend - MohammadSajjad]** `Exam & Question API`: Endpoints to fetch Course lists, Exam details, and Question lists.
- [ ] **[Backend - MohammadSajjad]** `Answer API`: `GET` endpoint must return an array of instructor answers. `POST / PUT` endpoints must accept `multipart/form-data` to support `image` and `pdf_file` uploads. Strictly enforce `is_instructor` RBAC.
- [ ] **[Backend - MohammadSajjad]** `Support API`: Endpoints for users to submit Tickets/Reports, and endpoints for Admins to fetch and reply to them.

## Phase 4: React Frontend Foundation & Auth
**Goal:** Set up the React application routing, state management, and API integration.
- [ ] **[Frontend - Mohammad Amin]** Install base dependencies: `axios`, `react-router-dom`, and styling framework (Tailwind/Bootstrap).
- [ ] **[Frontend - Mohammad Amin]** Setup `axios` interceptors to automatically attach the Auth token to headers and handle 401 Unauthorized responses.
- [ ] **[Frontend - Mohammad Amin]** Implement `AuthContext` to manage the user session and role-based UI rendering (e.g., hiding the "Upload Answer" button if `!user.is_instructor`).
- [ ] **[Frontend - Mohammad Amin]** Build Base Layout components (Navbar, Sidebar for Course/Exam navigation).

## Phase 5: UI Implementation - Multi-Answer & Editor
**Goal:** Build the core Q&A interfaces.
- [ ] **[Frontend - Mohammad Amin]** `QuestionExplorer`: Render a list of Questions for a selected Exam.
- [ ] **[Frontend - Mohammad Amin]** `AnswerCard`: For each Question, render the array of answers. Support displaying Markdown text, rendering MathJax, and providing links to the uploaded PDFs/Images.
- [ ] **[Frontend - Mohammad Amin]** `MarkdownEditor`: Integrate `EasyMDE` (or similar) combined with live MathJax rendering for instructors to write/edit answers. Ensure the form supports file attachments (PDF/Image) via `FormData`.

## Phase 6: UI Implementation - Support & Admin Dashboards
**Goal:** Build the interface for the ticketing and reporting system.
- [ ] **[Frontend - Mohammad Amin]** `SupportCenter`: Page for standard users to submit Tickets (including Role Requests with introductions) and view the status of their past tickets.
- [ ] **[Frontend - Mohammad Amin]** `ContentReportModal`: A modal on every Question/Answer allowing users to quickly report content errors.
- [ ] **[Frontend - Mohammad Amin]** `AdminSupportPanel`: A dedicated React dashboard strictly for `is_staff=True`. Needs a data grid to list all active tickets, role requests, and reports, allowing admins to open a ticket, read the history, and submit a `TicketReply` directly.



## Phase 7: i18n Localization (Persian/English Support) ✅ Complete
**Goal:** Implement a fully scalable, client-side translation system to support English and Persian (RTL/LTR) directly within React using `react-i18next`.
- [x] **[Frontend - Mohammad Amin]** Install dependencies: `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
    - **Implementation Date**: Phase 7
    - **Tech Stack**: i18next ecosystem
    - **Documentation**: `documentations/i18n_setup.md`
    - **Verification**: ✅ Complete - Dependencies installed successfully via npm
- [x] **[Frontend - Mohammad Amin]** Initialize `i18n.js` config file and structure `src/locales/en/translation.json` and `src/locales/fa/translation.json`.
    - **Implementation Date**: Phase 7
    - **Documentation**: `documentations/i18n_setup.md`
    - **Verification**: ✅ Complete - i18n.js created with browser language detector, both translation JSON files populated with comprehensive translations
- [x] **[Frontend - Mohammad Amin]** Update `App.jsx` and `index.html` logic to dynamically toggle the HTML `dir` attribute (`ltr`/`rtl`) based on the active language.
    - **Implementation Date**: Phase 7
    - **Documentation**: `documentations/i18n_setup.md`, `documentations/App.md` (if exists)
    - **Verification**: ✅ Complete - useEffect hook in App.jsx handles RTL/LTR switching automatically
- [x] **[Frontend - Mohammad Amin]** Update `Navbar.jsx` to include a dynamic Language Switcher button (EN/FA).
    - **Implementation Date**: Phase 7
    - **Documentation**: `documentations/Navbar.md`
    - **Verification**: ✅ Complete - Button group added to Navbar with EN/FA toggle functionality
- [x] **[Frontend - Mohammad Amin]** Refactor Phase 4 and Phase 5 components (`Sidebar`, `Home`, `Login`, `AnswerForm`, `QuestionExplorer`) by replacing hardcoded strings with the `useTranslation()` hook.
    - **Implementation Date**: Phase 7
    - **Documentation**: `documentations/Sidebar.md`, `documentations/Home.md` (if exists), `documentations/Login.md` (if exists)
    - **Verification**: ✅ Complete - Sidebar.jsx, Home.jsx, Login.jsx, Navbar.jsx all refactored to use useTranslation()
- [x] **[Frontend - Mohammad Amin]** Add `documentations/i18n_setup.md` detailing the localization structure and how to add new keys.
    - **Implementation Date**: Phase 7
    - **Documentation**: `documentations/i18n_setup.md`
    - **Verification**: ✅ Complete - Comprehensive documentation created with usage examples and best practices

## Phase 8: Rebranding, UI/UX Overhaul & Dynamic Widgets
**Goal:** Rebrand the platform to "AzmoonHub Nasir", overhaul the UI/UX with a professional academic theme (removing emojis, improving tabs/cards), and add dynamic side widgets for recent/popular content.

### Backend Tasks (MohammadSajjad)
- [ ] **[Backend]** Global Rebranding: Search and replace all instances of "UniQAKNTU" with "AzmoonHub Nasir" across all documentation files (`README.md`, `API.md`, `RULES.md`, `AGENT_CONSTRAINTS.md`) and Django config files (e.g., `settings.py`).
- [ ] **[Backend]** `Widgets API`: Implement new REST endpoints to supply data for the dynamic side panels:
    - `GET /api/v1/widgets/recent-answers/`: Returns the top 5-10 most recently added instructor answers.
    - `GET /api/v1/widgets/popular-courses/`: Returns the top courses based on the number of exams/questions available.
    - `GET /api/v1/widgets/latest-exams/`: Returns the most recently added exams.
- [ ] **[Backend]** Update `API.md`: Document the newly created `Widgets API` endpoints with their expected JSON response structures.

### Frontend Tasks (Mohammad Amin)
- [ ] **[Frontend]** Rebranding & Logo Integration: Update `frontend/index.html` (title tag), update `translation.json` files to replace old names, and modify `Navbar.jsx` to render the official logo from `frontend/src/assets/` instead of plain text.
- [ ] **[Frontend]** Professional Iconography: Completely remove all emojis (e.g., 📚, 🎫, ⚠️) from `Sidebar.jsx`, `MainLayout.jsx`, and other UI elements. Install and integrate a professional icon library (like `react-icons` or `bootstrap-icons`) and replace them with standard SVG icons.
- [ ] **[Frontend]** Color Palette & Styling Overhaul: Update `frontend/src/index.css` and `frontend/src/App.css`:
    - Apply a professional academic color scheme (e.g., Deep Blue for primary, Cyan/Teal for secondary, and a Light Gray `#f4f5f7` for the main background).
    - Apply consistent structural styling: Add `border: 1px solid #e0e0e0`, `border-radius`, and soft `box-shadow` on hover to all `Card` components to create a clean, separated box-layout.
- [ ] **[Frontend]** Tabs UI Refactor: Redesign tabbed interfaces (e.g., inside `SupportCenter` or `QuestionExplorer`) to mimic modern, professional standards (like Coursera). Active tabs should have a distinct bottom border and bold text, rather than pill/button shapes.
- [ ] **[Frontend]** `WidgetsPanel` Component: Build a new UI component (`frontend/src/components/layout/WidgetsPanel.jsx`) that sits on the side (in desktop view) or bottom (in mobile view) of the layout.
- [ ] **[Frontend]** Widget Integration: Connect `WidgetsPanel.jsx` to the new Backend APIs using `axios`, displaying clean lists of "Recent Answers", "Popular Courses", and "Latest Exams".
- [ ] **[Frontend]** Documentation: Update all affected `.md` files in the `documentations/` directory to reflect the new brand name, new components (`WidgetsPanel.md`), and updated UI logic.

## Phase 9: Landing Page Customization & UI Polish
**Goal:** Enhance the home page with modern landing page sections (Hero, Features, CTA, FAQ), implement a comprehensive multi-column footer, apply subtle gradients, and configure a sticky navbar with the custom brand logo.

### Frontend Tasks (Mohammad Amin)
- [ ] **[Frontend]** Logo Integration & Sticky Navbar: 
    - Replace the placeholder logo or text in `Navbar.jsx` and `Footer.jsx` with the actual `assets/azHubNasir.png` image.
    - Make the Navbar sticky (`position: sticky` or `fixed-top`) and add a scroll-triggered drop-shadow effect to keep navigation accessible.
- [ ] **[Frontend]** Global Gradients & Polish: 
    - Update `index.css` to include subtle gradient variables (e.g., mixing primary Deep Blue with secondary Teal).
    - Apply these gradients to primary buttons, CTA banners, and the top border/background of the footer to eliminate a flat, monotonous look.
- [ ] **[Frontend]** Revamp `Home.jsx` (Landing Page):
    - **Hero Section:** Upgrade the top banner with an engaging gradient and clear call-to-action buttons.
    - **Features Section:** Add a 3-4 column grid highlighting platform features (e.g., MathJax Support, Verified Instructor Answers, PDF Uploads).
    - **CTA Banner:** Implement a full-width call-to-action banner prompting users to "Join the Instructors" linking to the Role Request page.
    - **FAQ Accordion:** Build a Frequently Asked Questions section using Bootstrap's accordion component for static Q&A (e.g., "How to get verified?", "How to write Math formulas?").
- [ ] **[Frontend]** Implement `Footer.jsx`: 
    - Create a dedicated multi-column footer component to replace the basic one in `MainLayout.jsx`.
    - **Column 1 (Brand):** Logo (`azHubNasir.png`), brief platform description, and `react-icons` for social media links.
    - **Column 2 (Quick Links):** Links to All Courses, My Tickets, and Reports.
    - **Column 3 (Resources):** Links to Contact Us, FAQ, and Documentation/Terms.

## Phase 10: Landing Page Customization, Auth Redesign & Advanced UI
**Goal:** Redesign the Home page (Hero, Features, FAQ), implement a completely new and modern Login/Register interface based on provided mockups, apply advanced CSS gradients, and configure the custom logo across the application.

### Frontend Tasks (Mohammad Amin)
- [ ] **[Frontend]** Logo Integration & Fallback: Replace the placeholder `assets/logo.svg` with the newly provided `assets/azHubNasir.png`. Ensure it is scaled properly in the `Navbar` and `Footer`.
- [ ] **[Frontend]** Advanced CSS Gradients & Polish: Update `index.css` to include sophisticated gradients (e.g., mixing primary and secondary colors) to remove the flat/monotonous look across Hero sections, CTA buttons, and Auth screens.
- [ ] **[Frontend]** Revamp `Home.jsx` (Landing Page):
    - **Hero Section:** Build a large, centered hero section with a subtle background image/gradient, a strong hook ("Boost your learning today"), and an eye-catching CTA button (e.g., "Getting Started").
    - **Features Grid:** Implement a clean grid highlighting platform features (MathJax, PDFs, Verified Instructors).
    - **FAQ Section:** Implement a highly polished Accordion-style FAQ section matching the provided reference design (centered title, clear open/close toggles, thin borders).
- [ ] **[Frontend]** Auth Pages Redesign (`Login.jsx` & `Register.jsx`):
    - Completely redesign the Authentication pages to match the provided modern, full-screen, gradient-based UI mockup.
    - Include a centered user avatar icon, clear input fields with placeholder icons (email, password), a "Remember me" checkbox, and a prominent "LOGIN / REGISTER" button.
- [ ] **[Frontend]** Documentation Update: Update or create `.md` files for `Home.md`, `Login.md`, `Register.md`, and `Navbar.md` reflecting these UI changes and noting the new layout structures.