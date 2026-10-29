import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiMessageSquare,
  FiThumbsUp,
  FiThumbsDown,
  FiUser,
  FiSend,
  FiPlus,
  FiClock,
  FiCheck,
  FiAlertCircle,
  FiShield,
} from 'react-icons/fi';
import { getOpinions, submitOpinion, voteOpinion } from '../../../services/api';
import { getErrorMessage } from '../../../utils/errorHandler';

const OpinionsList = () => {
  const { t } = useTranslation();
  const [opinions, setOpinions] = useState([]);
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'top'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [newText, setNewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchOpinions = useCallback(async (sort) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOpinions({ sort });
      const results = res.data?.results || [];
      setOpinions(results);
    } catch (err) {
      setError(getErrorMessage(err, 'errors.default'));
      setOpinions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpinions(sortBy);
  }, [sortBy, fetchOpinions]);

  // Optimistic voting handler
  const handleVote = async (opinionId, value) => {
    // 1. Snapshot previous state for rollback
    const prevOpinions = [...opinions];

    // 2. Apply optimistic update
    setOpinions((currentList) =>
      currentList.map((op) => {
        if (op.id !== opinionId) return op;

        let newLikes = op.likes;
        let newDislikes = op.dislikes;
        let newUserVote = 0;

        if (op.user_vote === value) {
          // Toggle off
          if (value === 1) newLikes = Math.max(0, newLikes - 1);
          if (value === -1) newDislikes = Math.max(0, newDislikes - 1);
          newUserVote = 0;
        } else if (op.user_vote === 0) {
          // New vote
          if (value === 1) newLikes += 1;
          if (value === -1) newDislikes += 1;
          newUserVote = value;
        } else {
          // Switch vote
          if (value === 1) {
            newLikes += 1;
            newDislikes = Math.max(0, newDislikes - 1);
          } else {
            newDislikes += 1;
            newLikes = Math.max(0, newLikes - 1);
          }
          newUserVote = value;
        }

        return {
          ...op,
          likes: newLikes,
          dislikes: newDislikes,
          user_vote: newUserVote,
        };
      })
    );

    // 3. Make server API request
    try {
      const res = await voteOpinion(opinionId, value);
      if (res.data) {
        // Sync with verified server counts
        setOpinions((currentList) =>
          currentList.map((op) =>
            op.id === opinionId
              ? {
                  ...op,
                  likes: res.data.likes,
                  dislikes: res.data.dislikes,
                  user_vote: res.data.user_vote,
                }
              : op
          )
        );
      }
    } catch {
      // Rollback on failure
      setOpinions(prevOpinions);
      setError(t('errors.default', 'Failed to submit vote.'));
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCreateOpinion = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setSubmitting(true);
    setSubmitSuccess(false);
    setError(null);

    try {
      await submitOpinion({
        text: newText.trim(),
        is_anonymous: isAnonymous,
      });
      setNewText('');
      setIsAnonymous(false);
      setShowForm(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      setError(getErrorMessage(err, 'errors.default'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="card border-0 shadow-sm rounded-4 h-100"
      style={{
        backdropFilter: 'blur(10px)',
        background: 'var(--bs-card-bg, rgba(255, 255, 255, 0.9))',
      }}
    >
      <div className="card-header bg-transparent border-0 pt-4 px-4 pb-2">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
          <div>
            <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
              <FiMessageSquare className="text-info" />
              {t('community.opinions_title', 'Student Opinions & Reflections')}
            </h5>
            <p className="text-muted small mb-0">
              {t('community.opinions_subtitle', 'Insights, tips, and reflections shared by top students')}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Sort Buttons */}
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn btn-sm ${
                  sortBy === 'recent' ? 'btn-primary' : 'btn-outline-secondary'
                }`}
                onClick={() => setSortBy('recent')}
                disabled={loading}
              >
                {t('community.sort_recent', 'Recent')}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  sortBy === 'top' ? 'btn-primary' : 'btn-outline-secondary'
                }`}
                onClick={() => setSortBy('top')}
                disabled={loading}
              >
                {t('community.sort_top', 'Top')}
              </button>
            </div>

            {/* Toggle Submit Form Button */}
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 px-3 py-1 rounded-pill"
              onClick={() => setShowForm(!showForm)}
            >
              <FiPlus />
              <span>{t('community.submit_opinion', 'Share Opinion')}</span>
            </button>
          </div>
        </div>

        {submitSuccess && (
          <div className="alert alert-success py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
            <FiCheck />
            <span>{t('community.submitted_success', 'Opinion submitted successfully and pending approval.')}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Form Collapsible */}
        {showForm && (
          <form onSubmit={handleCreateOpinion} className="p-3 mb-3 rounded-3 bg-light border">
            <div className="mb-2">
              <textarea
                className="form-control form-control-sm rounded-3 p-2"
                rows={3}
                placeholder={t('community.opinion_placeholder', 'Write your experience or study tips...')}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
              <div className="form-check form-check-inline small mb-0">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="anonymousCheck"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  disabled={submitting}
                />
                <label className="form-check-label text-muted d-flex align-items-center gap-1" htmlFor="anonymousCheck">
                  <FiShield size={14} />
                  <span>{t('community.is_anonymous', 'Post anonymously')}</span>
                </label>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-light text-muted"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary d-flex align-items-center gap-1 px-3 rounded-pill"
                  disabled={submitting || !newText.trim()}
                >
                  {submitting ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  ) : (
                    <>
                      <FiSend size={13} />
                      <span>{t('community.submit', 'Submit')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="card-body px-4 pb-4">
        {loading ? (
          <div className="text-center py-5 text-muted small">
            <span className="spinner-border spinner-border-sm me-2 text-info" role="status" aria-hidden="true" />
            <span>{t('common.loading', 'Loading opinions...')}</span>
          </div>
        ) : opinions.length === 0 ? (
          <div className="p-4 rounded-3 bg-light text-center text-muted small">
            <FiMessageSquare size={32} className="text-muted opacity-50 mb-2" />
            <div>{t('community.no_data', 'No opinions shared yet. Be the first to share your thoughts!')}</div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {opinions.map((op) => (
              <div
                key={op.id}
                className="p-3 rounded-3 bg-light border d-flex flex-column gap-2 transition"
                style={{ background: 'rgba(255, 255, 255, 0.7)' }}
              >
                {/* Author & Timestamp */}
                <div className="d-flex justify-content-between align-items-center small">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center text-white ${
                        op.is_anonymous ? 'bg-secondary' : 'bg-primary'
                      }`}
                      style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}
                    >
                      {op.is_anonymous ? <FiShield size={14} /> : <FiUser size={14} />}
                    </div>
                    <span className="fw-semibold">
                      {op.is_anonymous
                        ? t('community.anonymous_user', 'Anonymous Student')
                        : op.author?.username || t('community.student', 'Student')}
                    </span>
                  </div>

                  {op.created_at_jalali && (
                    <span className="text-muted small font-monospace d-flex align-items-center gap-1">
                      <FiClock size={12} />
                      <span>{op.created_at_jalali}</span>
                    </span>
                  )}
                </div>

                {/* Text Content */}
                <p className="mb-1 text-dark small" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                  {op.text}
                </p>

                {/* Action Voting Row */}
                <div className="d-flex justify-content-end align-items-center gap-2 pt-1 border-top border-light-subtle">
                  {/* Like Button */}
                  <button
                    type="button"
                    className={`btn btn-sm d-flex align-items-center gap-1 px-2 py-1 rounded-pill ${
                      op.user_vote === 1
                        ? 'btn-success text-white shadow-sm'
                        : 'btn-outline-secondary'
                    }`}
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => handleVote(op.id, 1)}
                    title={t('community.like', 'Like')}
                  >
                    <FiThumbsUp size={13} />
                    <span className="font-monospace fw-bold">{op.likes}</span>
                  </button>

                  {/* Dislike Button */}
                  <button
                    type="button"
                    className={`btn btn-sm d-flex align-items-center gap-1 px-2 py-1 rounded-pill ${
                      op.user_vote === -1
                        ? 'btn-danger text-white shadow-sm'
                        : 'btn-outline-secondary'
                    }`}
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => handleVote(op.id, -1)}
                    title={t('community.dislike', 'Dislike')}
                  >
                    <FiThumbsDown size={13} />
                    <span className="font-monospace fw-bold">{op.dislikes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpinionsList;
