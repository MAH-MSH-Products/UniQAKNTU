import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiFileText, FiTrash2, FiEye } from 'react-icons/fi';
import { getCustomExams, deleteCustomExam, extractResults } from '../../services/api';

const CustomExamsList = () => {
  const { t } = useTranslation();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await getCustomExams();
      setExams(extractResults(response));
    } catch (error) {
      console.error('Failed to fetch custom exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (examId) => {
    if (!window.confirm(t('custom_exams.delete_confirm', 'Are you sure you want to delete this exam?'))) {
      return;
    }

    try {
      await deleteCustomExam(examId);
      alert(t('custom_exams.delete_success', 'Exam deleted successfully'));
      fetchExams();
    } catch (error) {
      alert(t('custom_exams.delete_failed', 'Failed to delete exam'));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="custom-exams-list-page py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{t('custom_exams.my_exams', 'My Custom Exams')}</h2>
        <Link to="/custom-exams/build" className="btn btn-primary">
          <FiFileText className="me-1" />
          {t('custom_exams.create_new', 'Create New Exam')}
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="alert alert-info">
          {t('custom_exams.no_exams', 'You haven\'t created any custom exams yet.')}
          <br />
          <Link to="/custom-exams/build" className="btn btn-primary mt-3">
            {t('custom_exams.create_first', 'Create Your First Exam')}
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {exams.map((exam) => (
            <div key={exam.id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title fw-bold text-primary">{exam.title}</h5>
                  <div className="mb-3 flex-grow-1">
                    <small className="text-muted d-block">
                      <i className="bi bi-calendar me-1"></i>
                      {t('custom_exams.created_on', 'Created')}: {new Date(exam.created_at).toLocaleDateString()}
                    </small>
                    <small className="text-muted d-block mt-1">
                      <i className="bi bi-file-text me-1"></i>
                      {exam.questions?.length || exam.question_count || 0} {t('custom_exams.questions', 'Questions')}
                    </small>
                  </div>

                  <div className="d-flex gap-2">
                    <Link
                      to={`/custom-exams/${exam.id}`}
                      className="btn btn-primary btn-sm flex-grow-1"
                    >
                      <FiEye className="me-1" />
                      {t('custom_exams.view', 'View')}
                    </Link>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDelete(exam.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomExamsList;
