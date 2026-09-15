import React, { createContext, useState, useContext, useEffect } from 'react';

const CustomExamContext = createContext(null);

export const CustomExamProvider = ({ children }) => {
  const [examCart, setExamCart] = useState(() => {
    const saved = localStorage.getItem('examCart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('examCart', JSON.stringify(examCart));
  }, [examCart]);

  const addToExam = (question) => {
    setExamCart(prev => {
      if (prev.find(q => q.id === question.id)) {
        return prev;
      }
      return [...prev, question];
    });
  };

  const removeFromExam = (questionId) => {
    setExamCart(prev => prev.filter(q => q.id !== questionId));
  };

  const isInExam = (questionId) => {
    return examCart.some(q => q.id === questionId);
  };

  const clearExam = () => {
    setExamCart([]);
  };

  const reorderQuestions = (newOrder) => {
    setExamCart(newOrder);
  };

  return (
    <CustomExamContext.Provider value={{
      examCart,
      addToExam,
      removeFromExam,
      isInExam,
      clearExam,
      reorderQuestions,
      examCount: examCart.length
    }}>
      {children}
    </CustomExamContext.Provider>
  );
};

export const useCustomExam = () => {
  const context = useContext(CustomExamContext);
  if (!context) {
    throw new Error('useCustomExam must be used within a CustomExamProvider');
  }
  return context;
};
