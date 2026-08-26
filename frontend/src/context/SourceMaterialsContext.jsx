import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSourceMaterials } from '../services/api';

/**
 * SourceMaterialsContext - Global store for source materials
 * 
 * Caches source-materials list to populate dropdowns in QuestionForm
 * and other components that need to reference courses/textbooks.
 * 
 * This context implements the caching requirement from Phase 4:
 * "Cache `source-materials` list in a global store or context to populate dropdowns in `QuestionForm`."
 */

const SourceMaterialsContext = createContext();

/**
 * Custom hook to access source materials context
 * @returns {Object} Context value with materials, loading, error, and refresh function
 */
export const useSourceMaterials = () => {
  const context = useContext(SourceMaterialsContext);
  if (!context) {
    throw new Error('useSourceMaterials must be used within a SourceMaterialsProvider');
  }
  return context;
};

/**
 * Provider component for source materials context
 * @param {ReactNode} children - Child components
 */
export const SourceMaterialsProvider = ({ children }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch all source materials from API
   * Uses flat endpoint: GET /api/source-materials/
   */
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSourceMaterials();
      // Use extractResults utility for standardized parsing
      const results = response.data?.results || response.data || [];
      setMaterials(results);
    } catch (err) {
      console.error('Failed to fetch source materials:', err);
      setError(err.message || 'Failed to load source materials');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchMaterials();
  }, []);

  /**
   * Refresh materials manually (e.g., after creating new material)
   */
  const refreshMaterials = async () => {
    await fetchMaterials();
  };

  /**
   * Get single material by ID from cached list
   * @param {number} id - Material ID
   * @returns {Object|undefined} - Found material or undefined
   */
  const getMaterialById = (id) => {
    return materials.find(m => m.id === parseInt(id));
  };

  const value = {
    materials,
    loading,
    error,
    refreshMaterials,
    getMaterialById
  };

  return (
    <SourceMaterialsContext.Provider value={value}>
      {children}
    </SourceMaterialsContext.Provider>
  );
};

export default SourceMaterialsContext;
