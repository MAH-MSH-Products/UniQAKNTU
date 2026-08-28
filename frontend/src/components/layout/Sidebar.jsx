import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { FiBook, FiTag, FiAlertTriangle, FiPieChart, FiEdit } from 'react-icons/fi';
/**
 * Sidebar Component - Course and Exam Navigation
 * 
 * Provides navigation links for courses, exams, and support features.
 * Uses i18n translations for all text content.
 * Uses react-icons for professional iconography (no emojis).
 * Features hover effects matching the new academic color palette.
 * Dynamically renders navigation items based on authentication state and user role (RBAC).
 */

const Sidebar = () => {
  const { t } = useTranslation();
  const { isAuthenticated, canModerate } = useAuth();

  const navLinkStyle = {
    transition: 'all 0.2s ease-in-out',
    borderRadius: '6px',
    marginBottom: '0.25rem'
  };

  const navLinkHoverStyle = {
    backgroundColor: 'rgba(23, 162, 184, 0.1)',
    color: 'var(--secondary-color)'
  };

  return (
    <div className="sidebar bg-light border-end" style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: 'var(--background-color)' }}>
      <div className="p-3">
        <h6 className="sidebar-heading text-uppercase text-muted small fw-bold mb-3" style={{ color: 'var(--text-light)' }}>
          {t('sidebar.navigation')}
        </h6>
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link 
              className="nav-link text-dark d-flex align-items-center gap-2" 
              to="/source-materials"
              style={navLinkStyle}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, navLinkHoverStyle)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: 'var(--text-secondary)' })}
            >
              <FiBook />
              <span>{t('sidebar.all_courses')}</span>
            </Link>
          </li>
          {/* Show My Tickets and Reports only for authenticated users */}
          {isAuthenticated && (
            <>
              <li className="nav-item">
                <Link 
                  className="nav-link text-dark d-flex align-items-center gap-2" 
                  to="/tickets"
                  style={navLinkStyle}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, navLinkHoverStyle)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: 'var(--text-secondary)' })}
                >
                  <FiTag />
                  <span>{t('sidebar.my_tickets')}</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link text-dark d-flex align-items-center gap-2" 
                  to="/reports"
                  style={navLinkStyle}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, navLinkHoverStyle)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: 'var(--text-secondary)' })}
                >
                  <FiAlertTriangle />
                  <span>{t('sidebar.reports')}</span>
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Moderator/Admin-only section - Only visible to users with canModerate permission */}
        {canModerate && (
          <>
            <h6 className="sidebar-heading text-uppercase text-muted small fw-bold mb-3 mt-4" style={{ color: 'var(--text-light)' }}>
              {t('sidebar.instructor_tools')}
            </h6>
            <ul className="nav flex-column">
              <li className="nav-item">
                <Link 
                  className="nav-link text-dark d-flex align-items-center gap-2" 
                  to="/instructor/dashboard"
                  style={navLinkStyle}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, navLinkHoverStyle)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: 'var(--text-secondary)' })}
                >
                  <FiPieChart />
                  <span>{t('sidebar.dashboard')}</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link text-dark d-flex align-items-center gap-2" 
                  to="/instructor/answers"
                  style={navLinkStyle}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, navLinkHoverStyle)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: 'var(--text-secondary)' })}
                >
                  <FiEdit />
                  <span>{t('sidebar.manage_answers')}</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link text-dark d-flex align-items-center gap-2" 
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, navLinkHoverStyle)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', color: 'var(--text-secondary)' })}
                  style={navLinkStyle}
                  to="/admin/support"
                >
                  <FiAlertTriangle/>
                  <span>{t('pages.admin_panel')}</span>
                </Link>
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
