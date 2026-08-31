# UniQAKNTU (AzmoonHub Nasir): Instructor-Led Exam Q&A Platform

<div align="center">
  <img src="documentations/imgs/djangoReact.png" alt="Django and React Integration" width="700"/>
</div>

## Overview

**UniQAKNTU** (also known as *AzmoonHub Nasir*) is a modern, crowdsourced open exam wiki and collaborative learning platform engineered specifically for university examinations at K. N. Toosi University of Technology. The platform bridges the gap between students and educators by providing a centralized repository for verified exam solutions, past papers, and structured academic discussions.

Designed with a strict **Role-Based Access Control (RBAC)** architecture, the system safely isolates student contribution workflows from instructor and administrative approvals, maintaining uncompromised academic integrity. The project features a fully decoupled monorepo architecture uniting a high-performance Django REST Framework backend with a responsive, internationalized React Single Page Application (SPA) frontend supporting both English (LTR) and Persian/Farsi (RTL) localization.

---

## System Architecture

<div align="center">
  <img src="documentations/imgs/architecture.jpg" alt="System Architecture Diagram" width="850"/>
</div>

The system operates on a robust, decoupled client-server model:
* **Backend (Django REST Framework):** Manages relational data models (PostgreSQL), high-speed caching/session workflows (Redis), strict RBAC permission classes, secure JWT authentication with token rotation, file handling for image/PDF attachments, and comprehensive audit trails.
* **Frontend (React & Vite):** Delivers a fluid user experience featuring a real-time Markdown/MathJax editor, dual Dark/Light mode styling inspired by modern enterprise design patterns, and state-managed API consumption.

---

## Key Features & Visual Walkthrough

### 1. Onboarding, Authentication & Profile Management
The platform features secure user registration enforced by automatic 6-digit OTP email verification. It includes brute-force protection (temporary 15-minute IP/Username lockouts after consecutive failed attempts), secure password resets, email change verification flows, and customizable user profiles.

<div align="center">
  <img src="documentations/imgs/1.png" alt="Authentication and Onboarding Flow" width="750"/>
</div>

### 2. Course & Source Material Explorer
Exams and study materials are organized cleanly into source materials, complete with downloadable official exam papers and solution PDFs, year indexing, and quick navigation into question explorers.

<div align="center">
  <img src="documentations/imgs/2.png" alt="Source Materials & Course Explorer" width="750"/>
</div>

### 3. Advanced Q&A Wiki with MathJax & Attachments
Questions and answers support rich-text Markdown formatting integrated with **MathJax** rendering (enabling inline `$E = mc^2$` and block equations). Users can drag and drop images or PDFs directly into the editor utilizing an advanced *Orphan Claiming* pattern (uploading assets first, then binding them upon submission). 

<div align="center">
  <img src="documentations/imgs/3.png" alt="Question and Answer Detail View with MathJax" width="750"/>
</div>

### 4. Integrated Support Center & Ticketing
A robust built-in support module lets users raise tickets across categories (General Support, Technical Issues, Content Errors, and Instructor Role Requests with resume/qualification inputs). Users can track ticket statuses, view chronological responses, and communicate directly with administrators.

<div align="center">
  <img src="documentations/imgs/4.png" alt="Support Center and Ticketing System" width="750"/>
</div>

### 5. Admin Support Panel & Content Moderation
Moderators and administrators have a dedicated management interface to review pending questions, pending answers, suggested wiki edits, and user content reports. Admins can instantly approve or reject submissions, modify user roles, and update ticket statuses.

<div align="center">
  <img src="documentations/imgs/5.png" alt="Admin Support and Moderation Panel" width="750"/>
</div>

### 6. Dynamic Dark/Light Mode & Instructor Dashboards
UniQAKNTU features an adaptive theme toggle (Dark/Light mode) with fully inverted high-contrast greyscale palettes for reduced eye strain. Instructors and moderators also gain access to custom dashboards tracking total answers, upvotes, and accepted solutions.

<div align="center">
  <img src="documentations/imgs/6.png" alt="Instructor Dashboard and Dark Mode" width="750"/>
</div>

---

## Project Structure

```text
UniQAKNTU/
│
├── backend/                  # Django REST Framework Backend
│   ├── apps/
│   │   ├── accounts/         # RBAC, User Models, OTP, Role Requests
│   │   ├── curriculum/       # Course, Source Material, and Exam Hierarchy
│   │   ├── wiki/             # Questions, Answers, Comments, and Voting
│   │   └── support/          # Ticketing, Content Reports, and Suggested Edits
│   ├── config/               # Core Django Settings & API URL Routing
│   ├── media/                # Server Storage for Uploaded PDFs and Images
│   ├── manage.py
│   └── requirements.txt      # Python Dependencies
│
├── frontend/                 # React SPA Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable UI (Navbar, MarkdownEditor, Cards)
│   │   ├── context/          # Global Auth (JWT) & Source Material State
│   │   ├── pages/            # View Containers (Dashboards, Auth, Profiles)
│   │   ├── locales/          # i18n Translation Files (English & Persian)
│   │   └── App.jsx           # Main Router Configuration
│   ├── package.json          # Node Dependencies
│   └── vite.config.js        # Vite Build & Proxy Configuration
│
└── documentations/           # File-Centric Technical Documentation
    ├── imgs/                 # Architecture, Flow, and UI Screenshots (1-6.png)
    └── ...

```

---

## Setup & Installation

### Prerequisites

* Python 3.10+
* Node.js & npm
* PostgreSQL & Redis

### 1. Backend Setup (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

```

### 2. Frontend Setup (React)

```bash
cd frontend
npm install
npm run dev

```

---

## Development Team & Acknowledgments

* **Supervising Professor:** Dr. Hamed Khanmirza
* **Frontend Developer:** Mohammad Amin Haji Alirezaei
* **Backend Developer:** Mohammad Sajjad Hamidifard
* **Institution:** K. N. Toosi University of Technology

---

