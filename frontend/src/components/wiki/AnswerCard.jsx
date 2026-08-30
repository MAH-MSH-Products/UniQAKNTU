import React, { useEffect, useState } from 'react';
import { FiThumbsUp, FiThumbsDown, FiTrash2, FiEdit, FiCheckCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SuggestEditModal from './SuggestEditModal';
import CommentSection from './CommentSection';
import { processMarkdown, getAuthorDisplayName, typesetMathJax } from '../../services/utils';

const AnswerCard = ({ answer, question, onAcceptSuccess, onDeleteSuccess }) => {
  const { t } = useTranslation();
  const {
    id,
    author,
    body = '',
    status = 'PENDING',
    image = null,
    pdf_file = null,
    user_vote = 0,
    created_at_jalali,
    is_accepted = false,
  } = answer;

  const { user, isAuthenticated } = useAuth();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState(null);
  
  // Voting state
  const [currentVote, setCurrentVote] = useState(user_vote || 0);
  const [score, setScore] = useState(answer.score || 0);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState(null);

  // Exact ID matching for Author Permissions
  const questionAuthorId = typeof question?.author === 'object' ? question?.author?.id : question?.author;
  const isQuestionAuthor = Boolean(user?.id && questionAuthorId && String(questionAuthorId).toLowerCase() === String(user.id).toLowerCase());

  const answerAuthorId = typeof author === 'object' ? author?.id : author;
  const isAnswerAuthor = Boolean(user?.id && answerAuthorId && String(answerAuthorId).toLowerCase() === String(user.id).toLowerCase());

  // Formatting Author Name
  const displayAuthorName = getAuthorDisplayName(author, null, user);

  const handleVote = async (value) => {
    if (!isAuthenticated) {
      alert(t('common.login_to_vote'));
      return;
    }
    setVoting(true);
    setVoteError(null);
    try {
      const response = await api.post(`/answers/${id}/vote/`, { value });
      setCurrentVote(response.data.user_vote !== undefined ? response.data.user_vote : value);
      if (response.data.new_score !== undefined) {
        setScore(response.data.new_score);
      }
    } catch (err) {
      console.error('Failed to vote:', err);
      setVoteError(
        err.response?.data?.message ||
        t('answers.vote_error')
      );
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t('answers.confirm_delete'))) {
      try {
        await api.delete(`/answers/${id}/`);
        if (onDeleteSuccess) onDeleteSuccess();
      } catch (error) {
        console.error('Failed to delete answer:', error);
        alert(t('answers.delete_failed'));
      }
    }
  };

  const handleAcceptAnswer = async () => {
    if (!isQuestionAuthor) return;
    
    setAccepting(true);
    setAcceptError(null);
    
    try {
      const response = await api.post(`/answers/${id}/accept/`);
      if (onAcceptSuccess) {
        onAcceptSuccess(response.data);
      }
    } catch (err) {
      console.error('Failed to accept answer:', err);
      setAcceptError(
        err.response?.data?.message ||
        t('answers.accept_failed')
      );
    } finally {
      setAccepting(false);
    }
  };

  useEffect(() => {
    setTimeout(() => { typesetMathJax(); }, 100);
  }, [body]);

  const processedContent = processMarkdown(body);

  const getStatusBadge = () => {
    if (status === 'APPROVED') {
      return <span className="badge bg-success">{t('common.approved')}</span>;
    } else if (status === 'PENDING') {
      return <span className="badge bg-warning">{t('common.pending')}</span>;
    } else if (status === 'REJECTED') {
      return <span className="badge bg-danger">{t('common.rejected')}</span>;
    }
    return null;
  };

  return (
    <div className="answer-card card mb-3" id={`answer-${id}`}>
      <div className="card-header bg-white border-bottom-0 pb-0">
        <div className="d-flex justify-content-between align-items-start">
          
          {/* Author Info */}
          <div>
            <h6 className="mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-person-circle text-secondary"></i>
              {displayAuthorName}
              {author?.role && (
                <span className="badge bg-secondary ms-2" style={{ fontSize: '0.7rem' }}>
                  {author.role === 'ADMIN' ? 'Admin' : author.role === 'MODERATOR' ? 'Moderator' : 'Student'}
                </span>
              )}
            </h6>
            
            {created_at_jalali && (
              <small className="text-muted d-block mt-1" style={{ fontSize: '0.8rem' }}>
                {t('answers.posted')}: {created_at_jalali.split('T')[0]}
              </small>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            {is_accepted && (
              <span className="badge bg-success d-flex align-items-center gap-1">
                <FiCheckCircle />
                {t('answers.accepted')}
              </span>
            )}
            {getStatusBadge()}
          </div>
        </div>
      </div>

      <div className="card-body pt-2">
        <div className="d-flex gap-3">
          
          {/* Voting UI */}
          <div className="d-flex flex-column align-items-center">
            <button 
              className={`btn btn-sm border-0 p-1 ${currentVote === 1 ? 'text-success' : 'text-secondary'}`}
              onClick={() => handleVote(1)}
              disabled={voting || !isAuthenticated}
              title={isAuthenticated ? t('common.upvote') : t('common.login_to_vote')}
            >
              <FiThumbsUp size={22} className={currentVote === 1 ? 'fill-current' : ''} />
            </button>
            
            <span className="fw-bold my-1" style={{ fontSize: '1.2rem' }}>
              {score}
            </span>
            
            <button 
              className={`btn btn-sm border-0 p-1 ${currentVote === -1 ? 'text-danger' : 'text-secondary'}`}
              onClick={() => handleVote(-1)}
              disabled={voting || !isAuthenticated}
              title={isAuthenticated ? t('common.downvote') : t('common.login_to_vote')}
            >
              <FiThumbsDown size={22} className={currentVote === -1 ? 'fill-current' : ''} />
            </button>
          </div>

          {/* Answer Content */}
          <div className="flex-grow-1">
            <div 
              className="answer-content mb-3"
              dangerouslySetInnerHTML={{ __html: processedContent }}
              style={{ lineHeight: '1.6', fontSize: '15px' }}
            />

            {image && (
              <div className="answer-image mb-3">
                <img 
                  src={image} 
                  alt="Answer attachment" 
                  className="img-fluid rounded border shadow-sm"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
              </div>
            )}

            {pdf_file && (
              <div className="answer-pdf mb-3">
                <a 
                  href={pdf_file} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary btn-sm"
                >
                  <i className="bi bi-file-pdf me-2"></i>
                  {t('answers.download_pdf')}
                </a>
              </div>
            )}

            {/* Action Buttons (Edit / Delete / Accept) */}
            <div className="d-flex gap-2 mt-3 pt-2 border-top">
              {/* Accept Answer Button */}
              {isQuestionAuthor && !is_accepted && status === 'APPROVED' && (
                <button 
                  className="btn btn-sm btn-success d-flex align-items-center gap-1"
                  onClick={handleAcceptAnswer}
                  disabled={accepting}
                >
                  {accepting ? <span className="spinner-border spinner-border-sm"></span> : <FiCheckCircle />}
                  {t('answers.accept')}
                </button>
              )}

              <button 
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                onClick={() => setShowEditModal(true)}
              >
                <FiEdit /> {isAnswerAuthor ? t('common.edit') : t('common.suggest_edit')}
              </button>
              
              {/* Delete (ONLY if Exact Author) */}
              {isAnswerAuthor && (
                <button 
                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                  onClick={handleDelete}
                >
                  <FiTrash2 /> {t('common.delete')}
                </button>
              )}
            </div>

            {acceptError && <div className="text-danger small mt-2">{acceptError}</div>}
            {voteError && <div className="text-danger small mt-2">{voteError}</div>}
          </div>
        </div>
      </div>

      <CommentSection targetType="answers" targetId={id} />

        <SuggestEditModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        itemId={id}
        itemType="answer"
        currentText={body}
        currentAttachments={answer.attachments || []}
        onSuccess={(data) => {
          setShowEditModal(false);
          if (onAcceptSuccess) onAcceptSuccess(); 
        }}
      />
    </div>
  );
};

export default AnswerCard;