import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft } from 'react-icons/fi';
import { getCustomExamById } from '../../services/api';
import { processMarkdown, typesetMathJax } from '../../services/utils';

const CustomExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExam();
  }, [id]);

  const fetchExam = async () => {
    setLoading(true);
    try {
      const response = await getCustomExamById(id);
      setExam(response.data);
      setTimeout(() => typesetMathJax(), 100);
    } catch (error) {
      console.error('Failed to fetch exam:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2">{t('common.loading')}</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="alert alert-danger mt-4">
        {t('custom_exams.not_found', 'Exam not found')}
        <br />
        <button className="btn btn-primary mt-3" onClick={() => navigate('/custom-exams')}>
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="custom-exam-detail-page py-4">
      <button
        className="btn btn-sm btn-outline-secondary mb-3 d-flex align-items-center gap-2 border-0"
        onClick={() => navigate('/custom-exams')}
      >
        <FiArrowLeft /> {t('common.back')}
      </button>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h2 className="card-title text-primary fw-bold">{exam.title}</h2>
          <div className="text-muted">
            <small>
              <i className="bi bi-calendar me-1"></i>
              {t('custom_exams.created_on', 'Created')}: {new Date(exam.created_at).toLocaleDateString()}
            </small>
            <small className="ms-3">
              <i className="bi bi-file-text me-1"></i>
              {exam.questions?.length || 0} {t('custom_exams.questions', 'Questions')}
            </small>
          </div>
        </div>
      </div>

      {exam.questions && exam.questions.length > 0 ? (
        exam.questions.map((question, index) => (
          <div key={question.id} className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="d-flex align-items-start gap-3">
                <div className="badge bg-primary px-3 py-2" style={{ fontSize: '16px' }}>
                  Q{index + 1}
                </div>
                <div className="flex-grow-1">
                  <h5 className="card-title fw-bold">{question.title || `Question #${question.id}`}</h5>

                  {question.body && (
                    <div
                      className="question-text mb-3"
                      dangerouslySetInnerHTML={{
                        __html: processMarkdown(question.body, question.attachments || [])
                      }}
                    />
                  )}

                  {question.tags && question.tags.length > 0 && (
                    <div className="mb-3">
                      {question.tags.map(tag => (
                        <span key={tag.id || tag} className="badge bg-light text-secondary border me-1">
                          {tag.value || tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {question.official_answer && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <h6 className="fw-bold text-success mb-2">
                        <i className="bi bi-check-circle me-1"></i>
                        {t('custom_exams.official_answer', 'Official Answer')}
                      </h6>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: processMarkdown(question.official_answer.text || question.official_answer.body, question.official_answer.attachments || [])
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="alert alert-info">
          {t('custom_exams.no_questions', 'No questions in this exam')}
        </div>
      )}
    </div>
  );
};

export default CustomExamDetail;
