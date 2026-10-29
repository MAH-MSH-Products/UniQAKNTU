import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiArrowRight,
  FiArrowLeft,
  FiPrinter,
  FiDownload,
  FiCalendar,
  FiClock,
  FiCheckSquare,
  FiAlertCircle,
} from 'react-icons/fi';
import {
  getWeeklyReport,
  getPerformedReport,
  getConclusionReport,
  getFullReport,
  downloadReportPdf,
} from '../../../../services/api';
import { useAuth } from '../../../../context/AuthContext';
import './Reports.css';

/**
 * Format minutes into "Xh Ym" or "X ساعت و Y دقیقه"
 */
const formatDuration = (totalMins, t) => {
  if (!totalMins || totalMins === 0) return '0';
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0 && mins > 0) {
    return `${hours} ${t('reports.reading_time', 'ساعت')} ${mins} ${t('weekly_hours.minutes_abbr', 'دقیقه')}`;
  }
  if (hours > 0) {
    return `${hours} ${t('reports.reading_time', 'ساعت')}`;
  }
  return `${mins} ${t('weekly_hours.minutes_abbr', 'دقیقه')}`;
};

const ReportViewer = () => {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'fa';

  const startDate = searchParams.get('start_date') || '';
  const endDate = searchParams.get('end_date') || '';

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      let res;
      switch (type) {
        case 'weekly':
          res = await getWeeklyReport(params);
          break;
        case 'performed':
          res = await getPerformedReport(params);
          break;
        case 'conclusion':
          res = await getConclusionReport(params);
          break;
        case 'full':
          res = await getFullReport(params);
          break;
        default:
          throw new Error('Invalid report type');
      }
      setReportData(res.data);
    } catch (err) {
      console.error('Fetch report error:', err);
      setError(err?.response?.data?.error || err.message || 'Error fetching report');
    } finally {
      setLoading(false);
    }
  }, [type, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      await downloadReportPdf(type, params);
    } catch (err) {
      console.error('Download PDF error:', err);
      alert(t('reports.pdf_download_error', 'Failed to download PDF. Please try again.'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container py-5 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="spinner-border text-primary my-4" role="status">
          <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
        </div>
        <p className="text-muted">{t('common.loading', 'در حال بارگذاری گزارش...')}</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="container py-5" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <FiAlertCircle size={22} />
          <div>{error || t('reports.no_data', 'خطا در دریافت اطلاعات گزارش')}</div>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary d-inline-flex align-items-center gap-2 mt-3"
          onClick={() => navigate('/reports')}
        >
          {isRTL ? <FiArrowRight /> : <FiArrowLeft />}
          <span>{t('reports.back_to_list', 'بازگشت به فهرست گزارشات')}</span>
        </button>
      </div>
    );
  }

  const { report_title, week_start, week_end, generated_at, data } = reportData;

  // Render Section Tables
  const renderWeeklyTable = (chapters, totalAllocated) => (
    <div className="table-responsive my-3">
      <table className="table table-bordered table-striped align-middle table-report">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>{t('reports.row', 'ردیف')}</th>
            <th>{t('reports.course', 'کتاب / درس')}</th>
            <th>{t('reports.chapter', 'فصل / مبحث')}</th>
            <th style={{ width: '180px' }}>{t('reports.allocated_time', 'زمان برنامه‌ریزی شده')}</th>
          </tr>
        </thead>
        <tbody>
          {chapters && chapters.length > 0 ? (
            chapters.map((chap, idx) => (
              <tr key={chap.chapter_id || idx}>
                <td className="text-center">{idx + 1}</td>
                <td>{chap.source_material_title}</td>
                <td>{chap.chapter_title}</td>
                <td className="text-center fw-semibold">
                  {formatDuration(chap.allocated_minutes, t)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center text-muted py-4">
                {t('reports.no_data', 'هیچ برنامه‌ای برای این بازه ثبت نشده است.')}
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3" className="text-end fw-bold">
              {t('reports.total', 'مجموع زمان برنامه‌ریزی شده')}:
            </td>
            <td className="text-center fw-bold text-primary">
              {formatDuration(totalAllocated, t)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  const renderPerformedTable = (perfData) => (
    <div className="table-responsive my-3">
      <table className="table table-bordered table-striped align-middle table-report">
        <thead>
          <tr>
            <th style={{ width: '50px' }}>{t('reports.row', 'ردیف')}</th>
            <th>{t('reports.course', 'کتاب / درس')}</th>
            <th>{t('reports.chapter', 'فصل / مبحث')}</th>
            <th style={{ width: '120px' }}>{t('reports.reading_time', 'مطالعه')}</th>
            <th style={{ width: '120px' }}>{t('reports.review_time', 'مرور')}</th>
            <th style={{ width: '120px' }}>{t('reports.class_time', 'کلاس')}</th>
            <th style={{ width: '110px' }}>{t('reports.test_count', 'تعداد تست')}</th>
          </tr>
        </thead>
        <tbody>
          {perfData?.chapters && perfData.chapters.length > 0 ? (
            perfData.chapters.map((chap, idx) => (
              <tr key={chap.chapter_id || idx}>
                <td className="text-center">{idx + 1}</td>
                <td>{chap.source_material_title}</td>
                <td>{chap.chapter_title}</td>
                <td className="text-center">{formatDuration(chap.read_time_minutes, t)}</td>
                <td className="text-center">{formatDuration(chap.review_time_minutes, t)}</td>
                <td className="text-center">{formatDuration(chap.class_time_minutes, t)}</td>
                <td className="text-center fw-bold">{chap.test_count || 0}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center text-muted py-4">
                {t('reports.no_data', 'هیچ عملکردی برای این بازه زمانی ثبت نشده است.')}
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3" className="text-end fw-bold">
              {t('reports.total', 'مجموع کل')}:
            </td>
            <td className="text-center fw-bold text-primary">
              {formatDuration(perfData?.total_read_time_minutes, t)}
            </td>
            <td className="text-center fw-bold text-primary">
              {formatDuration(perfData?.total_review_time_minutes, t)}
            </td>
            <td className="text-center fw-bold text-primary">
              {formatDuration(perfData?.total_class_time_minutes, t)}
            </td>
            <td className="text-center fw-bold text-primary">
              {perfData?.total_tests || 0}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  const renderConclusionTable = (conclData) => (
    <div className="table-responsive my-3">
      <table className="table table-bordered table-striped align-middle table-report">
        <thead>
          <tr>
            <th style={{ width: '50px' }}>{t('reports.row', 'ردیف')}</th>
            <th>{t('reports.course', 'کتاب / درس')}</th>
            <th>{t('reports.chapter', 'فصل / مبحث')}</th>
            <th style={{ width: '110px' }}>{t('reports.mastery', 'سطح تسلط')}</th>
            <th style={{ width: '90px' }}>{t('reports.test_count', 'تست کل')}</th>
            <th style={{ width: '80px' }}>{t('reports.correct', 'صحیح')}</th>
            <th style={{ width: '80px' }}>{t('reports.wrong', 'غلط')}</th>
            <th style={{ width: '80px' }}>{t('reports.untested', 'نزده')}</th>
            <th style={{ width: '100px' }}>{t('reports.percentage', 'درصد')}</th>
          </tr>
        </thead>
        <tbody>
          {conclData?.chapters && conclData.chapters.length > 0 ? (
            conclData.chapters.map((chap, idx) => (
              <tr key={chap.chapter_id || idx}>
                <td className="text-center">{idx + 1}</td>
                <td>{chap.source_material_title}</td>
                <td>{chap.chapter_title}</td>
                <td className="text-center">
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                    {chap.mastery_level !== null ? `${chap.mastery_level}%` : '-'}
                  </span>
                </td>
                <td className="text-center fw-semibold">{chap.total_tests}</td>
                <td className="text-center text-success">{chap.correct_tests}</td>
                <td className="text-center text-danger">{chap.wrong_tests}</td>
                <td className="text-center text-muted">{chap.untested_tests}</td>
                <td className="text-center fw-bold" dir="ltr">
                  {chap.percentage}%
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center text-muted py-4">
                {t('reports.no_data', 'هیچ اطلاعات تسلط یا تستی ثبت نشده است.')}
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3" className="text-end fw-bold">
              {t('reports.total', 'مجموع کل')}:
            </td>
            <td className="text-center fw-bold text-primary">
              {conclData?.average_mastery || 0}%
            </td>
            <td className="text-center fw-bold text-primary">
              {conclData?.total_tests || 0}
            </td>
            <td className="text-center fw-bold text-success">
              {conclData?.total_correct || 0}
            </td>
            <td className="text-center fw-bold text-danger">
              {conclData?.total_wrong || 0}
            </td>
            <td className="text-center fw-bold text-muted">
              {conclData?.total_untested || 0}
            </td>
            <td className="text-center fw-bold text-primary" dir="ltr">
              {conclData?.overall_percentage || 0}%
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <div className="container py-4 reports-container" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Action Bar (Hidden in Print) */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4 reports-top-bar no-print">
        <button
          type="button"
          className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
          onClick={() => navigate('/reports')}
        >
          {isRTL ? <FiArrowRight /> : <FiArrowLeft />}
          <span>{t('reports.back_to_list', 'بازگشت به فهرست')}</span>
        </button>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
            onClick={handlePrint}
          >
            <FiPrinter size={18} />
            <span>{t('reports.print', 'چاپ')}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            disabled={isDownloading}
            onClick={handleDownload}
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

      {/* Printable Report Document */}
      <div className="report-paper">
        {/* Header Block */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center pb-3 mb-4 border-bottom">
          <div>
            <h2 className="h4 fw-bold text-dark mb-1">{report_title}</h2>
            <div className="text-muted small d-flex flex-wrap align-items-center gap-3">
              <span>
                <strong>{t('reports.student_name', 'دانشجو')}:</strong> {user?.first_name || user?.username || '-'}
              </span>
              <span>
                <strong>{t('reports.period', 'بازه زمانی')}:</strong> {week_start} {t('common.to', 'تا')} {week_end}
              </span>
              <span>
                <strong>{t('reports.generated_at', 'تاریخ صدور')}:</strong> {generated_at}
              </span>
            </div>
          </div>
          <div className="mt-2 mt-md-0 text-md-end">
            <span className="badge bg-light text-secondary border px-3 py-2 fs-6">
              UniQAKNTU Academic Planner
            </span>
          </div>
        </div>

        {/* Content based on type */}
        {type === 'weekly' && (
          <div>
            {/* KPI Cards */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-6">
                <div className="report-kpi-card">
                  <div className="report-kpi-val">{formatDuration(data.total_allocated_minutes, t)}</div>
                  <div className="report-kpi-lbl">{t('reports.kpi_scheduled_hours', 'مجموع ساعات برنامه‌ریزی')}</div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="report-kpi-card">
                  <div className="report-kpi-val">{data.chapters ? data.chapters.length : 0}</div>
                  <div className="report-kpi-lbl">{t('reports.chapter', 'تعداد مباحث برنامه‌ریزی شده')}</div>
                </div>
              </div>
            </div>

            {/* Table */}
            {renderWeeklyTable(data.chapters, data.total_allocated_minutes)}
          </div>
        )}

        {type === 'performed' && (
          <div>
            {/* KPI Cards */}
            <div className="row g-3 mb-4">
              <div className="col-6 col-md-3">
                <div className="report-kpi-card">
                  <div className="report-kpi-val text-success">
                    {formatDuration(
                      (data.total_read_time_minutes || 0) +
                        (data.total_review_time_minutes || 0) +
                        (data.total_class_time_minutes || 0),
                      t
                    )}
                  </div>
                  <div className="report-kpi-lbl">{t('reports.kpi_performed_study', 'مجموع مطالعه واقعی')}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="report-kpi-card">
                  <div className="report-kpi-val text-info">
                    {formatDuration(data.total_sleep_time_minutes, t)}
                  </div>
                  <div className="report-kpi-lbl">{t('reports.sleep_time', 'مجموع زمان خواب')}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="report-kpi-card">
                  <div className="report-kpi-val text-warning">
                    {data.total_tests || 0}
                  </div>
                  <div className="report-kpi-lbl">{t('reports.kpi_total_tests', 'تعداد تست‌های حل‌شده')}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="report-kpi-card">
                  <div className="report-kpi-val text-secondary">
                    {data.chapters ? data.chapters.length : 0}
                  </div>
                  <div className="report-kpi-lbl">{t('reports.chapter', 'تعداد مباحث مطالعه‌شده')}</div>
                </div>
              </div>
            </div>

            {/* Table */}
            {renderPerformedTable(data)}
          </div>
        )}

        {type === 'conclusion' && (
          <div>
            {/* KPI Cards */}
            <div className="row g-3 mb-4">
              <div className="col-6 col-md-3">
                <div className="report-kpi-card">
                  <div className="report-kpi-val text-primary">
                    {data.average_mastery || 0}%
                  </div>
                  <div className="report-kpi-lbl">{t('reports.kpi_average_mastery', 'میانگین تسلط مباحث')}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="report-kpi-card">
                  <div className="report-kpi-val text-success" dir="ltr">
                    {data.overall_percentage || 0}%
                  </div>
                  <div className="report-kpi-lbl">{t('reports.kpi_overall_percentage', 'درصد کل آزمون‌ها')}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="report-kpi-card">
                  <div className="report-kpi-val text-warning">
                    {data.total_tests || 0}
                  </div>
                  <div className="report-kpi-lbl">{t('reports.kpi_total_tests', 'مجموع تست‌ها')}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="report-kpi-card">
                  <div className="report-kpi-val text-muted">
                    {data.total_untested || 0}
                  </div>
                  <div className="report-kpi-lbl">{t('reports.untested', 'تست‌های نزده')}</div>
                </div>
              </div>
            </div>

            {/* Table */}
            {renderConclusionTable(data)}
          </div>
        )}

        {type === 'full' && (
          <div>
            {/* Combined KPI Overview */}
            <div className="row g-3 mb-4">
              <div className="col-6 col-md-3">
                <div className="report-kpi-card">
                  <div className="report-kpi-val text-primary">
                    {formatDuration(data?.scheduled_data?.total_allocated_minutes, t)}
                  </div>
                  <div className="report-kpi-lbl">{t('reports.kpi_scheduled_hours', 'ساعات برنامه‌ریزی')}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="report-kpi-card">
                  <div className="report-kpi-val text-success">
                    {formatDuration(
                      (data?.performed_data?.total_read_time_minutes || 0) +
                        (data?.performed_data?.total_review_time_minutes || 0) +
                        (data?.performed_data?.total_class_time_minutes || 0),
                      t
                    )}
                  </div>
                  <div className="report-kpi-lbl">{t('reports.kpi_performed_study', 'مطالعه واقعی')}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="report-kpi-card">
                  <div className="report-kpi-val text-warning">
                    {data?.performed_data?.total_tests || 0}
                  </div>
                  <div className="report-kpi-lbl">{t('reports.kpi_total_tests', 'مجموع تست‌ها')}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="report-kpi-card">
                  <div className="report-kpi-val text-info">
                    {data?.conclusion_data?.average_mastery || 0}%
                  </div>
                  <div className="report-kpi-lbl">{t('reports.kpi_average_mastery', 'میانگین تسلط')}</div>
                </div>
              </div>
            </div>

            {/* Section 1: Weekly Schedule */}
            <div className="mt-4 mb-4">
              <h5 className="fw-bold border-bottom pb-2 d-flex align-items-center gap-2 text-primary">
                <FiCalendar />
                {t('reports.sub_weekly_header', 'بخش ۱: برنامه هفتگی روزانه')}
              </h5>
              {renderWeeklyTable(
                data?.scheduled_data?.chapters,
                data?.scheduled_data?.total_allocated_minutes
              )}
            </div>

            {/* Section 2: Executed Performance */}
            <div className="mt-5 mb-4 page-break-after">
              <h5 className="fw-bold border-bottom pb-2 d-flex align-items-center gap-2 text-success">
                <FiClock />
                {t('reports.sub_performed_header', 'بخش ۲: عملکرد هفتگی واقعی')}
              </h5>
              {renderPerformedTable(data?.performed_data)}
            </div>

            {/* Section 3: Conclusion & Mastery */}
            <div className="mt-5 mb-4">
              <h5 className="fw-bold border-bottom pb-2 d-flex align-items-center gap-2 text-warning-emphasis">
                <FiCheckSquare />
                {t('reports.sub_conclusion_header', 'بخش ۳: جمع‌بندی و تسلط مباحث')}
              </h5>
              {renderConclusionTable(data?.conclusion_data)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportViewer;
