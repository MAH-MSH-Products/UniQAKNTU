// src/components/wiki/AnswerCard.jsx
import React, { useEffect, useState } from 'react';
import { FiThumbsUp, FiThumbsDown, FiTrash2, FiEdit, FiCheckCircle, FiAward } from 'react-icons/fi';
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
    author_name,
    body = '',
    status = 'PENDING',
    user_vote = 0,
    created_at_jalali,
    is_accepted = false,
    is_official = false,
    attachments = []
  } = answer;

  const { user, isAuthenticated, canModerate } = useAuth();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState(null);
  const [currentVote, setCurrentVote] = useState(user_vote || 0);
  const [score, setScore] = useState(answer.score || 0);
  const [voting, setVoting] = useState(false);

  const questionAuthorId = typeof question?.author === 'object' ? question?.author?.id : question?.author;
  const isQuestionAuthor = Boolean(user?.id && questionAuthorId && String(questionAuthorId).toLowerCase() === String(user.id).toLowerCase());

  const answerAuthorId = typeof author === 'object' ? author?.id : author;
  const isAnswerAuthor = Boolean(user?.id && answerAuthorId && String(answerAuthorId).toLowerCase() === String(user.id).toLowerCase());

  const displayAuthorName = getAuthorDisplayName(author, author_name, user);

  const handleVote = async (value) => {
    if (!isAuthenticated) return alert(t('common.login_to_vote'));
    setVoting(true);
    try {
      const response = await api.post(`/answers/${id}/vote/`, { value });
      setCurrentVote(response.data.user_vote !== undefined ? response.data.user_vote : value);
      if (response.data.new_score !== undefined) setScore(response.data.new_score);
    } catch (err) {
      console.error('Failed to vote:', err);
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
      if (onAcceptSuccess) onAcceptSuccess(response.data);
    } catch (err) {
      setAcceptError(err.response?.data?.message || t('answers.accept_failed'));
    } finally {
      setAccepting(false);
    }
  };

  useEffect(() => {
    setTimeout(() => { typesetMathJax(); }, 100);
  }, [body]);

  const getStatusBadge = () => {
    if (status === 'PENDING') return <span className="badge bg-warning text-dark">{t('common.pending')}</span>;
    if (status === 'REJECTED') return <span className="badge bg-danger">{t('common.rejected')}</span>;
    return null;
  };

  return (
    <div className={`answer-card card mb-3 border-0 shadow-sm ${is_accepted ? 'border-success border-2' : ''} ${is_official ? 'border-primary border-2' : ''}`} style={{ borderLeft: is_accepted ? '4px solid #198754' : (is_official ? '4px solid var(--primary-blue)' : '4px solid transparent') }} id={`answer-${id}`}>
      <div className="card-header bg-transparent border-bottom-0 pb-0 pt-3">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h6 className="mb-0 d-flex align-items-center gap-2 text-dark">
              <i className="bi bi-person-circle text-muted"></i>
              <span className="fw-bold">{displayAuthorName}</span>
              {is_official && (
                <span className="badge bg-primary ms-2"><FiAward className="me-1"/>{t('questions.official')}</span>
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
          <div className="d-flex flex-column align-items-center">
            <button 
              className={`btn btn-sm border-0 p-1 ${currentVote === 1 ? 'text-success' : 'text-muted'}`}
              onClick={() => handleVote(1)}
              disabled={voting || !isAuthenticated}
            >
              <FiThumbsUp size={22} className={currentVote === 1 ? 'fill-current' : ''} />
            </button>
            <span className="fw-bold my-1 fs-5 text-dark">{score}</span>
            <button 
              className={`btn btn-sm border-0 p-1 ${currentVote === -1 ? 'text-danger' : 'text-muted'}`}
              onClick={() => handleVote(-1)}
              disabled={voting || !isAuthenticated}
            >
              <FiThumbsDown size={22} className={currentVote === -1 ? 'fill-current' : ''} />
            </button>
          </div>

          <div className="flex-grow-1">
            <div 
              className="answer-content mb-3 text-dark"
              dangerouslySetInnerHTML={{ __html: processMarkdown(body, attachments) }}
              style={{ lineHeight: '1.6', fontSize: '15px' }}
            />

            <div className="d-flex justify-content-end gap-2 mt-3 pt-2 border-top">
              {isQuestionAuthor && !is_accepted && status === 'APPROVED' && (
                <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-1" onClick={handleAcceptAnswer} disabled={accepting}>
                  {accepting ? <span className="spinner-border spinner-border-sm"></span> : <FiCheckCircle />}
                  {t('answers.accept')}
                </button>
              )}

              {(isAnswerAuthor || canModerate) && (
                <button className="btn btn-sm btn-outline-secondary border-0 d-flex align-items-center gap-1" onClick={() => setShowEditModal(true)}>
                  <FiEdit /> {canModerate || isAnswerAuthor ? t('common.edit') : t('common.suggest_edit')}
                </button>
              )}
              
              {(isAnswerAuthor || canModerate) && (
                <button className="btn btn-sm text-danger border-0 d-flex align-items-center gap-1" onClick={handleDelete}>
                  <FiTrash2 /> {t('common.delete')}
                </button>
              )}
            </div>

            {acceptError && <div className="text-danger small mt-2">{acceptError}</div>}
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
        currentAttachments={attachments}
        isDirectEdit={canModerate}
        onSuccess={() => {
          setShowEditModal(false);
          if (onAcceptSuccess) onAcceptSuccess(); 
        }}
      />
    </div>
  );
};

export default AnswerCard;