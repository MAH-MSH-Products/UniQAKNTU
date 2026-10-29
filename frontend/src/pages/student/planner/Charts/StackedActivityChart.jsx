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
import { getStackedCourseActivityAnalytics } from '../../../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StackedActivityChart = ({ interval, startDate, endDate }) => {
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

      const res = await getStackedCourseActivityAnalytics(params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load stacked course activity analytics:', err);
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

  const { labels, datasets } = data;
  const hasData = labels && labels.length > 0;

  const chartData = {
    labels: labels || [],
    datasets: [
      {
        label: t('analytics.reading', 'مطالعه'),
        data: datasets?.read || [],
        backgroundColor: '#10b981',
        borderRadius: 4,
        stack: 'Stack 0',
      },
      {
        label: t('analytics.review', 'مرور'),
        data: datasets?.review || [],
        backgroundColor: '#f59e0b',
        borderRadius: 4,
        stack: 'Stack 0',
      },
      {
        label: t('analytics.test', 'تست'),
        data: datasets?.test || [],
        backgroundColor: '#ef4444',
        borderRadius: 4,
        stack: 'Stack 0',
      },
      {
        label: t('analytics.class', 'کلاس'),
        data: datasets?.class || [],
        backgroundColor: '#6366f1',
        borderRadius: 4,
        stack: 'Stack 0',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        rtl: isRTL,
        labels: {
          font: { family: 'IRANYekan, sans-serif' },
        },
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
      x: {
        stacked: true,
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: { family: 'IRANYekan, sans-serif' },
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: t('analytics.hours_unit', 'ساعت'),
        },
      },
    },
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h6 className="fw-bold mb-0">{t('analytics.stacked_chart_title', 'ترکیب فعالیت‌ها به تفکیک درس')}</h6>
      </div>

      {!hasData ? (
        <div className="text-center text-muted py-5">
          {t('analytics.no_data', 'اطلاعاتی در این بازه زمانی یافت نشد.')}
        </div>
      ) : (
        <div className="chart-canvas-wrapper" style={{ height: '400px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default StackedActivityChart;
