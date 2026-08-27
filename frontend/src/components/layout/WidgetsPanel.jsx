import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMessageSquare, FiBookOpen, FiFileText } from 'react-icons/fi';

/**
 * WidgetsPanel Component - Dynamic Side Panel
 * 
 * Phase 6 Update:
 * - Backend endpoints /widgets/recent-answers/, /widgets/popular-courses/, /widgets/latest-exams/ do not exist
 * - All API calls replaced with mock data
 * - Implements conditional rendering based on REACT_APP_ENABLE_MOCK_WIDGETS environment flag
 * - Component serves as placeholder until backend support is added
 * 
 * Original Purpose:
 * Displays three dynamic widget sections:
 * 1. Recent Answers - Latest instructor answers
 * 2. Popular Courses - Most accessed courses
 * 3. Latest Exams - Recently added exams
 */

const WidgetsPanel = () => {
  const { t } = useTranslation();
  
  const [recentAnswers, setRecentAnswers] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [latestExams, setLatestExams] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch widget data on component mount
   * Phase 6 Update: Uses mock data only - backend endpoints do not exist
   */
  useEffect(() => {
    fetchWidgetData();
  }, []);

  const fetchWidgetData = async () => {
    setLoading(true);
    try {
      // Phase 6: Mock data only - backend endpoints do not exist
      // Original API Endpoints (not implemented):
      // - GET /widgets/recent-answers/
      // - GET /widgets/popular-courses/
      // - GET /widgets/latest-exams/
      
      const mockAnswers = [
        { id: 1, title: 'Banker\'s Algorithm Solution', course: 'Operating Systems', author: 'Dr. Khanmirza', date: '2026-08-16' },
        { id: 2, title: 'Deadlock Prevention', course: 'Operating Systems', author: 'Prof. Rahimi', date: '2026-08-15' },
        { id: 3, title: 'Process Scheduling', course: 'Computer Architecture', author: 'Dr. Azizi', date: '2026-08-14' }
      ];
      
      const mockCourses = [
        { id: 1, name: 'Operating Systems', code: 'CE414', examCount: 12 },
        { id: 2, name: 'Computer Networks', code: 'CE420', examCount: 10 },
        { id: 3, name: 'Database Systems', code: 'CE305', examCount: 8 }
      ];
      
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

  // Phase 6.2: UI Fallbacks - Conditional rendering based on environment flag
  // When mock widgets are disabled, show empty state instead
  if (import.meta.env.VITE_ENABLE_MOCK_WIDGETS === 'false') {
    return <EmptyState />;
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

/**
 * EmptyState Component - Fallback when mock widgets are disabled
 * Phase 6.2: UI Fallbacks
 */
const EmptyState = () => {
  return (
    <div className="widgets-panel" style={{ width: '300px', flexShrink: 0 }}>
      <div className="academic-card widget-panel mb-3">
        <div className="text-center py-4">
          <FiMessageSquare className="widget-icon mb-2" />
          <p className="text-muted">Widgets are currently unavailable.</p>
          <small className="text-muted">Backend integration pending.</small>
        </div>
      </div>
    </div>
  );
};

export default WidgetsPanel;
