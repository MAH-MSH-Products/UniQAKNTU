import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import MarkdownEditor from '../editor/MarkdownEditor';
import { useTranslation } from 'react-i18next';

const SuggestEditModal = ({ show, onClose, itemId, itemType, currentText, currentAttachments = [], onSuccess, isDirectEdit = false }) => {
  const [proposedText, setProposedText] = useState(currentText);
  const [newAttachments, setNewAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (show) {
      setProposedText(currentText);
      setNewAttachments([]);
      setError(null);
      setSubmitting(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show, currentText]);

  const handleAttachmentUpload = (attachment) => {
    setNewAttachments(prev => [...prev, attachment]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proposedText.trim()) return setError(t('common.error', 'Text cannot be empty'));
    
    setSubmitting(true);
    try {
      const keptCurrentIds = currentAttachments
        .filter(att => proposedText.includes(att.file || att.relative_path))
        .map(att => att.id);

      const keptNewIds = newAttachments
        .filter(att => proposedText.includes(att.url))
        .map(att => att.id);

      const finalAttachmentIds = [...keptCurrentIds, ...keptNewIds];

      if (isDirectEdit) {
        // مدیران: ویرایش مستقیم و لحظه‌ای
        const endpoint = itemType === 'question' 
          ? `/questions/${itemId}/`
          : `/answers/${itemId}/`;
        
        await api.patch(endpoint, {
          body: proposedText,
          attachment_ids: finalAttachmentIds
        });
      } else {
        // کاربران عادی: پیشنهاد ویرایش
        const endpoint = itemType === 'question' 
          ? `/questions/${itemId}/suggest_edit/`
          : `/answers/${itemId}/suggest_edit/`;
          
        await api.post(endpoint, {
          proposed_text: proposedText,
          attachment_ids: finalAttachmentIds
        });
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('common.error', 'Failed to submit edit.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return createPortal(
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
      <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content shadow-lg border-0">
            <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
              <h5 className="modal-title fw-bold text-primary">
                {isDirectEdit ? t('common.direct_edit') : t('common.suggest_edit')}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={submitting}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4">
                {error && <div className="alert alert-danger">{error}</div>}
                
                <MarkdownEditor 
                   value={proposedText} 
                   onChange={setProposedText} 
                   onAttachmentUpload={handleAttachmentUpload} 
                   existingAttachments={currentAttachments}
                />
                
              </div>
              <div className="modal-footer border-top-0 px-4 pb-4">
                <button type="button" className="btn btn-secondary px-4" onClick={onClose} disabled={submitting}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary px-5" disabled={submitting || !proposedText.trim()}>
                  {submitting ? <span className="spinner-border spinner-border-sm"></span> : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default SuggestEditModal;