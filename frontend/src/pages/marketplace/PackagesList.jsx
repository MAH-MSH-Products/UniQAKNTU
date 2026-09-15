import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiShoppingCart, FiCheck } from 'react-icons/fi';
import { getPackages, purchasePackage, extractResults } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorHandler';

const PackagesList = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await getPackages();
      setPackages(extractResults(response));
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg) => {
    if (!isAuthenticated) {
      alert(t('packages.login_required', 'Please login to purchase packages'));
      return;
    }

    if (user.tokens < pkg.price) {
      alert(t('packages.insufficient_tokens', 'Insufficient tokens. You need {required} tokens but have {current} tokens.')
        .replace('{required}', pkg.price)
        .replace('{current}', user.tokens));
      return;
    }

    if (!window.confirm(t('packages.confirm_purchase', 'Purchase this package for {price} tokens?').replace('{price}', pkg.price))) {
      return;
    }

    setPurchasing(pkg.id);
    try {
      await purchasePackage(pkg.id);
      alert(t('packages.purchase_success', 'Package purchased successfully!'));
      window.location.reload(); // Refresh to update token balance
    } catch (error) {
      alert(getErrorMessage(error, 'packages.purchase_failed'));
    } finally {
      setPurchasing(null);
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
    <div className="packages-list-page py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{t('packages.marketplace', 'Marketplace')}</h2>
        {isAuthenticated && (
          <span className="badge bg-warning text-dark px-3 py-2" style={{ fontSize: '16px' }}>
            🪙 {user?.tokens || 0} {t('packages.tokens', 'Tokens')}
          </span>
        )}
      </div>

      {packages.length === 0 ? (
        <div className="alert alert-info">
          {t('packages.no_packages', 'No packages available at the moment.')}
        </div>
      ) : (
        <div className="row g-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title fw-bold text-primary">{pkg.title}</h5>
                  <p className="card-text text-muted flex-grow-1">{pkg.description}</p>

                  <div className="mb-3">
                    <small className="text-muted">
                      <i className="bi bi-person me-1"></i>
                      {pkg.instructor_name || 'Instructor'}
                    </small>
                    <div className="mt-2">
                      <small className="text-muted">
                        <i className="bi bi-book me-1"></i>
                        {pkg.source_materials?.length || 0} {t('packages.materials', 'Materials')}
                      </small>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <span className="h4 mb-0 text-warning">
                      🪙 {pkg.price}
                    </span>
                    {pkg.is_purchased ? (
                      <button className="btn btn-success" disabled>
                        <FiCheck className="me-1" /> {t('packages.owned', 'Owned')}
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => handlePurchase(pkg)}
                        disabled={purchasing === pkg.id || !isAuthenticated}
                      >
                        <FiShoppingCart className="me-1" />
                        {purchasing === pkg.id ? t('common.loading') : t('packages.buy', 'Buy')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PackagesList;
