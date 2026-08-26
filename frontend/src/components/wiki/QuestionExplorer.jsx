import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AnswerCard from './AnswerCard';
import AnswerForm from './AnswerForm';
import { useAuth } from '../../context/AuthContext';

/**
 * QuestionExplorer Component
 * 
 * Displays a list of questions for a specific exam with their answers.
 * Instructors can submit new answers through the integrated AnswerForm.
 * Uses API Endpoint 2.3 (Questions) and 3.1 (Answers).
 * 
 * @param {number} examId - The ID of the exam to fetch questions for
 */
const QuestionExplorer = ({ examId }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isInstructor } = useAuth();

  /**
   * Fetch questions from API
   * Implements pagination adapter pattern from api.js
   * Filters by source_material (exam) and status=APPROVED for public visibility
   */
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);

      try {
        // Fetch questions filtered by source_material (exam) and status=APPROVED
        const response = await api.get(`/questions/?source_material=${examId}&status=APPROVED`);
        
        // Use extractResults utility for standardized parsing
        const results = api.extractResults ? api.extractResults(response) : (response.data?.results || []);
        setQuestions(results);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
        // Fallback to empty array on error
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchQuestions();
    }
  }, [examId]);

  /**
   * Handle successful answer submission
   * Refreshes the question list to show new answer
   */
  const handleAnswerSubmit = (result) => {
    console.log('Answer submitted:', result);
    // Refetch questions to show updated answers
    if (examId) {
      setLoading(true);
      api.get(`/questions/?source_material=${examId}&status=APPROVED`)
        .then(response => {
          const results = api.extractResults ? api.extractResults(response) : (response.data?.results || []);
          setQuestions(results);
        })
        .catch(error => console.error('Failed to refetch questions:', error))
        .finally(() => setLoading(false));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="question-explorer">
      <h2 className="mb-4">Exam Questions</h2>

      {questions.length === 0 ? (
        <div className="alert alert-info">
          No questions available for this exam yet.
        </div>
      ) : (
        questions.map((question) => (
          <div key={question.id} className="question-item mb-5">
            {/* Question Header */}
            <div className="card mb-3 bg-light">
              <div className="card-body">
                <h4 className="text-primary">
                  Question {question.question_number || question.id}
                </h4>
                <div 
                  className="question-text mt-2"
                  style={{ fontSize: '16px', lineHeight: '1.6' }}
                  dangerouslySetInnerHTML={{ 
                    __html: question.text?.replace(/\$(.*?)\$/g, '<span class="math-inline">$1</span>') || question.body || ''
                  }}
                />
                {/* Status Badge */}
                {question.status && (
                  <span className={`badge ms-2 ${question.status === 'APPROVED' ? 'bg-success' : 'bg-warning'}`}>
                    {question.status === 'APPROVED' ? 'Approved' : 'Pending Review'}
                  </span>
                )}
                {/* Timestamp using Jalali date */}
                {question.created_at_jalali && (
                  <small className="text-muted d-block mt-2">
                    Asked: {question.created_at_jalali}
                  </small>
                )}
              </div>
            </div>

            {/* Answers List */}
            <div className="answers-section">
              <h5 className="mb-3">
                Answers ({question.answers_count || 0})
              </h5>
              
              {question.answers && question.answers.length > 0 ? (
                question.answers.map((answer) => (
                  <AnswerCard key={answer.id} answer={answer} />
                ))
              ) : (
                <div className="alert alert-warning">
                  No answers submitted yet. Be the first to contribute!
                </div>
              )}
            </div>

            {/* Instructor Answer Form */}
            {isInstructor && (
              <AnswerForm 
                questionId={question.id} 
                onSubmit={handleAnswerSubmit} 
              />
            )}

            <hr className="my-4" />
          </div>
        ))
      )}
    </div>
  );
};

export default QuestionExplorer;
