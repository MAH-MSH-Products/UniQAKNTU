import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Sidebar Component - Course and Exam Navigation
 * 
 * Provides navigation links for courses, exams, and support features.
 * Currently includes placeholder links for future functionality.
 */

const Sidebar = () => {
  return (
    <div className="sidebar bg-light border-end" style={{ minHeight: 'calc(100vh - 56px)' }}>
      <div className="p-3">
        <h6 className="sidebar-heading text-uppercase text-muted small fw-bold mb-3">
          Navigation
        </h6>
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link 
              className="nav-link text-dark" 
              to="/courses"
            >
              📚 All Courses
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              className="nav-link text-dark" 
              to="/tickets"
            >
              🎫 My Tickets
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              className="nav-link text-dark" 
              to="/reports"
            >
              ⚠️ Reports
            </Link>
          </li>
        </ul>

        {/* Instructor-only section */}
        <h6 className="sidebar-heading text-uppercase text-muted small fw-bold mb-3 mt-4">
          Instructor Tools
        </h6>
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link 
              className="nav-link text-dark" 
              to="/instructor/dashboard"
            >
              📊 Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              className="nav-link text-dark" 
              to="/instructor/answers"
            >
              ✏️ Manage Answers
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
