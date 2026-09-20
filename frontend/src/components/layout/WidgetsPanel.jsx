import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiMessageSquare, FiFileText } from 'react-icons/fi';
import api, { extractResults } from '../../services/api';

const WidgetsPanel = () => {
  const { t } = useTranslation();
  const [recentAnswers, setRecentAnswers] = useState([]);
  const [latestExams, setLatestExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWidgetData();
  }, []);

  const fetchWidgetData = async () => {
    setLoading(true);
    try {
      const answersResponse = await api.get('/widgets/recent-answers/');
      const examsResponse = await api.get('/widgets/latest-exams/');
      
      setRecentAnswers(extractResults(answersResponse));
      setLatestExams(extractResults(examsResponse));
    } catch (error) {
      console.error('Error fetching widget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  if (loading) {
    return (
      <div className="widgets-panel" style={{ width: '300px', flexShrink: 0 }}>
        <div className="academic-card widget-panel p-4 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="widgets-panel" style={{ width: '300px', flexShrink: 0 }}>
      
      {/* Recent Answers Widget */}
      {/* کلاس p-4 پدینگ مناسبی به کل کادر می‌دهد */}
      <div className="academic-card widget-panel mb-4 p-4 shadow-sm border-0">
        <h6 className="section-title text-primary fw-bold mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
          <FiMessageSquare className="widget-icon" />
          {t('widgets.recent_answers', 'Recent Answers')}
        </h6>
        
        <div className="d-flex flex-column gap-1">
          {recentAnswers.length > 0 ? (
            recentAnswers.map(answer => (
              <Link
                to={`/answers/${answer.id}`}
                key={answer.id}
                // کلاس p-2 باعث می‌شود موقع هاور شدن، آیتم‌ها به دیواره نچسبند
                className="text-decoration-none text-dark d-block widget-item p-2 rounded"
              >
                <div className="widget-content">
                  <p className="widget-title text-primary mb-1 fw-bold" style={{ fontSize: '13px' }}>
                    {answer.title}
                  </p>
                  <p className="widget-subtitle text-muted small mb-0" style={{ fontSize: '11px' }}>
                    {answer.course} • {answer.author}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-muted small mb-0 px-2">{t('common.no_data', 'No data available')}</p>
          )}
        </div>
      </div>

      {/* Latest Exams Widget */}
      <div className="academic-card widget-panel mb-4 p-4 shadow-sm border-0">
        <h6 className="section-title text-primary fw-bold mb-3 pb-2 border-bottom d-flex align-items-center gap-2">
          <FiFileText className="widget-icon" />
          {t('widgets.latest_exams', 'Latest Exams')}
        </h6>
        
        <div className="d-flex flex-column gap-1">
          {latestExams.length > 0 ? (
            latestExams.map(exam => (
              <Link
                to={`/source-materials/${exam.id}/questions`}
                key={exam.id}
                className="text-decoration-none text-dark d-block widget-item p-2 rounded"
              >
                <div className="widget-content">
                  <p className="widget-title text-primary mb-1 fw-bold" style={{ fontSize: '13px' }}>
                    {exam.title}
                  </p>
                  <p className="widget-subtitle text-muted small mb-0" style={{ fontSize: '11px' }}>
                    {exam.course} • {formatDate(exam.date || exam.created_at_jalali)}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-muted small mb-0 px-2">{t('common.no_data', 'No data available')}</p>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default WidgetsPanel;