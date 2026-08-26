import React, { useEffect } from 'react';

/**
 * AnswerCard Component
 * 
 * Displays a single answer to a question with support for:
 * - Author information and verification badge
 * - Markdown text with MathJax formulas
 * - Image attachments
 * - PDF file downloads
 * - Status badges (Pending Review / Approved)
 * - Jalali date timestamps
 * - Vote display using user_vote field
 * 
 * @param {Object} answer - Answer object matching API Endpoint 3.1 structure
 * @param {number} answer.id - Unique answer identifier
 * @param {Object} answer.author - Author information (username, role)
 * @param {string} answer.body - Markdown content of the answer
 * @param {string} answer.status - Status enum: 'PENDING', 'APPROVED', 'REJECTED'
 * @param {string|null} answer.image - URL to attached image (optional)
 * @param {string|null} answer.pdf_file - URL to attached PDF (optional)
 * @param {number} answer.user_vote - User's vote: 1, -1, or 0
 * @param {string} answer.created_at_jalali - Persian Shamsi timestamp
 */
const AnswerCard = ({ answer }) => {
  const {
    id,
    author,
    body = '',
    status = 'PENDING',
    image = null,
    pdf_file = null,
    user_vote = 0,
    created_at_jalali,
    updated_at_jalali,
  } = answer;

  /**
   * Process markdown text for display
   * Basic markdown parsing with MathJax support
   */
  const processMarkdown = (text) => {
    let processed = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      // Line breaks
      .replace(/\n/gim, '<br>');
    
    return processed;
  };

  /**
   * Render MathJax formulas after component mounts and updates
   */
  useEffect(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  }, [body]);

  const processedContent = processMarkdown(body);

  /**
   * Get status badge configuration
   */
  const getStatusBadge = () => {
    if (status === 'APPROVED') {
      return <span className="badge bg-success">✓ Approved</span>;
    } else if (status === 'PENDING') {
      return <span className="badge bg-warning">Pending Review</span>;
    } else if (status === 'REJECTED') {
      return <span className="badge bg-danger">Rejected</span>;
    }
    return null;
  };

  /**
   * Get vote display based on user_vote field
   */
  const getVoteDisplay = () => {
    if (user_vote === 1) {
      return <span className="text-success"><i className="bi bi-arrow-up"></i> Upvoted</span>;
    } else if (user_vote === -1) {
      return <span className="text-danger"><i className="bi bi-arrow-down"></i> Downvoted</span>;
    }
    return null;
  };

  return (
    <div className="answer-card card mb-3" id={`answer-${id}`}>
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-0">
              {author?.username || author?.name || 'Unknown Author'}
              {author?.role && (
                <small className="text-muted ms-2">
                  ({author.role === 'ADMIN' ? 'Admin' : author.role === 'MODERATOR' ? 'Moderator' : 'Student'})
                </small>
              )}
            </h6>
            {getVoteDisplay()}
          </div>
          <div className="d-flex align-items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>
      </div>
      <div className="card-body">
        {/* Answer Content */}
        <div 
          className="answer-content mb-3"
          dangerouslySetInnerHTML={{ __html: processedContent }}
          style={{ 
            lineHeight: '1.6',
            fontSize: '15px'
          }}
        />

        {/* Timestamp using Jalali date */}
        {created_at_jalali && (
          <small className="text-muted d-block mb-2">
            Posted: {created_at_jalali}
            {updated_at_jalali && updated_at_jalali !== created_at_jalali && (
              <span className="ms-2">• Updated: {updated_at_jalali}</span>
            )}
          </small>
        )}

        {/* Image Attachment */}
        {image && (
          <div className="answer-image mb-3">
            <img 
              src={image} 
              alt="Answer attachment" 
              className="img-fluid rounded"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
          </div>
        )}

        {/* PDF Attachment */}
        {pdf_file && (
          <div className="answer-pdf">
            <a 
              href={pdf_file} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm"
            >
              <i className="bi bi-file-pdf me-2"></i>
              View/Download PDF
            </a>
            
            {/* Optional: Embed PDF preview */}
            {/* 
            <iframe 
              src={pdf_file} 
              title="PDF Preview"
              style={{ width: '100%', height: '400px', border: 'none', marginTop: '1rem' }}
            />
            */}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnswerCard;
