/**
 * Utility Functions for UniQAKNTU Frontend
 * Provides helper functions for common operations including MathJax rendering.
 */

/**
 * Render MathJax formulas in a specific element or the entire document
 * Call this function after DOM updates that include mathematical formulas
 * @param {HTMLElement|null} element - Specific element to render math in (optional)
 * @returns {Promise<void>} - Promise that resolves when typesetting is complete
 */
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

/**
 * Format date string to readable format
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text with ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Human-readable file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Centralized Markdown Processor for Questions and Answers
 * Handles HTML escaping, standard markdown, and image attachments.
 * @param {string} text - Raw markdown text
 * @returns {string} - Processed HTML string
 */
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
    // Image matching for drag and drop orphan files: ![alt](url)
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" class="img-fluid rounded border shadow-sm my-3" style="max-width: 100%; height: auto; display: block;">')
    .replace(/\n/gim, '<br>');
  return processed;
};

/**
 * Derives a clean display name for an author.
 * Resolves UUID hashes to standard format or maps to the current user's name.
 * @param {string|object} author - Author UUID string or object
 * @param {string|null} fallbackName - Author name provided by backend if available
 * @param {object|null} currentUser - Currently authenticated user object
 * @returns {string} - Formatted display name
 */
export const getAuthorDisplayName = (author, fallbackName, currentUser) => {
  if (!author) return 'Unknown Author';
  
  if (typeof author === 'object') {
    return author.username || author.name || author.id || 'Unknown Author';
  }
  
  if (typeof author === 'string') {
    if (currentUser && currentUser.id === author) {
      return currentUser.username; // Map to self
    }
    if (fallbackName) {
      return fallbackName;
    }
    // Mask raw UUIDs for better UX
    return `User-${author.substring(0, 5)}`;
  }
  
  return 'Unknown Author';
};