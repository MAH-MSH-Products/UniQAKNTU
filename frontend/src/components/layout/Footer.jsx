import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';
import logoWide from '../../assets/azHubNasir-wide.png';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer 
      className="mt-auto"
      style={{ 
        backgroundColor: 'var(--footer-bg)', 
        color: 'var(--footer-text)',
        borderTop: '3px solid var(--accent-orange)',
        paddingTop: '2.5rem',
        paddingBottom: '1.5rem'
      }}
    >
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-4 mb-md-0">
            <div className="d-flex align-items-center mb-3">
              <img src={logoWide} alt="AzmoonHub Nasir" height="60" className="me-2" style={{ filter: 'brightness(0) invert(1)' }} />
              <span className="fw-bold fs-5" style={{ color: 'var(--footer-heading)' }}>
                {t('footer.brand_name')}
              </span>
            </div>
            <p className="small mb-3" style={{ opacity: 0.8 }}>
              {t('footer.description')}
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-decoration-none" style={{ color: 'var(--footer-text)', fontSize: '1.2rem' }}><FaTwitter /></a>
              <a href="#" className="text-decoration-none" style={{ color: 'var(--footer-text)', fontSize: '1.2rem' }}><FaLinkedin /></a>
              <a href="#" className="text-decoration-none" style={{ color: 'var(--footer-text)', fontSize: '1.2rem' }}><FaInstagram /></a>
            </div>
          </div>

          <div className="col-md-4 mb-4 mb-md-0">
            <h6 className="fw-bold mb-3" style={{ color: 'var(--footer-heading)' }}>{t('footer.quick_links_title')}</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/source-materials" className="text-decoration-none text-reset small">{t('footer.all_courses')}</Link></li>
              <li className="mb-2"><Link to="/tickets" className="text-decoration-none text-reset small">{t('footer.my_tickets')}</Link></li>
              <li className="mb-2"><Link to="/reports" className="text-decoration-none text-reset small">{t('footer.reports')}</Link></li>
            </ul>
          </div>

          <div className="col-md-4">
            <h6 className="fw-bold mb-3" style={{ color: 'var(--footer-heading)' }}>{t('footer.resources_title')}</h6>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/#faq" className="text-decoration-none text-reset small">{t('footer.faq')}</Link></li>
              <li className="mb-2"><Link to="/support" className="text-decoration-none text-reset small">{t('footer.contact_us')}</Link></li>
            </ul>
          </div>
        </div>
        
        <hr className="my-4" style={{ borderColor: 'var(--footer-border)' }} />
        
        <div className="row">
          <div className="col-12 text-center">
            <p className="small mb-0" style={{ opacity: 0.6 }}>{t('footer.copyright')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;