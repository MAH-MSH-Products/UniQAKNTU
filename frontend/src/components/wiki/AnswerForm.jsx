import React, { useState } from 'react';
import MarkdownEditor from '../editor/MarkdownEditor';

/**
 * AnswerForm Component
 * 
 * Form component for instructors to submit answers to questions.
 * Supports markdown text with MathJax formulas, image uploads, and PDF uploads.
 * 
 * @param {number} questionId - The ID of the question to answer
 * @param {function} onSubmit - Callback function when form is submitted (optional)
 */
const AnswerForm = ({ questionId, onSubmit }) => {
  const [markdownText, setMarkdownText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  /**
   * Handle image file selection
   * @param {Event} e - File input change event
   */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  /**
   * Handle PDF file selection
   * @param {Event} e - File input change event
   */
  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  /**
   * Handle form submission
   * Constructs FormData matching API Endpoint 3.2 specification
   * @param {Event} e - Submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    // Construct FormData object matching Endpoint 3.2
    const formData = new FormData();
    formData.append('current_body', markdownText);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    if (pdfFile) {
      formData.append('pdf_file', pdfFile);
    }

    // Log FormData entries for debugging
    console.log('=== FormData Entries ===');
    for (let pair of formData.entries()) {
      console.log(`${pair[0]}:`, pair[1]);
    }
    console.log('========================');

    // Mock API call - Backend endpoint not ready yet
    // باید چک شود - Real API integration needed once backend Phase 3 is complete
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Mock submission successful for question:', questionId);
      setSubmitMessage('✅ Answer submitted successfully! (Mock - Backend not connected)');
      
      // Reset form after successful submission
      setMarkdownText('');
      setImageFile(null);
      setPdfFile(null);
      
      if (onSubmit) {
        onSubmit({ success: true, mock: true });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitMessage('❌ Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }

    // باید چک شود - Uncomment below when backend is ready:
    /*
    try {
      const response = await api.post(`/questions/${questionId}/answers/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data) {
        setSubmitMessage('✅ Answer submitted successfully!');
        setMarkdownText('');
        setImageFile(null);
        setPdfFile(null);
        
        if (onSubmit) {
          onSubmit({ success: true, data: response.data });
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      setSubmitMessage('❌ Failed to submit answer: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
    */
  };

  return (
    <div className="answer-form-container card mt-4">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Submit Your Answer (Instructor)</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {/* Markdown Editor */}
          <div className="mb-3">
            <MarkdownEditor 
              value={markdownText} 
              onChange={setMarkdownText} 
            />
          </div>

          {/* File Uploads */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">Upload Image (Optional)</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
              {imageFile && (
                <small className="text-muted">Selected: {imageFile.name}</small>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold">Upload PDF (Optional)</label>
              <input
                type="file"
                className="form-control"
                accept="application/pdf"
                onChange={handlePdfChange}
                disabled={isSubmitting}
              />
              {pdfFile && (
                <small className="text-muted">Selected: {pdfFile.name}</small>
              )}
            </div>
          </div>

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

          {/* Backend Integration Notice */}
          <div className="alert alert-warning mt-3 mb-0">
            <strong>⚠️ باید چک شود:</strong> This form currently uses mock submission. 
            Real API integration requires backend Endpoint 3.2 (<code>POST /api/v1/questions/:id/answers/</code>) 
            to be implemented and tested.
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnswerForm;
