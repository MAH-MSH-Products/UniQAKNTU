# UniQAKNTU - Open Exam Wiki

## Overview
UniQAKNTU is a collaborative, wiki-style web application designed to manage, archive, and crowdsource solutions for university course exams. The system is currently targeted towards the Operating Systems course but features a scalable architecture designed to support multiple disciplines.

The application strictly separates Backend and Frontend components, prioritizing functional execution, system logic, and database versioning over monolithic design.

## Features
* **Wiki-Style Collaboration:** Authenticated users can write, update, and refine exam answers.
* **Revision History:** Full tracking of answer modifications via `AnswerRevision` to maintain data integrity and enable rollback capabilities.
* **Markdown & MathJax Integration:** Native rendering of code snippets, algorithms, and mathematical formulas.
* **Modular Architecture:** Segregated Django Apps (`accounts`, `curriculum`, `wiki`) for clear responsibility boundaries.
* **Role-Based Access:** Admin panel for Question/Exam entry, user-facing interfaces for Answer contributions.

## Technology Stack
* **Backend:** Python 3, Django
* **Frontend:** HTML5, CSS (Bootstrap 5 / Tailwind), JavaScript
* **Text Processing:** MarkdownX / EasyMDE, MathJax

## Project Structure
```text
UniQAKNTU/
├── config/                 # Core Django configuration (settings, wsgi, asgi)
├── apps/                   # Django applications directory
│   ├── accounts/           # Custom User model and authentication logic
│   ├── curriculum/         # Course and Exam models
│   └── wiki/               # Question, Answer, and AnswerRevision models
├── templates/              # HTML templates (base and app-specific)
├── static/                 # Static assets (CSS, JS, Images)
└── media/                  # User-uploaded files (e.g., question images)
```

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/UniQAKNTU.git
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