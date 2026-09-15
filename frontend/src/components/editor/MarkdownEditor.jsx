import React, { useState, useEffect, useRef } from 'react';
import api, { improveTextWithAI } from '../../services/api';
import { processMarkdown, typesetMathJax } from '../../services/utils';
import { FiZap } from 'react-icons/fi';
import { getErrorMessage } from '../../utils/errorHandler';

const MarkdownEditor = ({ value = '', onChange, onAttachmentUpload }) => {
  const [preview, setPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [aiImproving, setAiImproving] = useState(false);
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    if (onChange) onChange(e.target.value);
  };

  const insertAtCursor = (textToInsert) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const newValue = value.substring(0, startPos) + textToInsert + value.substring(endPos);
    
    if (onChange) onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + textToInsert.length, startPos + textToInsert.length);
    }, 0);
  };

  const uploadAttachment = async (file) => {
    if (!file) return null;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/attachments/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { id, file: fileUrl } = response.data;
      
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

  const processFile = async (file) => {
    // Handle Images
    if (file.type.startsWith('image/')) {
      const result = await uploadAttachment(file);
      if (result) insertAtCursor(`![Image Attachment](${result.url})`);
    } 
    // Handle PDFs
    else if (file.type === 'application/pdf') {
      const result = await uploadAttachment(file);
      if (result) insertAtCursor(`\n[Download PDF Attachment](${result.url})\n`);
    } 
    else {
      alert('Only images and PDF files are supported.');
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/') || item.type === 'application/pdf') {
        e.preventDefault();
        await processFile(item.getAsFile());
        break;
      }
    }
  };

  const handleImproveWithAI = async () => {
    if (!value.trim()) {
      alert('Please enter some text first');
      return;
    }

    if (!window.confirm('Improve this text with AI? This may cost tokens.')) {
      return;
    }

    setAiImproving(true);
    try {
      const response = await improveTextWithAI(value);
      if (onChange) onChange(response.data.improved_text);
      alert('Text improved successfully!');
    } catch (error) {
      alert(getErrorMessage(error, 'Failed to improve text'));
    } finally {
      setAiImproving(false);
    }
  };

  useEffect(() => {
    setPreview(processMarkdown(value));
    setTimeout(() => { typesetMathJax(); }, 100);
  }, [value]);

  return (
    <div className="markdown-editor-container" style={{ display: 'flex', gap: '1rem', height: '400px' }}>
      <div className="editor-pane" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <label className="form-label fw-bold mb-0">Markdown Editor</label>
          <button
            type="button"
            className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
            onClick={handleImproveWithAI}
            disabled={aiImproving || !value.trim()}
            title="Improve with AI"
          >
            <FiZap />
            {aiImproving ? 'Improving...' : 'Improve with AI'}
          </button>
        </div>
        <textarea
          ref={textareaRef}
          className="form-control font-monospace"
          value={value}
          onChange={handleChange}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onPaste={handlePaste}
          dir="ltr" 
          placeholder="Drag & Drop Images or PDFs here..."
          disabled={isUploading}
          style={{ 
            flex: 1, 
            resize: 'none',
            fontSize: '14px',
            lineHeight: '1.6',
            backgroundColor: '#2b2b2b',
            color: '#f8f8f2'
          }}
        />
      </div>
      <div className="preview-pane" style={{ flex: 1, border: '1px solid #dee2e6', borderRadius: '0.375rem', padding: '1rem', backgroundColor: '#f8f9fa', overflowY: 'auto' }} dir="auto">
        <label className="form-label fw-bold">Live Preview</label>
        <div className="preview-content" dangerouslySetInnerHTML={{ __html: preview }} />
        {isUploading && <div className="text-muted mt-2"><small>Uploading attachment...</small></div>}
      </div>
    </div>
  );
};

export default MarkdownEditor;