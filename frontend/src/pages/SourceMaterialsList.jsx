// src/pages/SourceMaterialsList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api, { extractResults } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';

const SourceMaterialsList = () => {
  const { t } = useTranslation();
  const { canModerate } = useAuth(); // برای دادن دسترسی مستقیم به مدیران
  
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });

  // وضعیت‌های مربوط به مودال CRUD
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', year: '' });
  const [files, setFiles] = useState({ question_pdf: null, answer_pdf: null });
  const [submitting, setSubmitting] = useState(false);

  const fetchMaterials = async (url = '/source-materials/') => {
    setLoading(true);
    try {
      const response = await api.get(url);
      setMaterials(extractResults(response));
      setPagination({
        count: response.data?.count || 0,
        next: response.data?.next || null,
        previous: response.data?.previous || null,
      });
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handlePageChange = (url) => {
    if (url) {
      const urlObj = new URL(url);
      fetchMaterials(urlObj.pathname + urlObj.search);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('source_materials.delete_confirm'))) {
      try {
        await api.delete(`/source-materials/${id}/`);
        fetchMaterials();
      } catch (err) {
        alert(t('common.error'));
      }
    }
  };

  const openModal = (material = null) => {
    if (material) {
      setEditingId(material.id);
      setFormData({ title: material.title, year: material.year || '' });
    } else {
      setEditingId(null);
      setFormData({ title: '', year: '' });
    }
    setFiles({ question_pdf: null, answer_pdf: null });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const data = new FormData();
    data.append('title', formData.title);
    if (formData.year) data.append('year', formData.year);
    if (files.question_pdf) data.append('question_pdf', files.question_pdf);
    if (files.answer_pdf) data.append('answer_pdf', files.answer_pdf);

    try {
      if (editingId) {
        await api.patch(`/source-materials/${editingId}/`, data, { headers: { 'Content-Type': 'multipart/form-data' }});
      } else {
        await api.post(`/source-materials/`, data, { headers: { 'Content-Type': 'multipart/form-data' }});
      }
      setShowModal(false);
      fetchMaterials();
    } catch (err) {
      alert(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && materials.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container py-4 px-3 px-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary mb-0">{t('source_materials.title')}</h2>
        
        {canModerate && (
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => openModal()}>
            <FiPlus /> {t('source_materials.add_material')}
          </button>
        )}
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder={t('source_materials.search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {(() => {
        const filteredMaterials = materials.filter(material => 
          material.title && material.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return filteredMaterials.length === 0 ? (
          <div className="alert alert-info shadow-sm">
            {searchTerm ? t('source_materials.no_match') : t('source_materials.no_materials')}
          </div>
        ) : (
          <div className="row g-4">
            {filteredMaterials.map((material) => (
            <div key={material.id} className="col-md-6 col-lg-4">
              <div className="academic-card h-100 position-relative">
                
                {/* دکمه‌های مدیریت برای مدیران */}
                {canModerate && (
                  <div className="position-absolute top-0 end-0 p-2 d-flex gap-1 z-2">
                    <button className="btn btn-sm btn-light border" onClick={() => openModal(material)}>
                      <FiEdit className="text-secondary" />
                    </button>
                    <button className="btn btn-sm btn-light border" onClick={() => handleDelete(material.id)}>
                      <FiTrash2 className="text-danger" />
                    </button>
                  </div>
                )}

                <div className="card-body p-4 d-flex flex-column pt-5">
                  <h5 className="card-title text-primary fw-bold mb-3">
                    {material.title || `Source Material #${material.id}`}
                  </h5>
                  
                  {material.year && (
                    <p className="card-text mb-2">
                      <strong className="text-muted">{t('source_materials.year')}</strong> {material.year}
                    </p>
                  )}
                  
                  {material.created_at_jalali && (
                    <p className="card-text text-muted small mb-3">
                      <strong>{t('source_materials.created')}</strong> {material.created_at_jalali.split('T')[0]}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-3 border-top">
                    {material.question_pdf && (
                      <a href={material.question_pdf} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm w-100 mb-2">
                        <i className="bi bi-file-earmark-pdf me-2"></i>{t('source_materials.download_exam')}
                      </a>
                    )}
                    
                    {material.answer_pdf && (
                      <a href={material.answer_pdf} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm w-100 mb-3">
                        <i className="bi bi-file-earmark-check me-2"></i>{t('source_materials.download_answers')}
                      </a>
                    )}
                    
                    <Link to={`/source-materials/${material.id}/questions`} className="btn btn-primary w-100 fw-bold">
                      <i className="bi bi-search me-2"></i>{t('source_materials.explore_questions')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )})()}

      {(pagination.next || pagination.previous) && (
        <nav className="mt-5">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${!pagination.previous ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(pagination.previous)} disabled={!pagination.previous}>
                {t('source_materials.previous')}
              </button>
            </li>
            <li className={`page-item ${!pagination.next ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(pagination.next)} disabled={!pagination.next}>
                {t('source_materials.next')}
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal fade show d-block" style={{background: 'rgba(0,0,0,0.5)', zIndex: 1055}} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingId ? t('source_materials.edit_material') : t('source_materials.add_material')}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label">{t('source_materials.title_label')} *</label>
                    <input type="text" className="form-control" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('source_materials.year')}</label>
                    <input type="number" className="form-control" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('source_materials.q_pdf_label')}</label>
                    <input type="file" className="form-control" accept="application/pdf" onChange={e => setFiles({...files, question_pdf: e.target.files[0]})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('source_materials.a_pdf_label')}</label>
                    <input type="file" className="form-control" accept="application/pdf" onChange={e => setFiles({...files, answer_pdf: e.target.files[0]})} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>{t('common.cancel')}</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting || !formData.title.trim()}>
                    {submitting ? <span className="spinner-border spinner-border-sm"></span> : t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceMaterialsList;