import React, { useState, useEffect } from 'react';

/**
 * MarkdownEditor Component
 * 
 * A controlled rich text editor component for instructors to write answers.
 * Features live Markdown preview with MathJax mathematical formula rendering.
 * 
 * @param {string} value - The current markdown content (controlled prop)
 * @param {function} onChange - Callback function when content changes
 */
const MarkdownEditor = ({ value = '', onChange }) => {
  const [preview, setPreview] = useState('');

  /**
   * Render MathJax formulas in the preview pane
   * Called whenever markdown text changes
   */
  const renderMathJax = () => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  };

  /**
   * Process markdown text and update preview
   * Basic markdown parsing: headers, bold, italic, code blocks
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
   * Handle text change in editor
   * @param {Event} e - Change event
   */
  const handleChange = (e) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    }
  };

  /**
   * Update preview when value changes
   */
  useEffect(() => {
    const processedHtml = processMarkdown(value);
    setPreview(processedHtml);
    
    // Render MathJax after DOM update
    setTimeout(() => {
      renderMathJax();
    }, 100);
  }, [value]);

  return (
    <div className="markdown-editor-container" style={{ display: 'flex', gap: '1rem', height: '400px' }}>
      {/* Editor Pane */}
      <div className="editor-pane" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <label className="form-label fw-bold">Answer Content (Markdown)</label>
        <textarea
          className="form-control font-monospace"
          value={value}
          onChange={handleChange}
          placeholder="Write your answer in Markdown...&#10;&#10;Examples:&#10;# Header&#10;**bold** *italic*&#10;$O(n)$ for inline math&#10;$$E=mc^2$$ for display math"
          style={{ 
            flex: 1, 
            resize: 'none',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
        />
      </div>

      {/* Preview Pane */}
      <div className="preview-pane" style={{ 
        flex: 1, 
        border: '1px solid #dee2e6', 
        borderRadius: '0.375rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        overflowY: 'auto'
      }}>
        <label className="form-label fw-bold">Live Preview</label>
        <div 
          className="preview-content"
          dangerouslySetInnerHTML={{ __html: preview }}
          style={{ minHeight: '300px' }}
        />
      </div>
    </div>
  );
};

export default MarkdownEditor;
