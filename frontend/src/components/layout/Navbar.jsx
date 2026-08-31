// src/components/layout/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { FiLogOut, FiLogIn, FiUser, FiUserPlus, FiTag, FiFileText, FiShield, FiSun, FiMoon } from 'react-icons/fi';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../../assets/azHubNasir.png';

const Navbar = () => {
  const { user, isAuthenticated, logout, canModerate, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
  };

  const renderRoleBadge = () => {
    if (userRole === 'ADMIN') {
      return <span className="badge ms-2" style={{ backgroundColor: '#dc3545', color: 'white' }}>{t('nav.admin_badge', 'Admin')}</span>;
    } else if (userRole === 'MODERATOR') {
      return <span className="badge ms-2" style={{ backgroundColor: '#f48024', color: 'white' }}>{t('nav.moderator_badge', 'Moderator')}</span>;
    }
    return null;
  };

  return (
    <nav className="navbar navbar-expand-lg custom-navbar py-1 position-sticky top-0" style={{ zIndex: 1030 }}>
      <div className="container-fluid">
        {/* Branding with Logo */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src={logo} alt="AzmoonHub Nasir" height="40" className="me-2" />
          <span className="fw-bold fs-5 text-dark d-none d-sm-inline">AzmoonHub</span>
        </Link>
        
        {/* Toggle button for mobile */}
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            
            {/* Theme Toggle Button */}
            <li className="nav-item me-2">
              <button 
                onClick={toggleTheme} 
                className="btn btn-sm btn-outline-secondary border-0 d-flex align-items-center"
                title={t('nav.toggle_theme', 'Toggle Dark/Light Mode')}
              >
                {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
              </button>
            </li>

            {/* Language Switcher */}
            <li className="nav-item me-3">
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${i18n.language === 'en' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleLanguageChange('en')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`btn ${i18n.language === 'fa' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleLanguageChange('fa')}
                >
                  FA
                </button>
              </div>
            </li>
            
            {isAuthenticated ? (
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle d-flex align-items-center gap-2" href="#" role="button" data-bs-toggle="dropdown">
                  <FiUser size={20} />
                  <span className="fw-medium text-dark">{user?.username}</span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                  <li>
                    <h6 className="dropdown-header d-flex align-items-center">
                      <span className="text-dark">{user?.username}</span>
                      {renderRoleBadge()}
                    </h6>
                  </li>
                  <li>
                    <Link className="dropdown-item d-flex align-items-center gap-2" to="/profile">
                      <FiUser /> {t('profile.title', 'My Profile')}
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  
                  {canModerate && (
                    <>
                      <li>
                        <Link className="dropdown-item d-flex align-items-center gap-2" to="/admin/support">
                          <FiShield /> {t('pages.admin_panel', 'Admin Support Panel')}
                        </Link>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                    </>
                  )}
                  
                  <li>
                    <Link className="dropdown-item d-flex align-items-center gap-2" to="/tickets">
                      <FiTag /> {t('nav.my_tickets', 'My Tickets')}
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item d-flex align-items-center gap-2" to="/reports">
                      <FiFileText /> {t('nav.reports', 'Reports')}
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={handleLogout}>
                      <FiLogOut /> {t('nav.logout', 'Logout')}
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item me-2">
                  <Link className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1" to="/login">
                    <FiLogIn /> {t('nav.login', 'Login')}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-primary btn-sm d-flex align-items-center gap-1" to="/register">
                    <FiUserPlus /> {t('nav.register', 'Register')}
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