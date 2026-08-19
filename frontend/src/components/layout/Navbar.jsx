import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { FiLogOut, FiLogIn, FiUser } from 'react-icons/fi';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../../assets/azHubNasir.png';

/**
 * Navbar Component - Responsive Navigation Bar
 * 
 * Displays branding with AzmoonHub Nasir logo, user information, and authentication controls.
 * Conditionally renders content based on user authentication status and role.
 * Includes language switcher for English/Persian (EN/FA).
 * Uses react-icons for professional iconography.
 * Features sticky positioning with scroll-triggered shadow effect.
 * Dynamically adapts styling for auth pages (/login, /register) using glassmorphism effect.
 */

const Navbar = () => {
  const { user, isAuthenticated, logout, isInstructor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if current path is an auth page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Scroll listener for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
  };

  // Dynamic navbar styles based on current route
  const getNavbarStyle = () => {
    if (isAuthPage) {
      // Glassmorphism style for auth pages - blends with gradient background
      return {
        background: 'rgba(10, 37, 64, 0.4)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1030,
        position: 'absolute',
        width: '100%'
      };
    }
    // Default solid primary color for other pages
    return {
      backgroundColor: 'var(--primary-color)',
      zIndex: 1030
    };
  };

  return (
    <nav 
      className={`navbar navbar-expand-lg ${isAuthPage ? 'position-absolute' : 'position-sticky'} top-0 ${isScrolled && !isAuthPage ? 'shadow-sm' : ''}`} 
      style={getNavbarStyle()}
    >
      <div className="container-fluid">
        {/* Branding with Logo */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src={logo} alt="AzmoonHub Nasir" height="80" className="me-2" />
        </Link>

        {/* Toggle button for mobile */}
        <button
          className="navbar-toggler border-0"
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
            <li className="nav-item me-3">
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
                  <span className="navbar-text text-white d-flex align-items-center">
                    <FiUser className="me-1" />
                    {t('nav.welcome')}, {user?.username}
                    {isInstructor && (
                      <span className="badge ms-2" style={{ backgroundColor: 'var(--secondary-color)', color: 'white' }}>
                        {t('nav.instructor_badge')}
                      </span>
                    )}
                  </span>
                </li>
                
                {/* Logout button */}
                <li className="nav-item">
                  <button
                    className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
                    onClick={handleLogout}
                  >
                    <FiLogOut />
                    {t('nav.logout')}
                  </button>
                </li>
              </>
            ) : (
              <>
                {/* Login link for unauthenticated users */}
                <li className="nav-item">
                  <Link className="btn btn-outline-light btn-sm d-flex align-items-center gap-1" to="/login">
                    <FiLogIn />
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
