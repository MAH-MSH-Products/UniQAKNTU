// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { FiBook, FiTag, FiAlertTriangle, FiPieChart, FiEdit, FiShield } from 'react-icons/fi';

const Sidebar = () => {
  const { t } = useTranslation();
  const { isAuthenticated, canModerate, isAdmin } = useAuth(); // Destructured isAdmin

  const navLinkStyle = {
    transition: 'all 0.2s ease-in-out',
    borderRadius: '6px',
    marginBottom: '0.25rem'
  };

  return (
    <div className="sidebar border-end h-100" style={{ minHeight: 'calc(100vh - 56px)' }}>
      <div className="p-3">
        <h6 className="sidebar-heading text-uppercase text-muted small fw-bold mb-3">
          {t('sidebar.navigation')}
        </h6>
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link className="nav-link d-flex align-items-center gap-2" to="/source-materials" style={navLinkStyle}>
              <FiBook /> <span>{t('sidebar.all_courses')}</span>
            </Link>
          </li>
          
          {isAuthenticated && (
            <>
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center gap-2" to="/tickets" style={navLinkStyle}>
                  <FiTag /> <span>{t('sidebar.my_tickets')}</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center gap-2" to="/reports" style={navLinkStyle}>
                  <FiAlertTriangle /> <span>{t('sidebar.reports')}</span>
                </Link>
              </li>
            </>
          )}
        </ul>

        {canModerate && (
          <>
            <h6 className="sidebar-heading text-uppercase text-muted small fw-bold mb-3 mt-4">
              {t('sidebar.instructor_tools')}
            </h6>
            <ul className="nav flex-column">
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center gap-2" to="/instructor/dashboard" style={navLinkStyle}>
                  <FiPieChart /> <span>{t('sidebar.dashboard')}</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center gap-2" to="/instructor/answers" style={navLinkStyle}>
                  <FiEdit /> <span>{t('sidebar.manage_answers')}</span>
                </Link>
              </li>
              
              {/* Added strict isAdmin check for Admin Panel */}
              {isAdmin && (
                <li className="nav-item">
                  <Link className="nav-link d-flex align-items-center gap-2 text-danger fw-bold" to="/admin/support" style={navLinkStyle}>
                    <FiShield /> <span>{t('pages.admin_panel')}</span>
                  </Link>
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;