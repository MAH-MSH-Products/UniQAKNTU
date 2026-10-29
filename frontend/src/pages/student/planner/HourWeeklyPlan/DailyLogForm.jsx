import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiClock,
  FiMoon,
  FiBookOpen,
  FiPlus,
  FiTrash2,
  FiSave,
  FiAlertTriangle,
  FiCheckCircle,
  FiLock,
  FiInfo
} from 'react-icons/fi';
import { useSourceMaterials } from '../../../../context/SourceMaterialsContext';
import {
  getDailyStudyLog,
  saveDailyStudyLog,
  getConclusionPlanChapters
} from '../../../../services/api';
import { getErrorMessage } from '../../../../utils/errorHandler';

const ACTIVITY_TYPES = ['READING', 'REVIEW', 'CLASS'];

const formatMinutesToHours = (totalMins, t) => {
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

const ActivityRow = ({
  activity,
  index,
  books,
  isLocked,
  onChange,
  onRemove,
  t
}) => {
  const [chapters, setChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  // Fetch chapters when sourceMaterialId changes
  useEffect(() => {
    let isMounted = true;
    if (activity.sourceMaterialId) {
      setLoadingChapters(true);
      getConclusionPlanChapters(activity.sourceMaterialId)
        .then((res) => {
          if (isMounted) {
            setChapters(res.data || []);
          }
        })
        .catch(() => {
          if (isMounted) setChapters([]);
        })
        .finally(() => {
          if (isMounted) setLoadingChapters(false);
        });
    } else {
      setChapters([]);
    }
    return () => {
      isMounted = false;
    };
  }, [activity.sourceMaterialId]);

  const hours = Math.floor((activity.duration_minutes || 0) / 60);
  const minutes = (activity.duration_minutes || 0) % 60;

  const handleBookChange = (e) => {
    const bookId = e.target.value ? parseInt(e.target.value, 10) : '';
    onChange(index, {
      ...activity,
      sourceMaterialId: bookId,
      chapter_id: '' // reset chapter when book changes
    });
  };

  const handleChapterChange = (e) => {
    const chapterId = e.target.value ? parseInt(e.target.value, 10) : '';
    onChange(index, {
      ...activity,
      chapter_id: chapterId
    });
  };

  const handleTypeChange = (e) => {
    onChange(index, {
      ...activity,
      activity_type: e.target.value
    });
  };

  const handleHoursChange = (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 24) val = 24;
    const newTotal = val * 60 + minutes;
    onChange(index, {
      ...activity,
      duration_minutes: Math.min(newTotal, 1440)
    });
  };

  const handleMinutesChange = (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 59) val = 59;
    const newTotal = hours * 60 + val;
    onChange(index, {
      ...activity,
      duration_minutes: Math.min(newTotal, 1440)
    });
  };

  return (
    <div className="card mb-3 border bg-light-subtle shadow-xs rounded-3 p-3">
      <div className="row g-2 align-items-center">
        {/* Book / Course Dropdown */}
        <div className="col-12 col-md-4">
          <label className="form-label small text-muted mb-1">
            {t('weekly_hours.book', 'Course / Book')}
          </label>
          <select
            className="form-select form-select-sm"
            value={activity.sourceMaterialId || ''}
            onChange={handleBookChange}
            disabled={isLocked}
          >
            <option value="">{t('weekly_hours.select_book', 'Select book...')}</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>

        {/* Chapter Dropdown */}
        <div className="col-12 col-md-3">
          <label className="form-label small text-muted mb-1">
            {t('weekly_hours.chapter', 'Chapter')}
            {loadingChapters && <span className="spinner-border spinner-border-sm ms-1" />}
          </label>
          <select
            className="form-select form-select-sm"
            value={activity.chapter_id || ''}
            onChange={handleChapterChange}
            disabled={isLocked || !activity.sourceMaterialId || loadingChapters}
          >
            <option value="">{t('weekly_hours.select_chapter', 'Select chapter...')}</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Activity Type */}
        <div className="col-6 col-md-2">
          <label className="form-label small text-muted mb-1">
            {t('weekly_hours.activity_type', 'Activity')}
          </label>
          <select
            className="form-select form-select-sm"
            value={activity.activity_type}
            onChange={handleTypeChange}
            disabled={isLocked}
          >
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`weekly_hours.types.${type}`, type)}
              </option>
            ))}
          </select>
        </div>

        {/* Duration Input: Hours & Minutes */}
        <div className="col-5 col-md-2">
          <label className="form-label small text-muted mb-1">
            {t('weekly_hours.duration', 'Duration')}
          </label>
          <div className="input-group input-group-sm">
            <input
              type="number"
              min="0"
              max="24"
              value={hours}
              onChange={handleHoursChange}
              disabled={isLocked}
              className="form-control text-center p-1"
              placeholder="0"
              title={t('weekly_hours.hours', 'Hours')}
            />
            <span className="input-group-text p-1 text-muted">:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={handleMinutesChange}
              disabled={isLocked}
              className="form-control text-center p-1"
              placeholder="00"
              title={t('weekly_hours.minutes', 'Minutes')}
            />
          </div>
        </div>

        {/* Remove Button */}
        <div className="col-1 col-md-1 text-end d-flex align-items-end justify-content-end">
          {!isLocked && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger p-1 mt-md-4"
              onClick={() => onRemove(index)}
              title={t('weekly_hours.remove_activity', 'Remove')}
            >
              <FiTrash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DailyLogForm = ({ selectedDay, onLogSaved, onCancel }) => {
  const { t } = useTranslation();
  const { materials } = useSourceMaterials();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [sleepHours, setSleepHours] = useState(0);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [isFinalized, setIsFinalized] = useState(false);
  const [activities, setActivities] = useState([]);

  const isLocked = selectedDay?.is_locked || false;

  // Load existing data for selected day
  const fetchDayLog = useCallback(async (dateStr) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await getDailyStudyLog(dateStr);
      const data = res.data;
      const sleepTotal = data.sleep_duration_minutes || 0;
      setSleepHours(Math.floor(sleepTotal / 60));
      setSleepMinutes(sleepTotal % 60);
      setIsFinalized(data.is_finalized || false);

      const loadedActivities = (data.activities || []).map((act) => ({
        id: act.id,
        sourceMaterialId: act.source_material_id || '',
        chapter_id: act.chapter_id || '',
        activity_type: act.activity_type || 'READING',
        duration_minutes: act.duration_minutes || 0
      }));
      setActivities(loadedActivities);
    } catch (err) {
      setError(getErrorMessage(err, 'errors.default'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDay?.date) {
      fetchDayLog(selectedDay.date);
    }
  }, [selectedDay?.date, fetchDayLog]);

  // Handle sleep duration changes
  const handleSleepHoursChange = (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 24) val = 24;
    setSleepHours(val);
  };

  const handleSleepMinutesChange = (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 59) val = 59;
    setSleepMinutes(val);
  };

  // Add new activity row
  const handleAddActivity = () => {
    setActivities((prev) => [
      ...prev,
      {
        sourceMaterialId: '',
        chapter_id: '',
        activity_type: 'READING',
        duration_minutes: 60
      }
    ]);
  };

  // Update activity row
  const handleActivityChange = (index, updatedAct) => {
    setActivities((prev) => {
      const next = [...prev];
      next[index] = updatedAct;
      return next;
    });
  };

  // Remove activity row
  const handleRemoveActivity = (index) => {
    setActivities((prev) => prev.filter((_, i) => i !== index));
  };

  // Total calculations
  const totalSleepMinutes = sleepHours * 60 + sleepMinutes;
  const totalStudyMinutes = useMemo(() => {
    return activities.reduce((acc, act) => acc + (act.duration_minutes || 0), 0);
  }, [activities]);

  const totalDayMinutes = totalSleepMinutes + totalStudyMinutes;
  const isTimeExceeded = totalDayMinutes > 1440; // Over 24 hours

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    if (isTimeExceeded) {
      setError(t('weekly_hours.time_exceeded_error', 'Total time cannot exceed 24 hours.'));
      return;
    }

    // Validate that activities with duration have a chapter selected
    for (let i = 0; i < activities.length; i++) {
      const act = activities[i];
      if (!act.chapter_id) {
        setError(t('planner.select_chapter', 'Please select a chapter for all activities.'));
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      sleep_duration_minutes: totalSleepMinutes,
      is_finalized: isFinalized,
      activities: activities.map((act) => ({
        chapter_id: act.chapter_id,
        activity_type: act.activity_type,
        duration_minutes: act.duration_minutes
      }))
    };

    try {
      const res = await saveDailyStudyLog(selectedDay.date, payload);
      setSuccessMsg(res.data?.message || t('weekly_hours.success_saved', 'Saved successfully.'));
      if (onLogSaved) {
        onLogSaved();
      }
    } catch (err) {
      setError(getErrorMessage(err, 'errors.default'));
    } finally {
      setSaving(false);
    }
  };

  if (!selectedDay) {
    return (
      <div className="card border-0 shadow-sm rounded-3 p-4 text-center text-muted">
        <FiInfo size={32} className="mx-auto mb-2 opacity-50 text-primary" />
        <p className="mb-0">{t('weekly_hours.select_day_hint', 'Select a day from the list to view or enter hours.')}</p>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
      <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
        <div>
          <h6 className="card-title fw-bold mb-1 d-flex align-items-center gap-2">
            <FiClock className="text-primary" />
            {t('weekly_hours.day_details', { day: selectedDay.day_name_jalali || selectedDay.date })}
          </h6>
          <span className="small text-muted font-monospace">{selectedDay.date}</span>
        </div>

        <div>
          {isLocked ? (
            <span className="badge bg-secondary d-flex align-items-center gap-1 py-1 px-2">
              <FiLock size={12} />
              {t('weekly_hours.status_locked', 'Locked')}
            </span>
          ) : isFinalized ? (
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
        </div>
      </div>

      <div className="card-body p-4">
        {/* Locked Day Warning Alert */}
        {isLocked && (
          <div className="alert alert-secondary border-0 d-flex align-items-center gap-2 mb-3">
            <FiLock size={18} className="text-secondary flex-shrink-0" />
            <div className="small">
              {t('weekly_hours.locked_warning', 'This day is locked because the edit deadline has passed.')}
            </div>
          </div>
        )}

        {/* Error / Success Feedback */}
        {error && (
          <div className="alert alert-danger border-0 d-flex align-items-center gap-2 mb-3">
            <FiAlertTriangle size={18} className="text-danger flex-shrink-0" />
            <div className="small">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success border-0 d-flex align-items-center gap-2 mb-3">
            <FiCheckCircle size={18} className="text-success flex-shrink-0" />
            <div className="small">{successMsg}</div>
          </div>
        )}

        {loading ? (
          <div className="py-5 text-center">
            <div className="spinner-border text-primary mx-auto mb-2" role="status" />
            <div className="text-muted small">{t('common.loading', 'Loading daily log...')}</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Sleep Duration Section */}
            <div className="p-3 bg-light rounded-3 mb-4 border">
              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-2">
                  <FiMoon size={20} className="text-indigo" />
                  <div>
                    <h6 className="fw-bold mb-0">{t('weekly_hours.sleep_duration', 'Sleep Duration')}</h6>
                    <span className="small text-muted">
                      {t('weekly_hours.sleep_duration_hint', 'Enter sleep duration in hours and minutes.')}
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <div className="input-group input-group-sm" style={{ width: '140px' }}>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={sleepHours}
                      onChange={handleSleepHoursChange}
                      disabled={isLocked}
                      className="form-control text-center"
                      title={t('weekly_hours.hours', 'Hours')}
                    />
                    <span className="input-group-text">:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={sleepMinutes}
                      onChange={handleSleepMinutesChange}
                      disabled={isLocked}
                      className="form-control text-center"
                      title={t('weekly_hours.minutes', 'Minutes')}
                    />
                  </div>
                  <span className="small text-muted">{formatMinutesToHours(totalSleepMinutes, t)}</span>
                </div>
              </div>
            </div>

            {/* Study Activities Section */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <FiBookOpen className="text-primary" />
                  {t('weekly_hours.activities_title', 'Daily Study Activities')}
                  <span className="badge bg-secondary-subtle text-secondary small">
                    {activities.length}
                  </span>
                </h6>

                {!isLocked && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                    onClick={handleAddActivity}
                  >
                    <FiPlus size={14} />
                    <span>{t('weekly_hours.add_activity', 'Add Activity')}</span>
                  </button>
                )}
              </div>

              {activities.length === 0 ? (
                <div className="p-4 border border-dashed rounded-3 text-center text-muted bg-white mb-3">
                  <p className="mb-2 small">{t('weekly_hours.no_activities', 'No study activities logged yet.')}</p>
                  {!isLocked && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={handleAddActivity}
                    >
                      {t('weekly_hours.add_activity', 'Add First Activity')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="activities-list">
                  {activities.map((act, index) => (
                    <ActivityRow
                      key={index}
                      activity={act}
                      index={index}
                      books={materials}
                      isLocked={isLocked}
                      onChange={handleActivityChange}
                      onRemove={handleRemoveActivity}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Finalized Checkbox */}
            <div className="form-check form-switch mb-4 p-3 bg-white border rounded-3 d-flex align-items-center gap-3">
              <input
                className="form-check-input ms-0 me-2"
                type="checkbox"
                id="isFinalizedSwitch"
                checked={isFinalized}
                onChange={(e) => setIsFinalized(e.target.checked)}
                disabled={isLocked}
                style={{ transform: 'scale(1.2)' }}
              />
              <label className="form-check-label fw-bold small text-dark mb-0" htmlFor="isFinalizedSwitch">
                {t('weekly_hours.is_finalized_label', 'Mark this day as finalized and completed')}
              </label>
            </div>

            {/* Daily Total Summary & 24h Constraint Banner */}
            <div className={`p-3 rounded-3 mb-4 border ${isTimeExceeded ? 'bg-danger-subtle border-danger' : 'bg-light'}`}>
              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
                <div className="small">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span>{t('weekly_hours.total_study_time', 'Study Time')}:</span>
                    <strong>{formatMinutesToHours(totalStudyMinutes, t)}</strong>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span>{t('weekly_hours.total_day_time', 'Total Logged (Sleep + Study)')}:</span>
                    <strong className={isTimeExceeded ? 'text-danger' : 'text-primary'}>
                      {formatMinutesToHours(totalDayMinutes, t)} / 24 {t('weekly_hours.hours_abbr', 'h')}
                    </strong>
                  </div>
                </div>

                {isTimeExceeded && (
                  <div className="text-danger small fw-bold d-flex align-items-center gap-1">
                    <FiAlertTriangle size={16} />
                    {t('weekly_hours.time_exceeded_error', 'Cannot exceed 24 hours.')}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="d-flex align-items-center justify-content-end gap-2">
              {onCancel && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-3"
                  onClick={onCancel}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              )}

              {!isLocked && (
                <button
                  type="submit"
                  className="btn btn-sm btn-primary px-4 d-flex align-items-center gap-1"
                  disabled={saving || isTimeExceeded}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" />
                      <span>{t('weekly_hours.saving', 'Saving...')}</span>
                    </>
                  ) : (
                    <>
                      <FiSave size={15} />
                      <span>{t('weekly_hours.save_daily_log', 'Save Daily Log')}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DailyLogForm;
