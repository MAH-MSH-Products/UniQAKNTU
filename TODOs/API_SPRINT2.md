# API_SPRINT2.md: Frontend Implementation Guide for Phase 2

## Overview
This sprint introduces four major epics to the UniQAKNTU platform:
1. **Marketplace (Packages):** Monetization mechanism allowing Instructors (Moderators/Admins) to sell bundled content.
2. **Gamification (Reward Tokens):** A token-based economy rewarding users for approved contributions.
3. **Custom Exam Builder:** A tool to cherry-pick questions from various source materials and compile them into custom mock exams.
4. **AI Integration:** Embedding AI endpoints into the editor and question views for automated answering and content improvement.

Ensure all new features strictly adhere to our existing Decoupled Architecture, i18n localization, Dark/Light mode variables, and `AuthContext` for RBAC.

---

## Epic 1: Premium Packages & Marketplace

### UI/UX Requirements
*   **Sidebar & Routing:** Add `Store/Marketplace` and `My Purchases` to `Sidebar.jsx`.
*   **Package Explorer (`/packages`):** Create a grid view similar to `SourceMaterialsList.jsx` to display available packages. Each card must show Title, Description, Instructor Name, Token Price, and a "Buy" button.
*   **Package Creation (Instructors Only):** Create a form (`PackageForm.jsx`) accessible only via `RequireInstructor`. It should allow instructors to bundle multiple `SourceMaterial` IDs into one package and set a token price.
*   **Purchase Flow:** Implement a confirmation modal. If the user's token balance is insufficient, display a specific error and disable the purchase.

### API Contracts
*   **`GET /api/packages/`**: List all active packages.
*   **`POST /api/packages/`**: [Instructor Only] Create a package.
    *   *Payload:* `{ title: string, description: string, price: integer, source_material_ids: integer[] }`
*   **`POST /api/packages/{id}/purchase/`**: Buy a package using tokens.
*   **`GET /api/users/me/purchases/`**: List packages owned by the current user.

---

## Epic 2: Gamification & Reward Tokens

### UI/UX Requirements
*   **Navbar Integration:** Update `Navbar.jsx` to display the user's current token balance (e.g., 🪙 150) next to the user profile dropdown. Fetch this from the updated `AuthContext` -> `user.tokens`.
*   **Profile Section:** Add a "Wallet / Rewards" tab in `Profile.jsx` showing the history of earned/spent tokens.
*   **Toast Notifications:** When a user creates a Question or Answer and it gets approved (via websocket or upon next login/fetch), trigger a success toast: *"Your answer was approved! +10 Tokens earned."*

### API Contracts
*   **`GET /api/auth/me/` (Updated):** Backend will now return a new field `"tokens": integer`. Update the `AuthContext` to store and expose this value.
*   **`GET /api/users/me/token-history/`**: Returns a paginated list of token transactions (amount, reason, date).

---

## Epic 3: Custom Exam Builder

### UI/UX Requirements
*   **"Add to Exam" Action:** In `QuestionExplorer.jsx` and `QuestionDetail.jsx`, add a new button (e.g., `FiPlusSquare`) to the action row of each question.
*   **Shopping Cart Pattern:** Clicking "Add to Exam" should add the question to a local state "Exam Cart" (consider creating a `CustomExamContext`). Show a floating badge indicating the number of selected questions.
*   **Custom Exam Builder (`/custom-exams/build`):** A page where users can reorder selected questions, assign a title to the new exam, and save it.
*   **My Exams Dashboard (`/custom-exams`):** List all custom exams created by the user. Clicking one opens an interface to take the exam or view questions and official answers in sequence.

### API Contracts
*   **`POST /api/custom-exams/`**: Save a new custom exam.
    *   *Payload:* `{ title: string, question_ids: integer[] }`
*   **`GET /api/custom-exams/`**: List user's custom exams.
*   **`GET /api/custom-exams/{id}/`**: Retrieve full details of the custom exam (including nested questions).

---

## Epic 4: AI Integration & Tooling

### UI/UX Requirements
*   **AI Auto-Answer:** In `QuestionDetail.jsx`, add an "Ask AI" button (visible only if no official answer exists or as a premium feature costing tokens). It should render a streaming or loading state until the AI generates an answer.
*   **Markdown Editor Assistant:** In `MarkdownEditor.jsx`, add an "Improve with AI" (Sparkles icon) button. 
    *   *Action:* Takes the current raw text, sends it to the API, and replaces it with a grammatically corrected or better-formatted Markdown/MathJax version.
*   **AI Disclaimer:** Any AI-generated content must have a small badge (`AI Generated`) when rendered to maintain academic transparency.

### API Contracts
*   **`POST /api/ai/generate-answer/`**: Generates an answer based on a question.
    *   *Payload:* `{ question_id: integer }`
    *   *Response:* `{ text: string, cost_in_tokens: integer }`
*   **`POST /api/ai/improve-text/`**: Enhances raw markdown formatting.
    *   *Payload:* `{ text: string }`
    *   *Response:* `{ improved_text: string }`

---

## Execution Constraints & Checklist for Frontend
- [ ] **State Management:** Implement `CustomExamContext` for building exams without hammering the backend on every selection.
- [ ] **API Service:** Add all new endpoints to `src/services/api.js`.
- [ ] **i18n:** Add new translation keys for *Tokens*, *Packages*, *Store*, *Custom Exam*, and *AI Assistant* in both `en` and `fa` locale files.
- [ ] **Error Handling:** Ensure `getErrorMessage` utility catches insufficient token errors (e.g., `402 Payment Required` or `400 Bad Request` with specific error codes).
- [ ] **Dark Mode:** Ensure the new AI gradients and Token icons have proper contrast in `[data-theme="dark"]` within `index.css`.