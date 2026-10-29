import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiGrid,
  FiRefreshCw,
  FiClock,
  FiTarget,
  FiSun,
  FiAlertCircle,
} from 'react-icons/fi';
import { getDashboardSummary } from '../../../services/api';
import { getErrorMessage } from '../../../utils/errorHandler';
import PersonalRecordsWidget from './PersonalRecordsWidget';
import StopwatchWidget from './StopwatchWidget';
import DailyNoteWidget from './DailyNoteWidget';
import ConsultationWidget from './ConsultationWidget';
import LeaderboardGrid from '../../../components/community/LeaderboardGrid';
import OpinionsList from '../../../components/community/OpinionsList';

const StudentDashboard = () => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardSummary();
      setSummary(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'errors.default'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const quote = summary?.quote || t('dashboard.motivational_quote', 'Start now and stay consistent.');
  const countdown = summary?.countdown || { target_name: 'آزمون ارشد', days: 0, hours: 0, minutes: 0 };

  return (
    <div className="container py-4">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <FiGrid className="text-primary" />
            {t('dashboard.title', 'My Dashboard')}
          </h2>
          <p className="text-muted mb-0">
            {t('dashboard.subtitle', 'Student Control Center & Academic Tools')}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
          onClick={fetchSummary}
          disabled={loading}
          title={t('common.search', 'Refresh')}
        >
          <FiRefreshCw className={loading ? 'spin' : ''} />
          <span>{t('common.search', 'Refresh')}</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-4 mb-4 shadow-sm">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {/* Top Cards: Quote & Countdown */}
      <div className="row g-4 mb-4">
        {/* Motivational Quote */}
        <div className="col-12 col-lg-7">
          <div
            className="card border-0 shadow-sm rounded-4 h-100 p-4 position-relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(13, 110, 253, 0.08) 0%, rgba(13, 202, 240, 0.12) 100%)',
              borderLeft: '4px solid #0d6efd',
            }}
          >
            <div className="d-flex align-items-start gap-3">
              <div className="p-3 rounded-circle bg-primary bg-opacity-10 text-primary flex-shrink-0">
                <FiSun size={28} />
              </div>
              <div className="flex-grow-1">
                <span className="badge bg-primary bg-opacity-10 text-primary mb-2 px-3 py-1 rounded-pill small">
                  {t('dashboard.motivational_quote', 'Quote of the Day')}
                </span>
                <p className="fs-5 fw-semibold text-dark mb-0 fst-italic line-height-lg" style={{ lineHeight: '1.7' }}>
                  "{quote}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Countdown */}
        <div className="col-12 col-lg-5">
          <div
            className="card border-0 shadow-sm rounded-4 h-100 p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(25, 135, 84, 0.08) 0%, rgba(255, 193, 7, 0.12) 100%)',
              borderLeft: '4px solid #198754',
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="badge bg-success bg-opacity-10 text-success px-3 py-1 rounded-pill small d-flex align-items-center gap-1">
                <FiTarget />
                {countdown.target_name || t('dashboard.exam_countdown', 'Exam Countdown')}
              </span>
              <span className="text-muted small d-flex align-items-center gap-1">
                <FiClock />
                {t('dashboard.exam_countdown', 'Remaining')}
              </span>
            </div>

            <div className="row g-2 text-center">
              <div className="col-4">
                <div className="p-2 rounded-3 bg-white bg-opacity-75 shadow-sm border border-success border-opacity-25">
                  <div className="h3 fw-bold text-success mb-0">{countdown.days}</div>
                  <div className="small text-muted">{t('dashboard.days', 'Days')}</div>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded-3 bg-white bg-opacity-75 shadow-sm border border-success border-opacity-25">
                  <div className="h3 fw-bold text-success mb-0">{countdown.hours}</div>
                  <div className="small text-muted">{t('dashboard.hours', 'Hours')}</div>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded-3 bg-white bg-opacity-75 shadow-sm border border-success border-opacity-25">
                  <div className="h3 fw-bold text-success mb-0">{countdown.minutes}</div>
                  <div className="small text-muted">{t('dashboard.minutes', 'Minutes')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Personal Records & Milestones */}
      <PersonalRecordsWidget
        records={summary?.records || {}}
        todayTasks={summary?.today_tasks || {}}
      />

      {/* Row 2: Stopwatch & Daily Note */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <StopwatchWidget />
        </div>
        <div className="col-12 col-lg-6">
          <DailyNoteWidget />
        </div>
      </div>

      {/* Row 3: Consultation Booking & Community Leaderboard */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <ConsultationWidget />
        </div>
        <div className="col-12 col-lg-6">
          <LeaderboardGrid />
        </div>
      </div>

      {/* Row 4: Student Community Opinions */}
      <div className="row g-4">
        <div className="col-12">
          <OpinionsList />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
