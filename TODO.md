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