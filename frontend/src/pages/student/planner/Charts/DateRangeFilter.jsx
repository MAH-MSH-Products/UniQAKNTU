import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiFilter, FiCheck, FiX } from 'react-icons/fi';

const intervals = ['daily', 'weekly', 'monthly', '3-month', '6-month', '1-year', 'all'];

const DateRangeFilter = ({
  activeInterval,
  onSelectInterval,
  startDate,
  endDate,
  onApplyCustomDates,
  onResetDates,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempStart, setTempStart] = useState(startDate || '');
  const [tempEnd, setTempEnd] = useState(endDate || '');

  const handleApply = (e) => {
    e.preventDefault();
    onApplyCustomDates(tempStart, tempEnd);
    setShowCustomModal(false);
  };

  const handleClear = () => {
    setTempStart('');
    setTempEnd('');
    onResetDates();
    setShowCustomModal(false);
  };

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Interval Pills */}
      <div className="d-flex flex-wrap align-items-center gap-1 bg-light p-1 rounded-pill border">
        {intervals.map((intv) => (
          <button
            key={intv}
            type="button"
            className={`btn btn-sm rounded-pill px-3 py-1 border-0 ${
              activeInterval === intv && !startDate && !endDate
                ? 'btn-primary shadow-sm'
                : 'text-secondary'
            }`}
            onClick={() => {
              onResetDates();
              onSelectInterval(intv);
            }}
          >
            {t(`analytics.intervals.${intv}`, intv)}
          </button>
        ))}
      </div>

      {/* Custom Date Range Button & Modal */}
      <div>
        <button
          type="button"
          className={`btn btn-sm d-inline-flex align-items-center gap-2 rounded-pill px-3 py-1 ${
            startDate || endDate ? 'btn-primary' : 'btn-outline-secondary'
          }`}
          onClick={() => setShowCustomModal(true)}
        >
          <FiCalendar size={15} />
          <span>
            {startDate || endDate
              ? `${startDate || '...'} ${t('common.to', 'تا')} ${endDate || '...'}`
              : t('analytics.custom_date', 'بازه انتخابی')}
          </span>
        </button>

        {/* Modal for Custom Dates */}
        {showCustomModal && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
            onClick={() => setShowCustomModal(false)}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="modal-header bg-primary text-white py-3">
                  <h6 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                    <FiFilter size={18} />
                    {t('analytics.custom_date', 'بازه تاریخی انتخابی')}
                  </h6>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowCustomModal(false)}
                  />
                </div>

                <form onSubmit={handleApply}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">
                        {t('reports.start_date', 'تاریخ شروع')}
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={tempStart}
                        onChange={(e) => setTempStart(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">
                        {t('reports.end_date', 'تاریخ پایان')}
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={tempEnd}
                        onChange={(e) => setTempEnd(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="modal-footer bg-light py-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                      onClick={handleClear}
                    >
                      <FiX size={16} />
                      <span>{t('reports.reset_filter', 'بازنشانی')}</span>
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm btn-primary d-flex align-items-center gap-1 px-4"
                    >
                      <FiCheck size={16} />
                      <span>{t('reports.apply_filter', 'اعمال')}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateRangeFilter;
