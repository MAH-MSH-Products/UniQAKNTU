import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiCalendar,
  FiClock,
  FiBookOpen,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
  FiRefreshCw
} from 'react-icons/fi';
import { getWeeklyPerformance } from '../../../../services/api';
import { getErrorMessage } from '../../../../utils/errorHandler';

/**
 * Calculates previous or next week's Saturday (YYYY-MM-DD).
 */
const shiftWeek = (dateStr, days) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const formatMinutesToHours = (totalMins, t) => {
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0 && mins > 0) {
    return `${hours} ${t('planner.hours_abbr', 'h')} ${mins} ${t('planner.minutes_abbr', 'min')}`;
  }
  if (hours > 0) {
    return `${hours} ${t('planner.hours_abbr', 'h')}`;
  }
  return `${mins} ${t('planner.minutes_abbr', 'min')}`;
};

const PerformedWeeklyPlan = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';

  const [currentWeekStart, setCurrentWeekStart] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPerformance = useCallback(async (weekStartParam) => {
    setLoading(true);
    setError(null);
    try {
      const params = weekStartParam ? { week_start: weekStartParam } : {};
      const res = await getWeeklyPerformance(params);
      setData(res.data);
      if (!currentWeekStart && res.data?.week_start) {
        setCurrentWeekStart(res.data.week_start);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'errors.default'));
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    fetchPerformance(currentWeekStart);
  }, [currentWeekStart, fetchPerformance]);

  const handlePrevWeek = () => {
    if (data?.week_start) {
      setCurrentWeekStart(shiftWeek(data.week_start, -7));
    }
  };

  const handleNextWeek = () => {
    if (data?.week_start) {
      setCurrentWeekStart(shiftWeek(data.week_start, 7));
    }
  };

  const handleCurrentWeek = () => {
    setCurrentWeekStart('');
    fetchPerformance('');
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <FiCalendar className="text-primary" />
            {t('planner.performed_weekly_plan', 'Performed Weekly Plan')}
          </h2>
          <p className="text-muted mb-0">
            {t('planner.performed_weekly_plan_desc', 'Aggregated summary of your actual executed study time and tests.')}
          </p>
        </div>

        {/* Week Navigator */}
        <div className="d-flex align-items-center gap-2 bg-card p-1 rounded border shadow-sm">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={isRTL ? handleNextWeek : handlePrevWeek}
            title={t('planner.prev_week', 'Previous Week')}
          >
            {isRTL ? <FiChevronRight /> : <FiChevronLeft />}
            <span className="d-none d-sm-inline">{t('planner.prev_week', 'Previous Week')}</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-primary px-3"
            onClick={handleCurrentWeek}
          >
            {t('planner.current_week', 'Current Week')}
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={isRTL ? handlePrevWeek : handleNextWeek}
            title={t('planner.next_week', 'Next Week')}
          >
            <span className="d-none d-sm-inline">{t('planner.next_week', 'Next Week')}</span>
            {isRTL ? <FiChevronLeft /> : <FiChevronRight />}
          </button>
        </div>
      </div>

      {/* Mandatory Read-Only Notification / Call-To-Action (CTA) */}
      <div className="alert alert-info border-0 shadow-sm d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-start gap-2">
          <FiInfo size={22} className="text-info flex-shrink-0 mt-1" />
          <div>
            <div className="fw-bold mb-1">
              {t('planner.cta_info', 'Notice: This is a read-only reporting view.')}
            </div>
            <div className="small text-muted">
              {t('planner.cta_edit_time', 'To edit study hours, visit the')}{' '}
              <Link to="/schedule/daily" className="fw-bold text-decoration-underline text-info">
                {t('planner.daily_schedule_link', 'Daily Schedule')}
              </Link>
              .{' '}
              {t('planner.cta_edit_tests', 'To edit test results, visit the')}{' '}
              <Link to="/schedule/conclusion-plan" className="fw-bold text-decoration-underline text-info">
                {t('planner.conclusion_plan_link', 'Conclusion Plan')}
              </Link>
              .
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchPerformance(currentWeekStart)}
          className="btn btn-sm btn-outline-info text-nowrap d-flex align-items-center gap-1"
          disabled={loading}
        >
          <FiRefreshCw className={loading ? 'spin' : ''} />
          {t('common.search', 'Refresh')}
        </button>
      </div>

      {/* Week Date Range Badge */}
      {data && (
        <div className="mb-3 d-flex align-items-center gap-2">
          <span className="badge bg-secondary-subtle text-secondary px-3 py-2 fs-6 rounded-pill">
            📅 {t('planner.week_range', { start: data.week_start, end: data.week_end })}
          </span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="alert alert-danger shadow-sm mb-4">
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card h-100 shadow-sm border-0 border-top border-3 border-primary">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-medium">
                  {t('planner.total_read_time', 'Total Reading Time')}
                </span>
                <div className="p-2 bg-primary-subtle text-primary rounded-circle">
                  <FiBookOpen size={20} />
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-primary">
                {formatMinutesToHours(data?.total_read_time_minutes || 0, t)}
              </h3>
              <small className="text-muted">
                {data?.total_read_time_minutes || 0} {t('planner.minutes_abbr', 'min')}
              </small>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card h-100 shadow-sm border-0 border-top border-3 border-info">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-medium">
                  {t('planner.total_review_time', 'Total Review Time')}
                </span>
                <div className="p-2 bg-info-subtle text-info rounded-circle">
                  <FiClock size={20} />
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-info">
                {formatMinutesToHours(data?.total_review_time_minutes || 0, t)}
              </h3>
              <small className="text-muted">
                {data?.total_review_time_minutes || 0} {t('planner.minutes_abbr', 'min')}
              </small>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card h-100 shadow-sm border-0 border-top border-3 border-warning">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-medium">
                  {t('planner.total_tests', 'Total Tests Solved')}
                </span>
                <div className="p-2 bg-warning-subtle text-warning rounded-circle">
                  <FiCheckCircle size={20} />
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-warning">
                {data?.total_test_count || 0}
              </h3>
              <small className="text-muted">
                {t('planner.test_count', 'Tests Solved')}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Main Aggregated Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-transparent border-bottom py-3">
          <h5 className="mb-0 fw-bold">
            {t('planner.performed_weekly_plan', 'Performed Weekly Plan')}
          </h5>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
              </div>
              <p className="mt-2 text-muted">{t('planner.loading_plan', 'Loading weekly performance...')}</p>
            </div>
          ) : !data?.chapter_records || data.chapter_records.length === 0 ? (
            <div className="text-center py-5">
              <FiBookOpen size={40} className="text-muted mb-3 opacity-50" />
              <p className="text-muted mb-0">{t('planner.no_records_for_week', 'No study activities or tests recorded for this week.')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">{t('planner.course_title', 'Course / Exam')}</th>
                    <th>{t('planner.chapter_title', 'Chapter')}</th>
                    <th className="text-center">{t('planner.read_time', 'Reading (mins)')}</th>
                    <th className="text-center">{t('planner.review_time', 'Review (mins)')}</th>
                    <th className="text-center pe-3">{t('planner.test_count', 'Tests Solved')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.chapter_records.map((record) => (
                    <tr key={record.chapter_id}>
                      <td className="ps-3 fw-bold text-dark">{record.source_material_title}</td>
                      <td>
                        <span className="badge bg-light text-dark border px-2 py-1">
                          {record.chapter_title}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="fw-semibold text-primary">
                          {record.read_time_minutes > 0 ? `${record.read_time_minutes} m` : '—'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="fw-semibold text-info">
                          {record.review_time_minutes > 0 ? `${record.review_time_minutes} m` : '—'}
                        </span>
                      </td>
                      <td className="text-center pe-3">
                        <span className="badge bg-warning text-dark px-3 py-1 fw-bold">
                          {record.test_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformedWeeklyPlan;
