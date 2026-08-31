import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import MarkdownEditor from '../editor/MarkdownEditor';

const SuggestEditModal = ({ show, onClose, itemId, itemType, currentText, currentAttachments = [], onSuccess }) => {
  const [proposedText, setProposedText] = useState(currentText);
  const [newAttachments, setNewAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show) {
      setProposedText(currentText);
      setNewAttachments([]);
      setError(null);
      setSubmitting(false);
    }
  }, [show, currentText]);

  const handleAttachmentUpload = (attachment) => {
    setNewAttachments(prev => [...prev, attachment]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proposedText.trim()) return setError('Proposed text cannot be empty');
    
    setSubmitting(true);
    try {
      const endpoint = itemType === 'question' 
        ? `/questions/${itemId}/suggest_edit/`
        : `/answers/${itemId}/suggest_edit/`;
        
      const keptCurrentIds = currentAttachments
        .filter(att => proposedText.includes(att.file))
        .map(att => att.id);

      const keptNewIds = newAttachments
        .filter(att => proposedText.includes(att.url))
        .map(att => att.id);

      const finalAttachmentIds = [...keptCurrentIds, ...keptNewIds];

      await api.post(endpoint, {
        proposed_text: proposedText,
        attachment_ids: finalAttachmentIds
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit edit suggestion.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.5)', zIndex: 1055}} tabIndex="-1">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Suggest Edit</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={submitting}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {error && <div className="alert alert-danger">{error}</div>}
              
              <MarkdownEditor 
                 value={proposedText} 
                 onChange={setProposedText} 
                 onAttachmentUpload={handleAttachmentUpload} 
              />
              
            </div>
            <div className="modal-footer mt-2">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" disabled={submitting || !proposedText.trim()}>
                {submitting ? 'Submitting...' : 'Submit Suggestion'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuggestEditModal;