import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MarkdownEditor from '../editor/MarkdownEditor';
import api from '../../services/api';

/**
 * AnswerForm Component
 * Form component for users to submit answers to questions.
 * Implements the two-step Orphan Claiming pattern for attachments.
 * Supports markdown text with MathJax formulas and inline image attachments.
 * @param {number} questionId - The ID of the question to answer
 * @param {function} onSubmit - Callback function when form is submitted (optional)
 */
const AnswerForm = ({ questionId, onSubmit }) => {
  const { t } = useTranslation();
  const [markdownText, setMarkdownText] = useState('');
  const [attachmentIds, setAttachmentIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  /**
   * Handle attachment upload from MarkdownEditor
   * @param {{id: number, url: string}} attachment - Uploaded attachment info
   */
  const handleAttachmentUpload = (attachment) => {
    setAttachmentIds(prev => [...prev, attachment.id]);
  };

  /**
   * Handle form submission
   * Uses application/json content type with attachment_ids array
   * @param {Event} e - Submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });

    // Construct JSON payload matching API spec
    const payload = {
      question: questionId,
      body: markdownText,
      attachment_ids: attachmentIds
    };

    try {
      const response = await api.post('/answers/', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      setSubmitMessage({ 
        type: 'success', 
        text: t('answers.submit_success', 'Answer submitted successfully! Pending approval.') 
      });
      
      // Reset form on successful submission
      setMarkdownText('');
      setAttachmentIds([]);
      
      if (onSubmit) {
        onSubmit({ success: true, data: response.data });
      }
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = error.response?.data?.message || error.message || t('common.error', 'Failed to submit answer');
      setSubmitMessage({ 
        type: 'danger', 
        text: `${t('answers.submit_failed', 'Failed to submit answer:')} ${errorMessage}` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="answer-form-container card mt-4">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">{t('answers.submit_instructor_answer', 'Submit Your Answer')}</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {/* Markdown Editor with Attachment Support */}
          <div className="mb-3">
            <MarkdownEditor 
              value={markdownText} 
              onChange={setMarkdownText}
              onAttachmentUpload={handleAttachmentUpload}
            />
          </div>

          {/* Attachment Info */}
          {attachmentIds.length > 0 && (
            <div className="alert alert-info mb-3">
              <strong>{t('answers.attached_files', 'Attached Files:')}</strong> {attachmentIds.length} {t('answers.files_uploaded', 'file(s) uploaded')}
              <small className="d-block text-muted">
                {t('answers.attachment_help', 'Attachments are embedded in the markdown text as ![attachment](url)')}
              </small>
            </div>
          )}

          {/* Submit Button */}
          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting || !markdownText.trim()}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {t('common.submitting', 'Submitting...')}
                </>
              ) : (
                t('answers.submit_button', 'Submit Answer')
              )}
            </button>
          </div>

          {/* Status Message */}
          {submitMessage.text && (
            <div className={`alert mt-3 alert-${submitMessage.type}`}>
              {submitMessage.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AnswerForm;