import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiClock,
  FiTrendingUp,
  FiCheckSquare,
  FiZap,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';

const PersonalRecordsWidget = ({ records = {}, todayTasks = {} }) => {
  const { t } = useTranslation();

  const {
    total_study_hours = '00:00',
    max_daily_study = '00:00',
    total_tests = 0,
    max_daily_tests = 0,
  } = records;

  const { has_reviews = false, has_studies = false } = todayTasks;

  return (
    <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ backdropFilter: 'blur(10px)', background: 'var(--bs-card-bg, rgba(255, 255, 255, 0.9))' }}>
      <div className="card-header bg-transparent border-0 pt-4 px-4 pb-2">
        <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
          <FiZap className="text-primary" />
          {t('dashboard.personal_records', 'Personal Records')}
        </h5>
        <p className="text-muted small mb-0">
          {t('dashboard.today_status', "Today's Tasks Status")} &amp; {t('dashboard.personal_records', 'Milestones')}
        </p>
      </div>

      <div className="card-body px-4 pb-4">
        {/* KPI Grid */}
        <div className="row g-3 mb-3">
          {/* Total Study Hours */}
          <div className="col-6 col-md-3">
            <div className="p-3 rounded-4 bg-primary bg-opacity-10 border border-primary border-opacity-25 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between text-primary mb-2">
                <span className="small fw-semibold">{t('dashboard.total_study_time', 'Total Study')}</span>
                <FiClock size={18} />
              </div>
              <div className="h3 fw-bold text-primary mb-0">{total_study_hours}</div>
              <span className="small text-muted">{t('dashboard.hours', 'hours')}</span>
            </div>
          </div>

          {/* Peak Daily Study */}
          <div className="col-6 col-md-3">
            <div className="p-3 rounded-4 bg-info bg-opacity-10 border border-info border-opacity-25 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between text-info mb-2">
                <span className="small fw-semibold">{t('dashboard.max_daily_study', 'Peak Daily Study')}</span>
                <FiTrendingUp size={18} />
              </div>
              <div className="h3 fw-bold text-info mb-0">{max_daily_study}</div>
              <span className="small text-muted">{t('dashboard.hours', 'hours')}</span>
            </div>
          </div>

          {/* Total Tests */}
          <div className="col-6 col-md-3">
            <div className="p-3 rounded-4 bg-success bg-opacity-10 border border-success border-opacity-25 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between text-success mb-2">
                <span className="small fw-semibold">{t('dashboard.total_tests', 'Total Tests')}</span>
                <FiCheckSquare size={18} />
              </div>
              <div className="h3 fw-bold text-success mb-0">{total_tests.toLocaleString()}</div>
              <span className="small text-muted">{t('planner.total_tests_count', 'tests')}</span>
            </div>
          </div>

          {/* Peak Daily Tests */}
          <div className="col-6 col-md-3">
            <div className="p-3 rounded-4 bg-warning bg-opacity-10 border border-warning border-opacity-25 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex align-items-center justify-content-between text-warning mb-2">
                <span className="small fw-semibold">{t('dashboard.max_daily_tests', 'Peak Daily Tests')}</span>
                <FiZap size={18} />
              </div>
              <div className="h3 fw-bold text-warning mb-0">{max_daily_tests.toLocaleString()}</div>
              <span className="small text-muted">{t('planner.total_tests_count', 'tests')}</span>
            </div>
          </div>
        </div>

        {/* Today's Tasks Status Badges */}
        <div className="p-3 rounded-3 bg-light d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
          <div className="fw-semibold small text-muted">
            {t('dashboard.today_status', "Today's Tasks Status")}:
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span
              className={`badge rounded-pill px-3 py-2 d-flex align-items-center gap-1 ${
                has_studies ? 'bg-success text-white' : 'bg-secondary text-white'
              }`}
            >
              {has_studies ? <FiCheckCircle /> : <FiAlertCircle />}
              {has_studies ? t('dashboard.studies_done', 'Study Completed') : t('dashboard.studies_pending', 'Study Pending')}
            </span>

            <span
              className={`badge rounded-pill px-3 py-2 d-flex align-items-center gap-1 ${
                has_reviews ? 'bg-info text-dark' : 'bg-secondary text-white'
              }`}
            >
              {has_reviews ? <FiCheckCircle /> : <FiAlertCircle />}
              {has_reviews ? t('dashboard.reviews_done', 'Review Completed') : t('dashboard.reviews_pending', 'Review Pending')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalRecordsWidget;
