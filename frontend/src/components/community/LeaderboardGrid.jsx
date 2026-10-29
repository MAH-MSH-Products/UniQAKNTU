import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiAward } from 'react-icons/fi';

/**
 * Consumer Component for Leaderboard (Sub-module 4).
 * Backend and full interactive logic owned exclusively by Sub-module 4 (community).
 */
const LeaderboardGrid = () => {
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
          <FiAward className="text-warning" />
          {t('dashboard.community_leaderboard', 'Top Students Leaderboard')}
        </h5>
        <p className="text-muted small mb-0">
          {t('dashboard.community_leaderboard_desc', 'This section is managed by the student community module (Sub-module 4)')}
        </p>
      </div>

      <div className="card-body px-4 pb-4">
        <div className="p-4 rounded-3 bg-light text-center text-muted">
          <FiAward size={32} className="text-warning mb-2" />
          <div className="fw-semibold small">{t('dashboard.community_leaderboard', 'Leaderboard')}</div>
          <div className="small text-muted mt-1">
            {t('dashboard.community_leaderboard_desc', 'Rankings and study leaderboards will appear here once connected to the community service.')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardGrid;
