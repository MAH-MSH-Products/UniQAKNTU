/**
 * Utility Functions for UniQAKNTU Frontend
 * 
 * Provides helper functions for common operations including MathJax rendering.
 */

/**
 * Render MathJax formulas in a specific element or the entire document
 * Call this function after DOM updates that include mathematical formulas
 * 
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
