import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FiCornerDownRight, FiTrash2 } from 'react-icons/fi';
import { getAuthorDisplayName } from '../../services/utils';

const CommentSection = ({ targetType, targetId }) => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // ID of parent comment
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/${targetType}/${targetId}/comments/`);
        setComments(response.data?.results || response.data || []);
        setHasFetched(true);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
        setError('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };
    if (isOpen && !hasFetched && targetId) fetchComments();
  }, [isOpen, hasFetched, targetType, targetId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = { body: newComment.trim() };
      if (replyingTo) payload.parent_id = replyingTo;

      await api.post(`/${targetType}/${targetId}/comments/`, payload);
      
      // Full refresh to get the nested structure properly
      const response = await api.get(`/${targetType}/${targetId}/comments/`);
      setComments(response.data?.results || response.data || []);
      
      setNewComment('');
      setReplyingTo(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm(t('common.delete') + "?")) return;
    try {
      await api.delete(`/${targetType}/${targetId}/comments/${commentId}/`);
      // Refresh tree
      const response = await api.get(`/${targetType}/${targetId}/comments/`);
      setComments(response.data?.results || response.data || []);
    } catch (err) {
      alert("Failed to delete comment.");
    }
  };

  const renderComment = (comment, isReply = false) => {
    const isDeleted = comment.body === '[Deleted]' && !comment.author;
    const authorName = getAuthorDisplayName(comment.author, comment.author_name, user);
    const isOwner = user?.id && (comment.author === user.id || comment.author?.id === user.id);

    return (
      <div key={comment.id} className={`comment-item py-2 ${isReply ? 'ps-4 border-start border-2 ms-2 mt-1' : 'border-bottom'}`}>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <div>
            <strong className="text-primary" style={{ fontSize: '13px' }}>
              {isDeleted ? t('common.unknown_author') : authorName}
            </strong>
            <span className="text-muted ms-2" style={{ fontSize: '11px' }}>
              {comment.created_at_jalali ? comment.created_at_jalali.split('T')[0] : ''}
            </span>
          </div>
          <div className="d-flex gap-2">
            {!isDeleted && isAuthenticated && !isReply && (
              <button 
                className="btn btn-sm btn-link text-muted p-0 text-decoration-none" 
                style={{ fontSize: '11px' }}
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <FiCornerDownRight /> {t('common.reply')}
              </button>
            )}
            {!isDeleted && isOwner && (
              <button 
                className="btn btn-sm btn-link text-danger p-0" 
                onClick={() => handleDeleteComment(comment.id)}
              >
                <FiTrash2 size={12} />
              </button>
            )}
          </div>
        </div>
        <div className={isDeleted ? "text-muted fst-italic" : "text-dark"} style={{ fontSize: '13px', lineHeight: '1.5' }}>
          {isDeleted ? t('common.deleted_comment') : comment.body}
        </div>
        
        {/* Render Replies */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="replies-container mt-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="comment-section mt-3 pt-3 border-top">
      <button 
        className="btn btn-sm btn-link text-decoration-none p-0 d-flex align-items-center gap-2 mb-2 text-muted fw-bold"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className={`bi bi-chat-left-text${isOpen ? '-fill' : ''}`}></i>
        <span>
          {isOpen ? 'Hide Comments' : 'Show Comments'} 
          {hasFetched && ` (${comments.length})`}
        </span>
        <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} small`}></i>
      </button>

      {isOpen && (
        <div className="mt-3">
          {error && <div className="alert alert-danger py-2 mb-3 small">{error}</div>}
          
          {loading ? (
            <div className="text-center py-3"><span className="spinner-border spinner-border-sm text-primary"></span></div>
          ) : (
            <>
              {comments.length > 0 ? (
                <div className="comments-list mb-3">
                  {comments.map(c => renderComment(c))}
                </div>
              ) : (
                <div className="text-muted small mb-3">No comments yet.</div>
              )}

              {isAuthenticated ? (
                <form onSubmit={handleSubmitComment} className="comment-form mt-2 p-2 bg-light rounded border">
                  {replyingTo && (
                    <div className="d-flex justify-content-between align-items-center mb-2 px-2 border-start border-primary border-3">
                      <small className="text-muted">Replying to comment #{replyingTo}</small>
                      <button type="button" className="btn-close" style={{width: '0.5em', height:'0.5em'}} onClick={() => setReplyingTo(null)}></button>
                    </div>
                  )}
                  <textarea
                    className="form-control form-control-sm mb-2"
                    rows="2"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={submitting}
                  />
                  <div className="text-end">
                    <button type="submit" className="btn btn-primary btn-sm px-3" disabled={submitting || !newComment.trim()}>
                      {submitting ? <span className="spinner-border spinner-border-sm"></span> : t('common.submit')}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="alert alert-warning py-2 mb-0 small">Please <a href="/login">login</a> to comment.</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;