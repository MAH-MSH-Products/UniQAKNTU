// src/pages/admin/AdminSupportPanel.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api, {
  extractResults,
  getAdminOpinions,
  moderateOpinion,
  getAdminConsultations,
  updateConsultationStatus,
} from '../../services/api';
import { FiSend, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const DAY_LABELS = {
  1: 'شنبه (Shanbeh)',
  2: 'یکشنبه (Yekshanbeh)',
  3: 'دوشنبه (Doshanbeh)',
  4: 'سه‌شنبه (Seshanbeh)',
  5: 'چهارشنبه (Chaharshanbeh)',
  6: 'پنج‌شنبه (Panjshanbeh)',
  7: 'جمعه (Jomeh)',
};

const AdminSupportPanel = () => {
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('tickets'); 
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState({ type: '', message: '' });
  const [replying, setReplying] = useState(false);
  const [consultationStatus, setConsultationStatus] = useState('CONFIRMED');
  const [consultationNotes, setConsultationNotes] = useState('');
  const [updatingConsultation, setUpdatingConsultation] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      fetchItems();
    }
  }, [activeTab, user, isAdmin]);

  // فقط ادمین به این پنل دسترسی دارد
  if (!user || !isAdmin) {
    return (
      <div className="container-fluid py-5 text-center">
        <h1 className="display-1 text-danger">403</h1>
        <h2 className="mb-3">Access Denied</h2>
        <p className="text-muted">You do not have permission to access the admin support panel.</p>
        <a href="/" className="btn btn-primary">Return to Home</a>
      </div>
    );
  }

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
      } else if (activeTab === 'users') {
        const response = await api.get('/users/');
        setItems(extractResults(response));
      } else if (activeTab === 'opinions') {
        const response = await getAdminOpinions({ status: 'all' });
        setItems(extractResults(response));
      } else if (activeTab === 'consultations') {
        const response = await getAdminConsultations();
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

    if (activeTab === 'consultations') {
      setConsultationStatus(item.status || 'CONFIRMED');
      setConsultationNotes(item.notes || '');
    }

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
      setReplyStatus({ type: 'danger', message: t('common.error') });
    } finally {
      setReplying(false);
    }
  };

  // تابع یکسان‌سازی وضعیت برای جلوگیری از باگ‌های Case Sensitivity در React Select
  const normalizeStatus = (status) => {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s === 'in-progress') return 'In-progress';
    return s.charAt(0).toUpperCase() + s.slice(1);
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
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.response?.data?.status?.[0] || t('common.error');
      alert(`Failed to update status: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (action) => {
    setLoadingDetails(true);
    try {
      let resource = activeTab.replace('pending-', '');
      await api.post(`/${resource}/${selectedItem.id}/${action}/`);
      alert(action === 'approve' ? t('admin.msg_approved') : t('admin.msg_rejected'));
      setSelectedItem(null);
      fetchItems();
    } catch (error) {
      alert(t('common.error'));
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm("Change user role?")) return;
    try {
      await api.patch(`/users/${userId}/role/`, { role: newRole });
      alert(t('admin.role_updated'));
      fetchItems();
    } catch (err) {
      alert(t('common.error'));
    }
  };

  const handleModerateOpinion = async (opinionId, action) => {
    try {
      await moderateOpinion(opinionId, action);
      fetchItems();
      if (selectedItem?.id === opinionId) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error moderating opinion:', error);
      alert(t('common.error'));
    }
  };

  const handleSaveConsultation = async (e) => {
    e?.preventDefault();
    if (!selectedItem) return;
    setUpdatingConsultation(true);
    try {
      const res = await updateConsultationStatus(selectedItem.id, {
        status: consultationStatus,
        notes: consultationNotes,
      });
      setSelectedItem(res.data);
      fetchItems();
      alert(t('admin.consultation_status_updated', 'Consultation updated successfully.'));
      handleCloseModal();
    } catch (error) {
      console.error('Error updating consultation:', error);
      alert(t('common.error'));
    } finally {
      setUpdatingConsultation(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = status?.toLowerCase();
    if (['open', 'approved', 'confirmed'].includes(s)) return 'bg-success';
    if (['closed', 'dismissed', 'completed'].includes(s)) return 'bg-secondary';
    if (['in-progress', 'pending'].includes(s)) return 'bg-warning text-dark';
    if (['resolved'].includes(s)) return 'bg-primary';
    if (['rejected', 'cancelled'].includes(s)) return 'bg-danger';
    return 'bg-info';
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="page-heading">{t('admin.title')}</h2>
          <p className="text-muted">{t('admin.subtitle')}</p>
        </div>
      </div>

      <div className="coursera-tabs mb-4 overflow-auto text-nowrap">
        <button className={activeTab === 'tickets' ? 'coursera-tab-active' : 'coursera-tab'} onClick={() => setActiveTab('tickets')}>{t('admin.all_tickets')}</button>
        <button className={activeTab === 'reports' ? 'coursera-tab-active' : 'coursera-tab'} onClick={() => setActiveTab('reports')}>{t('admin.content_reports')}</button>
        <button className={activeTab === 'pending-questions' ? 'coursera-tab-active' : 'coursera-tab'} onClick={() => setActiveTab('pending-questions')}>{t('admin.pending_questions')}</button>
        <button className={activeTab === 'pending-answers' ? 'coursera-tab-active' : 'coursera-tab'} onClick={() => setActiveTab('pending-answers')}>{t('admin.pending_answers')}</button>
        <button className={activeTab === 'suggested-edits' ? 'coursera-tab-active' : 'coursera-tab'} onClick={() => setActiveTab('suggested-edits')}>{t('admin.suggested_edits')}</button>
        <button className={activeTab === 'opinions' ? 'coursera-tab-active' : 'coursera-tab'} onClick={() => setActiveTab('opinions')}>
          {t('admin.student_opinions', 'نظرات دانشجویان')}
        </button>
        <button className={activeTab === 'consultations' ? 'coursera-tab-active' : 'coursera-tab'} onClick={() => setActiveTab('consultations')}>
          {t('admin.consultation_bookings', 'جلسات مشاوره')}
        </button>
        {isAdmin && <button className={activeTab === 'users' ? 'coursera-tab-active' : 'coursera-tab'} onClick={() => setActiveTab('users')}>{t('admin.users_management')}</button>}
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading && items.length === 0 ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : items.length === 0 ? (
            <p className="text-muted text-center py-5 mb-0">{t('admin.no_items')}</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    {activeTab === 'users' ? (
                      <>
                        <th className="px-3">Username</th>
                        <th>{t('admin.th_email')}</th>
                        <th>{t('admin.th_name')}</th>
                        <th>{t('admin.th_role')}</th>
                        <th>{t('admin.th_date_joined')}</th>
                      </>
                    ) : activeTab === 'opinions' ? (
                      <>
                        <th className="px-3">#</th>
                        <th>{t('admin.th_user')}</th>
                        <th>{t('admin.th_content', 'Content')}</th>
                        <th>{t('admin.th_votes', 'Likes / Dislikes')}</th>
                        <th>{t('admin.th_status')}</th>
                        <th>{t('admin.th_created')}</th>
                        <th className="text-end px-3">{t('admin.th_action')}</th>
                      </>
                    ) : activeTab === 'consultations' ? (
                      <>
                        <th className="px-3">#</th>
                        <th>{t('admin.th_student', 'Student')}</th>
                        <th>{t('dashboard.day_of_week', 'Day')}</th>
                        <th>{t('dashboard.time_slot', 'Time Slot')}</th>
                        <th>{t('admin.th_status')}</th>
                        <th>{t('admin.consultation_notes', 'Notes')}</th>
                        <th>{t('admin.th_created', 'Booked At')}</th>
                        <th className="text-end px-3">{t('admin.th_action')}</th>
                      </>
                    ) : (
                      <>
                        <th className="px-3">{t('admin.th_id')}</th>
                        <th>{t('admin.th_user')}</th>
                        {['tickets', 'pending-questions'].includes(activeTab) && <th>{t('admin.th_title')}</th>}
                        {activeTab === 'pending-answers' && <th>{t('admin.th_question_id')}</th>}
                        {activeTab === 'reports' && <th>{t('admin.th_category')}</th>}
                        {activeTab === 'suggested-edits' && <th>{t('admin.target_item')}</th>}
                        {['tickets'].includes(activeTab) && <th>{t('admin.th_category')}</th>}
                        <th>{t('admin.th_status')}</th>
                        <th>{t('admin.th_created')}</th>
                        <th>{t('admin.th_action')}</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      {activeTab === 'users' ? (
                        <>
                          <td className="px-3 fw-bold">{item.username}</td>
                          <td>{item.email}</td>
                          <td>{item.first_name} {item.last_name}</td>
                          <td>
                            <select 
                              className="form-select form-select-sm" 
                              value={item.role} 
                              onChange={(e) => handleRoleChange(item.id, e.target.value)}
                              disabled={!isAdmin || item.id === user.id}
                            >
                              <option value="STUDENT">Student</option>
                              <option value="MODERATOR">Moderator</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </td>
                          <td>{new Date(item.date_joined).toLocaleDateString()}</td>
                        </>
                      ) : activeTab === 'opinions' ? (
                        <>
                          <td className="px-3">#{item.id ? String(item.id).slice(0, 8) : ''}</td>
                          <td>
                            {item.is_anonymous
                              ? `${t('community.anonymous', 'Anonymous')} (${item.author_name || item.author?.username || 'User'})`
                              : (item.author_name || item.author?.username || 'User')}
                          </td>
                          <td style={{ maxWidth: '280px' }} className="text-truncate">
                            {item.text}
                          </td>
                          <td>👍 {item.likes || 0} / 👎 {item.dislikes || 0}</td>
                          <td><span className={`badge ${getStatusBadgeClass(item.status)}`}>{item.status}</span></td>
                          <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</td>
                          <td className="text-end px-3">
                            <div className="d-inline-flex gap-1 align-items-center">
                              {item.status === 'PENDING' && (
                                <>
                                  <button
                                    className="btn btn-sm btn-outline-success border-0 p-1"
                                    onClick={() => handleModerateOpinion(item.id, 'APPROVE')}
                                    title={t('admin.btn_approve', 'Approve')}
                                  >
                                    <FiCheckCircle size={16} />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger border-0 p-1"
                                    onClick={() => handleModerateOpinion(item.id, 'REJECT')}
                                    title={t('admin.btn_reject', 'Reject')}
                                  >
                                    <FiXCircle size={16} />
                                  </button>
                                </>
                              )}
                              <button className="btn btn-sm btn-outline-primary border-0" onClick={() => handleOpenItem(item)}>
                                {t('admin.btn_view')}
                              </button>
                            </div>
                          </td>
                        </>
                      ) : activeTab === 'consultations' ? (
                        <>
                          <td className="px-3">#{item.id ? String(item.id).slice(0, 8) : ''}</td>
                          <td>
                            <div className="fw-bold">{item.student?.username || 'Student'}</div>
                            <small className="text-muted">{item.student?.first_name} {item.student?.last_name} ({item.student?.email})</small>
                          </td>
                          <td>{DAY_LABELS[item.day_of_week] || item.day_of_week}</td>
                          <td><span className="badge bg-light text-dark border font-monospace">{item.time_slot ? item.time_slot.slice(0, 5) : ''}</span></td>
                          <td><span className={`badge ${getStatusBadgeClass(item.status)}`}>{item.status}</span></td>
                          <td style={{ maxWidth: '200px' }} className="text-truncate text-muted">{item.notes || '-'}</td>
                          <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</td>
                          <td className="text-end px-3">
                            <button className="btn btn-sm btn-outline-primary border-0" onClick={() => handleOpenItem(item)}>
                              {t('admin.btn_view')}
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3">#{item.id}</td>
                          <td>{item.author?.username || item.author || item.reporter || 'Unknown'}</td>
                          
                          {['tickets', 'pending-questions'].includes(activeTab) && <td><strong>{item.title}</strong></td>}
                          {activeTab === 'pending-answers' && <td>#{item.question}</td>}
                          
                          {activeTab === 'reports' ? (
                            <td>{item.target_type} #{item.target_id}</td>
                          ) : activeTab === 'suggested-edits' ? (
                            <td className="text-capitalize">{item.target_type} #{item.target_id}</td>
                          ) : activeTab === 'tickets' ? (
                            <td>{item.category}</td>
                          ) : null}
                          
                          <td><span className={`badge ${getStatusBadgeClass(item.status)}`}>{item.status}</span></td>
                          <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : (item.created_at_jalali ? item.created_at_jalali.split('T')[0] : '')}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary border-0" onClick={() => handleOpenItem(item)}>
                              {t('admin.btn_view')}
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && activeTab !== 'users' && (
        <>
          <div className="modal-backdrop fade show" onClick={handleCloseModal} style={{ zIndex: 1050 }} />
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                  <h5 className="modal-title fw-bold text-primary">#{selectedItem.id} Detail View</h5>
                  <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                </div>
                
                <div className="modal-body px-4">
                  <table className="table table-sm table-bordered mt-3">
                    <tbody>
                      <tr>
                        <th style={{ width: '150px' }}>User ID:</th>
                        <td>{selectedItem.author?.username || selectedItem.author || selectedItem.reporter || selectedItem.student?.username || 'Unknown'}</td>
                      </tr>
                      {activeTab === 'opinions' && (
                        <>
                          <tr>
                            <th>{t('community.author', 'Author:')}</th>
                            <td>
                              {selectedItem.is_anonymous
                                ? `${t('community.anonymous', 'Anonymous')} (${selectedItem.author_name || selectedItem.author?.username || 'User'})`
                                : (selectedItem.author_name || selectedItem.author?.username || 'User')}
                            </td>
                          </tr>
                          <tr>
                            <th>{t('admin.th_votes', 'Votes:')}</th>
                            <td>👍 {selectedItem.likes || 0} &nbsp;|&nbsp; 👎 {selectedItem.dislikes || 0}</td>
                          </tr>
                        </>
                      )}
                      {activeTab === 'consultations' && (
                        <>
                          <tr>
                            <th>{t('admin.th_student', 'Student:')}</th>
                            <td>
                              <strong>{selectedItem.student?.username}</strong> &mdash; {selectedItem.student?.first_name} {selectedItem.student?.last_name} ({selectedItem.student?.email})
                            </td>
                          </tr>
                          <tr>
                            <th>{t('dashboard.day_of_week', 'Day:')}</th>
                            <td>{DAY_LABELS[selectedItem.day_of_week] || selectedItem.day_of_week}</td>
                          </tr>
                          <tr>
                            <th>{t('dashboard.time_slot', 'Session Time:')}</th>
                            <td>{selectedItem.time_slot ? selectedItem.time_slot.slice(0, 5) : ''}</td>
                          </tr>
                        </>
                      )}
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
                                value={normalizeStatus(selectedItem.status)} /* رفع باگ Case Sensitivity */
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
                          ) : activeTab === 'consultations' ? (
                            <div className="d-flex align-items-center gap-2">
                              <select
                                className="form-select form-select-sm w-auto fw-bold"
                                value={consultationStatus}
                                onChange={(e) => setConsultationStatus(e.target.value)}
                                disabled={updatingConsultation}
                              >
                                <option value="CONFIRMED">CONFIRMED</option>
                                <option value="PENDING">PENDING</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
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

                  {/* نمایش Reason فقط برای تب Reports */}
                  {activeTab === 'reports' && selectedItem.reason && (
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary">{t('admin.description_reason', 'Reason')}</h6>
                      <div className="bg-light p-3 rounded border">
                        {selectedItem.reason}
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

                  {activeTab === 'opinions' && (
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary">{t('admin.opinion_content', 'Opinion Text')}</h6>
                      <div className="bg-light p-3 rounded border" style={{ maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                        {selectedItem.text}
                      </div>
                    </div>
                  )}

                  {activeTab === 'consultations' && (
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary">{t('admin.consultation_notes', 'Counselor Notes')}</h6>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={consultationNotes}
                        onChange={(e) => setConsultationNotes(e.target.value)}
                        placeholder={t('admin.notes_placeholder', 'Add notes or advice for this session...')}
                        disabled={updatingConsultation}
                      />
                    </div>
                  )}

                  {/* چت تیکت‌ها - شامل تمام پیام‌ها حتی پیام اول */}
                  {activeTab === 'tickets' && (
                    <>
                      <div className="mb-4 mt-4 border-top pt-3">
                        <h6 className="fw-bold text-primary">{t('admin.replies', 'Replies')}</h6>
                        {loadingDetails ? (
                           <div className="text-center py-3">
                             <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                           </div>
                        ) : selectedItem.messages && selectedItem.messages.length > 0 ? (
                          <div className="ticket-chat-section p-3 bg-light rounded border mb-3" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {selectedItem.messages.map((reply, index) => {
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
                          <p className="text-muted small p-3 bg-light rounded border text-center">{t('admin.no_replies', 'No messages yet.')}</p>
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
                
                <div className="modal-footer border-top-0 px-4 pb-4">
                  {(activeTab === 'pending-questions' || activeTab === 'pending-answers' || activeTab === 'suggested-edits') && selectedItem.status === 'PENDING' && (
                    <>
                      <button className="btn btn-success" onClick={() => handleApproveReject('approve')} disabled={loadingDetails}>{t('admin.btn_approve')}</button>
                      <button className="btn btn-danger" onClick={() => handleApproveReject('reject')} disabled={loadingDetails}>{t('admin.btn_reject')}</button>
                    </>
                  )}
                  {activeTab === 'opinions' && (
                    <>
                      <button
                        className="btn btn-success"
                        onClick={() => handleModerateOpinion(selectedItem.id, 'APPROVE')}
                      >
                        {t('admin.btn_approve', 'Approve')}
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleModerateOpinion(selectedItem.id, 'REJECT')}
                      >
                        {t('admin.btn_reject', 'Reject')}
                      </button>
                    </>
                  )}
                  {activeTab === 'consultations' && (
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveConsultation}
                      disabled={updatingConsultation}
                    >
                      {updatingConsultation ? <span className="spinner-border spinner-border-sm" /> : t('common.save', 'Save Changes')}
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={handleCloseModal}>{t('common.close')}</button>
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