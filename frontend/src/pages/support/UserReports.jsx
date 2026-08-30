import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaArrowRight } from 'react-icons/fa';

/**
 * UserReports Component - Reports Information Page
 * 
 * Displays an academic-styled card explaining to users how to report content.
 * Users don't submit reports via a general page; they report specific questions/answers contextually.
 * This page guides them to navigate to the item they want to report or use the Support Center.
 */

const UserReports = () => {
  const { t } = useTranslation();

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10">
          <div className="academic-card">
            <div className="card-header bg-gradient text-white">
              <h3 className="mb-0 d-flex align-items-center gap-2">
                <FaExclamationTriangle />
                {t('reports.title')}
              </h3>
            </div>
            <div className="card-body p-4">
              <p className="lead text-center mb-4">
                {t('reports.description')}
              </p>
              
              <div className="alert alert-info" role="alert">
                <h5 className="alert-heading">{t('reports.how_to_report_title')}</h5>
                <ol className="mb-0">
                  <li className="mb-2">{t('reports.how_to_report_step_1')}</li>
                  <li className="mb-2">{t('reports.how_to_report_step_2')}</li>
                  <li className="mb-2">{t('reports.how_to_report_step_3')}</li>
                </ol>
              </div>

              <div className="text-center mt-4">
                <Link 
                  to="/support" 
                  className="btn btn-primary btn-lg"
                >
                  {t('reports.go_to_support')} <FaArrowRight className="ms-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserReports;
