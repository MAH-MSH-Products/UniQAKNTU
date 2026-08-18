import React from 'react';

/**
 * Home Component - Landing Page
 * 
 * Displays welcome message and overview of the platform.
 */

const Home = () => {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <h1 className="display-4 mb-4">Welcome to UniQAKNTU</h1>
          <p className="lead text-muted">
            Open Exam Wiki Platform for Knowledge Sharing and Collaborative Learning
          </p>
          <hr className="my-4" />
          <p>
            Access course materials, exam questions, and instructor-approved answers.
            Join our community of learners and educators.
          </p>
          <div className="mt-4">
            <a href="/courses" className="btn btn-primary btn-lg me-2">
              Browse Courses
            </a>
            <a href="/login" className="btn btn-outline-secondary btn-lg">
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
