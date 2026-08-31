import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiThumbsUp, FiThumbsDown, FiTrash2, FiEdit, FiArrowLeft } from 'react-icons/fi';
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
  const { user, isAuthenticated } = useAuth();
  
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
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await api.delete(`/questions/${id}/`);
        navigate(-1);
      } catch (err) {
        console.error('Failed to delete question:', err);
        alert('Failed to delete the question.');
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2">Loading question...</p>
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

  return (
    <div className="question-detail-page py-4">
      <button className="btn btn-outline-secondary mb-4 d-flex align-items-center gap-2" onClick={() => navigate(-1)}>
        <FiArrowLeft /> {t('common.back')}
      </button>

      {/* Question Header & Body */}
      <div className="card mb-4 border-primary border-opacity-25 shadow-sm">
        <div className="card-body">
          <div className="d-flex gap-3">
            {/* Voting Sidebar */}
            <div className="d-flex flex-column align-items-center">
              <button
                className={`btn btn-sm border-0 p-1 ${question.user_vote === 1 ? 'text-success' : 'text-secondary'}`}
                onClick={() => handleVote(1)}
                disabled={voting || !isAuthenticated}
              >
                <FiThumbsUp size={24} className={question.user_vote === 1 ? 'fill-current' : ''} />
              </button>
              <span className="fw-bold my-1 fs-5">{question.score || 0}</span>
              <button
                className={`btn btn-sm border-0 p-1 ${question.user_vote === -1 ? 'text-danger' : 'text-secondary'}`}
                onClick={() => handleVote(-1)}
                disabled={voting || !isAuthenticated}
              >
                <FiThumbsDown size={24} className={question.user_vote === -1 ? 'fill-current' : ''} />
              </button>
            </div>

            {/* Main Question Content */}
            <div className="flex-grow-1">
              <h3 className="card-title text-primary fw-bold mb-3">
                {question.title || `Question #${question.id}`}
              </h3>
              
              <div
                className="question-text mb-4"
                style={{ fontSize: '16px', lineHeight: '1.7' }}
                dangerouslySetInnerHTML={{
                  __html: processMarkdown(question.body || question.text)
                }}
              />

              {/* Tags */}
              {question.tags && question.tags.length > 0 && (
                <div className="mb-3 d-flex gap-2 flex-wrap">
                  {question.tags.map(tag => (
                    <span key={tag.id || tag} className="badge bg-light text-secondary border">
                      {tag.value || tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="d-flex justify-content-between align-items-center border-top pt-3 text-muted small">
                <div>
                  <i className="bi bi-person me-1"></i>
                  {displayAuthorName}
                  <span className="mx-2">|</span>
                  <i className="bi bi-calendar me-1"></i>
                  {t('questions.asked')}: {question.created_at_jalali ? question.created_at_jalali.split('T')[0] : ''}
                  
                  <span className={`badge ms-3 ${question.status === 'APPROVED' ? 'bg-success' : 'bg-warning'}`}>
                    {question.status}
                  </span>
                </div>
                
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => setShowEditModal(true)}>
                    <FiEdit /> {isQuestionAuthor ? t('common.edit') : t('common.suggest_edit')}
                  </button>
                  {isQuestionAuthor && (
                    <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={handleDelete}>
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

      {/* Answers Section */}
      <div className="answers-section mt-5">
        <h4 className="mb-4 pb-2 border-bottom">
          {answers.length} {t('questions.answers')}
        </h4>

        {answers.length > 0 ? (
          answers.map((answer) => (
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

      {/* Answer Form */}
      {isAuthenticated && (
        <div className="mt-5">
          <AnswerForm questionId={question.id} onSubmit={fetchQuestionDetails} />
        </div>
      )}

      {/* Edit Modal */}
      <SuggestEditModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        itemId={question.id}
        itemType="question"
        currentText={question.text || question.body || ''}
        currentAttachments={question.attachments || []}
        onSuccess={() => {
          setShowEditModal(false);
          fetchQuestionDetails();
        }}
      />
    </div>
  );
};

export default QuestionDetail;