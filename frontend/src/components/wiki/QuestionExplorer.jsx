import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api, { extractResults } from '../../services/api';
import QuestionForm from './QuestionForm';
import { useAuth } from '../../context/AuthContext';
import { getAuthorDisplayName } from '../../services/utils';

const QuestionItemLight = ({ question }) => {
  const { user } = useAuth();
  const displayAuthorName = getAuthorDisplayName(question.author, question.author_name || question.author__username, user);

  return (
    <div className="card mb-3 academic-card border-0 shadow-sm transition-hover">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h5 className="card-title fw-bold mb-2">
              <Link to={`/questions/${question.id}`} className="text-decoration-none text-primary">
                {question.title || `Question #${question.id}`}
              </Link>
            </h5>
            <div className="text-muted small mb-2">
              <span className="me-3">
                <i className="bi bi-person me-1"></i>
                {displayAuthorName}
              </span>
              <span>
                <i className="bi bi-calendar me-1"></i>
                {question.created_at_jalali ? question.created_at_jalali.split('T')[0] : ''}
              </span>
            </div>
            {question.tags && question.tags.length > 0 && (
              <div className="d-flex gap-1 flex-wrap">
                {question.tags.map(tag => (
                  <span key={tag.id || tag} className="badge bg-light text-secondary border" style={{ fontSize: '11px' }}>
                    {tag.value || tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="d-flex flex-column align-items-end">
            <span className={`badge mb-2 ${question.status === 'APPROVED' ? 'bg-success' : 'bg-warning'}`}>
              {question.status}
            </span>
            <div className="d-flex align-items-center gap-2 text-muted small border rounded px-2 py-1 bg-light">
              <div title="Score"><i className="bi bi-arrow-up-circle me-1"></i>{question.score || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuestionExplorer = ({ examId: propExamId }) => {
  const { examId: paramExamId } = useParams();
  const { t } = useTranslation();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState(''); // ایجاد حالت جدید برای کنترل سرچ
  
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const currentExamId = propExamId || paramExamId;

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let url = `/questions/?source_material=${currentExamId}&status=APPROVED`;
      if (submittedSearch) {
        url += `&search=${encodeURIComponent(submittedSearch)}`;
      }
      const response = await api.get(url);
      setQuestions(extractResults(response));
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentExamId) {
      fetchQuestions();
    }
  }, [currentExamId, submittedSearch]); // فقط هنگام تغییر عبارت ثبت‌شده API فراخوانی می‌شود

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSubmittedSearch(searchTerm);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2">{t('questions.loading', 'Loading questions...')}</p>
      </div>
    );
  }

  return (
    <div className="question-explorer">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">{t('questions.exam_questions', 'Exam Questions')}</h2>
        {isAuthenticated && (
          <button
            className="btn btn-primary"
            onClick={() => setShowQuestionForm(!showQuestionForm)}
          >
            {showQuestionForm ? t('common.cancel', 'Cancel') : t('questions.ask_question', 'Ask a Question')}
          </button>
        )}
      </div>

      {showQuestionForm && (
        <QuestionForm
          examId={currentExamId}
          onSuccess={() => {
            fetchQuestions();
            setShowQuestionForm(false);
          }}
          onClose={() => setShowQuestionForm(false)}
        />
      )}

      {/* فرم جستجو با دکمه */}
      <div className="mb-4">
        <form onSubmit={handleSearchSubmit}>
          <div className="input-group shadow-sm">
            <input
              type="text"
              className="form-control border-end-0"
              placeholder={t('questions.search_placeholder', 'Search questions...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-primary px-4">
              <i className="bi bi-search me-2"></i>
              <span className="d-none d-sm-inline">{t('common.search', 'Search')}</span>
            </button>
          </div>
        </form>
      </div>

      {!currentExamId ? (
        <div className="alert alert-warning">
          {t('questions.no_exam_id', 'No exam ID provided. Please navigate from a source material.')}
        </div>
      ) : questions.length === 0 ? (
        <div className="alert alert-info">
          {t('questions.no_questions', 'No questions available for this exam yet.')}
        </div>
      ) : (
        <div className="questions-list">
          {questions.map((question) => (
            <QuestionItemLight key={question.id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionExplorer;