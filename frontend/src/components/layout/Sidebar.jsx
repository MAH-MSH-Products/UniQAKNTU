import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Sidebar Component - Course and Exam Navigation
 * 
 * Provides navigation links for courses, exams, and support features.
 * Uses i18n translations for all text content.
 */

const Sidebar = () => {
  const { t } = useTranslation();

  return (
    <div className="sidebar bg-light border-end" style={{ minHeight: 'calc(100vh - 56px)' }}>
      <div className="p-3">
        <h6 className="sidebar-heading text-uppercase text-muted small fw-bold mb-3">
          {t('sidebar.navigation')}
        </h6>
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link 
              className="nav-link text-dark" 
              to="/courses"
            >
              {t('sidebar.all_courses')}
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              className="nav-link text-dark" 
              to="/tickets"
            >
              {t('sidebar.my_tickets')}
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              className="nav-link text-dark" 
              to="/reports"
            >
              {t('sidebar.reports')}
            </Link>
          </li>
        </ul>

        {/* Instructor-only section */}
        <h6 className="sidebar-heading text-uppercase text-muted small fw-bold mb-3 mt-4">
          {t('sidebar.instructor_tools')}
        </h6>
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link 
              className="nav-link text-dark" 
              to="/instructor/dashboard"
            >
              {t('sidebar.dashboard')}
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              className="nav-link text-dark" 
              to="/instructor/answers"
            >
              {t('sidebar.manage_answers')}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
