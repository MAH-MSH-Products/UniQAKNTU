# UniQAKNTU - Open Exam Wiki

## Overview
UniQAKNTU is a collaborative web application designed to manage, archive, and provide instructor-led solutions for university course exams. The system features a scalable architecture with strict Role-Based Access Control (RBAC) to ensure answer quality and integrity.

The application strictly separates Backend and Frontend components, prioritizing functional execution, system logic, and database versioning over monolithic design.

## Features
* **Instructor-Led Solutions & Role-Based Access Control:** Verified instructors can post and edit their own isolated answers. Students have Read-Only access to view solutions.
* **Multi-Answer System:** Multiple instructors can provide different solutions to the same question, similar to StackOverflow.
* **Revision History:** Full tracking of answer modifications via `AnswerRevision` to maintain data integrity and enable personal revision history for each instructor's answer.
* **Markdown & MathJax Integration:** Native rendering of code snippets, algorithms, and mathematical formulas.
* **Modular Architecture:** Segregated Django Apps (`accounts`, `curriculum`, `wiki`) for clear responsibility boundaries.
* **Bulk Answer Upload:** Instructors can submit answers for an entire exam at once through a dedicated dashboard.
* **Role Request System:** Students can request to be upgraded to instructor status through an admin-approved workflow.

## Technology Stack
* **Backend:** Python 3, Django
* **Frontend:** HTML5, CSS (Bootstrap 5 / Tailwind), JavaScript
* **Text Processing:** MarkdownX / EasyMDE, MathJax

## Project Structure
```text
UniQAKNTU/
├── config/                 # Core Django configuration (settings, wsgi, asgi)
├── apps/                   # Django applications directory
│   ├── accounts/           # Custom User model with RBAC fields and RoleRequest
│   ├── curriculum/         # Course and Exam models
│   └── wiki/               # Question, Answer (multi-answer), and AnswerRevision models
├── templates/              # HTML templates (base and app-specific)
├── static/                 # Static assets (CSS, JS, Images)
└── media/                  # User-uploaded files (e.g., question images)
```

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MAH-MSH-Products/UniQAKNTU.git
   cd UniQAKNTU
   ```

2. **Set up the virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Apply database migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create a superuser for administration:**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

## Development Team & Credits

* **Supervising Professor:** Dr. Hamed Khanmirza
* **Core Developers:**
    * Mohammad Amin Haji Alirezaei
    * Mohammad Sajjad Hamidifard
