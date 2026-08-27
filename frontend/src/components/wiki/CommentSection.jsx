import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/**
 * CommentSection Component
 * 
 * A reusable component that displays and manages comments for questions or answers.
 * Supports:
 * - Fetching existing comments on mount
 * - Displaying comment list with author, body, and Jalali timestamp
 * - Posting new comments for authenticated users
 * - Pagination support using extractResults utility
 * 
 * @param {string} targetType - Either 'questions' or 'answers'
 * @param {number} targetId - The ID of the question or answer
 */
const CommentSection = ({ targetType, targetId }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Validate targetType
  if (!['questions', 'answers'].includes(targetType)) {
    console.error('Invalid targetType. Must be "questions" or "answers"');
    return null;
  }

  /**
   * Fetch comments from API on mount
   * Uses GET /api/{targetType}/{targetId}/comments/
   */
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/${targetType}/${targetId}/comments/`);
        // Use extractResults to handle paginated response
        const results = response.data?.results || response.data || [];
        setComments(results);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
        setError('Failed to load comments');
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    if (targetId) {
      fetchComments();
    }
  }, [targetType, targetId]);

  /**
   * Handle posting a new comment
   * Uses POST /api/{targetType}/{targetId}/comments/
   * Payload: { "body": "comment text" }
   */
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    if (!isAuthenticated) {
      alert('Please login to post comments');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await api.post(`/${targetType}/${targetId}/comments/`, {
        body: newComment.trim()
      });

      // Append the new comment to the list
      setComments(prev => [...prev, response.data]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.body?.[0] ||
        'Failed to post comment. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="comment-section mt-4">
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <small className="d-block mt-1">Loading comments...</small>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-section mt-4">
      <hr />
      
      {/* Comments Header */}
      <h6 className="mb-3">
        <i className="bi bi-chat-left-text me-2"></i>
        Comments ({comments.length})
      </h6>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger alert-sm py-2 mb-3">
          <small>{error}</small>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="comments-list mb-3">
          {comments.map((comment) => (
            <div 
              key={comment.id} 
              className="comment-item border-bottom py-2"
            >
              <div className="comment-header d-flex justify-content-between align-items-center mb-1">
                <strong className="comment-author" style={{ fontSize: '14px' }}>
                  {comment.author_name || comment.author?.username || 'Anonymous'}
                </strong>
                {comment.created_at_jalali && (
                  <small className="text-muted" style={{ fontSize: '12px' }}>
                    {comment.created_at_jalali}
                  </small>
                )}
              </div>
              <div className="comment-body" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                {comment.body}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info py-2 mb-3" style={{ fontSize: '14px' }}>
          No comments yet. Be the first to comment!
        </div>
      )}

      {/* Comment Form - Only for authenticated users */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <div className="mb-2">
            <textarea
              className="form-control form-control-sm"
              rows="2"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
              style={{ fontSize: '14px', resize: 'vertical' }}
            />
          </div>
          <div className="d-flex justify-content-end">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Posting...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-1"></i>
                  Post Comment
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="alert alert-warning py-2 mb-0" style={{ fontSize: '14px' }}>
          <i className="bi bi-lock me-1"></i>
          Please <a href="/login">login</a> to post comments.
        </div>
      )}
    </div>
  );
};

export default CommentSection;
