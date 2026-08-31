// src/pages/SourceMaterialsList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api, { extractResults } from '../services/api';

const SourceMaterialsList = () => {
  const { t } = useTranslation();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  const fetchMaterials = async (url = '/source-materials/') => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(url);
      const results = extractResults(response);
      setMaterials(results);
      setPagination({
        count: response.data?.count || 0,
        next: response.data?.next || null,
        previous: response.data?.previous || null,
      });
    } catch (err) {
      console.error('Failed to fetch source materials:', err);
      setError(t('common.error', 'Failed to load source materials. Please try again later.'));
      setMaterials([]);
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
      const relativePath = urlObj.pathname + urlObj.search;
      fetchMaterials(relativePath);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
        </div>
        <p className="mt-2">{t('source_materials.loading', 'Loading source materials...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    /* اضافه کردن کلاس container برای ایجاد حاشیه استاندارد از چپ و راست */
    <div className="container py-4 px-3 px-md-4">
      <h2 className="mb-4 fw-bold text-primary">{t('source_materials.title', 'Source Materials')}</h2>
      
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder={t('source_materials.search_placeholder', 'Search by title...')}
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
            {searchTerm 
              ? t('source_materials.no_match', 'No matching source materials found.') 
              : t('source_materials.no_materials', 'No source materials available yet.')}
          </div>
        ) : (
          <div className="row g-4">
            {filteredMaterials.map((material) => (
            <div key={material.id} className="col-md-6 col-lg-4">
              <div className="academic-card h-100">
                {/* اضافه کردن p-4 برای فاصله گرفتن متن از لبه‌های خود کارت */}
                <div className="card-body p-4 d-flex flex-column">
                  {/* Title */}
                  <h5 className="card-title text-primary fw-bold mb-3">
                    {material.title || `Source Material #${material.id}`}
                  </h5>
                  
                  {/* Year (if available) */}
                  {material.year && (
                    <p className="card-text mb-2">
                      <strong className="text-muted">{t('source_materials.year', 'Year:')}</strong> {material.year}
                    </p>
                  )}
                  
                  {/* Created Date (Jalali) */}
                  {material.created_at_jalali && (
                    <p className="card-text text-muted small mb-3">
                      <strong>{t('source_materials.created', 'Created:')}</strong> {material.created_at_jalali.split('T')[0]}
                    </p>
                  )}
                  
                  {/* PDF Download Buttons */}
                  <div className="mt-auto pt-3 border-top">
                    {material.question_pdf && (
                      <a
                        href={material.question_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-sm w-100 mb-2 d-flex align-items-center justify-content-center gap-2"
                      >
                        <i className="bi bi-file-earmark-pdf"></i>
                        {t('source_materials.download_exam', 'Download Exam PDF')}
                      </a>
                    )}
                    
                    {material.answer_pdf && (
                      <a
                        href={material.answer_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-secondary btn-sm w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                      >
                        <i className="bi bi-file-earmark-check"></i>
                        {t('source_materials.download_answers', 'Download Official Answers PDF')}
                      </a>
                    )}
                    
                    {/* Explore Questions Button */}
                    <Link
                      to={`/source-materials/${material.id}/questions`}
                      className="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                    >
                      <i className="bi bi-search"></i>
                      {t('source_materials.explore_questions', 'Explore Questions')}
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      )})()}

      {/* Pagination Controls */}
      {(pagination.next || pagination.previous) && (
        <nav aria-label="Source materials pagination" className="mt-5">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${!pagination.previous ? 'disabled' : ''}`}>
              <button
                className="page-link shadow-sm"
                onClick={() => handlePageChange(pagination.previous)}
                disabled={!pagination.previous}
              >
                {t('source_materials.previous', 'Previous')}
              </button>
            </li>
            <li className="page-item disabled">
              <span className="page-link shadow-sm text-muted">
                {t('source_materials.page', 'Page')} {pagination.count > 0 ? `${t('source_materials.of', 'of')} ${Math.ceil(pagination.count / 10)}` : ''}
              </span>
            </li>
            <li className={`page-item ${!pagination.next ? 'disabled' : ''}`}>
              <button
                className="page-link shadow-sm"
                onClick={() => handlePageChange(pagination.next)}
                disabled={!pagination.next}
              >
                {t('source_materials.next', 'Next')}
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default SourceMaterialsList;