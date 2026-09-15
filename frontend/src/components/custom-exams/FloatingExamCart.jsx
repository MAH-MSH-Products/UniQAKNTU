import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';
import { useCustomExam } from '../../context/CustomExamContext';
import { useTranslation } from 'react-i18next';

const FloatingExamCart = () => {
  const { examCount } = useCustomExam();
  const { t } = useTranslation();

  if (examCount === 0) return null;

  return (
    <Link
      to="/custom-exams/build"
      className="floating-exam-cart"
      title={t('custom_exams.view_cart', 'View Exam Cart')}
      style={{
        position: 'fixed',
        insetBlockEnd: 'var(--space-xl)',
        insetInlineEnd: 'var(--space-xl)',
        zIndex: 1000,
        background: 'linear-gradient(135deg, var(--primary-blue), var(--primary-hover))',
        color: 'white',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        textDecoration: 'none'
      }}
    >
      <FiShoppingCart size={24} />
      <span
        className="cart-badge"
        style={{
          position: 'absolute',
          insetBlockStart: '-5px',
          insetInlineEnd: '-5px',
          backgroundColor: '#dc3545',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          border: '2px solid var(--bg-body)'
        }}
      >
        {examCount}
      </span>
    </Link>
  );
};

export default FloatingExamCart;
