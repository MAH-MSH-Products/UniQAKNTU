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
    >
      <FiShoppingCart size={24} />
      <span className="cart-badge">{examCount}</span>
    </Link>
  );
};

export default FloatingExamCart;
