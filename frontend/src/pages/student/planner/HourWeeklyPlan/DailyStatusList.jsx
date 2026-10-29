import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiClock,
  FiCheckCircle,
  FiLock,
  FiEdit2,
  FiEye,
  FiCalendar
} from 'react-icons/fi';

const formatDuration = (mins, t) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) {
    return `${h} ${t('weekly_hours.hours_abbr', 'h')} ${m} ${t('weekly_hours.minutes_abbr', 'min')}`;
  }
  if (h > 0) {
    return `${h} ${t('weekly_hours.hours_abbr', 'h')}`;
  }
  return `${m} ${t('weekly_hours.minutes_abbr', 'min')}`;
};

const DailyStatusList = ({ days = [], selectedDate, onSelectDay, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="card border-0 shadow-sm rounded-3 p-4 text-center">
        <div className="spinner-border text-primary mx-auto mb-2" role="status" />
        <span className="text-muted small">{t('common.loading', 'Loading...')}</span>
      </div>
    );
  }

  if (!days || days.length === 0) {
    return (
      <div className="card border-0 shadow-sm rounded-3 p-4 text-center text-muted">
        <FiCalendar size={32} className="mx-auto mb-2 text-muted opacity-50" />
        <p className="mb-0">{t('weekly_hours.empty_days', 'No days found for this week.')}</p>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
      <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
        <h6 className="card-title fw-bold mb-0 d-flex align-items-center gap-2">
          <FiCalendar className="text-primary" />
          {t('weekly_hours.days_list_title', 'Days of the Week')}
        </h6>
        <span className="badge bg-light text-dark border">
          {days.length} {t('dashboard.days', 'Days')}
        </span>
      </div>

      <div className="list-group list-group-flush">
        {days.map((day) => {
          const isSelected = selectedDate === day.date;
          return (
            <div
              key={day.date}
              onClick={() => onSelectDay(day)}
              className={`list-group-item list-group-item-action p-3 d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 border-bottom transition-all ${
                isSelected ? 'bg-primary-subtle border-start border-primary border-4 shadow-xs' : ''
              }`}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex flex-column">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="fw-bold text-dark fs-6">
                    {day.day_name_jalali || day.date}
                  </span>
                  <span className="badge bg-light text-secondary border font-monospace small">
                    {day.date}
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2 small text-muted">
                  <span className="d-flex align-items-center gap-1">
                    <FiClock size={14} className="text-primary" />
                    {t('weekly_hours.total_study_time', 'Total Study')}:
                  </span>
                  <strong className="text-dark">
                    {formatDuration(day.total_study_duration_minutes || 0, t)}
                  </strong>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 align-self-end align-self-sm-center">
                {/* Status Badges */}
                {day.is_locked ? (
                  <span className="badge bg-secondary d-flex align-items-center gap-1 py-1 px-2">
                    <FiLock size={12} />
                    {t('weekly_hours.status_locked', 'Locked')}
                  </span>
                ) : day.is_finalized ? (
                  <span className="badge bg-success d-flex align-items-center gap-1 py-1 px-2">
                    <FiCheckCircle size={12} />
                    {t('weekly_hours.status_finalized', 'Finalized')}
                  </span>
                ) : (
                  <span className="badge bg-warning text-dark d-flex align-items-center gap-1 py-1 px-2">
                    <FiClock size={12} />
                    {t('weekly_hours.status_pending', 'Pending')}
                  </span>
                )}

                <button
                  type="button"
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center gap-1`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDay(day);
                  }}
                >
                  {day.is_locked ? <FiEye size={14} /> : <FiEdit2 size={14} />}
                  <span>{day.is_locked ? t('weekly_hours.view_day', 'View') : t('weekly_hours.edit_day', 'Edit')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyStatusList;
