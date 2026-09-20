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
      window.location.reload();
    } catch (error) {
      alert(getErrorMessage(error, 'packages.purchase_failed'));
    } finally {
      setPurchasing(null);
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
    <div className="packages-list-page" style={{ padding: 'var(--space-lg)' }}>
      <div className="d-flex justify-content-between align-items-center" style={{ marginBlockEnd: 'var(--space-lg)' }}>
        <h2 className="mb-0">{t('packages.marketplace', 'Marketplace')}</h2>
        {isAuthenticated && (
          <span className="badge bg-warning text-dark d-flex align-items-center gap-2" style={{
            padding: 'var(--space-sm) var(--space-md)',
            fontSize: '1rem'
          }}>
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
            <div key={pkg.id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body d-flex flex-column" style={{ padding: 'var(--space-lg)', gap: 'var(--space-md)' }}>
                  <h5 className="card-title fw-bold text-primary mb-0">{pkg.title}</h5>
                  <p className="card-text text-muted flex-grow-1 mb-0">{pkg.description}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    <small className="text-muted d-flex align-items-center gap-2">
                      <i className="bi bi-person"></i>
                      <span>{pkg.instructor_name || 'Instructor'}</span>
                    </small>
                    <small className="text-muted d-flex align-items-center gap-2">
                      <i className="bi bi-book"></i>
                      <span>{pkg.source_materials?.length || 0} {t('packages.materials', 'Materials')}</span>
                    </small>
                  </div>

                  <div className="d-flex justify-content-between align-items-center" style={{ marginBlockStart: 'var(--space-sm)' }}>
                    <span className="h4 mb-0 text-warning">
                      🪙 {pkg.price}
                    </span>
                    {pkg.is_purchased ? (
                      <button className="btn btn-success d-flex align-items-center gap-2" disabled>
                        <FiCheck />
                        <span>{t('packages.owned', 'Owned')}</span>
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary d-flex align-items-center gap-2"
                        onClick={() => handlePurchase(pkg)}
                        disabled={purchasing === pkg.id || !isAuthenticated}
                      >
                        <FiShoppingCart />
                        <span>{purchasing === pkg.id ? t('common.loading') : t('packages.buy', 'Buy')}</span>
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
