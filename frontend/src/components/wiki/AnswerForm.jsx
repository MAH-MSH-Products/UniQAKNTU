import React, { useState } from 'react';
import MarkdownEditor from '../editor/MarkdownEditor';
import api, { getAnswersByQuestionId } from '../../services/api';
import { useSourceMaterials } from '../../context/SourceMaterialsContext';

/**
 * AnswerForm Component
 * 
 * Form component for instructors to submit answers to questions.
 * Implements the two-step Orphan Claiming pattern for attachments.
 * Supports markdown text with MathJax formulas and inline image attachments.
 * 
 * Phase 4 Updates:
 * - Integrated SourceMaterialsContext for accessing cached source materials
 * - Uses flat endpoint structure for API calls
 * 
 * @param {number} questionId - The ID of the question to answer
 * @param {function} onSubmit - Callback function when form is submitted (optional)
 */
const AnswerForm = ({ questionId, onSubmit }) => {
  const [markdownText, setMarkdownText] = useState('');
  const [attachmentIds, setAttachmentIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const { materials, loading: materialsLoading } = useSourceMaterials();

  /**
   * Handle attachment upload from MarkdownEditor
   * @param {{id: number, url: string}} attachment - Uploaded attachment info
   */
  const handleAttachmentUpload = ({ id, url }) => {
    setAttachmentIds(prev => [...prev, id]);
  };

  /**
   * Handle form submission
   * Uses application/json content type with attachment_ids array
   * @param {Event} e - Submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    // Construct JSON payload matching API spec
    const payload = {
      question: questionId,
      body: markdownText,
      attachment_ids: attachmentIds
    };

    console.log('=== Submission Payload ===');
    console.log(JSON.stringify(payload, null, 2));
    console.log('==========================');

    try {
      const response = await api.post('/answers/', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data) {
        setSubmitMessage('✅ Answer submitted successfully! Pending approval.');
        
        // Reset form on successful submission
        setMarkdownText('');
        setAttachmentIds([]);
        
        if (onSubmit) {
          onSubmit({ success: true, data: response.data });
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit answer';
      setSubmitMessage('❌ Failed to submit answer: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="answer-form-container card mt-4">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Submit Your Answer (Instructor)</h5>
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
              <strong>📎 Attached Files:</strong> {attachmentIds.length} file(s) uploaded
              <small className="d-block text-muted">
                Attachments are embedded in the markdown text as ![attachment](url)
              </small>
            </div>
          )}

          {/* Source Materials Dropdown (Phase 4 caching implementation) */}
          {materialsLoading ? (
            <div className="alert alert-info mb-3">
              <small>Loading source materials...</small>
            </div>
          ) : (
            materials.length > 0 && (
              <div className="mb-3">
                <label htmlFor="source-material" className="form-label">
                  Related Source Material:
                </label>
                <select 
                  id="source-material" 
                  className="form-select"
                  disabled
                  title="Source material is set at question level"
                >
                  <option value="">Select source material (disabled - set by question)</option>
                  {materials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.title || material.name}
                    </option>
                  ))}
                </select>
                <small className="text-muted">
                  Source materials are cached globally and used when creating questions.
                  Answers inherit the source material from their parent question.
                </small>
              </div>
            )
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
                  Submitting...
                </>
              ) : (
                'Submit Answer'
              )}
            </button>
          </div>

          {/* Status Message */}
          {submitMessage && (
            <div className={`alert mt-3 ${submitMessage.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
              {submitMessage}
            </div>
          )}

          {/* Integration Notice */}
          <div className="alert alert-warning mt-3 mb-0">
            <strong>⚠️ باید چک شود:</strong> This form uses the two-step orphan claiming pattern.
            Images dropped/pasted into the editor are uploaded immediately to <code>POST /api/attachments/</code>,
            then the attachment IDs are sent with the answer submission.
            <br /><br />
            <strong>Phase 4:</strong> Source materials are now cached in <code>SourceMaterialsContext</code> 
            for dropdown population in forms.
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnswerForm;
