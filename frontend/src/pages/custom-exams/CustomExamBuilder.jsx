import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiX, FiMove } from 'react-icons/fi';
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
    <div className="custom-exam-builder-page py-4">
      <h2 className="mb-4">{t('custom_exams.build_exam', 'Build Custom Exam')}</h2>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="mb-3">
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
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || examCart.length === 0}
            >
              <FiSave className="me-1" />
              {saving ? t('common.saving') : t('custom_exams.save_exam', 'Save Exam')}
            </button>
            <button
              className="btn btn-outline-danger"
              onClick={() => {
                if (window.confirm(t('custom_exams.clear_confirm', 'Clear all questions from cart?'))) {
                  clearExam();
                }
              }}
              disabled={examCart.length === 0}
            >
              <FiX className="me-1" />
              {t('custom_exams.clear_cart', 'Clear Cart')}
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h5 className="mb-0">
            {t('custom_exams.selected_questions', 'Selected Questions')} ({examCart.length})
          </h5>
        </div>
        <div className="card-body">
          {examCart.length === 0 ? (
            <div className="alert alert-info mb-0">
              {t('custom_exams.no_questions_in_cart', 'No questions added yet. Browse questions and click "Add to Exam" to build your custom exam.')}
            </div>
          ) : (
            <div className="list-group">
              {examCart.map((question, index) => (
                <div key={question.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1">
                    <strong className="text-primary">Q{index + 1}:</strong> {question.title || `Question #${question.id}`}
                    {question.tags && question.tags.length > 0 && (
                      <div className="mt-1">
                        {question.tags.slice(0, 3).map(tag => (
                          <span key={tag.id || tag} className="badge bg-light text-secondary border me-1" style={{ fontSize: '10px' }}>
                            {tag.value || tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2 align-items-center">
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
                      className="btn btn-sm btn-outline-danger"
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
