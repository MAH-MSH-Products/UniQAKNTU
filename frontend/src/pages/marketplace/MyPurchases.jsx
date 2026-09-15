import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiPackage, FiBook } from 'react-icons/fi';
import { getMyPurchases, extractResults } from '../../services/api';

const MyPurchases = () => {
  const { t } = useTranslation();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await getMyPurchases();
      setPurchases(extractResults(response));
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status"></div>
        <p className="ms-3 mb-0">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="my-purchases-page" style={{ padding: 'var(--space-lg)' }}>
      <div className="d-flex align-items-center" style={{ marginBlockEnd: 'var(--space-lg)', gap: 'var(--space-sm)' }}>
        <FiPackage size={28} />
        <h2 className="mb-0">{t('packages.my_purchases', 'My Purchases')}</h2>
      </div>

      {purchases.length === 0 ? (
        <div className="alert alert-info d-flex flex-column align-items-start" style={{ gap: 'var(--space-md)' }}>
          <p className="mb-0">{t('packages.no_purchases', 'You haven\'t purchased any packages yet.')}</p>
          <Link to="/packages" className="btn btn-primary">
            {t('packages.browse_marketplace', 'Browse Marketplace')}
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body d-flex flex-column" style={{ padding: 'var(--space-lg)', gap: 'var(--space-md)' }}>
                  <h5 className="card-title fw-bold text-primary mb-0">{purchase.package_title || purchase.title}</h5>
                  <p className="card-text text-muted mb-0">{purchase.package_description || purchase.description}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    <small className="text-muted d-flex align-items-center gap-2">
                      <i className="bi bi-calendar"></i>
                      <span>{t('packages.purchased_on', 'Purchased on')}: {new Date(purchase.purchased_at).toLocaleDateString()}</span>
                    </small>
                    <small className="text-muted d-flex align-items-center gap-2">
                      <i className="bi bi-book"></i>
                      <span>{purchase.source_materials?.length || 0} {t('packages.materials', 'Materials')}</span>
                    </small>
                  </div>

                  {purchase.source_materials && purchase.source_materials.length > 0 && (
                    <div>
                      <h6 className="fw-bold" style={{ marginBlockEnd: 'var(--space-sm)' }}>
                        {t('packages.included_materials', 'Included Materials')}:
                      </h6>
                      <ul className="list-unstyled d-flex flex-column" style={{ gap: 'var(--space-sm)' }}>
                        {purchase.source_materials.map((material) => (
                          <li key={material.id}>
                            <Link
                              to={`/source-materials/${material.id}/questions`}
                              className="text-decoration-none d-flex align-items-center gap-2"
                            >
                              <FiBook size={16} />
                              <span>{material.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPurchases;
