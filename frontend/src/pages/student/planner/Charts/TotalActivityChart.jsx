import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { getTotalActivityAnalytics } from '../../../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const formatHoursAndMins = (minutes, t) => {
  if (!minutes || minutes === 0) return '0';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours} ${t('analytics.hours_unit', 'ساعت')} ${mins} ${t('analytics.minutes_unit', 'دقیقه')}`;
  }
  if (hours > 0) {
    return `${hours} ${t('analytics.hours_unit', 'ساعت')}`;
  }
  return `${mins} ${t('analytics.minutes_unit', 'دقیقه')}`;
};

const TotalActivityChart = ({ interval, startDate, endDate }) => {
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
      const res = await getTotalActivityAnalytics(params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load total activity analytics:', err);
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

  const { summary, line_chart, pie_chart } = data;

  // Prepare line chart datasets
  const lineChartData = {
    labels: line_chart.labels,
    datasets: [
      {
        label: t('analytics.total', 'کل'),
        data: line_chart.datasets.total || [],
        borderColor: '#0a95ff',
        backgroundColor: 'rgba(10, 149, 255, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: t('analytics.reading', 'مطالعه'),
        data: line_chart.datasets.read || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        tension: 0.3,
      },
      {
        label: t('analytics.review', 'مرور'),
        data: line_chart.datasets.review || [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        tension: 0.3,
      },
      {
        label: t('analytics.test', 'تست'),
        data: line_chart.datasets.test || [],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        tension: 0.3,
      },
    ],
  };

  const lineChartOptions = {
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
          label: (context) => `${context.dataset.label}: ${context.parsed.y} ${t('analytics.hours_unit', 'ساعت')}`,
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
    },
  };

  // Prepare Doughnut distribution data
  const pieChartData = {
    labels: [
      t('analytics.reading', 'مطالعه'),
      t('analytics.review', 'مرور'),
      t('analytics.test', 'تست'),
      t('analytics.class', 'کلاس'),
    ],
    datasets: [
      {
        data: [
          pie_chart.read || 0,
          pie_chart.review || 0,
          pie_chart.test || 0,
          pie_chart.class || 0,
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6366f1'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        rtl: isRTL,
        labels: {
          font: { family: 'IRANYekan, sans-serif' },
        },
      },
      tooltip: {
        rtl: isRTL,
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed} ${t('analytics.hours_unit', 'ساعت')}`,
        },
      },
    },
  };

  return (
    <div>
      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="chart-kpi-card">
            <div className="chart-kpi-val text-success">
              {formatHoursAndMins(summary.total_read_minutes, t)}
            </div>
            <div className="chart-kpi-lbl">{t('analytics.total_read_time', 'مجموع مطالعه')}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="chart-kpi-card">
            <div className="chart-kpi-val text-warning">
              {formatHoursAndMins(summary.total_review_minutes, t)}
            </div>
            <div className="chart-kpi-lbl">{t('analytics.total_review_time', 'مجموع مرور')}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="chart-kpi-card">
            <div className="chart-kpi-val text-danger">
              {formatHoursAndMins(summary.total_test_minutes, t)}
            </div>
            <div className="chart-kpi-lbl">{t('analytics.total_test_time', 'مجموع تست')}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="chart-kpi-card">
            <div className="chart-kpi-val text-primary">
              {formatHoursAndMins(summary.total_overall_minutes, t)}
            </div>
            <div className="chart-kpi-lbl">{t('analytics.total_overall_time', 'مجموع کل زمان')}</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4">
        {/* Time Series Line Chart */}
        <div className="col-12 col-lg-8">
          <div className="chart-card h-100">
            <div className="chart-header">
              <h6 className="fw-bold mb-0">{t('analytics.line_chart_title', 'روند مطالعه در طول زمان')}</h6>
            </div>
            <div className="chart-canvas-wrapper" style={{ height: '340px' }}>
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>
        </div>

        {/* Activity Distribution Doughnut */}
        <div className="col-12 col-lg-4">
          <div className="chart-card h-100">
            <div className="chart-header">
              <h6 className="fw-bold mb-0">{t('analytics.activity_distribution', 'توزیع فعالیت‌ها')}</h6>
            </div>
            <div className="chart-canvas-wrapper" style={{ height: '340px' }}>
              <Doughnut data={pieChartData} options={pieChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalActivityChart;
