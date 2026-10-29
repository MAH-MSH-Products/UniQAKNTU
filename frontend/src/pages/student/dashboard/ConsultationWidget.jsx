import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiCalendar,
  FiClock,
  FiUserCheck,
  FiCheck,
  FiAlertCircle,
  FiPlusCircle,
} from 'react-icons/fi';
import { getConsultations, bookConsultation } from '../../../services/api';
import { getErrorMessage } from '../../../utils/errorHandler';

const DAYS_OF_WEEK = [
  { value: 1, labelKey: 'dashboard.days_names.1', defaultLabel: 'شنبه (Shanbeh)' },
  { value: 2, labelKey: 'dashboard.days_names.2', defaultLabel: 'یکشنبه (Yekshanbeh)' },
  { value: 3, labelKey: 'dashboard.days_names.3', defaultLabel: 'دوشنبه (Doshanbeh)' },
  { value: 4, labelKey: 'dashboard.days_names.4', defaultLabel: 'سه‌شنبه (Seshanbeh)' },
  { value: 5, labelKey: 'dashboard.days_names.5', defaultLabel: 'چهارشنبه (Chaharshanbeh)' },
  { value: 6, labelKey: 'dashboard.days_names.6', defaultLabel: 'پنج‌شنبه (Panjshanbeh)' },
  { value: 7, labelKey: 'dashboard.days_names.7', defaultLabel: 'جمعه (Jomeh)' },
];

const STANDARD_TIME_SLOTS = [
  '08:00:00',
  '09:00:00',
  '10:00:00',
  '11:00:00',
  '14:00:00',
  '15:00:00',
  '16:00:00',
  '17:00:00',
  '18:00:00',
];

const ConsultationWidget = () => {
  const { t } = useTranslation();
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [timeSlot, setTimeSlot] = useState('09:00:00');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await getConsultations();
      setBookings(res.data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'errors.default'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await bookConsultation({
        day_of_week: Number(dayOfWeek),
        time_slot: timeSlot,
      });
      setSuccessMsg(t('dashboard.booking_success', 'Consultation slot booked successfully.'));
      fetchBookings();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(getErrorMessage(err, 'errors.default'));
    } finally {
      setSubmitting(false);
    }
  };

  const getDayName = (dayNumber) => {
    const found = DAYS_OF_WEEK.find((d) => d.value === dayNumber);
    return found ? t(found.labelKey, found.defaultLabel) : `Day ${dayNumber}`;
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
        <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
          <FiUserCheck className="text-primary" />
          {t('dashboard.consultation', 'Book Consultation')}
        </h5>
        <p className="text-muted small mb-0">
          {t('dashboard.consultation_desc', 'Select a convenient slot for your weekly academic consultation')}
        </p>
      </div>

      <div className="card-body px-4 pb-4">
        {error && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
            <FiCheck />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleBookingSubmit} className="mb-4 p-3 rounded-3 bg-light border border-light-subtle">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-sm-5">
              <label className="form-label small fw-semibold d-flex align-items-center gap-1 mb-1">
                <FiCalendar className="text-muted" />
                {t('dashboard.day_of_week', 'Day of Week')}
              </label>
              <select
                className="form-select form-select-sm"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                disabled={submitting}
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.value} value={d.value}>
                    {t(d.labelKey, d.defaultLabel)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-sm-4">
              <label className="form-label small fw-semibold d-flex align-items-center gap-1 mb-1">
                <FiClock className="text-muted" />
                {t('dashboard.time_slot', 'Session Time')}
              </label>
              <select
                className="form-select form-select-sm"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                disabled={submitting}
              >
                {STANDARD_TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot.slice(0, 5)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-sm-3">
              <button
                type="submit"
                className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1 py-2 rounded-3"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                ) : (
                  <>
                    <FiPlusCircle />
                    <span>{t('dashboard.book_now', 'Book')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Booked Sessions List */}
        <div>
          <h6 className="small fw-bold text-muted text-uppercase mb-2">
            {t('dashboard.booked_consultations', 'Booked Sessions')}
          </h6>

          {loading ? (
            <div className="text-center py-3 text-muted small">
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              <span>{t('common.loading', 'Loading...')}</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-muted small py-2 text-center bg-light rounded-3">
              {t('dashboard.no_consultations', 'No consultation sessions booked yet.')}
            </div>
          ) : (
            <div className="d-flex flex-column gap-2" style={{ maxHeight: '160px', overflowY: 'auto' }}>
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-2 px-3 rounded-3 bg-light border d-flex justify-content-between align-items-center small"
                >
                  <div className="d-flex align-items-center gap-2">
                    <FiCalendar className="text-primary" />
                    <span className="fw-semibold">{getDayName(b.day_of_week)}</span>
                  </div>
                  <div className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 font-monospace">
                    {b.time_slot ? b.time_slot.slice(0, 5) : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationWidget;
