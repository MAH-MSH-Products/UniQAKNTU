import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/**
 * AdminSupportPanel Component - Admin Support Dashboard
 * 
 * A dedicated dashboard for admin users (is_staff === true) to:
 * - View all system tickets and reports
 * - Reply to tickets and manage their status
 */

const AdminSupportPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'reports'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState({ type: '', message: '' });

  /**
   * Check if user is staff - render 403 if not
   */
  if (!user || !user.is_staff) {
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

  /**
   * Fetch all tickets/reports on component mount
   * API Endpoint 4.3: GET /support/admin/tickets/
   */
  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // باید چک شود - API integration point
      
      if (activeTab === 'tickets') {
        // API Endpoint 4.3: GET /support/admin/tickets/
        // const response = await api.get('/support/admin/tickets/');
        // setItems(response.data);
        
        // Mock data based on API.md Endpoint 4.3
        const mockTickets = [
          {
            id: 1,
            user: { username: 'student_01', id: 5 },
            title: 'Cannot upload PDF',
            description: 'I get a 500 error when attaching a PDF.',
            category: 'Technical Issue',
            status: 'Open',
            created_at: '2026-08-15T10:30:00Z',
            replies: []
          },
          {
            id: 2,
            user: { username: 'instructor_01', id: 8 },
            title: 'Request Instructor Role',
            description: 'I am a TA for the OS course.',
            category: 'Request Instructor Role',
            status: 'In-progress',
            created_at: '2026-08-14T08:00:00Z',
            introduction: 'I have been teaching for 3 years.',
            replies: [
              {
                id: 1,
                user: 'admin',
                message: 'We are reviewing your request.',
                created_at: '2026-08-14T10:00:00Z'
              }
            ]
          },
          {
            id: 3,
            user: { username: 'student_03', id: 12 },
            title: 'Question 5 has wrong answer',
            description: 'The provided solution uses incorrect formula.',
            category: 'Content Error',
            status: 'Open',
            created_at: '2026-08-13T14:20:00Z',
            replies: []
          }
        ];
        
        setItems(mockTickets);
      } else {
        // Mock reports data (Endpoint 4.5 related)
        const mockReports = [
          {
            id: 101,
            user: { username: 'student_02', id: 6 },
            question_id: 105,
            answer_id: 42,
            reason: 'The final formula in the PDF is incorrect.',
            status: 'Pending',
            created_at: '2026-08-16T09:00:00Z'
          },
          {
            id: 102,
            user: { username: 'student_01', id: 5 },
            question_id: 98,
            answer_id: null,
            reason: 'The question text has a typo.',
            status: 'Resolved',
            created_at: '2026-08-12T11:30:00Z'
          }
        ];
        
        setItems(mockReports);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open item detail modal
   */
  const handleOpenItem = (item) => {
    setSelectedItem(item);
    setReplyMessage('');
    setReplyStatus({ type: '', message: '' });
  };

  /**
   * Close item detail modal
   */
  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  /**
   * Submit reply to ticket
   * API Endpoint 4.4: POST /support/tickets/{ticket_id}/reply/
   */
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    
    if (!replyMessage.trim()) {
      setReplyStatus({ type: 'error', message: 'Please enter a reply message.' });
      return;
    }

    setLoading(true);
    setReplyStatus({ type: '', message: '' });

    try {
      // TODO: Replace with actual API call
      // باید چک شود - API integration point
      // API Endpoint 4.4: POST /support/tickets/{ticket_id}/reply/
      // const response = await api.post(`/support/tickets/${selectedItem.id}/reply/`, {
      //   message: replyMessage
      // });

      // Mock success
      console.log('Mock API Call - Ticket Reply:', {
        ticket_id: selectedItem.id,
        message: replyMessage
      });

      setReplyStatus({ type: 'success', message: 'Reply submitted successfully!' });
      
      // Update local state to show new reply
      const newReply = {
        id: Date.now(),
        user: 'admin',
        message: replyMessage,
        created_at: new Date().toISOString()
      };
      
      setSelectedItem(prev => ({
        ...prev,
        replies: [...(prev.replies || []), newReply]
      }));
      
      setReplyMessage('');
      
      // Refresh items list
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

  /**
   * Get badge class for status
   */
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'pending':
        return 'bg-success';
      case 'closed':
      case 'resolved':
        return 'bg-secondary';
      case 'in-progress':
        return 'bg-warning';
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

      {/* Coursera-Style Tab Navigation */}
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

      {/* Data Grid Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
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
                    <th>Category</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>{item.user?.username || 'Unknown'}</td>
                      {activeTab === 'tickets' && (
                        <td>
                          <strong>{item.title}</strong>
                        </td>
                      )}
                      {activeTab === 'reports' && (
                        <td>
                          Question #{item.question_id}
                          {item.answer_id && <>, Answer #{item.answer_id}</>}
                        </td>
                      )}
                      <td>{item.category || 'Report'}</td>
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
                          <th style={{ width: '150px' }}>User:</th>
                          <td>{selectedItem.user?.username || 'Unknown'}</td>
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
                              <th>Question ID:</th>
                              <td>#{selectedItem.question_id}</td>
                            </tr>
                            {selectedItem.answer_id && (
                              <tr>
                                <th>Answer ID:</th>
                                <td>#{selectedItem.answer_id}</td>
                              </tr>
                            )}
                          </>
                        )}
                        <tr>
                          <th>Status:</th>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(selectedItem.status)}`}>
                              {selectedItem.status}
                            </span>
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
                        ? selectedItem.description 
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
                        {selectedItem.replies && selectedItem.replies.length > 0 ? (
                          <div className="space-y-3">
                            {selectedItem.replies.map(reply => (
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
                        ) : (
                          <p className="text-muted">No replies yet.</p>
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
                            <label htmlFor="replyMessage" className="form-label">
                              Your Reply *
                            </label>
                            <textarea
                              id="replyMessage"
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
                            disabled={loading}
                          >
                            {loading ? 'Submitting...' : 'Submit Reply'}
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                  
                  {activeTab === 'reports' && (
                    <div className="alert alert-info">
                      For content reports, please review the reported question/answer 
                      and take appropriate action in the content management section.
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
