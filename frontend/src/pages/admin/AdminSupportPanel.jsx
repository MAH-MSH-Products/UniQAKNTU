import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { extractResults } from '../../services/api';

const AdminSupportPanel = () => {
  const { user, canModerate } = useAuth();
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'reports'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState({ type: '', message: '' });

  if (!user || !canModerate) {
    return (
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <h1 className="display-1 text-danger">403</h1>
            <h2 className="mb-3">Access Denied</h2>
            <p className="lead text-muted">
              You do not have permission to access the admin support panel.
            </p>
            <a href="/" className="btn btn-primary">Return to Home</a>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tickets') {
        const response = await api.get('/support/admin/tickets/');
        setItems(extractResults(response));
      } else {
        // FIXED: Pointing to the admin endpoint instead of the user endpoint
        const response = await api.get('/support/admin/reports/');
        setItems(extractResults(response));
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenItem = (item) => {
    setSelectedItem(item);
    setReplyMessage('');
    setReplyStatus({ type: '', message: '' });
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    
    if (!replyMessage.trim()) {
      setReplyStatus({ type: 'error', message: 'Please enter a reply message.' });
      return;
    }

    setLoading(true);
    setReplyStatus({ type: '', message: '' });
    try {
      // FIXED: Using the admin reply endpoint to avoid 404 errors on other users' tickets
      await api.post(`/support/admin/tickets/${selectedItem.id}/reply/`, { message: replyMessage });
      setReplyStatus({ type: 'success', message: 'Reply submitted successfully!' });
      
      const newReply = {
        id: Date.now(),
        sender: user.id, // Match schema structure somewhat for frontend rendering
        message: replyMessage,
        created_at: new Date().toISOString()
      };
      
      setSelectedItem(prev => ({
        ...prev,
        messages: [...(prev.messages || []), newReply] // Admin endpoints return `messages`
      }));
      
      setReplyMessage('');
      fetchItems();
      
    } catch (error) {
      console.error('Error submitting reply:', error);
      setReplyStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to submit reply.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // NEW FEATURE: Change Status for both Tickets and Reports
  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'tickets'
        ? `/support/admin/tickets/${selectedItem.id}/status/`
        : `/support/admin/reports/${selectedItem.id}/status/`;

      await api.patch(endpoint, { status: newStatus });
      
      // Update local state to reflect the change immediately
      setSelectedItem(prev => ({ ...prev, status: newStatus }));
      setItems(prevItems => prevItems.map(item => 
        item.id === selectedItem.id ? { ...item, status: newStatus } : item
      ));

    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'pending':
        return 'bg-success';
      case 'closed':
      case 'dismissed':
        return 'bg-secondary';
      case 'in-progress':
        return 'bg-warning text-dark';
      case 'resolved':
        return 'bg-primary';
      default:
        return 'bg-info';
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="page-heading">Admin Support Panel</h2>
          <p className="text-muted">Manage all system tickets and content reports</p>
        </div>
      </div>

      <div className="coursera-tabs mb-4">
        <button
          className={activeTab === 'tickets' ? 'coursera-tab-active' : 'coursera-tab'}
          onClick={() => setActiveTab('tickets')}
        >
          All Tickets
        </button>
        <button
          className={activeTab === 'reports' ? 'coursera-tab-active' : 'coursera-tab'}
          onClick={() => setActiveTab('reports')}
        >
          Content Reports
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {loading && items.length === 0 ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted text-center mb-0">No items found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    {activeTab === 'tickets' && <th>Title</th>}
                    <th>Category/Target</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      {/* Accommodating both ticket (author) and report (reporter) structures */}
                      <td>{item.author || item.reporter || 'Unknown'}</td>
                      
                      {activeTab === 'tickets' && (
                        <td><strong>{item.title}</strong></td>
                      )}
                      
                      {activeTab === 'reports' ? (
                        <td>
                          {item.target_type} #{item.target_id}
                        </td>
                      ) : (
                        <td>{item.category}</td>
                      )}
                      
                      <td>
                        <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleOpenItem(item)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <>
          <div 
            className="modal-backdrop fade show" 
            onClick={handleCloseModal}
            style={{ zIndex: 1050 }}
          />
          
          <div 
            className="modal fade show d-block" 
            tabIndex="-1" 
            role="dialog"
            style={{ zIndex: 1055 }}
          >
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {activeTab === 'tickets' ? 'Ticket' : 'Report'} #{selectedItem.id}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={handleCloseModal}
                    aria-label="Close"
                  />
                </div>
                
                <div className="modal-body">
                  <div className="mb-4">
                    <h6>Details</h6>
                    <table className="table table-sm table-bordered">
                      <tbody>
                        <tr>
                          <th style={{ width: '150px' }}>User ID:</th>
                          <td>{selectedItem.author || selectedItem.reporter || 'Unknown'}</td>
                        </tr>
                        {activeTab === 'tickets' && (
                          <>
                            <tr>
                              <th>Title:</th>
                              <td>{selectedItem.title}</td>
                            </tr>
                            <tr>
                              <th>Category:</th>
                              <td>{selectedItem.category}</td>
                            </tr>
                          </>
                        )}
                        {activeTab === 'reports' && (
                          <>
                            <tr>
                              <th>Target Type:</th>
                              <td className="text-capitalize">{selectedItem.target_type}</td>
                            </tr>
                            <tr>
                              <th>Target ID:</th>
                              <td>#{selectedItem.target_id}</td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <th>Status:</th>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {/* Status Dropdown for Admins */}
                              <select 
                                className="form-select form-select-sm w-auto fw-bold"
                                value={selectedItem.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={loading}
                              >
                                {activeTab === 'tickets' ? (
                                  <>
                                    <option value="Open">Open</option>
                                    <option value="In-progress">In-progress</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="Pending">Pending</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Dismissed">Dismissed</option>
                                  </>
                                )}
                              </select>
                              <span className={`badge ${getStatusBadgeClass(selectedItem.status)}`}>
                                Current: {selectedItem.status}
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <th>Created:</th>
                          <td>{new Date(selectedItem.created_at).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mb-4">
                    <h6>Description / Reason</h6>
                    <div className="bg-light p-3 rounded">
                      {activeTab === 'tickets' 
                        ? selectedItem.messages?.[0]?.message || 'No initial message'
                        : selectedItem.reason
                      }
                    </div>
                  </div>

                  {selectedItem.introduction && (
                    <div className="mb-4">
                      <h6>Introduction (Role Request)</h6>
                      <div className="bg-light p-3 rounded">
                        {selectedItem.introduction}
                      </div>
                    </div>
                  )}

                  {/* Replies Section - Only for tickets */}
                  {activeTab === 'tickets' && (
                    <>
                      <div className="mb-4">
                        <h6 className="border-bottom pb-2">Replies</h6>
                        {selectedItem.messages && selectedItem.messages.length > 1 ? (
                          <div className="space-y-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {selectedItem.messages.slice(1).map(reply => (
                              <div key={reply.id} className="bg-light p-3 rounded mb-2">
                                <div className="d-flex justify-content-between">
                                  <strong>User: {reply.sender?.substring(0, 8) || 'admin'}</strong>
                                  <small className="text-muted">
                                    {new Date(reply.created_at).toLocaleString()}
                                  </small>
                                </div>
                                <p className="mb-0 mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                                  {reply.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted small">No replies yet.</p>
                        )}
                      </div>

                      {/* Reply Form */}
                      <div className="border-top pt-3">
                        <h6>Submit Reply</h6>
                        {replyStatus.message && (
                          <div className={`alert alert-${replyStatus.type === 'success' ? 'success' : 'danger'} mb-3`}>
                            {replyStatus.message}
                          </div>
                        )}
                        
                        <form onSubmit={handleReplySubmit}>
                          <div className="mb-3">
                            <textarea
                              className="form-control"
                              rows="3"
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Enter your response to this ticket..."
                              required
                            />
                          </div>
                          
                          <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={loading || selectedItem.status === 'Closed'}
                          >
                            {loading ? 'Submitting...' : 'Submit Reply'}
                          </button>
                          {selectedItem.status === 'Closed' && (
                            <span className="ms-3 text-muted small">Cannot reply to closed tickets.</span>
                          )}
                        </form>
                      </div>
                    </>
                  )}
                  
                  {activeTab === 'reports' && (
                    <div className="alert alert-info">
                      Review the reported content on the public page and take appropriate action. Update the status above once handled.
                    </div>
                  )}

                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSupportPanel;