import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlay, FiPause, FiRotateCcw, FiClock } from 'react-icons/fi';

const StopwatchWidget = () => {
  const { t } = useTranslation();
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleStart = useCallback(() => {
    if (isActive) return;
    setIsActive(true);
    intervalRef.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
  }, [isActive]);

  const handlePause = useCallback(() => {
    if (!isActive) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
  }, [isActive]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setSecondsElapsed(0);
  }, []);

  const formatTime = (totalSec) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div
      className="card border-0 shadow-sm rounded-4 h-100"
      style={{
        backdropFilter: 'blur(10px)',
        background: 'var(--bs-card-bg, rgba(255, 255, 255, 0.9))',
      }}
    >
      <div className="card-header bg-transparent border-0 pt-4 px-4 pb-2">
        <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
          <FiClock className="text-primary" />
          {t('dashboard.stopwatch', 'Study Stopwatch')}
        </h5>
        <p className="text-muted small mb-0">
          {t('planner.daily_schedule_link', 'Track your current focus session')}
        </p>
      </div>

      <div className="card-body px-4 pb-4 d-flex flex-column justify-content-center align-items-center">
        {/* Timer Display */}
        <div
          className="display-4 fw-bold font-monospace my-3 p-3 px-4 rounded-4 bg-dark text-light border border-secondary border-opacity-50 text-center w-100 shadow-inner"
          style={{ letterSpacing: '2px', maxWidth: '320px' }}
        >
          {formatTime(secondsElapsed)}
        </div>

        {/* Action Controls */}
        <div className="d-flex align-items-center gap-2 mt-2">
          {!isActive ? (
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm"
              onClick={handleStart}
            >
              <FiPlay />
              <span>{t('dashboard.start', 'Start')}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-warning text-dark d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm"
              onClick={handlePause}
            >
              <FiPause />
              <span>{t('dashboard.pause', 'Pause')}</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
            onClick={handleReset}
            disabled={secondsElapsed === 0 && !isActive}
            title={t('dashboard.reset', 'Reset')}
          >
            <FiRotateCcw />
            <span>{t('dashboard.reset', 'Reset')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StopwatchWidget;
