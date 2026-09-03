// src/components/wiki/QuestionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiThumbsUp, FiThumbsDown, FiTrash2, FiEdit, FiArrowLeft, FiAward } from 'react-icons/fi';
import api, { extractResults } from '../../services/api';
import AnswerCard from './AnswerCard';
import AnswerForm from './AnswerForm';
import CommentSection from './CommentSection';
import SuggestEditModal from './SuggestEditModal';
import { useAuth } from '../../context/AuthContext';
import { processMarkdown, getAuthorDisplayName, typesetMathJax } from '../../services/utils';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, canModerate } = useAuth(); 
  
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState(null);

  const authorId = typeof question?.author === 'object' ? question?.author?.id : question?.author;
  const isQuestionAuthor = Boolean(user?.id && authorId && String(authorId).toLowerCase() === String(user.id).toLowerCase());
  
  const displayAuthorName = getAuthorDisplayName(question?.author, question?.author_name, user);

  const fetchQuestionDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const qResponse = await api.get(`/questions/${id}/`);
      setQuestion(qResponse.data);
      
      const aResponse = await api.get(`/answers/?question=${id}&status=APPROVED`);
      setAnswers(extractResults(aResponse));
    } catch (err) {
      console.error('Failed to fetch question details:', err);
      setError('Failed to load question details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionDetails();
  }, [id]);

  useEffect(() => {
    if (question && question.body) {
      setTimeout(() => { typesetMathJax(); }, 100);
    }
  }, [question]);

  const handleVote = async (value) => {
    if (!isAuthenticated) {
      alert('Please login to vote');
      return;
    }
    setVoting(true);
    try {
      const response = await api.post(`/questions/${id}/vote/`, { value });
      setQuestion(prev => ({
        ...prev,
        user_vote: response.data.user_vote !== undefined ? response.data.user_vote : value,
        score: response.data.new_score
      }));
    } catch (err) {
      console.error('Failed to vote:', err);
      alert(err.response?.data?.message || 'Failed to vote.');
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t('questions.confirm_delete'))) {
      try {
        await api.delete(`/questions/${id}/`);
        navigate(-1);
      } catch (err) {
        console.error('Failed to delete question:', err);
        alert(t('questions.delete_failed'));
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="alert alert-danger mt-4">
        {error || 'Question not found.'}
        <br />
        <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const sortedAnswers = [...answers].sort((a, b) => Number(b.is_official || false) - Number(a.is_official || false));

  return (
    <div className="question-detail-page py-4">
      <button className="btn btn-sm btn-outline-secondary mb-3 d-flex align-items-center gap-2 border-0" onClick={() => navigate(-1)}>
        <FiArrowLeft /> {t('common.back')}
      </button>

      <div className={`card mb-4 border-0 shadow-sm ${question.is_official ? 'border-top border-primary border-4' : ''}`} style={{ borderTop: !question.is_official ? '3px solid var(--primary-blue)' : '' }}>
        <div className="card-body">
          <div className="d-flex gap-3">
            
            <div className="d-flex flex-column align-items-center">
              <button
                className={`btn btn-sm border-0 p-1 ${question.user_vote === 1 ? 'text-success' : 'text-muted'}`}
                onClick={() => handleVote(1)}
                disabled={voting || !isAuthenticated}
              >
                <FiThumbsUp size={24} className={question.user_vote === 1 ? 'fill-current' : ''} />
              </button>
              <span className="fw-bold my-1 fs-5 text-dark">{question.score || 0}</span>
              <button
                className={`btn btn-sm border-0 p-1 ${question.user_vote === -1 ? 'text-danger' : 'text-muted'}`}
                onClick={() => handleVote(-1)}
                disabled={voting || !isAuthenticated}
              >
                <FiThumbsDown size={24} className={question.user_vote === -1 ? 'fill-current' : ''} />
              </button>
            </div>

            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h3 className="card-title text-primary fw-bold mb-0">
                  {question.title || `Question #${question.id}`}
                </h3>
                {question.is_official && (
                  <span className="badge bg-primary d-flex align-items-center gap-1">
                    <FiAward /> {t('questions.official', 'Official')}
                  </span>
                )}
              </div>
              
              <div
                className="question-text mb-4 text-dark"
                style={{ fontSize: '15px', lineHeight: '1.7' }}
                dangerouslySetInnerHTML={{
                  __html: processMarkdown(question.body || question.text, question.attachments || [])
                }}
              />

              {question.tags && question.tags.length > 0 && (
                <div className="mb-3 d-flex gap-2 flex-wrap">
                  {question.tags.map(tag => (
                    <span key={tag.id || tag} className="badge bg-light text-muted border">
                      {tag.value || tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center border-top pt-3 text-muted small">
                <div className="d-flex align-items-center gap-3">
                  <span>
                    <i className="bi bi-person me-1"></i>
                    {displayAuthorName}
                  </span>
                  <span>
                    <i className="bi bi-calendar me-1"></i>
                    {t('questions.asked')}: {question.created_at_jalali ? question.created_at_jalali.split('T')[0] : ''}
                  </span>
                  
                  {question.status !== 'APPROVED' && (
                    <span className={`badge ${question.status === 'PENDING' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                      {question.status}
                    </span>
                  )}
                </div>
                
                <div className="d-flex gap-2">
                  {(isQuestionAuthor || canModerate) && (
                    <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 border-0" onClick={() => setShowEditModal(true)}>
                      <FiEdit /> {canModerate || isQuestionAuthor ? t('common.edit') : t('common.suggest_edit')}
                    </button>
                  )}
                  {(isQuestionAuthor || canModerate) && (
                    <button className="btn btn-sm text-danger d-flex align-items-center gap-1 border-0" onClick={handleDelete}>
                      <FiTrash2 /> {t('common.delete')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <CommentSection targetType="questions" targetId={question.id} />
        </div>
      </div>

      <div className="answers-section mt-5">
        <h4 className="mb-4 pb-2 border-bottom fw-bold text-dark">
          {answers.length} {t('questions.answers')}
        </h4>

        {sortedAnswers.length > 0 ? (
          sortedAnswers.map((answer) => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              question={question}
              onAcceptSuccess={fetchQuestionDetails}
              onDeleteSuccess={fetchQuestionDetails}
            />
          ))
        ) : (
          <div className="alert alert-light border text-center text-muted py-4">
            {t('questions.no_answers')}
          </div>
        )}
      </div>

      {isAuthenticated && (
        <div className="mt-5">
          <AnswerForm questionId={question.id} onSubmit={fetchQuestionDetails} />
        </div>
      )}

      <SuggestEditModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        itemId={question.id}
        itemType="question"
        currentText={question.text || question.body || ''}
        currentAttachments={question.attachments || []}
        isDirectEdit={canModerate}
        onSuccess={() => {
          setShowEditModal(false);
          fetchQuestionDetails();
        }}
      />
    </div>
  );
};

export default QuestionDetail;