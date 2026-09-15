import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiX } from 'react-icons/fi';
import { useCustomExam } from '../../context/CustomExamContext';
import { createCustomExam } from '../../services/api';
import { getErrorMessage } from '../../utils/errorHandler';

const CustomExamBuilder = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { examCart, removeFromExam, clearExam, reorderQuestions } = useCustomExam();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      alert(t('custom_exams.title_required', 'Please enter a title for your exam'));
      return;
    }

    if (examCart.length === 0) {
      alert(t('custom_exams.no_questions', 'Please add at least one question to your exam'));
      return;
    }

    setSaving(true);
    try {
      await createCustomExam({
        title: title.trim(),
        question_ids: examCart.map(q => q.id)
      });
      alert(t('custom_exams.save_success', 'Custom exam created successfully!'));
      clearExam();
      navigate('/custom-exams');
    } catch (error) {
      alert(getErrorMessage(error, 'custom_exams.save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const moveQuestion = (index, direction) => {
    const newOrder = [...examCart];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newOrder.length) return;

    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    reorderQuestions(newOrder);
  };

  return (
    <div className="custom-exam-builder-page" style={{ padding: 'var(--space-lg)' }}>
      <h2 style={{ marginBlockEnd: 'var(--space-lg)' }}>{t('custom_exams.build_exam', 'Build Custom Exam')}</h2>

      <div className="card shadow-sm border-0" style={{ marginBlockEnd: 'var(--space-lg)' }}>
        <div className="card-body" style={{ padding: 'var(--space-lg)' }}>
          <div style={{ marginBlockEnd: 'var(--space-md)' }}>
            <label className="form-label fw-bold">{t('custom_exams.exam_title', 'Exam Title')}</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('custom_exams.title_placeholder', 'Enter a title for your custom exam')}
            />
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={handleSave}
              disabled={saving || examCart.length === 0}
            >
              <FiSave />
              <span>{saving ? t('common.saving') : t('custom_exams.save_exam', 'Save Exam')}</span>
            </button>
            <button
              className="btn btn-outline-danger d-flex align-items-center gap-2"
              onClick={() => {
                if (window.confirm(t('custom_exams.clear_confirm', 'Clear all questions from cart?'))) {
                  clearExam();
                }
              }}
              disabled={examCart.length === 0}
            >
              <FiX />
              <span>{t('custom_exams.clear_cart', 'Clear Cart')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white" style={{ padding: 'var(--space-md)' }}>
          <h5 className="mb-0">
            {t('custom_exams.selected_questions', 'Selected Questions')} ({examCart.length})
          </h5>
        </div>
        <div className="card-body" style={{ padding: 'var(--space-lg)' }}>
          {examCart.length === 0 ? (
            <div className="alert alert-info mb-0">
              {t('custom_exams.no_questions_in_cart', 'No questions added yet. Browse questions and click "Add to Exam" to build your custom exam.')}
            </div>
          ) : (
            <div className="d-flex flex-column" style={{ gap: 'var(--space-sm)' }}>
              {examCart.map((question, index) => (
                <div
                  key={question.id}
                  className="d-flex justify-content-between align-items-center p-3 border rounded"
                  style={{ gap: 'var(--space-md)' }}
                >
                  <div className="flex-grow-1">
                    <div>
                      <strong className="text-primary">Q{index + 1}:</strong> {question.title || `Question #${question.id}`}
                    </div>
                    {question.tags && question.tags.length > 0 && (
                      <div className="d-flex flex-wrap" style={{ gap: 'var(--space-xs)', marginBlockStart: 'var(--space-xs)' }}>
                        {question.tags.slice(0, 3).map(tag => (
                          <span key={tag.id || tag} className="badge bg-light text-secondary border" style={{ fontSize: '10px' }}>
                            {tag.value || tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="d-flex align-items-center" style={{ gap: 'var(--space-sm)' }}>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => moveQuestion(index, 'up')}
                        disabled={index === 0}
                        title={t('custom_exams.move_up', 'Move up')}
                      >
                        ↑
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => moveQuestion(index, 'down')}
                        disabled={index === examCart.length - 1}
                        title={t('custom_exams.move_down', 'Move down')}
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger d-flex align-items-center"
                      onClick={() => removeFromExam(question.id)}
                    >
                      <FiX />
                    </button>
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

export default CustomExamBuilder;
