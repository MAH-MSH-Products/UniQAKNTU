import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiAward,
  FiActivity,
  FiLayers
} from 'react-icons/fi';
import {
  setChapterMastery,
  deleteChapterMastery,
  deleteTestRecord
} from '../../../../services/api';
import { getErrorMessage } from '../../../../utils/errorHandler';

const getPercentageBadgeClass = (pct) => {
  if (pct >= 70) return 'bg-success text-white';
  if (pct >= 50) return 'bg-primary text-white';
  if (pct >= 30) return 'bg-warning text-dark';
  if (pct > 0) return 'bg-danger text-white';
  return 'bg-secondary text-white';
};

const getMasteryColor = (level) => {
  if (!level) return 'bg-secondary';
  if (level >= 80) return 'bg-success';
  if (level >= 60) return 'bg-primary';
  if (level >= 40) return 'bg-info';
  if (level >= 20) return 'bg-warning';
  return 'bg-danger';
};

const ConclusionGrid = ({ items, loading, onRefresh }) => {
  const { t } = useTranslation();

  const [editingMasteryChapterId, setEditingMasteryChapterId] = useState(null);
  const [masteryInputVal, setMasteryInputVal] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleStartEditMastery = (chapterId, currentLevel) => {
    setEditingMasteryChapterId(chapterId);
    setMasteryInputVal(currentLevel !== null && currentLevel !== undefined ? currentLevel : 50);
  };

  const handleSaveMastery = async (chapterId) => {
    const level = parseInt(masteryInputVal, 10);
    if (isNaN(level) || level < 1 || level > 100) {
      alert(t('planner.mastery_range_error', 'Mastery level must be between 1 and 100.'));
      return;
    }

    setActionLoading(true);
    try {
      await setChapterMastery({ chapter_id: chapterId, level });
      setEditingMasteryChapterId(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(getErrorMessage(err, 'errors.default'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMastery = async (chapterId) => {
    if (!window.confirm(t('planner.delete_mastery_confirm', 'Are you sure you want to remove mastery level for this chapter?'))) {
      return;
    }
    setActionLoading(true);
    try {
      await deleteChapterMastery(chapterId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(getErrorMessage(err, 'errors.default'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTestRecord = async (recordId) => {
    if (!window.confirm(t('planner.delete_test_record_confirm', 'Are you sure you want to delete this test record?'))) {
      return;
    }
    setActionLoading(true);
    try {
      await deleteTestRecord(recordId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(getErrorMessage(err, 'errors.default'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-transparent border-bottom py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
          <FiLayers className="text-primary" />
          {t('planner.conclusion_plan', 'Conclusion Grid (جدول جمع‌بندی)')}
        </h5>
      </div>

      <div className="card-body p-0">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
            </div>
            <p className="mt-2 text-muted">{t('common.loading', 'Loading conclusion plan data...')}</p>
          </div>
        ) : !items || items.length === 0 ? (
          <div className="text-center py-5">
            <FiActivity size={40} className="text-muted mb-3 opacity-50" />
            <p className="text-muted mb-0">{t('planner.no_records_conclusion', 'No records found for the selected course.')}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-3" style={{ minWidth: '160px' }}>
                    {t('planner.course_title', 'Course / Exam')}
                  </th>
                  <th style={{ minWidth: '160px' }}>
                    {t('planner.chapter_title', 'Chapter')}
                  </th>
                  <th style={{ minWidth: '220px' }}>
                    {t('planner.mastery_level', 'Self-Assessed Mastery (1-100%)')}
                  </th>
                  <th style={{ minWidth: '380px' }}>
                    {t('planner.test_records_label', 'Test Analytics Breakdown')}
                  </th>
                  <th className="text-center pe-3" style={{ minWidth: '130px' }}>
                    {t('planner.total_solved', 'Total Tests')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const chapter = item.chapter;
                  const records = item.test_records || [];
                  const totalTestsForChapter = records.reduce((acc, r) => acc + (r.total_tests || 0), 0);
                  const isEditingMastery = editingMasteryChapterId === chapter.id;

                  return (
                    <tr key={chapter.id}>
                      {/* Course Title */}
                      <td className="ps-3">
                        <span className="fw-bold text-dark d-block">
                          {chapter.source_material_title || '—'}
                        </span>
                      </td>

                      {/* Chapter Title */}
                      <td>
                        <span className="badge bg-light text-dark border px-2 py-1 fs-6">
                          {chapter.chapter_number ? `${chapter.chapter_number}. ` : ''}
                          {chapter.title}
                        </span>
                      </td>

                      {/* Mastery Level */}
                      <td>
                        {isEditingMastery ? (
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              className="form-control form-control-sm"
                              style={{ width: '80px' }}
                              value={masteryInputVal}
                              onChange={(e) => setMasteryInputVal(e.target.value)}
                              disabled={actionLoading}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-success p-1"
                              onClick={() => handleSaveMastery(chapter.id)}
                              disabled={actionLoading}
                              title={t('common.save', 'Save')}
                            >
                              <FiCheck size={16} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary p-1"
                              onClick={() => setEditingMasteryChapterId(null)}
                              disabled={actionLoading}
                              title={t('common.cancel', 'Cancel')}
                            >
                              <FiX size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex flex-column gap-1">
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="small fw-bold">
                                {item.mastery_level !== null ? (
                                  <span className="d-inline-flex align-items-center gap-1">
                                    <FiAward className="text-warning" />
                                    {item.mastery_level}%
                                  </span>
                                ) : (
                                  <span className="text-muted small">
                                    {t('planner.not_set', 'Not Set')}
                                  </span>
                                )}
                              </span>

                              <div className="d-flex gap-1">
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm p-0 text-muted"
                                  onClick={() => handleStartEditMastery(chapter.id, item.mastery_level)}
                                  title={t('planner.set_mastery', 'Set Mastery')}
                                >
                                  <FiEdit2 size={14} />
                                </button>
                                {item.mastery_level !== null && (
                                  <button
                                    type="button"
                                    className="btn btn-link btn-sm p-0 text-danger"
                                    onClick={() => handleDeleteMastery(chapter.id)}
                                    title={t('common.delete', 'Remove')}
                                  >
                                    <FiTrash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="progress" style={{ height: '6px' }}>
                              <div
                                className={`progress-bar ${getMasteryColor(item.mastery_level)}`}
                                role="progressbar"
                                style={{ width: `${item.mastery_level || 0}%` }}
                                aria-valuenow={item.mastery_level || 0}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Test Records Breakdown */}
                      <td>
                        {records.length === 0 ? (
                          <span className="text-muted small fst-italic">
                            {t('planner.no_records_for_week', 'No test records')}
                          </span>
                        ) : (
                          <div className="d-flex flex-wrap gap-2">
                            {records.map((rec) => (
                              <div
                                key={rec.id}
                                className="border rounded p-2 bg-card shadow-sm d-flex align-items-center gap-2"
                                style={{ fontSize: '0.82rem' }}
                              >
                                <div>
                                  <div className="d-flex align-items-center gap-1 mb-1">
                                    <span className="badge bg-secondary-subtle text-secondary py-1">
                                      {t(`planner.formats.${rec.test_format}`, rec.test_format)}
                                    </span>
                                    <span className="badge bg-light text-muted border py-1">
                                      {t(`planner.methods.${rec.test_method}`, rec.test_method)}
                                    </span>
                                    <span className={`badge py-1 px-2 fw-bold ${getPercentageBadgeClass(rec.percentage)}`}>
                                      {rec.percentage}%
                                    </span>
                                  </div>

                                  <div className="text-muted small">
                                    <span>T: {rec.total_tests}</span> |{' '}
                                    <span className="text-success fw-semibold">✓ {rec.correct_tests}</span> |{' '}
                                    <span className="text-danger fw-semibold">✗ {rec.wrong_tests}</span> |{' '}
                                    <span>– {rec.untested_tests}</span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className="btn btn-link btn-sm text-danger p-0 ms-1 opacity-75 hover-opacity-100"
                                  onClick={() => handleDeleteTestRecord(rec.id)}
                                  disabled={actionLoading}
                                  title={t('common.delete', 'Delete')}
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Total Tests Solved */}
                      <td className="text-center pe-3">
                        <span className="badge bg-primary text-white px-3 py-2 fw-bold fs-6">
                          {totalTestsForChapter}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConclusionGrid;
