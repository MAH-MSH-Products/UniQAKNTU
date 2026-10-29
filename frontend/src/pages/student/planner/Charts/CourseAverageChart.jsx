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
import { getCourseAveragesAnalytics } from '../../../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const METRIC_OPTIONS = [
  { key: 'percent', labelKey: 'analytics.metrics.percent', defaultLabel: 'درصد پاسخگویی (%)' },
  { key: 'time_per_test', labelKey: 'analytics.metrics.time_per_test', defaultLabel: 'زمان به ازای هر تست (دقیقه)' },
  { key: 'time_per_read_page', labelKey: 'analytics.metrics.time_per_read_page', defaultLabel: 'زمان مطالعه هر صفحه (دقیقه)' },
  { key: 'time_per_review_page', labelKey: 'analytics.metrics.time_per_review_page', defaultLabel: 'زمان مرور هر صفحه (دقیقه)' },
];

const CourseAverageChart = ({ interval, startDate, endDate }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';

  const [metricType, setMetricType] = useState('percent');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        interval,
        metric_type: metricType,
      };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await getCourseAveragesAnalytics(params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load course averages analytics:', err);
      setError(err?.response?.data?.error || err.message || 'Error loading analytics');
    } finally {
      setLoading(false);
    }
  }, [interval, metricType, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeMetricObj = METRIC_OPTIONS.find((m) => m.key === metricType) || METRIC_OPTIONS[0];

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: t(activeMetricObj.labelKey, activeMetricObj.defaultLabel),
        data: data?.datasets || [],
        backgroundColor: 'rgba(10, 149, 255, 0.75)',
        borderColor: '#0a95ff',
        borderWidth: 1.5,
        borderRadius: 6,
        hoverBackgroundColor: '#0a95ff',
      },
    ],
  };

  const unitSuffix = data?.unit === 'percent' ? '%' : ` ${t('analytics.minutes_unit', 'دقیقه')}`;

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
            return `${context.dataset.label}: ${val}${unitSuffix}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: metricType === 'percent' ? 100 : undefined,
        title: {
          display: true,
          text: data?.unit === 'percent' ? '%' : t('analytics.minutes_unit', 'دقیقه'),
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

  return (
    <div className="chart-card">
      <div className="chart-header flex-wrap gap-2">
        <h6 className="fw-bold mb-0">{t('analytics.tab_course_averages', 'میانگین شاخص‌های دروس')}</h6>
        {/* Metric Selector Pills */}
        <div className="d-flex flex-wrap gap-2">
          {METRIC_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`metric-pill ${metricType === opt.key ? 'active' : ''}`}
              onClick={() => setMetricType(opt.key)}
            >
              {t(opt.labelKey, opt.defaultLabel)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : !data || !data.labels || data.labels.length === 0 ? (
        <div className="text-center text-muted py-5">
          {t('analytics.no_data', 'اطلاعاتی در این بازه زمانی یافت نشد.')}
        </div>
      ) : (
        <div className="chart-canvas-wrapper" style={{ height: '380px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default CourseAverageChart;
