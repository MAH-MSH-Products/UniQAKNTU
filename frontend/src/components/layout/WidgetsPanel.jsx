import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMessageSquare, FiBookOpen, FiFileText } from 'react-icons/fi';
import api from '../../services/api';

/**
 * WidgetsPanel Component - Dynamic Side Panel
 * 
 * Displays three dynamic widget sections:
 * 1. Recent Answers - Latest instructor answers
 * 2. Popular Courses - Most accessed courses
 * 3. Latest Exams - Recently added exams
 * 
 * Fetches data from backend API endpoints (mock data for now).
 * Uses academic-card styling for consistent UI.
 * 
 * API Integration Points (باید چک شود):
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
   * Fetch all widget data on component mount
   * Currently uses mock data - API integration pending
   */
  useEffect(() => {
    fetchWidgetData();
  }, []);

  const fetchWidgetData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      // باید چک شود - API integration point for widgets
      
      // Mock data for Recent Answers (API Endpoint: GET /widgets/recent-answers/)
      // const answersResponse = await api.get('/widgets/recent-answers/');
      // setRecentAnswers(answersResponse.data);
      
      const mockAnswers = [
        { id: 1, title: 'Banker\'s Algorithm Solution', course: 'Operating Systems', author: 'Dr. Khanmirza', date: '2026-08-16' },
        { id: 2, title: 'Deadlock Prevention', course: 'Operating Systems', author: 'Prof. Rahimi', date: '2026-08-15' },
        { id: 3, title: 'Process Scheduling', course: 'Computer Architecture', author: 'Dr. Azizi', date: '2026-08-14' }
      ];
      
      // Mock data for Popular Courses (API Endpoint: GET /widgets/popular-courses/)
      // const coursesResponse = await api.get('/widgets/popular-courses/');
      // setPopularCourses(coursesResponse.data);
      
      const mockCourses = [
        { id: 1, name: 'Operating Systems', code: 'CE414', examCount: 12 },
        { id: 2, name: 'Computer Networks', code: 'CE420', examCount: 10 },
        { id: 3, name: 'Database Systems', code: 'CE305', examCount: 8 }
      ];
      
      // Mock data for Latest Exams (API Endpoint: GET /widgets/latest-exams/)
      // const examsResponse = await api.get('/widgets/latest-exams/');
      // setLatestExams(examsResponse.data);
      
      const mockExams = [
        { id: 1, title: 'Final Exam 1402', course: 'Operating Systems', date: '2026-08-16' },
        { id: 2, title: 'Midterm 1402', course: 'Computer Networks', date: '2026-08-15' },
        { id: 3, title: 'Final Exam 1401', course: 'Database Systems', date: '2026-08-14' }
      ];
      
      setRecentAnswers(mockAnswers);
      setPopularCourses(mockCourses);
      setLatestExams(mockExams);
    } catch (error) {
      console.error('Error fetching widget data:', error);
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
          {recentAnswers.map(answer => (
            <div key={answer.id} className="widget-item">
              <div className="widget-content">
                <p className="widget-title">{answer.title}</p>
                <p className="widget-subtitle">{answer.course} • {answer.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Courses Widget */}
      <div className="academic-card widget-panel mb-3">
        <h6 className="section-title">
          <FiBookOpen className="widget-icon" />
          Popular Courses
        </h6>
        <div>
          {popularCourses.map(course => (
            <div key={course.id} className="widget-item">
              <div className="widget-content">
                <p className="widget-title">{course.name}</p>
                <p className="widget-subtitle">{course.code} • {course.examCount} exams</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Exams Widget */}
      <div className="academic-card widget-panel mb-3">
        <h6 className="section-title">
          <FiFileText className="widget-icon" />
          Latest Exams
        </h6>
        <div>
          {latestExams.map(exam => (
            <div key={exam.id} className="widget-item">
              <div className="widget-content">
                <p className="widget-title">{exam.title}</p>
                <p className="widget-subtitle">{exam.course} • {exam.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WidgetsPanel;
