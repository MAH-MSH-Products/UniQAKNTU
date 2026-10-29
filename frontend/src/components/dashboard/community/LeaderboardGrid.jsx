import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiAward,
  FiUsers,
  FiRefreshCw,
  FiClock,
  FiCheckSquare,
} from 'react-icons/fi';
import { getLeaderboard } from '../../../services/api';
import { getErrorMessage } from '../../../utils/errorHandler';

const PERIODS = [
  { key: 'day', labelKey: 'community.day', defaultLabel: 'روز' },
  { key: 'week', labelKey: 'community.week', defaultLabel: 'هفته' },
  { key: 'month', labelKey: 'community.month', defaultLabel: 'ماه' },
  { key: 'three_months', labelKey: 'community.three_months', defaultLabel: 'سه ماه' },
];

const LeaderboardGrid = () => {
  const { t } = useTranslation();
  const [activePeriod, setActivePeriod] = useState('week');
  const [leaderboardData, setLeaderboardData] = useState({ total_active_users: 0, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async (period) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getLeaderboard(period);
      setLeaderboardData(res.data || { total_active_users: 0, results: [] });
    } catch (err) {
      setError(getErrorMessage(err, 'errors.default'));
      setLeaderboardData({ total_active_users: 0, results: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(activePeriod);
  }, [activePeriod, fetchLeaderboard]);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="badge rounded-circle p-2 bg-warning text-dark fw-bold d-inline-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="badge rounded-circle p-2 bg-secondary text-white fw-bold d-inline-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="badge rounded-circle p-2 bg-danger bg-opacity-75 text-white fw-bold d-inline-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
          3
        </span>
      );
    }
    return (
      <span className="badge rounded-circle p-2 bg-light text-muted border fw-semibold d-inline-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
        {rank}
      </span>
    );
  };

  return (
    <div
      className="card border-0 shadow-sm rounded-4 h-100"
      style={{
        backdropFilter: 'blur(10px)',
        background: 'var(--bs-card-bg, rgba(255, 255, 255, 0.9))',
      }}
    >
      <div className="card-header bg-transparent border-0 pt-4 px-4 pb-2">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
          <div>
            <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
              <FiAward className="text-warning" />
              {t('community.leaderboard_title', 'Top Students Leaderboard')}
            </h5>
            <p className="text-muted small mb-0">
              {t('community.leaderboard_subtitle', 'Live student rankings based on study hours and test count')}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill small d-flex align-items-center gap-1">
              <FiUsers />
              <span>{leaderboardData.total_active_users.toLocaleString()}</span>
              <span>{t('community.active_users', 'Active')}</span>
            </span>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-circle p-1 d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px' }}
              onClick={() => fetchLeaderboard(activePeriod)}
              disabled={loading}
              title={t('common.search', 'Refresh')}
            >
              <FiRefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="btn-group btn-group-sm w-100 rounded-3 p-1 bg-light border" role="group">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`btn rounded-2 fw-semibold transition ${
                activePeriod === p.key ? 'btn-primary text-white shadow-sm' : 'btn-light text-muted'
              }`}
              onClick={() => setActivePeriod(p.key)}
              disabled={loading}
            >
              {t(p.labelKey, p.defaultLabel)}
            </button>
          ))}
        </div>
      </div>

      <div className="card-body px-4 pb-4">
        {error && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5 text-muted small">
            <span className="spinner-border spinner-border-sm me-2 text-primary" role="status" aria-hidden="true" />
            <span>{t('common.loading', 'Loading...')}</span>
          </div>
        ) : leaderboardData.results.length === 0 ? (
          <div className="p-4 rounded-3 bg-light text-center text-muted small">
            <FiAward size={32} className="text-muted opacity-50 mb-2" />
            <div>{t('community.no_data', 'No study records found for this period.')}</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light text-muted text-uppercase">
                <tr>
                  <th scope="col" style={{ width: '45px' }} className="text-center">#</th>
                  <th scope="col">{t('community.student', 'Student')}</th>
                  <th scope="col" className="text-center d-none d-md-table-cell">{t('community.major', 'Major')}</th>
                  <th scope="col" className="text-center">
                    <span className="d-flex align-items-center justify-content-center gap-1">
                      <FiClock size={13} />
                      {t('community.total_hours', 'Total')}
                    </span>
                  </th>
                  <th scope="col" className="text-center d-none d-sm-table-cell">{t('community.daily_avg_hours', 'Daily Avg')}</th>
                  <th scope="col" className="text-center">
                    <span className="d-flex align-items-center justify-content-center gap-1">
                      <FiCheckSquare size={13} />
                      {t('community.total_tests', 'Tests')}
                    </span>
                  </th>
                  <th scope="col" className="text-center d-none d-sm-table-cell">{t('community.daily_avg_tests', 'Daily Tests')}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.results.map((entry) => (
                  <tr key={entry.rank}>
                    <td className="text-center">{getRankBadge(entry.rank)}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                          style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}
                        >
                          {entry.username ? entry.username.slice(0, 1) : 'U'}
                        </div>
                        <span className="fw-semibold text-truncate" style={{ maxWidth: '120px' }}>
                          {entry.username}
                        </span>
                      </div>
                    </td>
                    <td className="text-center text-muted d-none d-md-table-cell">{entry.major}</td>
                    <td className="text-center font-monospace fw-bold text-primary">{entry.total_study_hours}</td>
                    <td className="text-center font-monospace text-muted d-none d-sm-table-cell">{entry.average_daily_hours}</td>
                    <td className="text-center font-monospace fw-bold text-success">{entry.total_tests}</td>
                    <td className="text-center font-monospace text-muted d-none d-sm-table-cell">{entry.average_daily_tests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardGrid;
