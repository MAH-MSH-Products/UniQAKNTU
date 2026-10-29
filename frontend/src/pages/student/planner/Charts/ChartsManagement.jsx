import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiBarChart2,
  FiTrendingUp,
  FiPieChart,
  FiLayers,
} from 'react-icons/fi';
import DateRangeFilter from './DateRangeFilter';
import TotalActivityChart from './TotalActivityChart';
import CourseAverageChart from './CourseAverageChart';
import TimeAllocationChart from './TimeAllocationChart';
import StackedActivityChart from './StackedActivityChart';
import './Charts.css';

const TABS = [
  { id: 'total-activity', labelKey: 'analytics.tab_total_activity', defaultLabel: 'فعالیت کل', icon: FiTrendingUp },
  { id: 'course-averages', labelKey: 'analytics.tab_course_averages', defaultLabel: 'میانگین دروس', icon: FiBarChart2 },
  { id: 'time-allocation', labelKey: 'analytics.tab_time_allocation', defaultLabel: 'تخصیص زمان دروس', icon: FiPieChart },
  { id: 'stacked-activity', labelKey: 'analytics.tab_stacked_activity', defaultLabel: 'ترکیب فعالیت دروس', icon: FiLayers },
];

const ChartsManagement = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';

  const [activeTab, setActiveTab] = useState('total-activity');
  const [activeInterval, setActiveInterval] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSelectInterval = (interval) => {
    setActiveInterval(interval);
    setStartDate('');
    setEndDate('');
  };

  const handleApplyCustomDates = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleResetDates = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="container-fluid charts-container" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <FiBarChart2 className="text-primary" />
            {t('analytics.title', 'نمودارهای تحلیلی و آماری')}
          </h4>
          <p className="text-muted small mb-0">
            {t('analytics.subtitle', 'تحلیل روند مطالعه، میانگین نمرات و توزیع زمان دروس با نمودارهای هوشمند')}
          </p>
        </div>
      </div>

      {/* Date Range & Interval Filter */}
      <DateRangeFilter
        activeInterval={activeInterval}
        onSelectInterval={handleSelectInterval}
        startDate={startDate}
        endDate={endDate}
        onApplyCustomDates={handleApplyCustomDates}
        onResetDates={handleResetDates}
      />

      {/* Tab Navigation */}
      <ul className="nav nav-pills mb-4 border-bottom pb-2 gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <li className="nav-item" key={tab.id}>
              <button
                type="button"
                className={`nav-link d-flex align-items-center gap-2 rounded-pill px-3 py-2 ${
                  isActive ? 'active shadow-sm' : 'text-secondary bg-light'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{t(tab.labelKey, tab.defaultLabel)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'total-activity' && (
          <TotalActivityChart
            interval={activeInterval}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {activeTab === 'course-averages' && (
          <CourseAverageChart
            interval={activeInterval}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {activeTab === 'time-allocation' && (
          <TimeAllocationChart
            interval={activeInterval}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {activeTab === 'stacked-activity' && (
          <StackedActivityChart
            interval={activeInterval}
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </div>
    </div>
  );
};

export default ChartsManagement;
