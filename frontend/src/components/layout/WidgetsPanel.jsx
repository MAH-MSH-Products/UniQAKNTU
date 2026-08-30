import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiMessageSquare, FiBookOpen, FiFileText } from 'react-icons/fi';
import api, { extractResults } from '../../services/api';

/**
 * WidgetsPanel Component - Dynamic Side Panel
 * Displays links wrapping the items, allowing users to click and navigate
 * directly to the respective exams, questions, or answers.
 */
const WidgetsPanel = () => {
  const { t } = useTranslation();
  const [recentAnswers, setRecentAnswers] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [latestExams, setLatestExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWidgetData();
  }, []);

  const fetchWidgetData = async () => {
    setLoading(true);
    try {
      // Real API calls
      const answersResponse = await api.get('/widgets/recent-answers/');
      const coursesResponse = await api.get('/widgets/popular-courses/');
      const examsResponse = await api.get('/widgets/latest-exams/');
      
      setRecentAnswers(extractResults(answersResponse));
      setPopularCourses(extractResults(coursesResponse));
      setLatestExams(extractResults(examsResponse));
    } catch (error) {
      console.error('Error fetching widget data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date without time
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  if (loading) {
    return (
      <div className="widget-panel academic-card">
        <div className="text-center py-4">
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
      <div className="academic-card widget-panel mb-3">
        <h6 className="section-title">
          <FiMessageSquare className="widget-icon" />
          {t('widgets.recent_answers', 'Recent Answers')}
        </h6>
        <div>
          {recentAnswers.length > 0 ? (
            recentAnswers.map(answer => (
              <Link 
                to={`/answers/${answer.id}`} 
                key={answer.id} 
                className="text-decoration-none text-dark d-block widget-item border-bottom py-2"
              >
                <div className="widget-content">
                  <p className="widget-title text-primary mb-1 fw-bold">{answer.title}</p>
                  <p className="widget-subtitle text-muted small">{answer.course} • {answer.author}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-muted small">{t('common.no_data', 'No recent data')}</p>
          )}
        </div>
      </div>

      {/* Popular Courses Widget */}
      <div className="academic-card widget-panel mb-3">
        <h6 className="section-title">
          <FiBookOpen className="widget-icon" />
          {t('widgets.popular_courses', 'Popular Courses')}
        </h6>
        <div>
          {popularCourses.length > 0 ? (
            popularCourses.map(course => (
              <Link 
                to={`/source-materials/${course.id}/questions`} 
                key={course.id} 
                className="text-decoration-none text-dark d-block widget-item border-bottom py-2"
              >
                <div className="widget-content">
                  <p className="widget-title text-primary mb-1 fw-bold">{course.name || course.title}</p>
                  <p className="widget-subtitle text-muted small">{course.code} • {course.examCount || 0} exams</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-muted small">{t('common.no_data', 'No recent data')}</p>
          )}
        </div>
      </div>

      {/* Latest Exams Widget */}
      <div className="academic-card widget-panel mb-3">
        <h6 className="section-title">
          <FiFileText className="widget-icon" />
          {t('widgets.latest_exams', 'Latest Exams')}
        </h6>
        <div>
          {latestExams.length > 0 ? (
            latestExams.map(exam => (
              <Link 
                to={`/source-materials/${exam.id}/questions`} 
                key={exam.id} 
                className="text-decoration-none text-dark d-block widget-item border-bottom py-2"
              >
                <div className="widget-content">
                  <p className="widget-title text-primary mb-1 fw-bold">{exam.title}</p>
                  <p className="widget-subtitle text-muted small">{exam.course} • {formatDate(exam.date || exam.created_at_jalali)}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-muted small">{t('common.no_data', 'No recent data')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WidgetsPanel;