/**
 * UniQAKNTU Frontend JavaScript Utilities
 * Frontend Infrastructure - Phase 1
 * 
 * Provides AJAX wrapper functions, CSRF token handling,
 * and MathJax integration utilities.
 */

// CSRF Token Helper
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

// AJAX Wrapper Function with CSRF support
async function apiRequest(url, method = 'GET', data = null, isFormData = false) {
    const options = {
        method: method,
        headers: {}
    };

    if (!isFormData) {
        options.headers['Content-Type'] = 'application/json';
        options.headers['X-CSRFToken'] = csrftoken;
        if (data) {
            options.body = JSON.stringify(data);
        }
    } else {
        // FormData automatically sets Content-Type with boundary
        options.headers['X-CSRFToken'] = csrftoken;
        if (data) {
            options.body = data;
        }
    }

    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Forbidden: You do not have permission to perform this action.');
            } else if (response.status === 404) {
                throw new Error('Resource not found.');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Form Data Helper for File Uploads
function createFormData(formDataObj) {
    const formData = new FormData();
    for (const key in formDataObj) {
        if (formDataObj.hasOwnProperty(key)) {
            formData.append(key, formDataObj[key]);
        }
    }
    return formData;
}

// MathJax Typeset Helper
function typesetMathJax(element = null) {
    if (window.MathJax) {
        if (element) {
            MathJax.typesetPromise([element]).catch((err) => console.log('MathJax error:', err));
        } else {
            MathJax.typesetPromise().catch((err) => console.log('MathJax error:', err));
        }
    }
}

// DOM Ready Helper
function onDOMReady(callback) {
    if (document.readyState !== 'loading') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.role = 'alert';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiRequest,
        createFormData,
        typesetMathJax,
        onDOMReady,
        showToast,
        getCookie,
        csrftoken
    };
}
