import React, { useState, useEffect } from 'react';
import AnswerCard from './AnswerCard';
import AnswerForm from './AnswerForm';
import { useAuth } from '../../context/AuthContext';

/**
 * QuestionExplorer Component
 * 
 * Displays a list of questions for a specific exam with their answers.
 * Instructors can submit new answers through the integrated AnswerForm.
 * Uses mock data based on API Endpoint 2.3 (Questions) and 3.1 (Answers).
 * 
 * @param {number} examId - The ID of the exam to fetch questions for
 */
const QuestionExplorer = ({ examId }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isInstructor } = useAuth();

  /**
   * Mock data matching API Endpoint 2.3 structure
   * باید چک شود - Replace with actual API call when backend is ready
   */
  const mockQuestions = [
    {
      id: 1,
      question_number: 1,
      text: 'Calculate the time complexity of the following algorithm: $$T(n) = 2T(n/2) + O(n)$$',
      answers: [
        {
          id: 101,
          author: { name: 'Dr. Smith', title: 'Professor' },
          current_body: '## Solution\n\nUsing the **Master Theorem**:\n\n$$T(n) = aT(n/b) + f(n)$$\n\nWhere:\n- $a = 2$\n- $b = 2$\n- $f(n) = O(n)$\n\nSince $n^{\\log_b a} = n^{\\log_2 2} = n^1 = n$, and $f(n) = O(n)$, we have Case 2:\n\n$$T(n) = \\Theta(n \\log n)$$',
          is_verified: true,
          image: null,
          pdf_file: '/media/answers/solution1.pdf',
        },
        {
          id: 102,
          author: { name: 'Prof. Johnson', title: 'Associate Professor' },
          current_body: '### Alternative Approach\n\nWe can also solve this using a **recursion tree**:\n\n```\nLevel 0:        cn\nLevel 1:     cn/2  cn/2\nLevel 2:   cn/4 cn/4 cn/4 cn/4\n...\n```\n\nTotal work at each level: $cn$\nNumber of levels: $\\log_2 n$\n\nTherefore: $T(n) = O(n \\log n)$',
          is_verified: false,
          image: '/media/answers/recursion_tree.png',
          pdf_file: null,
        },
      ],
    },
    {
      id: 2,
      question_number: 2,
      text: 'Prove that for any graph $G = (V, E)$, the sum of degrees equals twice the number of edges: $$\\sum_{v \\in V} \\deg(v) = 2|E|$$',
      answers: [
        {
          id: 201,
          author: { name: 'Dr. Williams', title: 'Lecturer' },
          current_body: '**Proof by Handshaking Lemma:**\n\nEach edge $e = \\{u, v\\}$ contributes exactly **2** to the total degree count:\n- 1 to $\\deg(u)$\n- 1 to $\\deg(v)$\n\nTherefore:\n$$\\sum_{v \\in V} \\deg(v) = 2|E|$$\n\nThis is known as the **Handshaking Lemma**. ∎',
          is_verified: true,
          image: null,
          pdf_file: null,
        },
      ],
    },
    {
      id: 3,
      question_number: 3,
      text: 'Find the eigenvalues of the matrix: $$A = \\begin{pmatrix} 3 & 1 \\\\ 0 & 2 \\end{pmatrix}$$',
      answers: [],
    },
  ];

  /**
   * Fetch questions from API
   * باید چک شود - Replace mock data with actual API call
   */
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);

      // باید چک شود - Uncomment when backend Endpoint 2.3 is ready:
      /*
      try {
        const response = await api.get(`/exams/${examId}/questions/`);
        setQuestions(response.data);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
      } finally {
        setLoading(false);
      }
      */

      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      setQuestions(mockQuestions);
      setLoading(false);
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
    // In production, refetch questions or optimistically update UI
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
                  Question {question.question_number}
                </h4>
                <div 
                  className="question-text mt-2"
                  style={{ fontSize: '16px', lineHeight: '1.6' }}
                  dangerouslySetInnerHTML={{ 
                    __html: question.text.replace(/\$(.*?)\$/g, '<span class="math-inline">$1</span>')
                  }}
                />
              </div>
            </div>

            {/* Answers List */}
            <div className="answers-section">
              <h5 className="mb-3">
                Answers ({question.answers?.length || 0})
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

      {/* Backend Integration Notice */}
      <div className="alert alert-warning mt-4">
        <strong>⚠️ باید چک شود:</strong> This component currently uses mock data. 
        Real API integration requires:
        <ul className="mb-0 mt-2">
          <li>Backend Endpoint 2.3: <code>GET /api/v1/exams/:id/questions/</code></li>
          <li>Backend Endpoint 3.1: <code>GET /api/v1/questions/:id/answers/</code></li>
        </ul>
      </div>
    </div>
  );
};

export default QuestionExplorer;
