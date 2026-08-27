import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { extractResults } from '../../services/api';

/**
 * SourceMaterialsList Component - Display All Source Materials
 * 
 * Fetches and displays source materials from the backend API.
 * Each material is shown as a card with:
 * - Title
 * - Year (if available)
 * - Created date (Jalali)
 * - Download buttons for question_pdf and answer_pdf (if available)
 * - "Explore Questions" button to navigate to questions for that material
 * 
 * Uses the academic-card styling for consistency.
 * Implements pagination support via the API response structure.
 */

const SourceMaterialsList = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  /**
   * Fetch source materials from API
   * GET /api/source-materials/
   */
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
      setError('Failed to load source materials. Please try again later.');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  /**
   * Handle pagination navigation
   * @param {string} url - The next or previous page URL from API
   */
  const handlePageChange = (url) => {
    if (url) {
      // Extract the relative path from the full URL
      const urlObj = new URL(url);
      const relativePath = urlObj.pathname + urlObj.search;
      fetchMaterials(relativePath);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading source materials...</p>
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
    <div className="source-materials-list p-4">
      <h2 className="mb-4">Source Materials</h2>
      
      {materials.length === 0 ? (
        <div className="alert alert-info">
          No source materials available yet.
        </div>
      ) : (
        <div className="row g-4">
          {materials.map((material) => (
            <div key={material.id} className="col-md-6 col-lg-4">
              <div className="academic-card h-100">
                <div className="card-body d-flex flex-column">
                  {/* Title */}
                  <h5 className="card-title text-primary mb-3">
                    {material.title || `Source Material #${material.id}`}
                  </h5>
                  
                  {/* Year (if available) */}
                  {material.year && (
                    <p className="card-text">
                      <strong>Year:</strong> {material.year}
                    </p>
                  )}
                  
                  {/* Created Date (Jalali) */}
                  {material.created_at_jalali && (
                    <p className="card-text text-muted small">
                      <strong>Created:</strong> {material.created_at_jalali}
                    </p>
                  )}
                  
                  {/* PDF Download Buttons */}
                  <div className="mt-3 mb-3">
                    {material.question_pdf && (
                      <a
                        href={material.question_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-sm w-100 mb-2"
                      >
                        <i className="bi bi-file-earmark-pdf me-2"></i>
                        Download Exam PDF
                      </a>
                    )}
                    
                    {material.answer_pdf && (
                      <a
                        href={material.answer_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-success btn-sm w-100 mb-2"
                      >
                        <i className="bi bi-file-earmark-check me-2"></i>
                        Download Official Answers PDF
                      </a>
                    )}
                  </div>
                  
                  {/* Explore Questions Button */}
                  <Link
                    to={`/source-materials/${material.id}/questions`}
                    className="btn btn-primary mt-auto"
                  >
                    <i className="bi bi-search me-2"></i>
                    Explore Questions
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {(pagination.next || pagination.previous) && (
        <nav aria-label="Source materials pagination" className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${!pagination.previous ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(pagination.previous)}
                disabled={!pagination.previous}
              >
                Previous
              </button>
            </li>
            <li className="page-item disabled">
              <span className="page-link">
                Page {pagination.count > 0 ? `of ${Math.ceil(pagination.count / 10)}` : ''}
              </span>
            </li>
            <li className={`page-item ${!pagination.next ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(pagination.next)}
                disabled={!pagination.next}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default SourceMaterialsList;
