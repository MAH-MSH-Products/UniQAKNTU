import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api, { extractResults } from '../../services/api';

/**
 * SupportCenter Component - User Facing Support Dashboard
 * 
 * Un-mocked version connected to real backend API endpoints:
 * - GET /support/tickets/ - Fetch user tickets
 * - POST /support/tickets/ - Submit new ticket
 */

const SupportCenter = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' or 'my-tickets'
  const [tickets, setTickets] = useState([]);
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Form state for ticket submission
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General Support',
    introduction: ''
  });
  
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });

  // Categories for tickets - including "Request Instructor Role"
  // Values remain in English for API, but display is translated
  const categories = [
    { value: 'General Support', label: t('support.categories.general') },
    { value: 'Technical Issue', label: t('support.categories.technical') },
    { value: 'Content Error', label: t('support.categories.content') },
    { value: 'Request Instructor Role', label: t('support.categories.instructor_request') }
  ];

  /**
   * Fetch user's tickets on component mount
   * Only executes if user is authenticated to prevent 401 errors
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserTickets();
    }
  }, [isAuthenticated]);

  /**
   * Fetch user tickets from API
   * API Endpoint: GET /support/tickets/
   */
  const fetchUserTickets = async () => {
    setLoading(true);
    try {
      // Real API call
      const response = await api.get('/support/tickets/');
      setTickets(extractResults(response));
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Submit ticket form
   * API Endpoint: POST /support/tickets/
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ type: '', message: '' });

    // Validate form
    if (!formData.title || !formData.description) {
      setFormStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    setLoading(true);

    try {
      // Real API call
      await api.post('/support/tickets/', formData);
      setFormStatus({ type: 'success', message: 'Ticket submitted successfully!' });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'General Support',
        introduction: ''
      });
      
    } catch (error) {
      console.error('Error submitting ticket:', error);
      setFormStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to submit ticket.' 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle ticket expansion to show replies
   */
  const toggleTicketExpand = (ticketId) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="page-heading mb-4">{t('support.title')}</h2>
          
          {/* Coursera-Style Tab Navigation */}
          <div className="coursera-tabs mb-4">
            <button
              className={activeTab === 'submit' ? 'coursera-tab-active' : 'coursera-tab'}
              onClick={() => setActiveTab('submit')}
            >
              {t('support.submit_ticket_tab')}
            </button>
            <button
              className={activeTab === 'my-tickets' ? 'coursera-tab-active' : 'coursera-tab'}
              onClick={() => setActiveTab('my-tickets')}
            >
              {t('support.my_tickets_tab')}
            </button>
          </div>

          {/* Submit Ticket Tab */}
          {activeTab === 'submit' && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">{t('support.submit_ticket_title')}</h5>
                
                {formStatus.message && (
                  <div className={`alert alert-${formStatus.type === 'success' ? 'success' : 'danger'}`}>
                    {formStatus.message}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="category" className="form-label">{t('support.category_label')}</label>
                    <select
                      id="category"
                      name="category"
                      className="form-select"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">{t('support.title_label')} *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      className="form-control"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder={t('support.title_placeholder')}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">{t('support.description_label')} *</label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-control"
                      rows="4"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder={t('support.description_placeholder')}
                      required
                    ></textarea>
                  </div>


                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? t('support.submitting') : t('support.submit_button')}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* My Tickets Tab */}
          {activeTab === 'my-tickets' && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">{t('support.your_tickets_title')}</h5>
                
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">{t('common.loading')}</span>
                    </div>
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-muted">{t('support.no_tickets')}</p>
                ) : (
                  <div className="list-group">
                    {tickets.map(ticket => (
                      <div key={ticket.id} className="list-group-item list-group-item-action">
                        <div 
                          className="d-flex w-100 justify-content-between align-items-center"
                          onClick={() => toggleTicketExpand(ticket.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div>
                            <h6 className="mb-1">{ticket.title}</h6>
                            <small className="text-muted">
                              {t('support.category')}: {ticket.category} | {t('support.status')}: 
                              <span className={`badge ms-1 ${
                                ticket.status === 'Open' ? 'bg-success' : 
                                ticket.status === 'Closed' ? 'bg-secondary' : 'bg-warning'
                              }`}>
                                {ticket.status}
                              </span>
                            </small>
                          </div>
                          <span className="text-muted">
                            {expandedTicket === ticket.id ? '▼' : '▶'}
                          </span>
                        </div>
                        
                        {expandedTicket === ticket.id && (
                          <div className="mt-3 pt-3 border-top">
                            <p className="mb-2"><strong>{t('support.description')}:</strong> {ticket.description}</p>
                            {ticket.introduction && (
                              <p className="mb-2"><strong>{t('support.introduction')}:</strong> {ticket.introduction}</p>
                            )}
                            <small className="text-muted d-block mb-2">
                              {t('support.created')}: {new Date(ticket.created_at).toLocaleDateString()}
                            </small>
                            
                            {ticket.replies && ticket.replies.length > 0 && (
                              <div className="mt-3">
                                <h6 className="border-bottom pb-2">{t('support.replies')}</h6>
                                {ticket.replies.map(reply => (
                                  <div key={reply.id} className="bg-light p-3 rounded mb-2">
                                    <div className="d-flex justify-content-between">
                                      <strong>{reply.user}</strong>
                                      <small className="text-muted">
                                        {new Date(reply.created_at).toLocaleString()}
                                      </small>
                                    </div>
                                    <p className="mb-0 mt-2">{reply.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportCenter;
