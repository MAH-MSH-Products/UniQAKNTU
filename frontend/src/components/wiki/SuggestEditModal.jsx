import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const SuggestEditModal = ({ show, onClose, itemId, itemType, currentText, currentAttachments = [], onSuccess }) => {
  const [proposedText, setProposedText] = useState(currentText);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show) {
      setProposedText(currentText);
      setError(null);
      setSubmitting(false);
    }
  }, [show, currentText]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proposedText.trim()) return setError('Proposed text cannot be empty');
    
    setSubmitting(true);
    try {
      const endpoint = itemType === 'question' 
        ? `/questions/${itemId}/suggest_edit/`
        : `/answers/${itemId}/suggest_edit/`;
        
      // Keep existing attachments that are still referenced in the text
      const keptAttachmentIds = currentAttachments
        .filter(att => proposedText.includes(att.file))
        .map(att => att.id);

      await api.post(endpoint, {
        proposed_text: proposedText,
        attachment_ids: keptAttachmentIds
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
    <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Suggest Edit</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={submitting}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <textarea
                className="form-control"
                rows="10"
                value={proposedText}
                onChange={(e) => setProposedText(e.target.value)}
                disabled={submitting}
                dir="ltr"
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !proposedText.trim()}>
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