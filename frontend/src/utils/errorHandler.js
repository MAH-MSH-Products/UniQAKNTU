import i18n from '../i18n';

/**
 * Parses and extracts a user-friendly, localized error message from an API or Axios error.
 * @param {Object|Error|string} error - The error object from catch block or API response.
 * @param {string} fallbackKey - i18n fallback key if no message can be extracted.
 * @returns {string} - Localized error message string.
 */
export const getErrorMessage = (error, fallbackKey = 'errors.default') => {
  if (!error) {
    return i18n.t(fallbackKey, 'An unexpected error occurred.');
  }

  if (typeof error === 'string') {
    return error;
  }

  const responseData = error.response?.data;

  if (responseData) {
    // 1. Direct detail string
    if (typeof responseData.detail === 'string') {
      return responseData.detail;
    }

    // 2. Direct error string
    if (typeof responseData.error === 'string') {
      return responseData.error;
    }

    // 3. non_field_errors array
    if (Array.isArray(responseData.non_field_errors) && responseData.non_field_errors.length > 0) {
      return responseData.non_field_errors.join(' ');
    }

    // 4. Object of field errors (e.g. { username: ['A user with this username already exists.'] })
    if (typeof responseData === 'object') {
      const fieldErrors = Object.entries(responseData)
        .map(([field, msg]) => {
          const messageText = Array.isArray(msg) ? msg.join(' ') : String(msg);
          // If the key is 'message' or 'detail', don't prefix with field name
          if (field === 'message' || field === 'detail' || field === 'error') {
            return messageText;
          }
          return `${field}: ${messageText}`;
        })
        .filter(Boolean);

      if (fieldErrors.length > 0) {
        return fieldErrors.join('\n');
      }
    }
  }

  // Network / HTTP Status Fallbacks
  if (error.response?.status === 401) {
    return i18n.t('errors.unauthorized', 'Session expired. Please log in again.');
  }
  if (error.response?.status === 403) {
    return i18n.t('errors.forbidden', 'You do not have permission to perform this action.');
  }
  if (error.response?.status === 404) {
    return i18n.t('errors.notFound', 'Requested item was not found.');
  }
  if (error.response?.status >= 500) {
    return i18n.t('errors.serverError', 'Server error. Please try again later.');
  }
  if (error.message === 'Network Error' || !error.response) {
    return i18n.t('errors.network', 'Unable to connect to the server. Please check your internet connection.');
  }

  return error.message || i18n.t(fallbackKey, 'An unexpected error occurred.');
};

export default getErrorMessage;
