import React, { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/**
 * SuggestEditModal Component
 * 
 * Modal for suggesting edits to questions or answers (Wiki-style workflow).
 * Students cannot directly edit posts - they can only suggest edits that require admin approval.
 * 
 * Features:
 * - Displays current text in an editable textarea
 * - Allows users to propose changes to markdown content
 * - Submits to POST /api/questions/{id}/suggest_edit/ or POST /api/answers/{id}/suggest_edit/
 * - Shows success message with "Edit Pending Review" badge on successful submission
 * 
 * @param {Object} props
 * @param {boolean} props.show - Whether modal is visible
 * @param {Function} props.onClose - Callback to close modal
 * @param {number} props.itemId - ID of the question or answer being edited
 * @param {string} props.itemType - Type of item: 'question' or 'answer'
 * @param {string} props.currentText - Current markdown text of the item
 * @param {Function} props.onSuccess - Callback when edit suggestion is successfully submitted
 */
const SuggestEditModal = ({ show, onClose, itemId, itemType, currentText, onSuccess }) => {
  const { user } = useAuth();
  const [proposedText, setProposedText] = useState(currentText);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Reset state when modal opens/closes
   */
  React.useEffect(() => {
    if (show) {
      setProposedText(currentText);
      setSuccess(false);
      setError(null);
      setSubmitting(false);
    }
  }, [show, currentText]);

  /**
   * Handle form submission
   * Calls POST /api/{itemType}s/{itemId}/suggest_edit/
   * Payload: { proposed_text, attachment_ids }
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!proposedText.trim()) {
      setError('Proposed text cannot be empty');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Determine endpoint based on item type
      const endpoint = itemType === 'question' 
        ? `/questions/${itemId}/suggest_edit/`
        : `/answers/${itemId}/suggest_edit/`;

      // Submit suggested edit
      const response = await api.post(endpoint, {
        proposed_text: proposedText,
        attachment_ids: [] // TODO: Handle attachment changes if needed
      });

      // Success - show confirmation
      setSuccess(true);
      
      // Notify parent component
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Failed to submit edit suggestion:', err);
      setError(
        err.response?.data?.message || 
        'Failed to submit edit suggestion. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {itemType === 'question' ? 'Suggest Question Edit' : 'Suggest Answer Edit'}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleClose}
              disabled={submitting}
            >
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Info Banner - Wiki Workflow */}
              <div className="alert alert-info mb-3">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Wiki-Style Editing:</strong> As a student, you cannot directly edit posts. 
                Your suggested changes will be submitted for admin review.
              </div>

              {/* Success Message */}
              {success && (
                <div className="alert alert-success mb-3">
                  <i className="bi bi-check-circle me-2"></i>
                  <strong>Edit Submitted!</strong> Your suggestion is pending admin review.
                  <span className="badge bg-warning ms-2">Edit Pending Review</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="alert alert-danger mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {/* Text Editor */}
              <div className="mb-3">
                <label htmlFor="proposedText" className="form-label">
                  Proposed Changes
                </label>
                <textarea
                  id="proposedText"
                  className="form-control"
                  rows="10"
                  value={proposedText}
                  onChange={(e) => setProposedText(e.target.value)}
                  placeholder="Enter your proposed markdown text here..."
                  disabled={submitting || success}
                  style={{ fontFamily: 'monospace', fontSize: '14px' }}
                />
                <small className="text-muted">
                  You can use Markdown syntax. Include formulas using $...$ for inline math or $$...$$ for display math.
                </small>
              </div>

              {/* Preview Notice */}
              <div className="alert alert-secondary">
                <strong>Note:</strong> Your changes will be reviewed by a moderator before being applied.
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting || success || !proposedText.trim()}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Submitting...
                  </>
                ) : success ? (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Submitted
                  </>
                ) : (
                  <>
                    <i className="bi bi-pencil-square me-2"></i>
                    Submit Suggestion
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuggestEditModal;
