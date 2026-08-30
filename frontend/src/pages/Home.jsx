import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiFileText, FiEdit3, FiChevronDown } from 'react-icons/fi';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Home Component - Landing Page
 * 
 * Completely redesigned landing page with the following sections:
 * 1. Hero Section: Large heading, sub-heading, and two CTA buttons
 * 2. Features Grid: 3-column row highlighting platform features
 * 3. CTA Banner: Full-width banner prompting users to join instructors
 * 4. FAQ Section: Bootstrap Accordion with frequently asked questions
 * 
 * All text is localized using react-i18next.
 * Uses subtle gradient backgrounds for visual emphasis.
 */

const Home = () => {
  const { t } = useTranslation();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const faqs = [
    {
      question: t('home.faq_1_question'),
      answer: t('home.faq_1_answer')
    },
    {
      question: t('home.faq_2_question'),
      answer: t('home.faq_2_answer')
    },
    {
      question: t('home.faq_3_question'),
      answer: t('home.faq_3_answer')
    },
    {
      question: t('home.faq_4_question'),
      answer: t('home.faq_4_answer')
    }
  ];

  return (
    <div className="container-fluid p-0">
      {/* Hero Section */}
      <section 
        className="py-5 mb-5"
        style={{ 
          background: 'var(--gradient-subtle)',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-4" style={{ color: 'var(--primary-color)' }}>
                {t('home.hero_title')}
              </h1>
              <p className="lead text-muted mb-4">
                {t('home.hero_subtitle')}
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <Link 
                  to="/source-materials" 
                  className="btn btn-primary btn-lg px-4"
                  style={{ 
                    background: 'var(--gradient-primary)',
                    border: 'none'
                  }}
                >
                  {t('home.browse_courses')}
                </Link>
                <Link 
                  to="/login" 
                  className="btn btn-outline-secondary btn-lg px-4"
                >
                  {t('home.sign_in')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mb-5">
        <h2 className="text-center fw-bold mb-5" style={{ color: 'var(--primary-color)' }}>
          {t('home.features_title')}
        </h2>
        <div className="row g-4">
          {/* Feature 1: MathJax Support */}
          <div className="col-md-4">
            <div className="academic-card h-100 text-center">
              <div className="mb-3" style={{ color: 'var(--secondary-color)', fontSize: '2.5rem' }}>
                <FiEdit3 />
              </div>
              <h5 className="fw-bold mb-3" style={{ color: 'var(--primary-color)' }}>
                {t('home.feature_1_title')}
              </h5>
              <p className="text-muted small">
                {t('home.feature_1_description')}
              </p>
            </div>
          </div>

          {/* Feature 2: Verified Answers */}
          <div className="col-md-4">
            <div className="academic-card h-100 text-center">
              <div className="mb-3" style={{ color: 'var(--secondary-color)', fontSize: '2.5rem' }}>
                <FiCheckCircle />
              </div>
              <h5 className="fw-bold mb-3" style={{ color: 'var(--primary-color)' }}>
                {t('home.feature_2_title')}
              </h5>
              <p className="text-muted small">
                {t('home.feature_2_description')}
              </p>
            </div>
          </div>

          {/* Feature 3: PDF Attachments */}
          <div className="col-md-4">
            <div className="academic-card h-100 text-center">
              <div className="mb-3" style={{ color: 'var(--secondary-color)', fontSize: '2.5rem' }}>
                <FiFileText />
              </div>
              <h5 className="fw-bold mb-3" style={{ color: 'var(--primary-color)' }}>
                {t('home.feature_3_title')}
              </h5>
              <p className="text-muted small">
                {t('home.feature_3_description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner Section */}
      <section 
        className="container mb-5"
        style={{ 
          background: 'var(--gradient-primary)',
          borderRadius: '8px',
          padding: '2.5rem'
        }}
      >
        <div className="row align-items-center">
          <div className="col-md-8 text-white">
            <h3 className="fw-bold mb-2">
              {t('home.cta_title')}
            </h3>
            <p className="mb-0" style={{ opacity: 0.9 }}>
              {t('home.cta_subtitle')}
            </p>
          </div>
          <div className="col-md-4 text-md-end mt-3 mt-md-0">
            <Link 
              to="/support" 
              className="btn btn-light btn-lg px-4"
              style={{ color: 'var(--primary-color)' }}
            >
              {t('home.cta_button')}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mb-5">
        <h2 className="text-center fw-bold mb-5" style={{ color: 'var(--primary-color)' }}>
          {t('home.faq_title')}
        </h2>
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="accordion" id="faqAccordion">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="accordion-item mb-3 academic-card"
                  style={{ border: 'none' }}
                >
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${openFaqIndex === index ? '' : 'collapsed'}`}
                      type="button"
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? -1 : index)}
                      style={{ 
                        backgroundColor: openFaqIndex === index ? 'var(--gradient-subtle)' : 'transparent',
                        color: 'var(--primary-color)',
                        fontWeight: '600',
                        boxShadow: 'none',
                        border: 'none'
                      }}
                    >
                      {faq.question}
                    </button>
                  </h2>
                  {openFaqIndex === index && (
                    <div className="accordion-collapse collapse show">
                      <div className="accordion-body text-muted">
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
