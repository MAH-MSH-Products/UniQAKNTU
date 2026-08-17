# Frontend Setup Documentation

## Purpose
This document describes the React frontend application setup for the UniQAKNTU project. The frontend is a Single Page Application (SPA) built with Vite and React, designed to consume the Django REST API backend. It provides the user interface for students and instructors to interact with the exam Q&A platform.

## Key Components

### Project Structure
```
frontend/
├── public/              # Static assets served directly
├── src/
│   ├── assets/         # Images, fonts, and other imported assets
│   ├── components/     # Reusable UI components (to be created)
│   ├── context/        # React Context providers for global state (to be created)
│   ├── pages/          # Page-level components/views (to be created)
│   ├── App.jsx         # Main application component with routing
│   ├── App.css         # Application-specific styles
│   ├── index.css       # Global styles
│   └── main.jsx        # Application entry point
├── index.html          # HTML template
├── package.json        # Node.js dependencies and scripts
├── vite.config.js      # Vite build configuration
└── README.md           # Vite-generated readme
```

### Dependencies

#### Production Dependencies
- **react** (^19.2.8): Core React library for building UI components
- **react-dom** (^19.2.8): React DOM rendering engine

#### Development Dependencies
- **vite** (^8.2.0): Fast build tool and development server
- **@vitejs/plugin-react** (^6.0.4): Vite plugin for React JSX support
- **@types/react** (^19.2.17): TypeScript types for React
- **@types/react-dom** (^19.2.3): TypeScript types for React DOM
- **oxlint** (^1.75.0): JavaScript/TypeScript linter

### Build Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start development server with hot module replacement |
| `build` | `vite build` | Create production build in `dist/` directory |
| `preview` | `vite preview` | Preview production build locally |
| `lint` | `oxlint` | Run linting on source files |

## Usage

### Development Mode
To start the development server:
```bash
cd frontend
npm install          # Install dependencies (first time only)
npm run dev         # Start development server at http://localhost:5173
```

### Production Build
To create a production build:
```bash
npm run build       # Creates optimized build in dist/
npm run preview     # Preview the production build
```

## Integration

### Backend API Connection
The frontend is designed to connect to the Django REST API backend running on a separate port. The typical setup involves:
- **Backend**: Running on `http://localhost:8000` (Django development server)
- **Frontend**: Running on `http://localhost:5173` (Vite development server)

CORS (Cross-Origin Resource Sharing) must be configured in the Django backend to allow requests from the Vite development server.

### Authentication Flow
Future implementation will include:
- JWT or Session-based authentication
- Axios interceptors for automatic token attachment
- Auth context for managing user session state
- Role-based UI rendering (student vs instructor)

### Planned Features
According to TODO.md Phase 4-6:
1. **AuthContext**: Global state management for user sessions
2. **Base Layout**: Navbar and Sidebar components
3. **QuestionExplorer**: Display questions for selected exams
4. **AnswerCard**: Render instructor answers with Markdown/MathJax support
5. **MarkdownEditor**: Rich text editor for instructors
6. **SupportCenter**: Ticket submission and tracking interface
7. **AdminSupportPanel**: Admin dashboard for managing tickets and reports

## Change Log
- **August 2026**: Initial React project setup using Vite with React 19 template
  - Scaffolded project structure in `frontend/` directory
  - Installed base dependencies (react, react-dom, vite)
  - Configured Vite build system with React plugin
