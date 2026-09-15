import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiX } from 'react-icons/fi';
import { createPackage, getSourceMaterials, extractResults } from '../../services/api';
import { getErrorMessage } from '../../utils/errorHandler';

const PackageForm = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    source_material_ids: []
  });
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [materialsLoading, setMaterialsLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setMaterialsLoading(true);
    try {
      const response = await getSourceMaterials();
      setAvailableMaterials(extractResults(response));
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMaterialToggle = (materialId) => {
    setFormData(prev => ({
      ...prev,
      source_material_ids: prev.source_material_ids.includes(materialId)
        ? prev.source_material_ids.filter(id => id !== materialId)
        : [...prev.source_material_ids, materialId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert(t('packages.title_required', 'Package title is required'));
      return;
    }

    if (formData.source_material_ids.length === 0) {
      alert(t('packages.materials_required', 'Please select at least one source material'));
      return;
    }

    if (!formData.price || formData.price < 0) {
      alert(t('packages.price_required', 'Please enter a valid price'));
      return;
    }

    setLoading(true);
    try {
      await createPackage({
        ...formData,
        price: parseInt(formData.price)
      });
      alert(t('packages.create_success', 'Package created successfully!'));
      if (onSuccess) onSuccess();
    } catch (error) {
      alert(getErrorMessage(error, 'packages.create_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="package-form-page py-4">
      <h2 className="mb-4">{t('packages.create_package', 'Create New Package')}</h2>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-bold">{t('packages.title', 'Package Title')}</label>
              <input
                type="text"
                className="form-control"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('packages.title_placeholder', 'Enter package title')}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">{t('packages.description', 'Description')}</label>
              <textarea
                className="form-control"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder={t('packages.description_placeholder', 'Describe what this package includes')}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">{t('packages.price', 'Price (Tokens)')}</label>
              <input
                type="number"
                className="form-control"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                placeholder="100"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">{t('packages.select_materials', 'Select Source Materials')}</label>
              {materialsLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                </div>
              ) : (
                <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {availableMaterials.length === 0 ? (
                    <p className="text-muted mb-0">{t('packages.no_materials', 'No source materials available')}</p>
                  ) : (
                    availableMaterials.map(material => (
                      <div key={material.id} className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`material-${material.id}`}
                          checked={formData.source_material_ids.includes(material.id)}
                          onChange={() => handleMaterialToggle(material.id)}
                        />
                        <label className="form-check-label" htmlFor={`material-${material.id}`}>
                          {material.title}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              )}
              <small className="text-muted">
                {formData.source_material_ids.length} {t('packages.materials_selected', 'material(s) selected')}
              </small>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t('common.loading') : (
                  <>
                    <FiPlus className="me-1" />
                    {t('packages.create', 'Create Package')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PackageForm;
