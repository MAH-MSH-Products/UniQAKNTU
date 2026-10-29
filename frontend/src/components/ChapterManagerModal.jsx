import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiBook, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { getChapters, createChapter, updateChapter, deleteChapter } from '../services/api';

const ChapterManagerModal = ({ material, onClose }) => {
  const { t } = useTranslation();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    chapter_number: '',
    page_count: '',
  });

  const fetchChapters = useCallback(async () => {
    if (!material?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getChapters({ source_material_id: material.id });
      setChapters(res.data || []);
    } catch (err) {
      console.error('Error fetching chapters:', err);
      setError(t('chapters.fetch_error', 'Failed to load chapters.'));
    } finally {
      setLoading(false);
    }
  }, [material?.id, t]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      chapter_number: '',
      page_count: '',
    });
  };

  const handleStartEdit = (chapter) => {
    setEditingId(chapter.id);
    setFormData({
      title: chapter.title || '',
      chapter_number: chapter.chapter_number != null ? chapter.chapter_number : '',
      page_count: chapter.page_count != null ? chapter.page_count : '',
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.chapter_number === '') return;

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      source_material_id: material.id,
      title: formData.title.trim(),
      chapter_number: parseInt(formData.chapter_number, 10),
      page_count: formData.page_count !== '' ? parseInt(formData.page_count, 10) : 0,
    };

    try {
      if (editingId) {
        await updateChapter(editingId, payload);
        setSuccessMsg(t('chapters.update_success', 'Chapter updated successfully.'));
      } else {
        await createChapter(payload);
        setSuccessMsg(t('chapters.create_success', 'Chapter created successfully.'));
      }
      resetForm();
      fetchChapters();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Error saving chapter:', err);
      const detail = err.response?.data?.chapter_number ||
                     err.response?.data?.error ||
                     err.response?.data?.detail ||
                     t('common.error', 'An error occurred.');
      setError(Array.isArray(detail) ? detail.join(' ') : String(detail));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (chapterId) => {
    if (!window.confirm(t('chapters.delete_confirm', 'Are you sure you want to delete this chapter?'))) {
      return;
    }
    setError(null);
    try {
      await deleteChapter(chapterId);
      setSuccessMsg(t('chapters.delete_success', 'Chapter deleted successfully.'));
      if (editingId === chapterId) resetForm();
      fetchChapters();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Error deleting chapter:', err);
      const detail = err.response?.data?.error ||
                     err.response?.data?.detail ||
                     t('chapters.delete_failed', 'Cannot delete chapter with existing study records.');
      setError(String(detail));
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1060 }} onClick={onClose} />
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1065 }}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg rounded-4">
            <div className="modal-header border-bottom px-4 pt-4 pb-3">
              <div className="d-flex align-items-center gap-2">
                <FiBook className="text-primary fs-4" />
                <div>
                  <h5 className="modal-title fw-bold text-primary mb-0">
                    {t('chapters.manage_chapters', 'Manage Chapters')}
                  </h5>
                  <small className="text-muted">{material.title}</small>
                </div>
              </div>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <div className="modal-body px-4 py-3">
              {error && (
                <div className="alert alert-danger py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3">
                  <FiAlertCircle />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="alert alert-success py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3">
                  <FiCheck />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Add / Edit Form */}
              <div className="card bg-light border-0 rounded-3 p-3 mb-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-1">
                  {editingId ? <FiEdit2 /> : <FiPlus />}
                  {editingId
                    ? t('chapters.edit_chapter', 'Edit Chapter')
                    : t('chapters.add_chapter', 'Add New Chapter')}
                </h6>

                <form onSubmit={handleSubmit}>
                  <div className="row g-2">
                    <div className="col-12 col-md-3">
                      <label className="form-label small fw-semibold">
                        {t('chapters.chapter_number', 'Chapter No.')} *
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="form-control form-control-sm"
                        value={formData.chapter_number}
                        onChange={(e) => setFormData({ ...formData, chapter_number: e.target.value })}
                        required
                        disabled={submitting}
                        placeholder="1"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">
                        {t('chapters.chapter_title', 'Chapter Title')} *
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        disabled={submitting}
                        placeholder={t('chapters.title_placeholder', 'e.g. Graph Theory')}
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label small fw-semibold">
                        {t('chapters.page_count', 'Page Count')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm"
                        value={formData.page_count}
                        onChange={(e) => setFormData({ ...formData, page_count: e.target.value })}
                        disabled={submitting}
                        placeholder="45"
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-3">
                    {editingId && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                        onClick={resetForm}
                        disabled={submitting}
                      >
                        <FiX /> {t('common.cancel', 'Cancel')}
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn btn-sm btn-primary d-flex align-items-center gap-1 px-3"
                      disabled={submitting || !formData.title.trim() || formData.chapter_number === ''}
                    >
                      {submitting ? (
                        <span className="spinner-border spinner-border-sm" />
                      ) : (
                        <>
                          <FiCheck />
                          {editingId
                            ? t('common.save', 'Save Changes')
                            : t('chapters.add_chapter', 'Add Chapter')}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Chapters Table */}
              <h6 className="fw-bold mb-2">
                {t('chapters.chapters_list', 'Existing Chapters')} ({chapters.length})
              </h6>

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                </div>
              ) : chapters.length === 0 ? (
                <div className="alert alert-info small py-3 text-center mb-0">
                  {t('chapters.no_chapters', 'No chapters found for this book yet. Add the first chapter above.')}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '80px' }}>{t('chapters.chapter_number', '#')}</th>
                        <th>{t('chapters.chapter_title', 'Title')}</th>
                        <th style={{ width: '120px' }}>{t('chapters.page_count', 'Pages')}</th>
                        <th className="text-end" style={{ width: '120px' }}>{t('common.action', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chapters.map((ch) => (
                        <tr key={ch.id} className={editingId === ch.id ? 'table-primary' : ''}>
                          <td className="fw-bold">{ch.chapter_number}</td>
                          <td>{ch.title}</td>
                          <td className="text-muted">{ch.page_count || '-'}</td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-1">
                              <button
                                className="btn btn-sm btn-outline-primary border-0"
                                onClick={() => handleStartEdit(ch)}
                                title={t('common.edit', 'Edit')}
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger border-0"
                                onClick={() => handleDelete(ch.id)}
                                title={t('common.delete', 'Delete')}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer border-top px-4 py-3">
              <button type="button" className="btn btn-secondary btn-sm px-4" onClick={onClose}>
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChapterManagerModal;
