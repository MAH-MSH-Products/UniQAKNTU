import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiClock,
  FiVideo,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiAlertCircle,
  FiInfo,
  FiCheckCircle
} from 'react-icons/fi';
import { getWeeklyHoursOverview } from '../../../../services/api';
import { getErrorMessage } from '../../../../utils/errorHandler';
import DailyStatusList from './DailyStatusList';
import DailyLogForm from './DailyLogForm';
import VideoHelpModal from './VideoHelpModal';

/**
 * Shifts date by given number of days.
 */
const shiftDate = (dateStr, days) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const formatDuration = (totalMins, t) => {
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0 && mins > 0) {
    return `${hours} ${t('weekly_hours.hours_abbr', 'h')} ${mins} ${t('weekly_hours.minutes_abbr', 'min')}`;
  }
  if (hours > 0) {
    return `${hours} ${t('weekly_hours.hours_abbr', 'h')}`;
  }
  return `${mins} ${t('weekly_hours.minutes_abbr', 'min')}`;
};

const HourWeeklyPlan = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';

  const [activeDate, setActiveDate] = useState('');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDay, setSelectedDay] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Fetch weekly overview
  const fetchOverview = useCallback(async (dateParam) => {
    setLoading(true);
    setError(null);
    try {
      const params = dateParam ? { date: dateParam } : {};
      const res = await getWeeklyHoursOverview(params);
      const data = res.data;
      setOverview(data);

      // Default selected day: first day or current day if matched
      if (data?.days?.length > 0) {
        setSelectedDay((prev) => {
          if (prev) {
            const found = data.days.find((d) => d.date === prev.date);
            if (found) return found;
          }
          // Default to today if in range, otherwise first day
          const todayStr = new Date().toISOString().split('T')[0];
          const todayMatch = data.days.find((d) => d.date === todayStr);
          return todayMatch || data.days[0];
        });
      }
    } catch (err) {
      setError(getErrorMessage(err, 'errors.default'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview(activeDate);
  }, [activeDate, fetchOverview]);

  // Week navigation
  const handlePrevWeek = () => {
    const baseDate = overview?.start_date || activeDate || new Date().toISOString().split('T')[0];
    const prevWeekDate = shiftDate(baseDate, -7);
    setActiveDate(prevWeekDate);
  };

  const handleNextWeek = () => {
    const baseDate = overview?.start_date || activeDate || new Date().toISOString().split('T')[0];
    const nextWeekDate = shiftDate(baseDate, 7);
    setActiveDate(nextWeekDate);
  };

  const handleCurrentWeek = () => {
    setActiveDate('');
  };

  // Total study duration for the entire week
  const totalWeeklyStudyMinutes = useMemo(() => {
    if (!overview?.days) return 0;
    return overview.days.reduce(
      (acc, d) => acc + (d.total_study_duration_minutes || 0),
      0
    );
  }, [overview?.days]);

  const finalizedDaysCount = useMemo(() => {
    if (!overview?.days) return 0;
    return overview.days.filter((d) => d.is_finalized).length;
  }, [overview?.days]);

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <FiClock className="text-primary" />
            {t('weekly_hours.title', 'Weekly Study Hours')}
          </h2>
          <p className="text-muted mb-0">
            {t('weekly_hours.subtitle', 'Track and manage your daily reading, review, class, and sleep hours.')}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Help Video Trigger Button */}
          <button
            type="button"
            className="btn btn-outline-primary d-flex align-items-center gap-2 shadow-xs"
            onClick={() => setIsVideoModalOpen(true)}
          >
            <FiVideo size={18} />
            <span>{t('weekly_hours.help_video', 'Help Video')}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            className="btn btn-light border d-flex align-items-center gap-1 shadow-xs"
            onClick={() => fetchOverview(activeDate)}
            disabled={loading}
            title={t('common.search', 'Refresh')}
          >
            <FiRefreshCw className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Week Navigator & Metrics Strip */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white">
        <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
          {/* Week Info & Date Range */}
          <div className="d-flex align-items-center gap-3">
            <div className="p-2 bg-primary-subtle text-primary rounded-3">
              <FiCalendar size={26} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h5 className="fw-bold mb-0">
                  {t('weekly_hours.week_number', { number: overview?.week_number || 1 })}
                </h5>
                {overview?.can_edit_previous_week && (
                  <span className="badge bg-info-subtle text-info border border-info-subtle small">
                    <FiCheckCircle className="me-1" />
                    {t('weekly_hours.status_finalized', 'Active')}
                  </span>
                )}
              </div>
              <div className="small text-muted font-monospace">
                {overview?.start_date && overview?.end_date ? (
                  <span>
                    {overview.start_date} ~ {overview.end_date}
                  </span>
                ) : (
                  '...'
                )}
              </div>
            </div>
          </div>

          {/* KPI Summary: Weekly Study Hours & Finalized Count */}
          <div className="d-flex align-items-center gap-4">
            <div className="text-center text-sm-start">
              <div className="small text-muted mb-0">{t('weekly_hours.total_study_time', 'Weekly Study Time')}</div>
              <div className="fs-5 fw-bold text-primary">
                {formatDuration(totalWeeklyStudyMinutes, t)}
              </div>
            </div>

            <div className="vr d-none d-sm-block my-1" />

            <div className="text-center text-sm-start">
              <div className="small text-muted mb-0">{t('weekly_hours.days_list_title', 'Finalized Days')}</div>
              <div className="fs-5 fw-bold text-success">
                {finalizedDaysCount} / {overview?.days?.length || 7}
              </div>
            </div>
          </div>

          {/* Week Selector Controls */}
          <div className="d-flex align-items-center gap-2 bg-light p-1 rounded border">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={isRTL ? handleNextWeek : handlePrevWeek}
              title={t('planner.prev_week', 'Previous Week')}
            >
              {isRTL ? <FiChevronRight /> : <FiChevronLeft />}
              <span className="d-none d-sm-inline">{t('planner.prev_week', 'Previous')}</span>
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
              <span className="d-none d-sm-inline">{t('planner.next_week', 'Next')}</span>
              {isRTL ? <FiChevronLeft /> : <FiChevronRight />}
            </button>
          </div>
        </div>
      </div>

      {/* Temporal Edit Rule Hint Alert */}
      <div className="alert alert-info border-0 shadow-sm d-flex align-items-start gap-2 mb-4">
        <FiInfo size={20} className="text-info flex-shrink-0 mt-1" />
        <div className="small">
          {t(
            'weekly_hours.can_edit_previous_week_hint',
            'You can view and modify study hours for both the current active week and the immediately preceding week. Older weeks are locked.'
          )}
        </div>
      </div>

      {/* Global Error Alert */}
      {error && (
        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center gap-2 mb-4">
          <FiAlertCircle size={20} className="text-danger flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Main Split Grid: Days List (Left) & Daily Log Form (Right) */}
      <div className="row g-4">
        {/* Days List Column */}
        <div className="col-12 col-lg-5 col-xl-4">
          <DailyStatusList
            days={overview?.days || []}
            selectedDate={selectedDay?.date}
            onSelectDay={(day) => setSelectedDay(day)}
            loading={loading}
          />
        </div>

        {/* Daily Log Form Column */}
        <div className="col-12 col-lg-7 col-xl-8">
          <DailyLogForm
            selectedDay={selectedDay}
            onLogSaved={() => fetchOverview(activeDate)}
            onCancel={() => {}}
          />
        </div>
      </div>

      {/* Video Help Modal */}
      <VideoHelpModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </div>
  );
};

export default HourWeeklyPlan;
