import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Navbar Component - Responsive Navigation Bar
 * 
 * Displays branding, user information, and authentication controls.
 * Conditionally renders content based on user authentication status and role.
 * Includes language switcher for English/Persian (EN/FA).
 */

const Navbar = () => {
  const { user, isAuthenticated, logout, isInstructor } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        {/* Branding */}
        <Link className="navbar-brand" to="/">
          {t('nav.brand')}
        </Link>

        {/* Toggle button for mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            {/* Language Switcher */}
            <li className="nav-item me-2">
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${i18n.language === 'en' ? 'btn-light text-primary' : 'btn-outline-light'}`}
                  onClick={() => handleLanguageChange('en')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`btn ${i18n.language === 'fa' ? 'btn-light text-primary' : 'btn-outline-light'}`}
                  onClick={() => handleLanguageChange('fa')}
                >
                  FA
                </button>
              </div>
            </li>

            {isAuthenticated ? (
              <>
                {/* Welcome message */}
                <li className="nav-item me-3">
                  <span className="navbar-text text-white">
                    {t('nav.welcome')}, {user?.username}
                    {isInstructor && (
                      <span className="badge bg-warning text-dark ms-2">
                        {t('nav.instructor_badge')}
                      </span>
                    )}
                  </span>
                </li>
                
                {/* Logout button */}
                <li className="nav-item">
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={handleLogout}
                  >
                    {t('nav.logout')}
                  </button>
                </li>
              </>
            ) : (
              <>
                {/* Login link for unauthenticated users */}
                <li className="nav-item">
                  <Link className="btn btn-outline-light btn-sm" to="/login">
                    {t('nav.login')}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
