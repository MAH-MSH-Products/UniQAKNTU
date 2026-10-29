import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiMessageSquare } from 'react-icons/fi';

/**
 * Consumer Component for Student Community Opinions (Sub-module 4).
 * Backend and full interactive logic owned exclusively by Sub-module 4 (community).
 */
const OpinionsList = () => {
  const { t } = useTranslation();

  return (
    <div
      className="card border-0 shadow-sm rounded-4 h-100"
      style={{
        backdropFilter: 'blur(10px)',
        background: 'var(--bs-card-bg, rgba(255, 255, 255, 0.9))',
      }}
    >
      <div className="card-header bg-transparent border-0 pt-4 px-4 pb-2">
        <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
          <FiMessageSquare className="text-info" />
          {t('dashboard.community_opinions', 'Student Opinions & Discussions')}
        </h5>
        <p className="text-muted small mb-0">
          {t('dashboard.community_opinions_desc', 'This section is managed by the student community module (Sub-module 4)')}
        </p>
      </div>

      <div className="card-body px-4 pb-4">
        <div className="p-4 rounded-3 bg-light text-center text-muted">
          <FiMessageSquare size={32} className="text-info mb-2" />
          <div className="fw-semibold small">{t('dashboard.community_opinions', 'Discussions')}</div>
          <div className="small text-muted mt-1">
            {t('dashboard.community_opinions_desc', 'Community comments, questions, and discussions will be displayed here.')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpinionsList;
