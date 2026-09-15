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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="my-purchases-page py-4">
      <h2 className="mb-4">
        <FiPackage className="me-2" />
        {t('packages.my_purchases', 'My Purchases')}
      </h2>

      {purchases.length === 0 ? (
        <div className="alert alert-info">
          {t('packages.no_purchases', 'You haven\'t purchased any packages yet.')}
          <br />
          <Link to="/packages" className="btn btn-primary mt-3">
            {t('packages.browse_marketplace', 'Browse Marketplace')}
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <h5 className="card-title fw-bold text-primary">{purchase.package_title || purchase.title}</h5>
                  <p className="card-text text-muted">{purchase.package_description || purchase.description}</p>

                  <div className="mb-3">
                    <small className="text-muted d-block">
                      <i className="bi bi-calendar me-1"></i>
                      {t('packages.purchased_on', 'Purchased on')}: {new Date(purchase.purchased_at).toLocaleDateString()}
                    </small>
                    <small className="text-muted d-block mt-1">
                      <i className="bi bi-book me-1"></i>
                      {purchase.source_materials?.length || 0} {t('packages.materials', 'Materials')}
                    </small>
                  </div>

                  {purchase.source_materials && purchase.source_materials.length > 0 && (
                    <div>
                      <h6 className="fw-bold mb-2">{t('packages.included_materials', 'Included Materials')}:</h6>
                      <ul className="list-unstyled">
                        {purchase.source_materials.map((material) => (
                          <li key={material.id} className="mb-2">
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
