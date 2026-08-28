import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import MarkdownEditor from '../editor/MarkdownEditor';
import api from '../../services/api';
import { useSourceMaterials } from '../../context/SourceMaterialsContext';

/**
 * QuestionForm Component
 * Form for students to submit new questions.
 * Includes:
 * - Title input
 * - MarkdownEditor with orphan-claiming attachment workflow
 * - Tags multi-select dropdown
 * - Source material selection (auto-populated and auto-selected if context/examId exists)
 * Submit payload to POST /api/questions/
 * Shows success message indicating question is "PENDING" review.
 * @param {Function} onSuccess - Callback when question is submitted successfully
 * @param {Function} onClose - Callback to close the form
 * @param {number|string} examId - Optional ID to pre-select source material
 */
const QuestionForm = ({ onSuccess, onClose, examId }) => {
  const { materials, loading: materialsLoading } = useSourceMaterials();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [sourceMaterial, setSourceMaterial] = useState(examId || '');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [attachmentIds, setAttachmentIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Set the default source material if navigating from a specific exam explorer
  useEffect(() => {
    if (examId) {
      setSourceMaterial(examId);
    }
  }, [examId]);

  /**
   * Handle attachment upload from MarkdownEditor
   * @param {{id: number, url: string}} attachment - Uploaded attachment info
   */
  const handleAttachmentUpload = (attachment) => {
    setAttachmentIds(prev => [...prev, attachment.id]);
  };

  /**
   * Handle tag selection change
   * @param {React.ChangeEvent<HTMLSelectElement>} e - Change event
   */
  const handleTagChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value, 10));
    setSelectedTagIds(selectedOptions);
  };

  /**
   * Handle form submission
   * @param {React.FormEvent} e - Form event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !text.trim() || !sourceMaterial) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        body: text, // Matched with backend schema (was 'text' previously)
        source_material: parseInt(sourceMaterial, 10),
        tag_ids: selectedTagIds,
        attachment_ids: attachmentIds,
      };

      const response = await api.post('/questions/', payload);
      
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      console.error('Failed to submit question:', err);
      setError(
        err.response?.data?.message ||
        'Failed to submit question. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="alert alert-success">
        <h5>Question Submitted Successfully!</h5>
        <p>Your question is <strong>PENDING</strong> review by a moderator.</p>
        <p>Once approved, it will be visible to all users.</p>
        {onClose && (
          <button className="btn btn-primary mt-2" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="question-form card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Ask a New Question</h5>
        {onClose && (
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            <FiX />
          </button>
        )}
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title Input */}
          <div className="mb-3">
            <label htmlFor="question-title" className="form-label fw-bold">
              Question Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="question-title"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a concise title for your question"
              required
            />
          </div>

          {/* Source Material Selection */}
          <div className="mb-3">
            <label htmlFor="source-material" className="form-label fw-bold">
              Source Material (Exam/Course) <span className="text-danger">*</span>
            </label>
            <select
              id="source-material"
              className="form-select"
              value={sourceMaterial}
              onChange={(e) => setSourceMaterial(e.target.value)}
              required
              disabled={!!examId}
            >
              <option value="">Select a source material...</option>
              {materialsLoading ? (
                <option value="" disabled>Loading materials...</option>
              ) : (
                materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title || `Source Material #${m.id}`}
                  </option>
                ))
              )}
            </select>
            {examId && (
              <small className="text-muted d-block mt-1">
                Automatically selected based on the current exam view.
              </small>
            )}
          </div>

          {/* Tags Multi-Select */}
          <div className="mb-3">
            <label htmlFor="question-tags" className="form-label fw-bold">
              Tags (Optional)
            </label>
            <select
              id="question-tags"
              className="form-select"
              multiple
              value={selectedTagIds}
              onChange={handleTagChange}
              size={4}
            >
              <option value="1">Calculus</option>
              <option value="2">Algebra</option>
              <option value="3">Physics</option>
              <option value="4">Easy</option>
              <option value="5">Medium</option>
              <option value="6">Hard</option>
            </select>
            <small className="text-muted">Hold Ctrl/Cmd to select multiple tags</small>
          </div>

          {/* Markdown Editor */}
          <div className="mb-3">
            <label className="form-label fw-bold">
              Question Details <span className="text-danger">*</span>
            </label>
            <MarkdownEditor
              value={text}
              onChange={setText}
              onAttachmentUpload={handleAttachmentUpload}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Submitting...
              </>
            ) : (
              'Submit Question'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuestionForm;