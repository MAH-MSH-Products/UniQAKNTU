import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiFileText,
  FiCalendar,
  FiClock,
  FiCheckSquare,
  FiDownload,
  FiEye,
  FiVideo,
  FiFilter,
  FiRotateCcw,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';
import { downloadReportPdf } from '../../../../services/api';
import VideoHelpModal from '../HourWeeklyPlan/VideoHelpModal';
import './Reports.css';

/**
 * Calculates start and end dates of the previous Jalali/calendar week.
 */
const getPreviousWeekRange = () => {
  const now = new Date();
  const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const past14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  return {
    start: past14.toISOString().split('T')[0],
    end: past7.toISOString().split('T')[0],
  };
};

const ReportsList = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'fa';

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloadingType, setDownloadingType] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleQuickCurrentWeek = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleQuickPreviousWeek = () => {
    const range = getPreviousWeekRange();
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const handleView = (reportType) => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.set('start_date', startDate);
    if (endDate) queryParams.set('end_date', endDate);
    const queryString = queryParams.toString();
    navigate(`/reports/view/${reportType}${queryString ? `?${queryString}` : ''}`);
  };

  const handleDownloadPdf = async (reportType) => {
    setDownloadingType(reportType);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      await downloadReportPdf(reportType, params);
      showToast('success', t('reports.pdf_download_success', 'PDF downloaded successfully.'));
    } catch (err) {
      console.error('PDF download error:', err);
      showToast('error', t('reports.pdf_download_error', 'Failed to download PDF. Please try again.'));
    } finally {
      setDownloadingType(null);
    }
  };

  const reportCards = [
    {
      type: 'weekly',
      title: t('reports.weekly_title', 'گزارش برنامه هفتگی روزانه'),
      description: t('reports.weekly_desc', 'گزارش ساعات تخصیص‌یافته به دروس و فصول در برنامه هفتگی مصوب'),
      icon: <FiCalendar />,
      badgeClass: 'bg-primary-subtle text-primary border border-primary-subtle',
      badgeText: isRTL ? 'برنامه‌ریزی مصوب' : 'Scheduled Plan',
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
    },
    {
      type: 'performed',
      title: t('reports.performed_title', 'گزارش عملکرد هفتگی'),
      description: t('reports.performed_desc', 'گزارش دقیق ساعات مطالعه، کلاس، مرور، خواب و تست‌های اجرا شده'),
      icon: <FiClock />,
      badgeClass: 'bg-success-subtle text-success border border-success-subtle',
      badgeText: isRTL ? 'عملکرد واقعی' : 'Actual Execution',
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
    },
    {
      type: 'conclusion',
      title: t('reports.conclusion_title', 'گزارش جمع‌بندی و تسلط'),
      description: t('reports.conclusion_desc', 'گزارش درصد پاسخگویی تست‌ها و سطح تسلط مباحث بر اساس فصول'),
      icon: <FiCheckSquare />,
      badgeClass: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle',
      badgeText: isRTL ? 'تست و تسلط' : 'Mastery & Tests',
      iconBg: '#fefce8',
      iconColor: '#ca8a04',
    },
    {
      type: 'full',
      title: t('reports.full_title', 'گزارش جامع کلی'),
      description: t('reports.full_desc', 'گزارش جامع تجمیع‌شده شامل برنامه هفتگی، عملکرد و جمع‌بندی مباحث'),
      icon: <FiFileText />,
      badgeClass: 'bg-purple-subtle text-purple border border-purple-subtle',
      badgeText: isRTL ? 'جامع ۳ در ۱' : 'All-in-One',
      iconBg: '#faf5ff',
      iconColor: '#9333ea',
    },
  ];

  return (
    <div className="container-fluid py-4 reports-container" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`alert ${toastMessage.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show position-fixed top-0 end-0 m-3 shadow-lg z-3`}
          role="alert"
          style={{ maxWidth: '420px' }}
        >
          <div className="d-flex align-items-center gap-2">
            {toastMessage.type === 'success' ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setToastMessage(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 pb-3 mb-4 border-bottom">
        <div>
          <h1 className="h3 fw-bold mb-1 d-flex align-items-center gap-2">
            <FiFileText className="text-primary" />
            {t('reports.title', 'گزارشات مطالعاتی')}
          </h1>
          <p className="text-muted mb-0 small">
            {t('reports.subtitle', 'مشاهده و خروجی PDF انواع گزارش‌های هفتگی، عملکردی و تسلط مباحث')}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-primary d-flex align-items-center gap-2 rounded-pill px-3 py-2 btn-sm"
            onClick={() => setIsVideoModalOpen(true)}
          >
            <FiVideo size={16} />
            <span>{t('reports.help_video', 'راهنمای ویدیویی گزارشات')}</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold text-muted mb-1">
                {t('reports.start_date', 'تاریخ شروع')}
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold text-muted mb-1">
                {t('reports.end_date', 'تاریخ پایان')}
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-6 d-flex flex-wrap align-items-center gap-2">
              <button
                type="button"
                className={`btn btn-sm ${!startDate && !endDate ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={handleQuickCurrentWeek}
              >
                <FiRotateCcw className="me-1" />
                {t('reports.current_week', 'هفته جاری')}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={handleQuickPreviousWeek}
              >
                <FiFilter className="me-1" />
                {t('reports.previous_week', 'هفته گذشته')}
              </button>
              {(startDate || endDate) && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none text-muted"
                  onClick={handleQuickCurrentWeek}
                >
                  {t('reports.reset_filter', 'بازنشانی')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="row g-4">
        {reportCards.map((card) => {
          const isDownloading = downloadingType === card.type;
          return (
            <div key={card.type} className="col-12 col-lg-6">
              <div className="card h-100 border-0 shadow-sm report-card">
                <div className="card-body p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div
                        className="report-card-icon"
                        style={{ backgroundColor: card.iconBg, color: card.iconColor }}
                      >
                        {card.icon}
                      </div>
                      <span className={`badge rounded-pill px-3 py-1 small ${card.badgeClass}`}>
                        {card.badgeText}
                      </span>
                    </div>

                    <h5 className="card-title fw-bold text-dark mb-2">{card.title}</h5>
                    <p className="card-text text-muted small mb-4">{card.description}</p>
                  </div>

                  <div className="d-flex align-items-center gap-2 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2 flex-grow-1 py-2"
                      onClick={() => handleView(card.type)}
                    >
                      <FiEye size={18} />
                      <span>{t('reports.view', 'مشاهده')}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary d-flex align-items-center justify-content-center gap-2 flex-grow-1 py-2"
                      disabled={isDownloading}
                      onClick={() => handleDownloadPdf(card.type)}
                    >
                      {isDownloading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                          <span>{t('reports.downloading', 'در حال دانلود...')}</span>
                        </>
                      ) : (
                        <>
                          <FiDownload size={18} />
                          <span>{t('reports.download_pdf', 'دانلود PDF')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Modal */}
      <VideoHelpModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} />
    </div>
  );
};

export default ReportsList;
