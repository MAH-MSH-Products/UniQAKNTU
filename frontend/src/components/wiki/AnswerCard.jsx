import React, { useEffect, useState } from 'react';
import { FiThumbsUp, FiThumbsDown, FiTrash2, FiEdit, FiCheckCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SuggestEditModal from './SuggestEditModal';
import CommentSection from './CommentSection';

/**
 * AnswerCard Component
 * Displays a single answer to a question with support for:
 * - Author information and verification badge
 * - Markdown text with MathJax formulas
 * - Image attachments & PDF file downloads
 * - Status badges (Pending Review / Approved)
 * - Voting functionality (upvote/downvote) with local score state
 * - Edit suggestion & Delete workflow for authors
 * - Accept answer button for question authors
 * - Comments section
 */
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
    updated_at_jalali,
    is_accepted = false,
  } = answer;

  const { user, userRole, isAuthenticated } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState(null);

  // Voting state
  const [currentVote, setCurrentVote] = useState(user_vote || 0);
  const [score, setScore] = useState(answer.score || 0);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState(null);

  // Authorization checks
  const isQuestionAuthor = user?.id && (question?.author === user.id || question?.author?.id === user.id);
  
  // Handle both string UUID and object structures for author
  const authorId = typeof author === 'string' ? author : author?.id;
  const isAnswerAuthor = user?.id && authorId === user.id;
  
  const canDirectEdit = ['MODERATOR', 'ADMIN'].includes(userRole);

  // Formatting Author Name (hides raw UUIDs)
  const displayAuthorName = author?.username || author?.name || t('common.unknown_author', 'Unknown Author');

  /**
   * Handle voting on an answer
   */
  const handleVote = async (value) => {
    if (!isAuthenticated) {
      alert(t('common.login_to_vote', 'Please login to vote'));
      return;
    }
    setVoting(true);
    setVoteError(null);

    try {
      const response = await api.post(`/answers/${id}/vote/`, { value });
      
      // Update local state with the returned vote info and new score
      setCurrentVote(response.data.user_vote !== undefined ? response.data.user_vote : value);
      if (response.data.new_score !== undefined) {
        setScore(response.data.new_score);
      }
    } catch (err) {
      console.error('Failed to vote:', err);
      setVoteError(
        err.response?.data?.message ||
        t('answers.vote_error', 'Failed to vote. Please try again.')
      );
    } finally {
      setVoting(false);
    }
  };

  /**
   * Handle deleting the answer
   */
  const handleDelete = async () => {
    if (window.confirm(t('answers.confirm_delete', 'Are you sure you want to delete this answer?'))) {
      try {
        await api.delete(`/answers/${id}/`);
        if (onDeleteSuccess) onDeleteSuccess();
      } catch (error) {
        console.error('Failed to delete answer:', error);
        alert(t('answers.delete_failed', 'Failed to delete the answer.'));
      }
    }
  };

  /**
   * Handle accepting an answer
   */
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
        t('answers.accept_failed', 'Failed to accept answer. Please try again.')
      );
    } finally {
      setAccepting(false);
    }
  };

  /**
   * Process markdown text for display
   */
  const processMarkdown = (text) => {
    let processed = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\n/gim, '<br>');
    return processed;
  };

  useEffect(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  }, [body]);

  const processedContent = processMarkdown(body);

  const getStatusBadge = () => {
    if (status === 'APPROVED') {
      return <span className="badge bg-success">{t('common.approved', 'Approved')}</span>;
    } else if (status === 'PENDING') {
      return <span className="badge bg-warning">{t('common.pending', 'Pending Review')}</span>;
    } else if (status === 'REJECTED') {
      return <span className="badge bg-danger">{t('common.rejected', 'Rejected')}</span>;
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
            
            {/* Timestamp using Jalali date (Time removed) */}
            {created_at_jalali && (
              <small className="text-muted d-block mt-1" style={{ fontSize: '0.8rem' }}>
                {t('answers.posted', 'Posted')}: {created_at_jalali.split('T')[0]}
              </small>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Accepted Answer Badge */}
            {is_accepted && (
              <span className="badge bg-success d-flex align-items-center gap-1">
                <FiCheckCircle />
                {t('answers.accepted', 'Accepted Answer')}
              </span>
            )}
            {getStatusBadge()}
          </div>
        </div>
      </div>

      <div className="card-body pt-2">
        <div className="d-flex gap-3">
          
          {/* Voting UI - StackOverflow Style */}
          <div className="d-flex flex-column align-items-center">
            <button 
              className={`btn btn-sm border-0 p-1 ${currentVote === 1 ? 'text-success' : 'text-secondary'}`}
              onClick={() => handleVote(1)}
              disabled={voting || !isAuthenticated}
              title={isAuthenticated ? t('common.upvote', 'Upvote') : t('common.login_to_vote', 'Login to vote')}
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
              title={isAuthenticated ? t('common.downvote', 'Downvote') : t('common.login_to_vote', 'Login to vote')}
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

            {/* Image Attachment */}
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

            {/* PDF Attachment */}
            {pdf_file && (
              <div className="answer-pdf mb-3">
                <a 
                  href={pdf_file} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary btn-sm"
                >
                  <i className="bi bi-file-pdf me-2"></i>
                  {t('answers.download_pdf', 'View/Download PDF')}
                </a>
              </div>
            )}

            {/* Action Buttons (Edit / Delete / Accept) */}
            <div className="d-flex gap-2 mt-3 pt-2 border-top">
              {/* Accept Answer Button (Only for question author) */}
              {isQuestionAuthor && !is_accepted && status === 'APPROVED' && (
                <button 
                  className="btn btn-sm btn-success d-flex align-items-center gap-1"
                  onClick={handleAcceptAnswer}
                  disabled={accepting}
                >
                  {accepting ? <span className="spinner-border spinner-border-sm"></span> : <FiCheckCircle />}
                  {t('answers.accept', 'Accept')}
                </button>
              )}

              {/* Edit/Delete for Authors or Admins */}
              {(isAnswerAuthor || canDirectEdit) && (
                <>
                  <button 
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    onClick={() => setShowEditModal(true)}
                  >
                    <FiEdit /> {canDirectEdit ? t('common.edit', 'Edit') : t('common.suggest_edit', 'Suggest Edit')}
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                    onClick={handleDelete}
                  >
                    <FiTrash2 /> {t('common.delete', 'Delete')}
                  </button>
                </>
              )}
            </div>

            {acceptError && <div className="text-danger small mt-2">{acceptError}</div>}
            {voteError && <div className="text-danger small mt-2">{voteError}</div>}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <CommentSection targetType="answers" targetId={id} />

      {/* Suggest/Direct Edit Modal */}
      <SuggestEditModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        itemId={id}
        itemType="answer"
        currentText={body}
        onSuccess={(data) => {
          setShowEditModal(false);
          // Trigger refresh in parent
          if (onDeleteSuccess) onDeleteSuccess(); 
        }}
      />
    </div>
  );
};

export default AnswerCard;