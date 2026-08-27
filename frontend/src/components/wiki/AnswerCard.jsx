import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SuggestEditModal from './SuggestEditModal';
import CommentSection from './CommentSection';

/**
 * AnswerCard Component
 * 
 * Displays a single answer to a question with support for:
 * - Author information and verification badge
 * - Markdown text with MathJax formulas
 * - Image attachments
 * - PDF file downloads
 * - Status badges (Pending Review / Approved)
 * - Jalali date timestamps
 * - Vote display using user_vote field
 * - Voting functionality (upvote/downvote) - Phase 7.1
 * - Edit suggestion workflow for students (Phase 5)
 * - Accept answer button for question authors (Phase 5.3)
 * - Comments section (Phase 7.2)
 * 
 * @param {Object} answer - Answer object matching API Endpoint 3.1 structure
 * @param {number} answer.id - Unique answer identifier
 * @param {Object} answer.author - Author information (username, role)
 * @param {string} answer.body - Markdown content of the answer
 * @param {string} answer.status - Status enum: 'PENDING', 'APPROVED', 'REJECTED'
 * @param {string|null} answer.image - URL to attached image (optional)
 * @param {string|null} answer.pdf_file - URL to attached PDF (optional)
 * @param {number} answer.user_vote - User's vote: 1, -1, or 0
 * @param {string} answer.created_at_jalali - Persian Shamsi timestamp
 * @param {Object} question - Parent question object (for accept button verification)
 * @param {Function} onAcceptSuccess - Callback when answer is accepted
 */
const AnswerCard = ({ answer, question, onAcceptSuccess }) => {
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
  
  // Voting state - Phase 7.1
  const [currentVote, setCurrentVote] = useState(user_vote || 0);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState(null);

  // Check if current user is the question author
  const isQuestionAuthor = question?.author?.id === user?.id;
  
  // Check if user can directly edit (MODERATOR or ADMIN)
  const canDirectEdit = ['MODERATOR', 'ADMIN'].includes(userRole);
  
  // Students can only suggest edits
  const canSuggestEdit = user && userRole === 'STUDENT';

  /**
   * Handle voting on an answer - Phase 7.1
   * Uses POST /api/answers/{id}/vote/
   * Payload: { "value": 1 } for upvote, { "value": -1 } for downvote
   * Calling with same value removes the vote
   */
  const handleVote = async (value) => {
    if (!isAuthenticated) {
      alert('Please login to vote');
      return;
    }

    setVoting(true);
    setVoteError(null);

    try {
      const response = await api.post(`/answers/${id}/vote/`, { value });
      
      // Update local state with the returned vote info
      setCurrentVote(response.data.user_vote || value);
    } catch (err) {
      console.error('Failed to vote:', err);
      setVoteError(
        err.response?.data?.message ||
        'Failed to vote. Please try again.'
      );
    } finally {
      setVoting(false);
    }
  };

  /**
   * Process markdown text for display
   * Basic markdown parsing with MathJax support
   */
  const processMarkdown = (text) => {
    let processed = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      // Line breaks
      .replace(/\n/gim, '<br>');
    
    return processed;
  };

  /**
   * Render MathJax formulas after component mounts and updates
   */
  useEffect(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  }, [body]);

  const processedContent = processMarkdown(body);

  /**
   * Get status badge configuration
   */
  const getStatusBadge = () => {
    if (status === 'APPROVED') {
      return <span className="badge bg-success">✓ Approved</span>;
    } else if (status === 'PENDING') {
      return <span className="badge bg-warning">Pending Review</span>;
    } else if (status === 'REJECTED') {
      return <span className="badge bg-danger">Rejected</span>;
    }
    return null;
  };

  /**
   * Get vote display based on user_vote field
   */
  const getVoteDisplay = () => {
    if (user_vote === 1) {
      return <span className="text-success"><i className="bi bi-arrow-up"></i> Upvoted</span>;
    } else if (user_vote === -1) {
      return <span className="text-danger"><i className="bi bi-arrow-down"></i> Downvoted</span>;
    }
    return null;
  };

  /**
   * Handle accepting an answer (Phase 5.3)
   * Only question author can accept answers
   * Calls POST /api/answers/{id}/accept/
   */
  const handleAcceptAnswer = async () => {
    if (!isQuestionAuthor) return;
    
    setAccepting(true);
    setAcceptError(null);
    
    try {
      const response = await api.post(`/answers/${id}/accept/`);
      
      // Notify parent component of success
      if (onAcceptSuccess) {
        onAcceptSuccess(response.data);
      }
    } catch (err) {
      console.error('Failed to accept answer:', err);
      setAcceptError(
        err.response?.data?.message ||
        'Failed to accept answer. Please try again.'
      );
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="answer-card card mb-3" id={`answer-${id}`}>
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-0">
              {author?.username || author?.name || 'Unknown Author'}
              {author?.role && (
                <small className="text-muted ms-2">
                  ({author.role === 'ADMIN' ? 'Admin' : author.role === 'MODERATOR' ? 'Moderator' : 'Student'})
                </small>
              )}
            </h6>
          </div>
          <div className="d-flex align-items-center gap-2">
            {/* Voting Buttons - Phase 7.1 */}
            <div className="btn-group btn-group-sm" role="group">
              <button 
                className={`btn ${currentVote === 1 ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => handleVote(1)}
                disabled={voting || !isAuthenticated}
                title={isAuthenticated ? 'Upvote' : 'Login to vote'}
              >
                <i className={`bi bi-arrow-up${currentVote === 1 ? '-fill' : ''}`}></i>
              </button>
              <button 
                className={`btn ${currentVote === -1 ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => handleVote(-1)}
                disabled={voting || !isAuthenticated}
                title={isAuthenticated ? 'Downvote' : 'Login to vote'}
              >
                <i className={`bi bi-arrow-down${currentVote === -1 ? '-fill' : ''}`}></i>
              </button>
            </div>
            
            {getStatusBadge()}
            
            {/* Accepted Answer Badge */}
            {is_accepted && (
              <span className="badge bg-success">
                <i className="bi bi-check-circle me-1"></i>
                Accepted Answer
              </span>
            )}
            
            {/* Edit Button - Phase 5.1 (MODERATOR/ADMIN only) */}
            {canDirectEdit && (
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => setShowEditModal(true)}
                title="Edit this answer"
              >
                <i className="bi bi-pencil"></i>
              </button>
            )}
            
            {/* Suggest Edit Button for Students - Phase 5.2 */}
            {canSuggestEdit && (
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowEditModal(true)}
                title="Suggest an edit"
              >
                <i className="bi bi-pencil-square"></i>
              </button>
            )}
            
            {/* Accept Answer Button - Phase 5.3 (Only for question author) */}
            {isQuestionAuthor && !is_accepted && status === 'APPROVED' && (
              <button 
                className="btn btn-sm btn-success"
                onClick={handleAcceptAnswer}
                disabled={accepting}
                title="Accept this answer"
              >
                {accepting ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-1"></i>
                    Accept
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="card-body">
        {/* Answer Content */}
        <div 
          className="answer-content mb-3"
          dangerouslySetInnerHTML={{ __html: processedContent }}
          style={{ 
            lineHeight: '1.6',
            fontSize: '15px'
          }}
        />

        {/* Timestamp using Jalali date */}
        {created_at_jalali && (
          <small className="text-muted d-block mb-2">
            Posted: {created_at_jalali}
            {updated_at_jalali && updated_at_jalali !== created_at_jalali && (
              <span className="ms-2">• Updated: {updated_at_jalali}</span>
            )}
          </small>
        )}

        {/* Image Attachment */}
        {image && (
          <div className="answer-image mb-3">
            <img 
              src={image} 
              alt="Answer attachment" 
              className="img-fluid rounded"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
          </div>
        )}

        {/* PDF Attachment */}
        {pdf_file && (
          <div className="answer-pdf">
            <a 
              href={pdf_file} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm"
            >
              <i className="bi bi-file-pdf me-2"></i>
              View/Download PDF
            </a>
            
            {/* Optional: Embed PDF preview */}
            {/* 
            <iframe 
              src={pdf_file} 
              title="PDF Preview"
              style={{ width: '100%', height: '400px', border: 'none', marginTop: '1rem' }}
            />
            */}
          </div>
        )}
      </div>
      
      {/* Comments Section - Phase 7.2 */}
      <CommentSection targetType="answers" targetId={id} />
      
      {/* Suggest Edit Modal - Phase 5.2 */}
      <SuggestEditModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        itemId={id}
        itemType="answer"
        currentText={body}
        onSuccess={(data) => {
          console.log('Edit suggestion submitted:', data);
          // Optionally refresh the answer data here
        }}
      />
    </div>
  );
};

export default AnswerCard;
