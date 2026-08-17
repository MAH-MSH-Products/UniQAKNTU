# UniQAKNTU: Instructor-Led Exam Q&A Platform

<div align="center">
  <img src="documentations/imgs/djangoReact.png" alt="Django and React Integration" width="600"/>
</div>

## Overview
UniQAKNTU is a collaborative, instructor-led web application engineered to archive, manage, and crowdsource verified solutions for university examinations. Designed with a strict Role-Based Access Control (RBAC) architecture, the system isolates student read-only privileges from instructor write privileges, ensuring high academic integrity.

The platform has transitioned from a monolithic architecture to a Decoupled Monorepo, separating the robust Django REST API backend from the highly interactive React Single Page Application (SPA) frontend.

## System Architecture

<div align="center">
  <img src="documentations/imgs/architecture.jpg" alt="System Architecture Diagram" width="800"/>
</div>

The system operates on a decoupled client-server model:
* **Backend:** A Pure REST API built with Django REST Framework (DRF), managing database models, RBAC validation, file storage (PDF/Images), and system audit logs via `django-simple-history`.
* **Frontend:** A modern React application handling complex UI states, Markdown/MathJax rendering, and API consumption with JWT/Session authentication logic.

## Key Features
* **Decoupled Architecture:** Full separation of Backend (Django REST API) and Frontend (React/Vite).
* **Role-Based Access Control (RBAC):** Strict permission checks differentiating standard users (Students) and verified contributors (Instructors).
* **Multi-Answer Solutions:** Instructors can provide independent, version-controlled solutions using combinations of Markdown text, MathJax formulas, and direct file uploads (Images/PDFs).
* **Integrated Support System:** A built-in ticketing mechanism for role requests, platform support, and content error reporting.
* **Audit Trails:** Complete logging of administrative actions and database modifications.

## Project Structure

```text
UniQAKNTU/
│
├── backend/                  # Django REST Framework Backend
│   ├── apps/
│   │   ├── accounts/         # RBAC, User Models, Role Requests
│   │   ├── curriculum/       # Course and Exam Hierarchy Models
│   │   ├── wiki/             # Question, Answer, and Revision Models
│   │   └── support/          # Ticketing and Content Report Models
│   ├── config/               # Core Django Settings & API Routing
│   ├── media/                # Uploaded Assets (PDFs, Images)
│   ├── manage.py
│   └── requirements.txt      # Python Dependencies
│
├── frontend/                 # React SPA Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable UI (Navbar, Editor, Cards)
│   │   ├── context/          # Global Auth & Role State Management
│   │   ├── pages/            # View Components (Dashboards, ExamDetails)
│   │   └── App.jsx           # Main Router
│   ├── package.json          # Node Dependencies
│   └── vite.config.js        # Build Configuration
│
└── documentations/           # File-Centric Technical Documentation
    ├── imgs/                 # Architecture and Stack Diagrams
    └── ...
```

## Setup & Installation

### 1. Backend Setup (Django)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup (React)
```bash
cd frontend
npm install
npm run dev
```

## Development Team
* **Supervising Professor:** Dr. Hamed Khanmirza
* **Frontend Developer:** Mohammad Amin Haji Alirezaei
* **Backend Developer:** Mohammad Sajjad Hamidifard