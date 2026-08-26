import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnswerById } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/**
 * AnswerDetail Component
 * 
 * Displays a single answer with full details.
 * Uses the flat endpoint structure: GET /api/answers/{id}/
 * 
 * Phase 4 Implementation:
 * - Replaces old nested route /wiki/answers/{id}/
 * - Uses path parameter for single answer retrieval
 */
const AnswerDetail = () => {
  const { answerId } = useParams();
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAnswer = async () => {
      try {
        setLoading(true);
        // Use new flat endpoint: GET /api/answers/{id}/
        const response = await getAnswerById(answerId);
        setAnswer(response.data);
      } catch (err) {
        console.error('Failed to fetch answer:', err);
        setError(err.message || 'Failed to load answer');
      } finally {
        setLoading(false);
      }
    };

    if (answerId) {
      fetchAnswer();
    }
  }, [answerId]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading answer...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Error Loading Answer</h4>
        <p>{error}</p>
        <Link to="/" className="btn btn-primary mt-2">Back to Home</Link>
      </div>
    );
  }

  if (!answer) {
    return (
      <div className="alert alert-info">
        <p>Answer not found.</p>
        <Link to="/" className="btn btn-primary mt-2">Back to Home</Link>
      </div>
    );
  }

  /**
   * Process markdown text for display
   */
  const processMarkdown = (text) => {
    let processed = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\n/gim, '<br>');
    
    return processed;
  };

  const getStatusBadge = () => {
    if (answer.status === 'APPROVED') {
      return <span className="badge bg-success">✓ Approved</span>;
    } else if (answer.status === 'PENDING') {
      return <span className="badge bg-warning">Pending Review</span>;
    } else if (answer.status === 'REJECTED') {
      return <span className="badge bg-danger">Rejected</span>;
    }
    return null;
  };

  return (
    <div className="answer-detail container py-4">
      <div className="mb-4">
        <Link to="/" className="btn btn-outline-secondary btn-sm">
          ← Back to Home
        </Link>
      </div>

      <div className="answer-card card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">Answer Details</h4>
              <small className="text-muted">ID: #{answer.id}</small>
            </div>
            <div>
              {getStatusBadge()}
            </div>
          </div>
        </div>
        
        <div className="card-body">
          {/* Author Information */}
          <div className="mb-3">
            <strong>Author:</strong> {answer.author?.username || answer.author?.name || 'Unknown'}
            {answer.author?.role && (
              <span className="badge bg-secondary ms-2">{answer.author.role}</span>
            )}
          </div>

          {/* Question Reference */}
          {answer.question && (
            <div className="mb-3">
              <strong>Question:</strong>
              <Link to={`/questions/${answer.question}/answers`} className="ms-2">
                View Question
              </Link>
            </div>
          )}

          {/* Answer Content */}
          <div 
            className="answer-content my-4 p-3 bg-light rounded"
            dangerouslySetInnerHTML={{ __html: processMarkdown(answer.body || '') }}
            style={{ lineHeight: '1.6', fontSize: '15px' }}
          />

          {/* Vote Information */}
          {answer.user_vote !== undefined && (
            <div className="mb-3">
              <strong>Your Vote:</strong>{' '}
              <span className={answer.user_vote === 1 ? 'text-success' : answer.user_vote === -1 ? 'text-danger' : ''}>
                {answer.user_vote === 1 ? 'Upvoted ↑' : answer.user_vote === -1 ? 'Downvoted ↓' : 'No vote'}
              </span>
            </div>
          )}

          {/* Timestamps */}
          {answer.created_at_jalali && (
            <div className="text-muted small">
              <p className="mb-1">
                <strong>Created:</strong> {answer.created_at_jalali}
              </p>
              {answer.updated_at_jalali && answer.updated_at_jalali !== answer.created_at_jalali && (
                <p className="mb-0">
                  <strong>Updated:</strong> {answer.updated_at_jalali}
                </p>
              )}
            </div>
          )}

          {/* Attachments */}
          {answer.image && (
            <div className="mt-4">
              <h6>Attachments:</h6>
              <img 
                src={answer.image} 
                alt="Answer attachment" 
                className="img-fluid rounded mb-2"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
            </div>
          )}

          {answer.pdf_file && (
            <div className="mt-3">
              <a 
                href={answer.pdf_file} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-outline-primary btn-sm"
              >
                <i className="bi bi-file-pdf me-2"></i>
                View/Download PDF
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Verification Notice */}
      <div className="alert alert-warning mt-4">
        <strong>⚠️ باید چک شود:</strong> This component uses the new flat endpoint structure 
        <code>GET /api/answers/{answerId}/</code> as per Phase 4 routing alignment.
      </div>
    </div>
  );
};

export default AnswerDetail;
