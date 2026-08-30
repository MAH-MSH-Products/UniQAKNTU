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

export const processMarkdown = (text) => {
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
    // 1. Process Images FIRST
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" class="img-fluid rounded border shadow-sm my-3" style="max-width: 100%; height: auto; display: block;">')
    // 2. Process Standard Links (e.g., PDF downloads)
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" class="btn btn-sm btn-outline-primary my-2"><i class="bi bi-download me-2"></i>$1</a>')
    .replace(/\n/gim, '<br>');
  return processed;
};

export const getAuthorDisplayName = (author, fallbackName, currentUser) => {
  if (!author) return 'Unknown Author';
  
  if (typeof author === 'object') {
    return author.username || author.first_name || author.name || author.id || 'Unknown Author';
  }
  
  if (typeof author === 'string') {
    if (currentUser && currentUser.id === author) {
      return currentUser.username;
    }
    if (fallbackName) {
      return fallbackName;
    }
    // Fallback: Mask the long UUID so it doesn't break the UI
    return `User-${author.substring(0, 5)}`;
  }
  return 'Unknown Author';
};