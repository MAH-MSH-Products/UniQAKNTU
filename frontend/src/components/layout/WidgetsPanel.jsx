import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMessageSquare, FiBookOpen, FiFileText } from 'react-icons/fi';
import api, { extractResults } from '../../services/api';

/**
 * WidgetsPanel Component - Dynamic Side Panel
 * 
 * Un-mocked version connected to real backend API endpoints:
 * - GET /widgets/recent-answers/
 * - GET /widgets/popular-courses/
 * - GET /widgets/latest-exams/
 */

const WidgetsPanel = () => {
  const { t } = useTranslation();
  
  const [recentAnswers, setRecentAnswers] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [latestExams, setLatestExams] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch widget data on component mount
   * Uses real API calls - gracefully handles 404 errors if backend is not ready
   */
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
      // Leave states as empty arrays - UI will show "No recent data"
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="widget-panel academic-card">
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
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
          Recent Answers
        </h6>
        <div>
          {recentAnswers.length > 0 ? (
            recentAnswers.map(answer => (
              <div key={answer.id} className="widget-item">
                <div className="widget-content">
                  <p className="widget-title">{answer.title}</p>
                  <p className="widget-subtitle">{answer.course} • {answer.author}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted small">No recent data</p>
          )}
        </div>
      </div>

      {/* Popular Courses Widget */}
      <div className="academic-card widget-panel mb-3">
        <h6 className="section-title">
          <FiBookOpen className="widget-icon" />
          Popular Courses
        </h6>
        <div>
          {popularCourses.length > 0 ? (
            popularCourses.map(course => (
              <div key={course.id} className="widget-item">
                <div className="widget-content">
                  <p className="widget-title">{course.name}</p>
                  <p className="widget-subtitle">{course.code} • {course.examCount} exams</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted small">No recent data</p>
          )}
        </div>
      </div>

      {/* Latest Exams Widget */}
      <div className="academic-card widget-panel mb-3">
        <h6 className="section-title">
          <FiFileText className="widget-icon" />
          Latest Exams
        </h6>
        <div>
          {latestExams.length > 0 ? (
            latestExams.map(exam => (
              <div key={exam.id} className="widget-item">
                <div className="widget-content">
                  <p className="widget-title">{exam.title}</p>
                  <p className="widget-subtitle">{exam.course} • {exam.date}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted small">No recent data</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WidgetsPanel;
