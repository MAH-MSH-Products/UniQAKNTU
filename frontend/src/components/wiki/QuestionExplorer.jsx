import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { getAnswersByQuestionId, getSourceMaterials, extractResults } from '../../services/api';
import AnswerCard from './AnswerCard';
import AnswerForm from './AnswerForm';
import CommentSection from './CommentSection';
import { useAuth } from '../../context/AuthContext';
import { useSourceMaterials } from '../../context/SourceMaterialsContext';

/**
 * QuestionExplorer Component
 * 
 * Displays a list of questions for a specific source material with their answers.
 * Instructors can submit new answers through the integrated AnswerForm.
 * 
 * Phase 4 Updates:
 * - Replaced nested route /wiki/questions/{id}/answers/ with flat endpoint
 * - Uses GET /api/answers/?question={questionId} instead of /wiki/questions/{id}/answers/
 * - Integrated SourceMaterialsContext for caching
 * 
 * Phase 7 Updates:
 * - Added voting functionality for questions (upvote/downvote)
 * - Added comments section for questions
 * 
 * Phase 10 Updates:
 * - Changed route from /questions/:questionId/answers to /source-materials/:examId/questions
 * - Now uses examId from URL parameters via useParams hook
 * - Supports both prop-based and URL-based examId
 * 
 * @param {number} examId - The ID of the exam/source material to fetch questions for (optional, can come from URL)
 */
const QuestionExplorer = ({ examId: propExamId }) => {
  const { examId: paramExamId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isInstructor, isAuthenticated } = useAuth();
  const { materials } = useSourceMaterials();
  
  // Use examId from props or URL parameters
  const currentExamId = propExamId || paramExamId;
  
  // Voting state for questions - Phase 7.1
  const [votingQuestionId, setVotingQuestionId] = useState(null);
  const [voteError, setVoteError] = useState(null);

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
        const response = await api.get(`/questions/?source_material=${currentExamId}&status=APPROVED`);
        
        // Use extractResults utility for standardized parsing
        const results = extractResults(response);
        setQuestions(results);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
        // Fallback to empty array on error
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentExamId) {
      fetchQuestions();
    }
  }, [currentExamId]);

  /**
   * Handle successful answer submission
   * Refreshes the question list to show new answer
   */
  const handleAnswerSubmit = (result) => {
    // Refetch questions to show updated answers
    if (currentExamId) {
      setLoading(true);
      api.get(`/questions/?source_material=${currentExamId}&status=APPROVED`)
        .then(response => {
          const results = extractResults(response);
          setQuestions(results);
        })
        .catch(error => console.error('Failed to refetch questions:', error))
        .finally(() => setLoading(false));
    }
  };

  /**
   * Handle voting on a question - Phase 7.1
   * Uses POST /api/questions/{id}/vote/
   * Payload: { "value": 1 } for upvote, { "value": -1 } for downvote
   */
  const handleQuestionVote = async (questionId, value) => {
    if (!isAuthenticated) {
      alert('Please login to vote');
      return;
    }

    setVotingQuestionId(questionId);
    setVoteError(null);

    try {
      const response = await api.post(`/questions/${questionId}/vote/`, { value });
      
      // Update local state with the returned vote info
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { ...q, user_vote: response.data.user_vote || value }
          : q
      ));
    } catch (err) {
      console.error('Failed to vote:', err);
      setVoteError(
        err.response?.data?.message ||
        'Failed to vote. Please try again.'
      );
    } finally {
      setVotingQuestionId(null);
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

      {!currentExamId ? (
        <div className="alert alert-warning">
          No exam ID provided. Please navigate from a source material.
        </div>
      ) : questions.length === 0 ? (
        <div className="alert alert-info">
          No questions available for this exam yet.
        </div>
      ) : (
        questions.map((question) => (
          <div key={question.id} className="question-item mb-5">
            {/* Question Header */}
            <div className="card mb-3 bg-light">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h4 className="text-primary mb-0" style={{ fontSize: '18px' }}>
                    Question {question.question_number || question.id}
                  </h4>
                  
                  {/* Voting Buttons - Phase 7.1 */}
                  <div className="btn-group btn-group-sm" role="group">
                    <button 
                      className={`btn ${question.user_vote === 1 ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => handleQuestionVote(question.id, 1)}
                      disabled={votingQuestionId === question.id || !isAuthenticated}
                      title={isAuthenticated ? 'Upvote' : 'Login to vote'}
                    >
                      <i className={`bi bi-arrow-up${question.user_vote === 1 ? '-fill' : ''}`}></i>
                    </button>
                    <button 
                      className={`btn ${question.user_vote === -1 ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => handleQuestionVote(question.id, -1)}
                      disabled={votingQuestionId === question.id || !isAuthenticated}
                      title={isAuthenticated ? 'Downvote' : 'Login to vote'}
                    >
                      <i className={`bi bi-arrow-down${question.user_vote === -1 ? '-fill' : ''}`}></i>
                    </button>
                  </div>
                </div>
                
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
                  <AnswerCard 
                    key={answer.id} 
                    answer={answer}
                    question={question}
                    onAcceptSuccess={(data) => {
                      // Answer accepted successfully
                      // Optionally refresh the question data here
                    }}
                  />
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

            {/* Comments Section for Question - Phase 7.2 */}
            <CommentSection targetType="questions" targetId={question.id} />

            <hr className="my-4" />
          </div>
        ))
      )}

      {/* Vote Error Message */}
      {voteError && (
        <div className="alert alert-danger mt-3">
          <small>{voteError}</small>
        </div>
      )}

      {/* Phase 4 Verification Notice */}
      <div className="alert alert-info mt-4">
        <strong>ℹ️ Phase 4 Update:</strong> This component now uses the flat endpoint structure.
        Answers are fetched via <code>GET /api/answers/?question={'{questionId}'}</code> instead of nested paths.
        Source materials are cached in <code>SourceMaterialsContext</code> for dropdown population.
      </div>
    </div>
  );
};

export default QuestionExplorer;
