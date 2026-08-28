import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiThumbsUp, FiThumbsDown, FiTrash2, FiEdit } from 'react-icons/fi';
import api, { extractResults } from '../../services/api';
import AnswerCard from './AnswerCard';
import AnswerForm from './AnswerForm';
import CommentSection from './CommentSection';
import QuestionForm from './QuestionForm';
import SuggestEditModal from './SuggestEditModal';
import { useAuth } from '../../context/AuthContext';

/**
 * QuestionItem Component
 * Handles fetching and displaying answers for a specific question to support the flat API structure.
 */
const QuestionItem = ({ question, isAuthenticated, user, handleQuestionVote, votingQuestionId, onRefresh }) => {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState([]);
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  // Check if logged in user is the author
  // Fallback check handles both object structure (if fixed in backend) and UUID string
  const isQuestionAuthor = user?.id && (question.author === user.id || question.author?.id === user.id);

  const fetchAnswers = async () => {
    try {
      setLoadingAnswers(true);
      const response = await api.get(`/answers/?question=${question.id}&status=APPROVED`);
      setAnswers(extractResults(response));
    } catch (error) {
      console.error(`Failed to fetch answers for question ${question.id}:`, error);
      setAnswers([]);
    } finally {
      setLoadingAnswers(false);
    }
  };

  useEffect(() => {
    fetchAnswers();
  }, [question.id]);

  /**
   * Handle deleting the question
   */
  const handleDelete = async () => {
    if (window.confirm(t('questions.confirm_delete', 'Are you sure you want to delete this question?'))) {
      try {
        await api.delete(`/questions/${question.id}/`);
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Failed to delete question:', error);
        alert(t('questions.delete_failed', 'Failed to delete the question.'));
      }
    }
  };

  return (
    <div className="question-item mb-5">
      {/* Question Header */}
      <div className="card mb-3 bg-light">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h4 className="text-primary mb-0" style={{ fontSize: '18px' }}>
              {t('questions.question_number', 'Question')} {question.id}
            </h4>

            {/* Voting UI */}
            <div className="d-flex align-items-center bg-white border rounded px-2 py-1 shadow-sm">
              <button
                className={`btn btn-sm border-0 p-1 ${question.user_vote === 1 ? 'text-success' : 'text-secondary'}`}
                onClick={() => handleQuestionVote(question.id, 1)}
                disabled={votingQuestionId === question.id || !isAuthenticated}
                title={isAuthenticated ? t('common.upvote', 'Upvote') : t('common.login_to_vote', 'Login to vote')}
              >
                <FiThumbsUp size={18} className={question.user_vote === 1 ? 'fill-current' : ''} />
              </button>

              <span className="mx-2 fw-bold" style={{ fontSize: '1.1rem', minWidth: '20px', textAlign: 'center' }}>
                {question.score || 0}
              </span>

              <button
                className={`btn btn-sm border-0 p-1 ${question.user_vote === -1 ? 'text-danger' : 'text-secondary'}`}
                onClick={() => handleQuestionVote(question.id, -1)}
                disabled={votingQuestionId === question.id || !isAuthenticated}
                title={isAuthenticated ? t('common.downvote', 'Downvote') : t('common.login_to_vote', 'Login to vote')}
              >
                <FiThumbsDown size={18} className={question.user_vote === -1 ? 'fill-current' : ''} />
              </button>
            </div>
          </div>

          {/* Render Title if it exists */}
          {question.title && (
            <h5 className="card-title mt-2 fw-bold text-dark">{question.title}</h5>
          )}

          <div
            className="question-text mt-2"
            style={{ fontSize: '16px', lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{
              __html: question.text?.replace(/\$(.*?)\$/g, '<span class="math-inline">$1</span>') || question.body || ''
            }}
          />

          {/* Status Badge */}
          {question.status && (
            <span className={`badge mt-3 ${question.status === 'APPROVED' ? 'bg-success' : 'bg-warning'}`}>
              {question.status === 'APPROVED' ? t('common.approved', 'Approved') : t('common.pending', 'Pending Review')}
            </span>
          )}

          {/* Author and Timestamp using Jalali date (Time removed) */}
          <small className="text-muted d-block mt-3 border-top pt-2">
            <i className="bi bi-person me-1"></i>
            {question.author_name || (typeof question.author === 'string' ? `User ID: ${question.author.substring(0,8)}` : question.author?.username) || t('common.unknown_author', 'Unknown Author')}
            <span className="mx-2">|</span>
            <i className="bi bi-calendar me-1"></i>
            {t('questions.asked', 'Asked')}: {question.created_at_jalali ? question.created_at_jalali.split('T')[0] : ''}
          </small>

          {/* Author Actions (Only visible to the author of the question) */}
          {isQuestionAuthor && (
            <div className="mt-3 d-flex gap-2">
              <button 
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                onClick={() => setShowEditModal(true)}
              >
                <FiEdit /> {t('common.suggest_edit', 'Suggest Edit')}
              </button>
              <button 
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                onClick={handleDelete}
              >
                <FiTrash2 /> {t('common.delete', 'Delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Answers List */}
      <div className="answers-section">
        <h5 className="mb-3">
          {t('questions.answers', 'Answers')} ({answers.length})
        </h5>

        {loadingAnswers ? (
          <div className="text-center my-3">
            <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
          </div>
        ) : answers.length > 0 ? (
          answers.map((answer) => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              question={question}
              onAcceptSuccess={() => fetchAnswers()}
              onDeleteSuccess={() => fetchAnswers()}
            />
          ))
        ) : (
          <div className="alert alert-warning">
            {t('questions.no_answers', 'No answers submitted yet. Be the first to contribute!')}
          </div>
        )}
      </div>

      {/* General Answer Form for all authenticated users */}
      {isAuthenticated && (
        <AnswerForm
          questionId={question.id}
          onSubmit={() => fetchAnswers()}
        />
      )}

      {/* Comments Section for Question */}
      <CommentSection targetType="questions" targetId={question.id} />
      
      {/* Edit Modal */}
      <SuggestEditModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        itemId={question.id}
        itemType="question"
        currentText={question.text || question.body || ''}
        onSuccess={() => {
          setShowEditModal(false);
          if (onRefresh) onRefresh();
        }}
      />
      <hr className="my-4" />
    </div>
  );
};

/**
 * QuestionExplorer Component
 * Displays a list of questions for a specific source material.
 */
const QuestionExplorer = ({ examId: propExamId }) => {
  const { examId: paramExamId } = useParams();
  const { t } = useTranslation();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Use examId from props or URL parameters
  const currentExamId = propExamId || paramExamId;

  // Voting state for questions
  const [votingQuestionId, setVotingQuestionId] = useState(null);
  const [voteError, setVoteError] = useState(null);

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

  const handleQuestionVote = async (questionId, value) => {
    if (!isAuthenticated) {
      alert(t('common.login_to_vote', 'Please login to vote'));
      return;
    }
    setVotingQuestionId(questionId);
    setVoteError(null);

    try {
      const response = await api.post(`/questions/${questionId}/vote/`, { value });
      
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              user_vote: response.data.user_vote !== undefined ? response.data.user_vote : value,
              score: response.data.new_score 
            } 
          : q
      ));
    } catch (err) {
      console.error('Failed to vote:', err);
      setVoteError(
        err.response?.data?.message ||
        t('questions.vote_error', 'Failed to vote. Please try again.')
      );
    } finally {
      setVotingQuestionId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
        </div>
        <p className="mt-2">{t('questions.loading', 'Loading questions...')}</p>
      </div>
    );
  }

  return (
    <div className="question-explorer">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">{t('questions.exam_questions', 'Exam Questions')}</h2>
        
        {/* Ask a Question Button */}
        {isAuthenticated && (
          <button
            className="btn btn-primary"
            onClick={() => setShowQuestionForm(!showQuestionForm)}
          >
            {showQuestionForm ? t('common.cancel', 'Cancel') : t('questions.ask_question', 'Ask a Question')}
          </button>
        )}
      </div>
      
      {/* Question Form */}
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
      
      {/* Search Input */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder={t('questions.search_placeholder', 'Search questions...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
        questions.map((question) => (
          <QuestionItem 
            key={question.id}
            question={question}
            isAuthenticated={isAuthenticated}
            user={user}
            handleQuestionVote={handleQuestionVote}
            votingQuestionId={votingQuestionId}
            onRefresh={fetchQuestions}
          />
        ))
      )}

      {voteError && (
        <div className="alert alert-danger mt-3">
          <small>{voteError}</small>
        </div>
      )}
    </div>
  );
};

export default QuestionExplorer;