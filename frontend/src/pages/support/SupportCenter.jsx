import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  const categories = [
    'General Support',
    'Technical Issue',
    'Content Error',
    'Request Instructor Role'
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
          <h2 className="page-heading mb-4">Support Center</h2>
          
          {/* Coursera-Style Tab Navigation */}
          <div className="coursera-tabs mb-4">
            <button
              className={activeTab === 'submit' ? 'coursera-tab-active' : 'coursera-tab'}
              onClick={() => setActiveTab('submit')}
            >
              Submit Ticket
            </button>
            <button
              className={activeTab === 'my-tickets' ? 'coursera-tab-active' : 'coursera-tab'}
              onClick={() => setActiveTab('my-tickets')}
            >
              My Tickets
            </button>
          </div>

          {/* Submit Ticket Tab */}
          {activeTab === 'submit' && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">Submit a Support Ticket</h5>
                
                {formStatus.message && (
                  <div className={`alert alert-${formStatus.type === 'success' ? 'success' : 'danger'}`}>
                    {formStatus.message}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="category" className="form-label">Category</label>
                    <select
                      id="category"
                      name="category"
                      className="form-select"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      className="form-control"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Brief summary of your issue"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description *</label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-control"
                      rows="4"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your issue in detail"
                      required
                    ></textarea>
                  </div>


                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* My Tickets Tab */}
          {activeTab === 'my-tickets' && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">Your Support Tickets</h5>
                
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-muted">No tickets found.</p>
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
                              Category: {ticket.category} | Status: 
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
                            <p className="mb-2"><strong>Description:</strong> {ticket.description}</p>
                            {ticket.introduction && (
                              <p className="mb-2"><strong>Introduction:</strong> {ticket.introduction}</p>
                            )}
                            <small className="text-muted d-block mb-2">
                              Created: {new Date(ticket.created_at).toLocaleDateString()}
                            </small>
                            
                            {ticket.replies && ticket.replies.length > 0 && (
                              <div className="mt-3">
                                <h6 className="border-bottom pb-2">Replies</h6>
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
