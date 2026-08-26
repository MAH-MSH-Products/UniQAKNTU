import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

/**
 * MarkdownEditor Component
 * 
 * A controlled rich text editor component for instructors to write answers.
 * Features live Markdown preview with MathJax mathematical formula rendering.
 * Supports file drop/paste with immediate orphan upload pattern.
 * 
 * @param {string} value - The current markdown content (controlled prop)
 * @param {function} onChange - Callback function when content changes
 * @param {function} onAttachmentUpload - Optional callback when attachment is uploaded, receives {id, url}
 */
const MarkdownEditor = ({ value = '', onChange, onAttachmentUpload }) => {
  const [preview, setPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef(null);

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
   * Basic Markdown parsing: headers, bold, italic, code blocks, images
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
      // Images
      .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">')
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
   * Insert text at cursor position in textarea
   * @param {string} textToInsert - Text to insert
   */
  const insertAtCursor = (textToInsert) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const newValue = value.substring(0, startPos) + textToInsert + value.substring(endPos);
    
    if (onChange) {
      onChange(newValue);
    }

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + textToInsert.length, startPos + textToInsert.length);
    }, 0);
  };

  /**
   * Upload file as orphan attachment
   * @param {File} file - File to upload
   */
  const uploadAttachment = async (file) => {
    if (!file) return null;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/attachments/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { id, file: fileUrl } = response.data;
      
      // Notify parent component about uploaded attachment
      if (onAttachmentUpload) {
        onAttachmentUpload({ id, url: fileUrl });
      }

      return { id, url: fileUrl };
    } catch (error) {
      console.error('Attachment upload error:', error);
      alert('Failed to upload attachment. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle file drop on editor
   * @param {DragEvent} e - Drop event
   */
  const handleDrop = async (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    
    if (files.length > 0) {
      const file = files[0];
      
      // Only process image files
      if (file.type.startsWith('image/')) {
        const result = await uploadAttachment(file);
        if (result) {
          const markdownImage = `![attachment](${result.url})`;
          insertAtCursor(markdownImage);
        }
      } else {
        alert('Only image files are supported for drag-and-drop.');
      }
    }
  };

  /**
   * Handle paste event in editor
   * @param {ClipboardEvent} e - Paste event
   */
  const handlePaste = async (e) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Check if pasted item is an image
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        
        const result = await uploadAttachment(file);
        if (result) {
          const markdownImage = `![attachment](${result.url})`;
          insertAtCursor(markdownImage);
        }
        break;
      }
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
          ref={textareaRef}
          className="form-control font-monospace"
          value={value}
          onChange={handleChange}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onPaste={handlePaste}
          placeholder={`Write your answer in Markdown...\n\nExamples:\n# Header\n**bold** *italic*\n$O(n)$ for inline math\n$$E=mc^2$$ for display math\n![image](url) for images`}
          disabled={isUploading}
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
        {isUploading && (
          <div className="text-muted mt-2">
            <small>⏳ Uploading attachment...</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
