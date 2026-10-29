import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiCheckSquare,
  FiAward,
  FiInfo,
  FiRefreshCw,
  FiPercent,
  FiLayers
} from 'react-icons/fi';
import { useSourceMaterials } from '../../../../context/SourceMaterialsContext';
import { getConclusionPlan } from '../../../../services/api';
import { getErrorMessage } from '../../../../utils/errorHandler';
import ConclusionForm from './ConclusionForm';
import ConclusionGrid from './ConclusionGrid';

const ConclusionPlan = () => {
  const { t } = useTranslation();
  const { materials, loading: materialsLoading } = useSourceMaterials();

  const [selectedBookId, setSelectedBookId] = useState('');
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConclusionPlan = useCallback(async (bookId) => {
    setLoading(true);
    setError(null);
    try {
      const params = bookId ? { source_material_id: bookId } : {};
      const res = await getConclusionPlan(params);
      const results = res.data?.results || [];
      setGridData(results);
    } catch (err) {
      setError(getErrorMessage(err, 'errors.default'));
      setGridData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConclusionPlan(selectedBookId);
  }, [selectedBookId, fetchConclusionPlan]);

  const handleBookFilterChange = (e) => {
    const val = e.target.value;
    setSelectedBookId(val);
  };

  // KPI Calculations
  const totalChapters = gridData.length;
  const allTestRecords = gridData.flatMap((item) => item.test_records || []);
  const totalTestsSolved = allTestRecords.reduce((acc, r) => acc + (r.total_tests || 0), 0);
  const totalCorrectTests = allTestRecords.reduce((acc, r) => acc + (r.correct_tests || 0), 0);
  const totalWrongTests = allTestRecords.reduce((acc, r) => acc + (r.wrong_tests || 0), 0);
  
  let overallPercentage = 0;
  if (totalTestsSolved > 0) {
    overallPercentage = Math.round(
      (((totalCorrectTests * 3) - totalWrongTests) / (totalTestsSolved * 3) * 100) * 100
    ) / 100;
  }

  const chaptersWithMastery = gridData.filter(item => item.mastery_level !== null && item.mastery_level !== undefined);
  const avgMastery = chaptersWithMastery.length > 0
    ? Math.round(chaptersWithMastery.reduce((acc, i) => acc + i.mastery_level, 0) / chaptersWithMastery.length)
    : 0;

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <FiCheckSquare className="text-primary" />
            {t('planner.conclusion_plan', 'Conclusion Plan & Test Analytics (جدول جمع‌بندی)')}
          </h2>
          <p className="text-muted mb-0">
            {t('planner.conclusion_plan_desc', 'Single Source of Truth for test performance tracking, negative-marking percentages, and chapter mastery.')}
          </p>
        </div>

        {/* Book Selector Filter & Refresh */}
        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            style={{ minWidth: '200px' }}
            value={selectedBookId}
            onChange={handleBookFilterChange}
            disabled={materialsLoading}
          >
            <option value="">{t('planner.all_books', 'All Courses / Books')}</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} {m.year ? `(${m.year})` : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
            onClick={() => fetchConclusionPlan(selectedBookId)}
            disabled={loading}
            title={t('common.search', 'Refresh')}
          >
            <FiRefreshCw className={loading ? 'spin' : ''} />
            <span className="d-none d-sm-inline">{t('common.search', 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Info / Link CTA Banner */}
      <div className="alert alert-info border-0 shadow-sm d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-start gap-2">
          <FiInfo size={22} className="text-info flex-shrink-0 mt-1" />
          <div>
            <div className="fw-bold mb-1">
              {t('planner.single_source_truth', 'Single Source of Truth for Test Outcomes')}
            </div>
            <div className="small text-muted">
              {t('planner.cta_info_conclusion', 'All test metrics entered here automatically feed into your')}{' '}
              <Link to="/schedule/performed-weekly-plan" className="fw-bold text-decoration-underline text-info">
                {t('planner.performed_weekly_plan', 'Performed Weekly Plan')}
              </Link>
              .{' '}
              {t('planner.cta_edit_time', 'To manage study hours, visit')}{' '}
              <Link to="/schedule/daily" className="fw-bold text-decoration-underline text-info">
                {t('planner.daily_schedule_link', 'Daily Schedule')}
              </Link>
              .
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-danger shadow-sm mb-4">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card h-100 shadow-sm border-0 border-top border-3 border-primary">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-medium">
                  {t('planner.total_tests', 'Total Tests Solved')}
                </span>
                <div className="p-2 bg-primary-subtle text-primary rounded-circle">
                  <FiCheckSquare size={18} />
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-primary">{totalTestsSolved}</h3>
              <small className="text-muted">
                {totalCorrectTests} ✓ | {totalWrongTests} ✗
              </small>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card h-100 shadow-sm border-0 border-top border-3 border-success">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-medium">
                  {t('planner.percentage', 'Overall Exam Score')}
                </span>
                <div className="p-2 bg-success-subtle text-success rounded-circle">
                  <FiPercent size={18} />
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-success">{overallPercentage}%</h3>
              <small className="text-muted">
                {t('planner.with_negative_marking', 'Standard negative marking')}
              </small>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card h-100 shadow-sm border-0 border-top border-3 border-warning">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-medium">
                  {t('planner.mastery_level', 'Avg Chapter Mastery')}
                </span>
                <div className="p-2 bg-warning-subtle text-warning rounded-circle">
                  <FiAward size={18} />
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-warning">{avgMastery}%</h3>
              <small className="text-muted">
                {chaptersWithMastery.length} / {totalChapters} {t('planner.chapters_assessed', 'chapters')}
              </small>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card h-100 shadow-sm border-0 border-top border-3 border-info">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small fw-medium">
                  {t('planner.chapters_count', 'Chapters Tracked')}
                </span>
                <div className="p-2 bg-info-subtle text-info rounded-circle">
                  <FiLayers size={18} />
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-info">{totalChapters}</h3>
              <small className="text-muted">
                {selectedBookId ? t('planner.in_selected_book', 'In selected book') : t('planner.across_all_books', 'Across all books')}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Input Form Section */}
      <ConclusionForm
        selectedBookId={selectedBookId}
        onBookChange={(id) => setSelectedBookId(id)}
        onRecordSaved={() => fetchConclusionPlan(selectedBookId)}
      />

      {/* Conclusion Grid Section */}
      <ConclusionGrid
        items={gridData}
        loading={loading}
        onRefresh={() => fetchConclusionPlan(selectedBookId)}
      />
    </div>
  );
};

export default ConclusionPlan;
