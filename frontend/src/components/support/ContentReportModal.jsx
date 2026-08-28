import React, { useState } from 'react';
import api from '../../services/api';

/**
 * ContentReportModal Component - Report Content Errors
 * 
 * A reusable modal component for users to report errors in questions or answers.
 * Constructs payload for API Endpoint 4.5 and submits the report.
 */

const ContentReportModal = ({ isOpen, onClose, questionId, answerId = null }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  /**
   * Handle form submission
   * API Endpoint 4.5: POST /support/reports/
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setStatus({ type: 'error', message: 'Please provide a reason for the report.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Construct payload for Endpoint 4.5
      const payload = {
        question_id: questionId,
        ...(answerId && { answer_id: answerId }),
        reason: reason
      };

      // Real API call
      await api.post('/support/reports/', payload);
      
      setStatus({ type: 'success', message: 'Report submitted successfully!' });
      
      // Reset and close after short delay
      setTimeout(() => {
        setReason('');
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting report:', error);
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to submit report.' 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Close modal and reset state
   */
  const handleClose = () => {
    setReason('');
    setStatus({ type: '', message: '' });
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        onClick={handleClose}
        style={{ zIndex: 1050 }}
      />
      
      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        role="dialog"
        style={{ zIndex: 1055 }}
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Report Content Error</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={handleClose}
                aria-label="Close"
              />
            </div>
            
            <div className="modal-body">
              {status.message && (
                <div className={`alert alert-${status.type === 'success' ? 'success' : 'danger'} mb-3`}>
                  {status.message}
                </div>
              )}
              
              <p className="mb-3">
                You are reporting an issue with:
                <br />
                <strong>Question ID: {questionId}</strong>
                {answerId && <><br /><strong>Answer ID: {answerId}</strong></>}
              </p>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="reason" className="form-label">
                    Reason for Report *
                  </label>
                  <textarea
                    id="reason"
                    className="form-control"
                    rows="4"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please describe what you believe is incorrect about this content..."
                    required
                  />
                  <div className="form-text">
                    Your report will be reviewed by our admin team.
                  </div>
                </div>
                
                <div className="d-flex justify-content-end gap-2">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContentReportModal;
