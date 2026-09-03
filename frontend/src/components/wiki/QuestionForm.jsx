import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import MarkdownEditor from '../editor/MarkdownEditor';
import api from '../../services/api';
import { useSourceMaterials } from '../../context/SourceMaterialsContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const QuestionForm = ({ onSuccess, onClose, examId }) => {
  const { materials, loading: materialsLoading } = useSourceMaterials();
  const { t } = useTranslation();
  const { canModerate } = useAuth(); // برای نمایش تیک محتوای رسمی

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [sourceMaterial, setSourceMaterial] = useState(examId ? String(examId) : '');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [attachmentIds, setAttachmentIds] = useState([]);
  const [isOfficial, setIsOfficial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (examId) setSourceMaterial(String(examId));
  }, [examId]);

  const handleAttachmentUpload = (attachment) => {
    setAttachmentIds(prev => [...prev, attachment.id]);
  };

  const handleTagChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value, 10));
    setSelectedTagIds(selectedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !text.trim() || !sourceMaterial) {
      setError(t('common.error', 'Please fill in all required fields.'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        body: text, 
        source_material: parseInt(sourceMaterial, 10),
        tag_ids: selectedTagIds,
        attachment_ids: attachmentIds,
        is_official: isOfficial // ارسال فلگ رسمی بودن به بک‌اند
      };
      const response = await api.post('/questions/', payload);
      if (onSuccess) onSuccess(response.data);
    } catch (err) {
      console.error('Failed to submit question:', err);
      setError(err.response?.data?.message || t('common.error', 'Failed to submit question.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="question-form card mb-4 border-primary shadow-sm">
      <div className="card-header bg-transparent d-flex justify-content-between align-items-center pb-0 pt-3 border-bottom-0">
        <h5 className="mb-0 fw-bold text-primary">{t('questions.ask_question')}</h5>
        {onClose && (
          <button className="btn btn-sm btn-outline-secondary border-0" onClick={onClose}>
            <FiX size={20} />
          </button>
        )}
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger mb-3">{error}</div>}
        <form onSubmit={handleSubmit}>
          
          <div className="mb-3">
            <input
              type="text"
              className="form-control form-control-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Question Title *"
              required
            />
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <select
                className="form-select"
                value={sourceMaterial}
                onChange={(e) => setSourceMaterial(e.target.value)}
                required
                disabled={!!examId} 
              >
                <option value="">Select a source material... *</option>
                {materialsLoading ? (
                  <option value="" disabled>Loading materials...</option>
                ) : (
                  materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.title || `Source Material #${m.id}`}</option>
                  ))
                )}
              </select>
            </div>
            <div className="col-md-6 mt-3 mt-md-0">
              <select
                className="form-select"
                multiple
                value={selectedTagIds}
                onChange={handleTagChange}
                size={2}
              >
                <option value="1">Calculus</option>
                <option value="2">Algebra</option>
                <option value="3">Physics</option>
                <option value="4">Easy</option>
                <option value="5">Medium</option>
                <option value="6">Hard</option>
              </select>
              <small className="text-muted" style={{fontSize: '11px'}}>Hold Ctrl/Cmd to select multiple tags</small>
            </div>
          </div>

          {canModerate && (
            <div className="mb-3 form-check">
              <input type="checkbox" className="form-check-input" id="isOfficialQ" checked={isOfficial} onChange={(e) => setIsOfficial(e.target.checked)} />
              <label className="form-check-label fw-bold text-primary" htmlFor="isOfficialQ">{t('questions.mark_official')}</label>
            </div>
          )}

          <div className="mb-3">
            <MarkdownEditor
              value={text}
              onChange={setText}
              onAttachmentUpload={handleAttachmentUpload}
            />
          </div>
          
          <button type="submit" className="btn btn-primary px-4" disabled={submitting}>
            {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>{t('common.submitting')}</> : t('common.submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuestionForm;