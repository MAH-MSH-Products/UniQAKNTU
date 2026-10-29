import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getTimeAllocationAnalytics } from '../../../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TimeAllocationChart = ({ interval, startDate, endDate }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { interval };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await getTimeAllocationAnalytics(params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load time allocation analytics:', err);
      setError(err?.response?.data?.error || err.message || 'Error loading analytics');
    } finally {
      setLoading(false);
    }
  }, [interval, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="alert alert-danger" role="alert">
        {error || t('analytics.no_data', 'No data')}
      </div>
    );
  }

  const { bar_chart, table_data, totals } = data;

  const chartData = {
    labels: bar_chart?.labels || [],
    datasets: [
      {
        label: t('analytics.total_hours', 'مجموع ساعات'),
        data: bar_chart?.datasets || [],
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderColor: '#3b82f6',
        borderWidth: 1.5,
        borderRadius: 6,
        hoverBackgroundColor: '#2563eb',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        rtl: isRTL,
        callbacks: {
          label: (context) => {
            const val = context.parsed.y ?? context.parsed;
            return `${context.dataset.label}: ${val} ${t('analytics.hours_unit', 'ساعت')}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: t('analytics.hours_unit', 'ساعت'),
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: { family: 'IRANYekan, sans-serif' },
        },
      },
    },
  };

  const hasData = bar_chart?.labels && bar_chart.labels.length > 0;

  return (
    <div>
      {/* Chart Card */}
      <div className="chart-card mb-4">
        <div className="chart-header">
          <h6 className="fw-bold mb-0">{t('analytics.bar_chart_title', 'میزان ساعات اختصاص داده شده به دروس')}</h6>
        </div>
        {!hasData ? (
          <div className="text-center text-muted py-5">
            {t('analytics.no_data', 'اطلاعاتی در این بازه زمانی یافت نشد.')}
          </div>
        ) : (
          <div className="chart-canvas-wrapper" style={{ height: '360px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      {/* Synchronized Data Table Card */}
      <div className="chart-card">
        <div className="chart-header">
          <h6 className="fw-bold mb-0">{t('analytics.table_title', 'جدول میزان زمان اختصاص داده شده')}</h6>
        </div>
        {!table_data || table_data.length === 0 ? (
          <div className="text-center text-muted py-4">
            {t('analytics.no_data', 'اطلاعاتی در این بازه زمانی یافت نشد.')}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-allocation table-bordered align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col" className="text-center" style={{ width: '8%' }}>#</th>
                  <th scope="col">{t('analytics.course_type', 'نام درس / مجموعه')}</th>
                  <th scope="col" className="text-center" style={{ width: '25%' }}>{t('analytics.total_hours', 'مجموع ساعات')}</th>
                  <th scope="col" className="text-center" style={{ width: '25%' }}>{t('analytics.total_tests', 'تعداد تست‌ها')}</th>
                </tr>
              </thead>
              <tbody>
                {table_data.map((row, idx) => (
                  <tr key={row.course_type || idx}>
                    <td className="text-center text-muted">{idx + 1}</td>
                    <td className="fw-medium">{row.course_type}</td>
                    <td className="text-center fw-semibold text-primary">
                      {row.total_hours} {t('analytics.hours_unit', 'ساعت')}
                    </td>
                    <td className="text-center fw-semibold text-secondary">
                      {row.total_tests}
                    </td>
                  </tr>
                ))}
              </tbody>
              {totals && (
                <tfoot>
                  <tr className="table-active">
                    <td colSpan="2" className="text-end fw-bold px-3">
                      {t('analytics.total_row', 'مجموع کل')}:
                    </td>
                    <td className="text-center fw-bold text-primary">
                      {totals.total_hours} {t('analytics.hours_unit', 'ساعت')}
                    </td>
                    <td className="text-center fw-bold text-secondary">
                      {totals.total_tests}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeAllocationChart;
