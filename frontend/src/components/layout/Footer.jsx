// C:/Users/Mohammad/Desktop/UniQAKNTU/frontend/src/components/layout/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import logoWide from '../../assets/azHubNasir-wide.png'; 

/**
 * Footer Component - Multi-column Responsive Footer
 * 
 * Displays a comprehensive 3-column footer with:
 * - Column 1: Brand information, logo, and social media links
 * - Column 2: Quick navigation links (All Courses, My Tickets, Reports)
 * - Column 3: Resources links (FAQ, Documentation, Contact Us)
 * 
 * Features a subtle gradient top border for visual emphasis.
 * All text is localized using react-i18next.
 */

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer 
      className="mt-auto"
      style={{ 
        borderTop: '4px solid var(--gradient-primary)',
        background: 'var(--card-background)',
        paddingTop: '2rem',
        paddingBottom: '1.5rem'
      }}
    >
      <div className="container">
        <div className="row">
          {/* Column 1: Brand Information */}
          <div className="col-md-4 mb-4 mb-md-0">
            <div className="d-flex align-items-center mb-3">
              <img src={logoWide} alt="AzmoonHub Nasir" height="80" className="me-2" />
              <span className="fw-bold" style={{ color: 'var(--primary-color)' }}>
                {t('footer.brand_name')}
              </span>
            </div>
            <p className="text-muted small mb-3">
              {t('footer.description')}
            </p>
            {/* Social Media Links */}
            <div className="d-flex gap-3">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-decoration-none"
                style={{ color: 'var(--secondary-color)', fontSize: '1.25rem' }}
                aria-label="Twitter"
              >
                <FaTwitter />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-decoration-none"
                style={{ color: 'var(--secondary-color)', fontSize: '1.25rem' }}
                aria-label="LinkedIn"
              >
                <FaLinkedin />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-decoration-none"
                style={{ color: 'var(--secondary-color)', fontSize: '1.25rem' }}
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-md-4 mb-4 mb-md-0">
            <h6 className="fw-bold mb-3" style={{ color: 'var(--primary-color)' }}>
              {t('footer.quick_links_title')}
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link 
                  to="/source-materials" 
                  className="text-decoration-none text-muted small"
                  style={{ transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--secondary-color)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  {t('footer.all_courses')}
                </Link>
              </li>
              <li className="mb-2">
                <Link 
                  to="/tickets" 
                  className="text-decoration-none text-muted small"
                  style={{ transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--secondary-color)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  {t('footer.my_tickets')}
                </Link>
              </li>
              <li className="mb-2">
                <Link 
                  to="/reports" 
                  className="text-decoration-none text-muted small"
                  style={{ transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--secondary-color)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  {t('footer.reports')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="col-md-4">
            <h6 className="fw-bold mb-3" style={{ color: 'var(--primary-color)' }}>
              {t('footer.resources_title')}
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link 
                  to="/#faq" 
                  className="text-decoration-none text-muted small"
                  style={{ transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--secondary-color)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  {t('footer.faq')}
                </Link>
              </li>
              <li className="mb-2">
                <Link 
                  to="/support" 
                  className="text-decoration-none text-muted small"
                  style={{ transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--secondary-color)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  {t('footer.contact_us')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <hr className="my-4" style={{ borderColor: 'var(--border-color)' }} />
        <div className="row">
          <div className="col-12 text-center">
            <p className="text-muted small mb-0">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;