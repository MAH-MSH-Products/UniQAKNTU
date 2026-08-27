import React, { useState, useEffect } from 'react';
import MarkdownEditor from '../editor/MarkdownEditor';
import api, { getSourceMaterials, getTags, getTagCategories } from '../../services/api';
import { useSourceMaterials } from '../../context/SourceMaterialsContext';

/**
 * QuestionForm Component
 * 
 * Form component for students to submit new questions.
 * Implements the two-step Orphan Claiming pattern for attachments.
 * Supports markdown text with MathJax formulas and inline image attachments.
 * Includes multi-select tag picker and source material selection.
 * 
 * Phase 8 Updates:
 * - Fetches tags and categories from backend API
 * - Multi-select tag picker for question tagging
 * - Submits tag_ids array in payload
 * - Source material selection dropdown
 * 
 * @param {number} examId - The ID of the exam/source material (optional pre-selection)
 * @param {function} onSubmit - Callback function when form is submitted (optional)
 */
const QuestionForm = ({ examId, onSubmit }) => {
  const [markdownText, setMarkdownText] = useState('');
  const [attachmentIds, setAttachmentIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const { materials, loading: materialsLoading } = useSourceMaterials();
  
  // Phase 8: Tags & Categories state
  const [tags, setTags] = useState([]);
  const [tagCategories, setTagCategories] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [selectedSourceMaterial, setSelectedSourceMaterial] = useState(examId || '');
  const [loadingTags, setLoadingTags] = useState(true);

  /**
   * Fetch tags and categories on component mount
   */
  useEffect(() => {
    const fetchTagsAndCategories = async () => {
      setLoadingTags(true);
      try {
        // Fetch all tag categories
        const categoriesResponse = await getTagCategories();
        const categoriesData = categoriesResponse.data?.results || categoriesResponse.data || [];
        setTagCategories(categoriesData);

        // Fetch all tags (without filtering by category)
        const tagsResponse = await getTags();
        const tagsData = tagsResponse.data?.results || tagsResponse.data || [];
        setTags(tagsData);
      } catch (error) {
        console.error('Failed to fetch tags and categories:', error);
        setTags([]);
        setTagCategories([]);
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTagsAndCategories();
  }, []);

  /**
   * Handle attachment upload from MarkdownEditor
   * @param {{id: number, url: string}} attachment - Uploaded attachment info
   */
  const handleAttachmentUpload = ({ id, url }) => {
    setAttachmentIds(prev => [...prev, id]);
  };

  /**
   * Handle tag selection/deselection
   * @param {number} tagId - Tag ID to toggle
   */
  const handleTagToggle = (tagId) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  /**
   * Handle form submission
   * Uses application/json content type with attachment_ids and tag_ids arrays
   * @param {Event} e - Submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    // Construct JSON payload matching API spec
    const payload = {
      title: markdownText.substring(0, 100) || 'Question', // Extract title from first line or default
      body: markdownText,
      source_material: parseInt(selectedSourceMaterial),
      tag_ids: selectedTagIds,
      attachment_ids: attachmentIds
    };

    console.log('=== Question Submission Payload ===');
    console.log(JSON.stringify(payload, null, 2));
    console.log('=====================================');

    try {
      const response = await api.post('/questions/', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data) {
        setSubmitMessage('✅ Question submitted successfully! Pending approval.');
        
        // Reset form on successful submission
        setMarkdownText('');
        setAttachmentIds([]);
        setSelectedTagIds([]);
        setSelectedSourceMaterial('');
        
        if (onSubmit) {
          onSubmit({ success: true, data: response.data });
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit question';
      setSubmitMessage('❌ Failed to submit question: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="question-form-container card mt-4">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Ask a New Question</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {/* Source Materials Dropdown */}
          {materialsLoading ? (
            <div className="alert alert-info mb-3">
              <small>Loading source materials...</small>
            </div>
          ) : (
            <div className="mb-3">
              <label htmlFor="source-material" className="form-label">
                Source Material (Exam/Course): *
              </label>
              <select 
                id="source-material" 
                className="form-select"
                value={selectedSourceMaterial}
                onChange={(e) => setSelectedSourceMaterial(e.target.value)}
                required
              >
                <option value="">Select source material</option>
                {materials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.title || material.name}
                  </option>
                ))}
              </select>
              <small className="text-muted">
                Select the exam or course this question relates to.
              </small>
            </div>
          )}

          {/* Phase 8: Tags Multi-Select */}
          <div className="mb-3">
            <label className="form-label">Tags (Optional):</label>
            {loadingTags ? (
              <div className="alert alert-info">
                <small>Loading tags...</small>
              </div>
            ) : tags.length === 0 ? (
              <div className="alert alert-warning">
                <small>No tags available. Contact an administrator.</small>
              </div>
            ) : (
              <div className="tags-container border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {/* Group tags by category if categories exist */}
                {tagCategories.length > 0 ? (
                  tagCategories.map(category => (
                    <div key={category.id} className="mb-3">
                      <h6 className="fw-bold text-primary mb-2">{category.name}</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {tags
                          .filter(tag => tag.category?.id === category.id)
                          .map(tag => (
                            <label 
                              key={tag.id} 
                              className={`badge ${selectedTagIds.includes(tag.id) ? 'bg-primary' : 'bg-secondary'} p-2`}
                              style={{ cursor: 'pointer', fontSize: '14px' }}
                            >
                              <input
                                type="checkbox"
                                className="me-1"
                                checked={selectedTagIds.includes(tag.id)}
                                onChange={() => handleTagToggle(tag.id)}
                              />
                              {tag.value}
                            </label>
                          ))
                        }
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback: show all tags without categorization
                  <div className="d-flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <label 
                        key={tag.id} 
                        className={`badge ${selectedTagIds.includes(tag.id) ? 'bg-primary' : 'bg-secondary'} p-2`}
                        style={{ cursor: 'pointer', fontSize: '14px' }}
                      >
                        <input
                          type="checkbox"
                          className="me-1"
                          checked={selectedTagIds.includes(tag.id)}
                          onChange={() => handleTagToggle(tag.id)}
                        />
                        {tag.value}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            {selectedTagIds.length > 0 && (
              <small className="text-muted d-block mt-2">
                Selected: {selectedTagIds.length} tag(s)
              </small>
            )}
          </div>

          {/* Markdown Editor with Attachment Support */}
          <div className="mb-3">
            <label htmlFor="question-body" className="form-label">
              Question Body: *
            </label>
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

          {/* Submit Button */}
          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting || !markdownText.trim() || !selectedSourceMaterial}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Submitting...
                </>
              ) : (
                'Submit Question'
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
            then the attachment IDs are sent with the question submission.
            <br /><br />
            <strong>Phase 8:</strong> Tags are fetched from <code>GET /api/tags/</code> and 
            <code>GET /api/tags/categories/</code>. Selected tag IDs are submitted in the 
            <code>tag_ids</code> array. Source material must be selected before submission.
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionForm;
