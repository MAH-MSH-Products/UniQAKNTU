import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api, { extractResults } from '../../services/api';

/**
 * SupportCenter Component - User Facing Support Dashboard
 * Connected to real backend API endpoints:
 * - GET /support/tickets/ - Fetch user tickets
 * - POST /support/tickets/ - Submit new ticket (Fixed 400 Error by mapping payload)
 */
const SupportCenter = () => {
  const { isAuthenticated } = useAuth();
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

  // Categories for tickets
  const categories = [
    { value: 'General Support', label: t('support.categories.general', 'General Support') },
    { value: 'Technical Issue', label: t('support.categories.technical', 'Technical Issue') },
    { value: 'Content Error', label: t('support.categories.content', 'Content Error') },
    { value: 'Request Instructor Role', label: t('support.categories.instructor_request', 'Request Instructor Role') }
  ];

  /**
   * Fetch user's tickets on component mount
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserTickets();
    }
  }, [isAuthenticated]);

  const fetchUserTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/support/tickets/');
      setTickets(extractResults(response));
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Submit ticket form
   * Fixes 400 Bad Request by mapping UI 'description' to Backend 'message'
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ type: '', message: '' });

    if (!formData.title || !formData.description) {
      setFormStatus({ type: 'error', message: t('common.error', 'Please fill in all required fields.') });
      return;
    }

    setLoading(true);
    try {
      // Construct payload matching schema.yml TicketDetail
      let combinedMessage = formData.description;
      
      // If requesting instructor role, append the introduction to the message body
      if (formData.category === 'Request Instructor Role' && formData.introduction) {
        combinedMessage += `\n\n--- Introduction/Resume ---\n${formData.introduction}`;
      }

      const payload = {
        title: formData.title,
        category: formData.category,
        message: combinedMessage // Backend expects 'message', not 'description'
      };

      await api.post('/support/tickets/', payload);
      setFormStatus({ type: 'success', message: t('answers.submit_success', 'Ticket submitted successfully!') });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'General Support',
        introduction: ''
      });
      
      // Refresh list
      fetchUserTickets();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      setFormStatus({ 
        type: 'error', 
        message: error.response?.data?.message || t('answers.submit_failed', 'Failed to submit ticket.') 
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTicketExpand = (ticketId) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h2 className="page-heading mb-4">{t('support.title', 'Support Center')}</h2>
          
          {/* Tabs Navigation */}
          <div className="coursera-tabs mb-4">
            <button
              className={activeTab === 'submit' ? 'coursera-tab-active' : 'coursera-tab'}
              onClick={() => setActiveTab('submit')}
            >
              {t('support.submit_ticket_tab', 'Submit Ticket')}
            </button>
            <button
              className={activeTab === 'my-tickets' ? 'coursera-tab-active' : 'coursera-tab'}
              onClick={() => setActiveTab('my-tickets')}
            >
              {t('support.my_tickets_tab', 'My Tickets')}
            </button>
          </div>

          {/* Submit Ticket Tab */}
          {activeTab === 'submit' && (
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title mb-3 fw-bold">{t('support.submit_ticket_title', 'Submit a Support Ticket')}</h5>
                
                {formStatus.message && (
                  <div className={`alert alert-${formStatus.type === 'success' ? 'success' : 'danger'}`}>
                    {formStatus.message}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="category" className="form-label fw-bold">{t('support.category_label', 'Category')}</label>
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
                    <label htmlFor="title" className="form-label fw-bold">{t('support.title_label', 'Title')} <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      className="form-control"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder={t('support.title_placeholder', 'Brief summary of your issue')}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label fw-bold">{t('support.description_label', 'Description')} <span className="text-danger">*</span></label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-control"
                      rows="4"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder={t('support.description_placeholder', 'Describe your issue in detail')}
                      required
                    ></textarea>
                  </div>

                  {formData.category === 'Request Instructor Role' && (
                    <div className="mb-3">
                      <label htmlFor="introduction" className="form-label fw-bold">{t('support.introduction', 'Introduction')} <span className="text-danger">*</span></label>
                      <textarea
                        id="introduction"
                        name="introduction"
                        className="form-control"
                        rows="4"
                        value={formData.introduction}
                        onChange={handleInputChange}
                        placeholder="Explain why you want to become an instructor and your qualifications"
                        required
                      ></textarea>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary px-4"
                    disabled={loading}
                  >
                    {loading ? t('common.submitting', 'Submitting...') : t('support.submit_button', 'Submit Ticket')}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* My Tickets Tab */}
          {activeTab === 'my-tickets' && (
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title mb-3 fw-bold">{t('support.your_tickets_title', 'Your Support Tickets')}</h5>
                
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
                    </div>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="alert alert-info">{t('support.no_tickets', 'No tickets found.')}</div>
                ) : (
                  <div className="list-group">
                    {tickets.map(ticket => (
                      <div key={ticket.id} className="list-group-item list-group-item-action mb-2 border rounded">
                        <div 
                          className="d-flex w-100 justify-content-between align-items-center"
                          onClick={() => toggleTicketExpand(ticket.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div>
                            <h6 className="mb-1 text-primary fw-bold">{ticket.title}</h6>
                            <small className="text-muted">
                              {t('support.category', 'Category')}: {ticket.category} | {t('support.status', 'Status')}: 
                              <span className={`badge ms-1 ${
                                ticket.status === 'Open' ? 'bg-success' : 
                                ticket.status === 'Closed' ? 'bg-secondary' : 'bg-warning text-dark'
                              }`}>
                                {ticket.status}
                              </span>
                            </small>
                          </div>
                          <i className={`bi bi-chevron-${expandedTicket === ticket.id ? 'up' : 'down'} text-muted`}></i>
                        </div>
                        
                        {expandedTicket === ticket.id && (
                          <div className="mt-3 pt-3 border-top">
                            {/* Backend schema for TicketList doesn't return full message in list,
                                but we can display the date cleanly */}
                            <small className="text-muted d-block mb-2">
                              <i className="bi bi-calendar me-1"></i>
                              {t('support.created', 'Created')}: {ticket.created_at ? ticket.created_at.split('T')[0] : ''}
                            </small>
                            <p className="small text-muted mb-0">
                              <em>(Ticket details and replies are loaded in the Admin/Support Panel workflow.)</em>
                            </p>
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