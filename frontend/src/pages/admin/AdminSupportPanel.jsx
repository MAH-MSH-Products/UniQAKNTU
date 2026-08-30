import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api, { extractResults } from '../../services/api';
import { FiSend } from 'react-icons/fi';

const AdminSupportPanel = () => {
  const { user, canModerate } = useAuth();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('tickets'); 
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState({ type: '', message: '' });
  const [replying, setReplying] = useState(false);

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
      } else if (activeTab === 'reports') {
        const response = await api.get('/support/admin/reports/');
        setItems(extractResults(response));
      } else if (activeTab === 'pending-questions') {
        const response = await api.get('/questions/?status=PENDING');
        setItems(extractResults(response));
      } else if (activeTab === 'pending-answers') {
        const response = await api.get('/answers/?status=PENDING');
        setItems(extractResults(response));
      } else if (activeTab === 'suggested-edits') {
        const response = await api.get('/suggested-edits/');
        setItems(extractResults(response));
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenItem = async (item) => {
    setSelectedItem(item);
    setReplyMessage('');
    setReplyStatus({ type: '', message: '' });

    if (activeTab === 'tickets') {
      setLoadingDetails(true);
      try {
        const response = await api.get(`/support/admin/tickets/${item.id}/`);
        setSelectedItem(response.data);
      } catch (error) {
        console.error('Error fetching ticket details:', error);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    setReplying(true);
    setReplyStatus({ type: '', message: '' });

    try {
      const response = await api.post(`/support/admin/tickets/${selectedItem.id}/reply/`, { message: replyMessage });
      setSelectedItem(prev => ({
        ...prev,
        messages: [...(prev.messages || []), response.data] 
      }));
      setReplyMessage('');
      fetchItems(); 
    } catch (error) {
      console.error('Error submitting reply:', error);
      setReplyStatus({ 
        type: 'danger', 
        message: error.response?.data?.message || t('common.error', 'Failed to submit reply.') 
      });
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'tickets'
        ? `/support/admin/tickets/${selectedItem.id}/status/`
        : `/support/admin/reports/${selectedItem.id}/status/`;

      await api.patch(endpoint, { status: newStatus });
      setSelectedItem(prev => ({ ...prev, status: newStatus }));
      setItems(prevItems => prevItems.map(item => 
        item.id === selectedItem.id ? { ...item, status: newStatus } : item
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert(t('common.error', 'Failed to update status.'));
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (action) => {
    setLoadingDetails(true);
    try {
      let resource = '';
      if (activeTab === 'pending-questions') resource = 'questions';
      else if (activeTab === 'pending-answers') resource = 'answers';
      else if (activeTab === 'suggested-edits') resource = 'suggested-edits';
      
      await api.post(`/${resource}/${selectedItem.id}/${action}/`);
      
      alert(action === 'approve' ? t('admin.msg_approved', 'Approved successfully.') : t('admin.msg_rejected', 'Rejected successfully.'));
      handleCloseModal();
      fetchItems();
    } catch (error) {
      console.error(`Error ${action}ing item:`, error);
      alert(t('common.error', 'Action failed.'));
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'approved':
        return 'bg-success';
      case 'closed':
      case 'dismissed':
        return 'bg-secondary';
      case 'in-progress':
      case 'pending':
        return 'bg-warning text-dark';
      case 'resolved':
        return 'bg-primary';
      case 'rejected':
        return 'bg-danger';
      default:
        return 'bg-info';
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="page-heading">{t('admin.title', 'Admin Support Panel')}</h2>
          <p className="text-muted">{t('admin.subtitle', 'Manage all system tickets and content reports')}</p>
        </div>
      </div>

      <div className="coursera-tabs mb-4 overflow-auto text-nowrap">
        <button className={activeTab === 'tickets' ? 'coursera-tab-active' : 'coursera-tab'} onClick={() => setActiveTab('tickets')}>
          {t('admin.all_tickets', 'All Tickets')}
        </button>
        <button className={activeTab === 'reports' ? 'coursera-tab-active' : 'coursera-tab'} onClick={() => setActiveTab('reports')}>
          {t('admin.content_reports', 'Content Reports')}
        </button>
        <button className={activeTab === 'pending-questions' ? 'coursera-tab-active' : 'coursera-tab'} onClick={() => setActiveTab('pending-questions')}>
          {t('admin.pending_questions', 'Pending Questions')}
        </button>
        <button className={activeTab === 'pending-answers' ? 'coursera-tab-active' : 'coursera-tab'} onClick={() => setActiveTab('pending-answers')}>
          {t('admin.pending_answers', 'Pending Answers')}
        </button>
        <button className={activeTab === 'suggested-edits' ? 'coursera-tab-active' : 'coursera-tab'} onClick={() => setActiveTab('suggested-edits')}>
          {t('admin.suggested_edits', 'Suggested Edits')}
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {loading && items.length === 0 ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted text-center mb-0">{t('admin.no_items', 'No items found.')}</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>{t('admin.th_id', 'ID')}</th>
                    <th>{t('admin.th_user', 'User')}</th>
                    
                    {activeTab === 'tickets' && <th>{t('admin.th_title', 'Title')}</th>}
                    {activeTab === 'pending-questions' && <th>{t('admin.th_title', 'Title')}</th>}
                    {activeTab === 'pending-answers' && <th>{t('admin.th_question_id', 'Question ID')}</th>}
                    
                    {activeTab === 'reports' && <th>{t('admin.th_category', 'Target')}</th>}
                    {activeTab === 'suggested-edits' && <th>{t('admin.target_item', 'Target Item')}</th>}
                    {(activeTab === 'tickets' || activeTab === 'reports') && !['reports'].includes(activeTab) && <th>{t('admin.th_category', 'Category')}</th>}
                    
                    <th>{t('admin.th_status', 'Status')}</th>
                    <th>{t('admin.th_created', 'Created At')}</th>
                    <th>{t('admin.th_action', 'Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>{item.author?.username || item.author || item.reporter || 'Unknown'}</td>
                      
                      {activeTab === 'tickets' && <td><strong>{item.title}</strong></td>}
                      {activeTab === 'pending-questions' && <td><strong>{item.title}</strong></td>}
                      {activeTab === 'pending-answers' && <td>#{item.question}</td>}
                      
                      {activeTab === 'reports' ? (
                        <td>{item.target_type} #{item.target_id}</td>
                      ) : activeTab === 'suggested-edits' ? (
                        <td className="text-capitalize">{item.target_type} #{item.target_id}</td>
                      ) : activeTab === 'tickets' ? (
                        <td>{item.category}</td>
                      ) : null}
                      
                      <td>
                        <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : (item.created_at_jalali ? item.created_at_jalali.split('T')[0] : '')}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleOpenItem(item)}
                        >
                          {t('admin.btn_view', 'View')}
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
          <div className="modal-backdrop fade show" onClick={handleCloseModal} style={{ zIndex: 1050 }} />
          
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1055 }}>
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {activeTab === 'tickets' ? 'Ticket' : 
                     activeTab === 'reports' ? 'Report' : 
                     activeTab === 'pending-questions' ? 'Question' : 
                     activeTab === 'pending-answers' ? 'Answer' : 'Suggested Edit'} #{selectedItem.id}
                  </h5>
                  <button type="button" className="btn-close" onClick={handleCloseModal} aria-label="Close" />
                </div>
                
                <div className="modal-body">
                  <div className="mb-4">
                    <h6 className="fw-bold text-primary">{t('admin.details', 'Details')}</h6>
                    <table className="table table-sm table-bordered">
                      <tbody>
                        <tr>
                          <th style={{ width: '150px' }}>{t('admin.user_id', 'User ID:')}</th>
                          <td>{selectedItem.author?.username || selectedItem.author || selectedItem.reporter || 'Unknown'}</td>
                        </tr>
                        {activeTab === 'tickets' && (
                          <>
                            <tr>
                              <th>{t('admin.th_title', 'Title:')}</th>
                              <td>{selectedItem.title}</td>
                            </tr>
                            <tr>
                              <th>{t('admin.th_category', 'Category:')}</th>
                              <td>{selectedItem.category}</td>
                            </tr>
                          </>
                        )}
                        {(activeTab === 'reports' || activeTab === 'suggested-edits') && (
                          <>
                            <tr>
                              <th>{t('admin.target_type', 'Target Type:')}</th>
                              <td className="text-capitalize">{selectedItem.target_type}</td>
                            </tr>
                            <tr>
                              <th>{t('admin.target_id', 'Target ID:')}</th>
                              <td>#{selectedItem.target_id}</td>
                            </tr>
                          </>
                        )}
                        {activeTab === 'pending-questions' && (
                          <>
                            <tr>
                              <th>{t('admin.th_title', 'Title:')}</th>
                              <td>{selectedItem.title}</td>
                            </tr>
                            <tr>
                              <th>{t('source_materials.title', 'Source Material:')}</th>
                              <td>{selectedItem.source_material || 'N/A'}</td>
                            </tr>
                          </>
                        )}
                        {activeTab === 'pending-answers' && (
                          <>
                            <tr>
                              <th>{t('admin.th_question_id', 'Question ID:')}</th>
                              <td>#{selectedItem.question}</td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <th>{t('admin.th_status', 'Status:')}</th>
                          <td>
                            {(activeTab === 'tickets' || activeTab === 'reports') ? (
                              <div className="d-flex align-items-center gap-2">
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
                              </div>
                            ) : (
                              <span className={`badge ${getStatusBadgeClass(selectedItem.status)}`}>
                                {selectedItem.status}
                              </span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>{t('admin.th_created', 'Created:')}</th>
                          <td>{selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : (selectedItem.created_at_jalali ? selectedItem.created_at_jalali : 'N/A')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {(activeTab === 'tickets' || activeTab === 'reports') && (
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary">{t('admin.description_reason', 'Description / Reason')}</h6>
                      <div className="bg-light p-3 rounded border">
                        {activeTab === 'tickets' 
                          ? (selectedItem.messages?.[0]?.message || 'Loading description...')
                          : selectedItem.reason
                        }
                      </div>
                    </div>
                  )}

                  {activeTab === 'suggested-edits' && (
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary">{t('admin.proposed_text', 'Proposed Text')}</h6>
                      <div className="bg-light p-3 rounded border" style={{ maxHeight: '350px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                        {selectedItem.proposed_text || 'No text provided.'}
                      </div>
                    </div>
                  )}

                  {selectedItem.introduction && activeTab === 'tickets' && (
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary">{t('admin.intro_role_req', 'Introduction (Role Request)')}</h6>
                      <div className="bg-light p-3 rounded border">
                        {selectedItem.introduction}
                      </div>
                    </div>
                  )}

                  {(activeTab === 'pending-questions' || activeTab === 'pending-answers') && (
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary">{t('admin.th_body', 'Body / Content')}</h6>
                      <div className="bg-light p-3 rounded border" style={{ maxHeight: '350px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                        {selectedItem.body || selectedItem.text || 'No content provided.'}
                      </div>
                    </div>
                  )}

                  {activeTab === 'tickets' && (
                    <>
                      <div className="mb-4">
                        <h6 className="border-bottom pb-2 fw-bold text-primary">{t('admin.replies', 'Replies')}</h6>
                        {loadingDetails ? (
                           <div className="text-center py-3">
                             <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                           </div>
                        ) : selectedItem.messages && selectedItem.messages.length > 1 ? (
                          <div className="ticket-chat-section p-3 bg-light rounded border" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {selectedItem.messages.slice(1).map((reply, index) => {
                              const isAdminReply = reply.sender === user.id;
                              return (
                                <div key={reply.id || index} className={`mb-3 d-flex flex-column ${isAdminReply ? 'align-items-end' : 'align-items-start'}`}>
                                  <div 
                                    className={`p-2 rounded shadow-sm ${isAdminReply ? 'bg-primary text-white' : 'bg-white border text-dark'}`}
                                    style={{ maxWidth: '85%', display: 'inline-block' }}
                                  >
                                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                                      {reply.message}
                                    </div>
                                  </div>
                                  <small className="text-muted mt-1" style={{ fontSize: '11px' }}>
                                    {new Date(reply.created_at).toLocaleString()} - {isAdminReply ? 'You' : 'User'}
                                  </small>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-muted small p-3 bg-light rounded border text-center">{t('admin.no_replies', 'No replies yet.')}</p>
                        )}
                      </div>

                      <div className="border-top pt-3">
                        <h6 className="fw-bold">{t('admin.submit_reply', 'Submit Reply')}</h6>
                        {replyStatus.message && (
                          <div className={`alert alert-${replyStatus.type} py-2 small mb-3`}>
                            {replyStatus.message}
                          </div>
                        )}
                        
                        {selectedItem.status !== 'Closed' && selectedItem.status !== 'Resolved' ? (
                          <form onSubmit={handleReplySubmit} className="mt-2">
                            <div className="input-group shadow-sm">
                              <textarea
                                className="form-control"
                                rows="2"
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder={t('admin.reply_placeholder', 'Enter your response...')}
                                disabled={replying || loadingDetails}
                                style={{ resize: 'none' }}
                              />
                              <button 
                                type="submit" 
                                className="btn btn-primary px-4 d-flex align-items-center justify-content-center"
                                disabled={replying || !replyMessage.trim() || loadingDetails}
                              >
                                {replying ? <span className="spinner-border spinner-border-sm"></span> : <FiSend size={20} />}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="alert alert-secondary py-2 mt-2 text-center small">
                            {t('admin.cannot_reply_closed', 'Cannot reply to closed tickets.')}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  {activeTab === 'reports' && (
                    <div className="alert alert-info py-2 small">
                      <i className="bi bi-info-circle me-2"></i>
                      {t('admin.review_report_notice', 'Review the reported content on the public page and take appropriate action. Update the status above once handled.')}
                    </div>
                  )}
                </div>
                
                <div className="modal-footer border-top">
                  {(activeTab === 'pending-questions' || activeTab === 'pending-answers' || activeTab === 'suggested-edits') && selectedItem.status === 'PENDING' && (
                    <>
                      <button 
                        type="button" 
                        className="btn btn-success" 
                        onClick={() => handleApproveReject('approve')}
                        disabled={loadingDetails}
                      >
                        {t('admin.btn_approve', 'Approve')}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-danger" 
                        onClick={() => handleApproveReject('reject')}
                        disabled={loadingDetails}
                      >
                        {t('admin.btn_reject', 'Reject')}
                      </button>
                    </>
                  )}
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleCloseModal}
                  >
                    {t('common.close', 'Close')}
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