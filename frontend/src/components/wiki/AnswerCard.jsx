import React, { useEffect } from 'react';

/**
 * AnswerCard Component
 * 
 * Displays a single answer to a question with support for:
 * - Author information and verification badge
 * - Markdown text with MathJax formulas
 * - Image attachments
 * - PDF file downloads
 * 
 * @param {Object} answer - Answer object matching API Endpoint 3.1 structure
 * @param {number} answer.id - Unique answer identifier
 * @param {Object} answer.author - Author information (name, title)
 * @param {string} answer.current_body - Markdown content of the answer
 * @param {boolean} answer.is_verified - Whether the answer is verified
 * @param {string|null} answer.image - URL to attached image (optional)
 * @param {string|null} answer.pdf_file - URL to attached PDF (optional)
 */
const AnswerCard = ({ answer }) => {
  const {
    id,
    author,
    current_body = '',
    is_verified = false,
    image = null,
    pdf_file = null,
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
  }, [current_body]);

  const processedContent = processMarkdown(current_body);

  return (
    <div className="answer-card card mb-3" id={`answer-${id}`}>
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-0">
              {author?.name || 'Unknown Author'}
              {author?.title && (
                <small className="text-muted ms-2">({author.title})</small>
              )}
            </h6>
          </div>
          {is_verified && (
            <span className="badge bg-success">
              ✓ Verified
            </span>
          )}
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
