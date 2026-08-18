import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Home Component - Landing Page
 * 
 * Displays welcome message and overview of the platform.
 * Uses i18n translations for all text content.
 */

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <h1 className="display-4 mb-4">{t('app.welcome')}</h1>
          <p className="lead text-muted">
            {t('app.description')}
          </p>
          <hr className="my-4" />
          <p>
            {t('app.access_info')}
            {t('app.join_community')}
          </p>
          <div className="mt-4">
            <a href="/courses" className="btn btn-primary btn-lg me-2">
              {t('home.browse_courses')}
            </a>
            <a href="/login" className="btn btn-outline-secondary btn-lg">
              {t('home.sign_in')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
