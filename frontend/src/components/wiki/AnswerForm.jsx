import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MarkdownEditor from '../editor/MarkdownEditor';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AnswerForm = ({ questionId, onSubmit }) => {
  const { t } = useTranslation();
  const { canModerate } = useAuth();
  
  const [markdownText, setMarkdownText] = useState('');
  const [attachmentIds, setAttachmentIds] = useState([]);
  const [isOfficial, setIsOfficial] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  const handleAttachmentUpload = (attachment) => {
    setAttachmentIds(prev => [...prev, attachment.id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });
    
    const payload = {
      question: questionId,
      body: markdownText,
      attachment_ids: attachmentIds,
      is_official: isOfficial
    };
    
    try {
      const response = await api.post('/answers/', payload);
      setSubmitMessage({ type: 'success', text: t('answers.submit_success') });
      setMarkdownText('');
      setAttachmentIds([]);
      setIsOfficial(false);
      
      if (onSubmit) onSubmit({ success: true, data: response.data });
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = error.response?.data?.message || t('common.error');
      setSubmitMessage({ type: 'danger', text: `${t('answers.submit_failed')} ${errorMessage}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="answer-form-container card mt-4 border-0 shadow-sm" style={{ borderTop: '3px solid var(--primary-blue)' }}>
      <div className="card-header bg-transparent border-bottom-0 pb-0 pt-3">
        <h5 className="mb-0 fw-bold text-primary">{t('answers.submit_instructor_answer')}</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          
          {canModerate && (
            <div className="mb-3 form-check">
              <input type="checkbox" className="form-check-input" id="isOfficialA" checked={isOfficial} onChange={(e) => setIsOfficial(e.target.checked)} />
              <label className="form-check-label fw-bold text-primary" htmlFor="isOfficialA">{t('questions.mark_official')}</label>
            </div>
          )}

          <div className="mb-3">
            <MarkdownEditor value={markdownText} onChange={setMarkdownText} onAttachmentUpload={handleAttachmentUpload} />
          </div>

          <div className="d-flex justify-content-between align-items-center">
            {attachmentIds.length > 0 ? (
              <small className="text-muted fw-bold">
                <i className="bi bi-paperclip me-1"></i>
                {attachmentIds.length} {t('answers.files_uploaded')}
              </small>
            ) : <div></div>}
            
            <button type="submit" className="btn btn-primary px-5" disabled={isSubmitting || !markdownText.trim()}>
              {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
              {t('answers.submit_button')}
            </button>
          </div>
          
          {submitMessage.text && (
            <div className={`alert mt-3 py-2 small alert-${submitMessage.type}`}>
              {submitMessage.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AnswerForm;