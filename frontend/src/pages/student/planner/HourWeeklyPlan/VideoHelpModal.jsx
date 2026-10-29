import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX, FiVideo } from 'react-icons/fi';

const VideoHelpModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const videoRef = useRef(null);

  // Pause video on unmount
  useEffect(() => {
    const videoEl = videoRef.current;
    return () => {
      if (videoEl) {
        videoEl.pause();
      }
    };
  }, []);

  // Pause video when modal closes
  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1055 }}
      onClick={handleClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
          <div className="modal-header bg-primary text-white d-flex align-items-center justify-content-between py-3">
            <h5 className="modal-title fs-6 fw-bold d-flex align-items-center gap-2 mb-0">
              <FiVideo size={20} />
              {t('weekly_hours.help_video_title', 'Weekly Study Hours Video Guide')}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              aria-label={t('common.close', 'Close')}
              onClick={handleClose}
            />
          </div>

          <div className="modal-body p-0 bg-dark">
            <div className="ratio ratio-16x9">
              <video
                ref={videoRef}
                controls
                playsInline
                preload="metadata"
                className="w-100 h-100"
                style={{ objectFit: 'contain' }}
              >
                <source src="/assets/videos/planner-guide.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="modal-footer bg-light py-2">
            <button
              type="button"
              className="btn btn-sm btn-secondary px-4"
              onClick={handleClose}
            >
              {t('weekly_hours.close', 'Close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoHelpModal;
