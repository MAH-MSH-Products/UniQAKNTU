import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiBook,
  FiPercent,
  FiSave,
  FiRotateCcw,
  FiHelpCircle
} from 'react-icons/fi';
import { useSourceMaterials } from '../../../../context/SourceMaterialsContext';
import {
  getConclusionPlanChapters,
  createOrUpdateTestRecord
} from '../../../../services/api';
import { getErrorMessage } from '../../../../utils/errorHandler';

const TEST_FORMATS = [
  'ALL',
  'EVEN',
  'ODD',
  '3K',
  '3K_1',
  '3K_2',
  '4K',
  '4K_1',
  '4K_2',
  '4K_3',
  'HALF_1',
  'HALF_2',
  'IMPORTANT',
  'THIRD_1',
  'THIRD_2',
  'THIRD_3'
];

const TEST_METHODS = ['FEEDBACK', 'WASHBACK'];

const ConclusionForm = ({ selectedBookId, onBookChange, onRecordSaved }) => {
  const { t } = useTranslation();
  const { materials, loading: materialsLoading } = useSourceMaterials();

  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  const [formData, setFormData] = useState({
    sourceMaterialId: selectedBookId || '',
    chapterId: '',
    testFormat: 'ALL',
    testMethod: 'FEEDBACK',
    totalTests: '',
    correctTests: '',
    wrongTests: ''
  });

  const [preview, setPreview] = useState({
    untested: 0,
    percentage: 0,
    calculated: false
  });

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Sync selectedBookId from parent when it changes
  useEffect(() => {
    if (selectedBookId && selectedBookId !== formData.sourceMaterialId) {
      setFormData(prev => ({
        ...prev,
        sourceMaterialId: selectedBookId,
        chapterId: ''
      }));
    }
  }, [selectedBookId, formData.sourceMaterialId]);

  // Fetch chapters when sourceMaterialId changes
  useEffect(() => {
    const fetchChapters = async () => {
      if (!formData.sourceMaterialId) {
        setChapters([]);
        return;
      }
      setChaptersLoading(true);
      try {
        const res = await getConclusionPlanChapters(formData.sourceMaterialId);
        const data = res.data?.results || res.data || [];
        setChapters(data);
      } catch (err) {
        console.error('Failed to load chapters:', err);
        setChapters([]);
      } finally {
        setChaptersLoading(false);
      }
    };

    fetchChapters();
  }, [formData.sourceMaterialId]);

  // Client-Side Calculation: Formula: ((correct * 3) - wrong) / (total * 3) * 100
  const calculatePreview = (totalVal, correctVal, wrongVal) => {
    const total = parseInt(totalVal, 10) || 0;
    const correct = parseInt(correctVal, 10) || 0;
    const wrong = parseInt(wrongVal, 10) || 0;

    const untested = Math.max(0, total - correct - wrong);
    let pct = 0;
    if (total > 0) {
      pct = ((correct * 3) - wrong) / (total * 3) * 100;
      pct = Math.round(pct * 100) / 100;
    }

    setPreview({
      untested,
      percentage: pct,
      calculated: total > 0
    });
  };

  const handleInputChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    if (field === 'sourceMaterialId') {
      updated.chapterId = '';
      if (onBookChange) {
        onBookChange(value);
      }
    }

    // Auto-update preview live
    if (['totalTests', 'correctTests', 'wrongTests'].includes(field)) {
      calculatePreview(
        field === 'totalTests' ? value : updated.totalTests,
        field === 'correctTests' ? value : updated.correctTests,
        field === 'wrongTests' ? value : updated.wrongTests
      );
    }
  };

  // Requirement: Recalculate onBlur
  const handleBlur = () => {
    calculatePreview(formData.totalTests, formData.correctTests, formData.wrongTests);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    const total = parseInt(formData.totalTests, 10) || 0;
    const correct = parseInt(formData.correctTests, 10) || 0;
    const wrong = parseInt(formData.wrongTests, 10) || 0;

    if (!formData.chapterId) {
      setStatusMessage({
        type: 'danger',
        text: t('planner.select_chapter', 'Please select a chapter.')
      });
      return;
    }

    if (correct + wrong > total) {
      setStatusMessage({
        type: 'danger',
        text: t('planner.validation_exceed', 'Correct tests + wrong tests cannot exceed total tests.')
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        chapter_id: parseInt(formData.chapterId, 10),
        test_format: formData.testFormat,
        test_method: formData.testMethod,
        total_tests: total,
        correct_tests: correct,
        wrong_tests: wrong
      };

      await createOrUpdateTestRecord(payload);
      setStatusMessage({
        type: 'success',
        text: t('planner.success_test_saved', 'Test record saved successfully.')
      });

      if (onRecordSaved) {
        onRecordSaved();
      }

      // Reset test counts
      setFormData(prev => ({
        ...prev,
        totalTests: '',
        correctTests: '',
        wrongTests: ''
      }));
      setPreview({ untested: 0, percentage: 0, calculated: false });
    } catch (err) {
      setStatusMessage({
        type: 'danger',
        text: getErrorMessage(err, 'errors.default')
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(prev => ({
      ...prev,
      totalTests: '',
      correctTests: '',
      wrongTests: ''
    }));
    setPreview({ untested: 0, percentage: 0, calculated: false });
    setStatusMessage(null);
  };

  const getPercentageBadgeClass = (pct) => {
    if (pct >= 70) return 'bg-success text-white';
    if (pct >= 50) return 'bg-primary text-white';
    if (pct >= 30) return 'bg-warning text-dark';
    if (pct > 0) return 'bg-danger text-white';
    return 'bg-secondary text-white';
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-transparent border-bottom py-3">
        <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
          <FiBook className="text-primary" />
          {t('planner.save_test_record', 'Record Test Outcomes (ثبت آزمون)')}
        </h5>
      </div>

      <div className="card-body p-4">
        {statusMessage && (
          <div className={`alert alert-${statusMessage.type} alert-dismissible fade show mb-4`} role="alert">
            {statusMessage.text}
            <button
              type="button"
              className="btn-close"
              onClick={() => setStatusMessage(null)}
              aria-label="Close"
            />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Book / Course Dropdown */}
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-muted">
                {t('planner.select_book', 'Course / Book')} *
              </label>
              <select
                className="form-select"
                value={formData.sourceMaterialId}
                onChange={(e) => handleInputChange('sourceMaterialId', e.target.value)}
                disabled={materialsLoading}
                required
              >
                <option value="">{t('planner.select_book', '-- Select Course / Book --')}</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} {m.year ? `(${m.year})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Dropdown */}
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-muted">
                {t('planner.select_chapter', 'Chapter')} *
              </label>
              <select
                className="form-select"
                value={formData.chapterId}
                onChange={(e) => handleInputChange('chapterId', e.target.value)}
                disabled={!formData.sourceMaterialId || chaptersLoading}
                required
              >
                <option value="">
                  {chaptersLoading
                    ? t('common.loading', 'Loading chapters...')
                    : t('planner.select_chapter', '-- Select Chapter --')}
                </option>
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.chapter_number ? `${ch.chapter_number}. ` : ''}{ch.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Format Dropdown */}
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-muted">
                {t('planner.test_format', 'Test Format')} *
              </label>
              <select
                className="form-select"
                value={formData.testFormat}
                onChange={(e) => handleInputChange('testFormat', e.target.value)}
                required
              >
                {TEST_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {t(`planner.formats.${fmt}`, fmt)}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Method Dropdown */}
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small text-muted">
                {t('planner.test_method', 'Test Method')} *
              </label>
              <select
                className="form-select"
                value={formData.testMethod}
                onChange={(e) => handleInputChange('testMethod', e.target.value)}
                required
              >
                {TEST_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {t(`planner.methods.${method}`, method)}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Counts Grid */}
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold small text-muted">
                {t('planner.total_tests_count', 'Total Tests')} *
              </label>
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="40"
                value={formData.totalTests}
                onChange={(e) => handleInputChange('totalTests', e.target.value)}
                onBlur={handleBlur}
                required
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold small text-muted">
                {t('planner.correct_tests_count', 'Correct Tests')} *
              </label>
              <input
                type="number"
                min="0"
                className="form-control text-success fw-bold"
                placeholder="30"
                value={formData.correctTests}
                onChange={(e) => handleInputChange('correctTests', e.target.value)}
                onBlur={handleBlur}
                required
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold small text-muted">
                {t('planner.wrong_tests_count', 'Wrong Tests')} *
              </label>
              <input
                type="number"
                min="0"
                className="form-control text-danger fw-bold"
                placeholder="5"
                value={formData.wrongTests}
                onChange={(e) => handleInputChange('wrongTests', e.target.value)}
                onBlur={handleBlur}
                required
              />
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="mt-4 p-3 rounded bg-light border shadow-sm">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <span className="small fw-bold text-muted d-flex align-items-center gap-1">
                  <FiPercent className="text-primary" />
                  {t('planner.preview_percentage', 'Live Calculation Preview:')}
                </span>

                <span className="badge bg-secondary px-3 py-2">
                  {t('planner.untested_tests_count', 'Untested')}: {preview.untested}
                </span>

                <span className={`badge px-3 py-2 fs-6 rounded-pill ${getPercentageBadgeClass(preview.percentage)}`}>
                  {preview.percentage}%
                </span>
              </div>

              <div className="small text-muted d-flex align-items-center gap-1">
                <FiHelpCircle />
                <span>
                  ((Correct × 3) - Wrong) / (Total × 3) × 100
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-1"
              onClick={handleReset}
              disabled={submitting}
            >
              <FiRotateCcw />
              {t('common.cancel', 'Reset')}
            </button>

            <button
              type="submit"
              className="btn btn-primary px-4 d-flex align-items-center gap-1 fw-bold"
              disabled={submitting || !formData.chapterId}
            >
              <FiSave />
              {submitting ? t('common.loading', 'Saving...') : t('planner.save_test_record', 'Save Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConclusionForm;
