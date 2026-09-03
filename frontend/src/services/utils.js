// src/services/utils.js

export const typesetMathJax = async (element = null) => {
  if (window.MathJax && window.MathJax.typesetPromise) {
    try {
      if (element) {
        await window.MathJax.typesetPromise([element]);
      } else {
        await window.MathJax.typesetPromise();
      }
    } catch (error) {
      console.error('MathJax typeset error:', error);
    }
  }
};

export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Handles HTML escaping, standard markdown, and maps relative image/pdf attachments to live URLs.
 */
export const processMarkdown = (text, attachments = []) => {
  if (!text) return '';
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
    // Image matching for relative files: ![alt](attachments/filename)
    .replace(/!\[(.*?)\]\((.*?)\)/gim, (match, alt, src) => {
      const filename = src.split('/').pop();
      const matchingAttachment = attachments.find(a => a.file && a.file.includes(filename));
      const liveSrc = matchingAttachment ? matchingAttachment.file : src;
      return `<img src="${liveSrc}" alt="${alt}" class="img-fluid rounded border shadow-sm my-3" style="max-width: 100%; height: auto; display: block;">`;
    })
    // Standard links (PDFs)
    .replace(/\[(.*?)\]\((.*?)\)/gim, (match, linkText, src) => {
      const filename = src.split('/').pop();
      const matchingAttachment = attachments.find(a => a.file && a.file.includes(filename));
      const liveSrc = matchingAttachment ? matchingAttachment.file : src;
      return `<a href="${liveSrc}" target="_blank" class="btn btn-sm btn-outline-primary my-2"><i class="bi bi-download me-2"></i>${linkText}</a>`;
    })
    .replace(/\n/gim, '<br>');
  return processed;
};

/**
 * Derives a clean display name using the new author_name field from the API.
 */
export const getAuthorDisplayName = (author, authorName, currentUser) => {
  if (authorName) return authorName; 
  if (!author) return 'Unknown Author';
  
  if (typeof author === 'object') {
    return author.username || author.first_name || author.name || author.id || 'Unknown Author';
  }
  
  if (typeof author === 'string') {
    if (currentUser && currentUser.id === author) {
      return currentUser.username; 
    }
    return `User-${author.substring(0, 5)}`;
  }
  
  return 'Unknown Author';
};