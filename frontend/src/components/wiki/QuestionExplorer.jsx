import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api, { extractResults } from '../../services/api';
import QuestionForm from './QuestionForm';
import { useAuth } from '../../context/AuthContext';

/**
 * Lightweight QuestionItem Component for the Explorer list
 */
const QuestionItemLight = ({ question }) => {
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
                {question.author_name || question.author?.username || 'Unknown Author'}
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
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const { isAuthenticated } = useAuth();

  const currentExamId = propExamId || paramExamId;

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let url = `/questions/?source_material=${currentExamId}&status=APPROVED`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
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
  }, [currentExamId, searchTerm]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="question-explorer">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Exam Questions</h2>
        {isAuthenticated && (
          <button
            className="btn btn-primary"
            onClick={() => setShowQuestionForm(!showQuestionForm)}
          >
            {showQuestionForm ? 'Cancel' : 'Ask a Question'}
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

      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
          <input
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {!currentExamId ? (
        <div className="alert alert-warning">
          No exam ID provided. Please navigate from a source material.
        </div>
      ) : questions.length === 0 ? (
        <div className="alert alert-info">
          No questions available for this exam yet.
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