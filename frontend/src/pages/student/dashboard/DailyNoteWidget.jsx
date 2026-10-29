import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiEdit3, FiSave, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { getDailyNote, saveDailyNote } from '../../../services/api';
import { getErrorMessage } from '../../../utils/errorHandler';

const DailyNoteWidget = () => {
  const { t } = useTranslation();
  const [noteText, setNoteText] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchNote = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getDailyNote();
        if (isMounted && res.data) {
          setNoteText(res.data.text || '');
          setNoteDate(res.data.date || '');
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, 'errors.default'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNote();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const res = await saveDailyNote({ text: noteText });
      if (res.data) {
        setNoteText(res.data.text || '');
        setNoteDate(res.data.date || noteDate);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'errors.default'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="card border-0 shadow-sm rounded-4 h-100"
      style={{
        backdropFilter: 'blur(10px)',
        background: 'var(--bs-card-bg, rgba(255, 255, 255, 0.9))',
      }}
    >
      <div className="card-header bg-transparent border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
        <div>
          <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <FiEdit3 className="text-primary" />
            {t('dashboard.daily_note', 'Daily Note')}
          </h5>
          <p className="text-muted small mb-0">
            {t('dashboard.daily_note_desc', 'Jot down your targets and reflections for today')}
          </p>
        </div>

        {noteDate && (
          <span className="badge bg-light text-muted border px-2 py-1 font-monospace small">
            {noteDate}
          </span>
        )}
      </div>

      <div className="card-body px-4 pb-4 d-flex flex-column">
        {error && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 mb-2 d-flex align-items-center gap-2">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="alert alert-success py-2 px-3 small rounded-3 mb-2 d-flex align-items-center gap-2">
            <FiCheck />
            <span>{t('dashboard.note_saved', 'Daily note saved successfully.')}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="d-flex flex-column flex-grow-1">
          <div className="mb-3 flex-grow-1">
            <textarea
              className="form-control rounded-3 p-3 h-100"
              style={{ minHeight: '120px', resize: 'vertical' }}
              placeholder={t('dashboard.daily_note_placeholder', 'Write your note for today...')}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              disabled={loading || saving}
            />
          </div>

          <div className="d-flex justify-content-end align-items-center gap-2">
            <button
              type="submit"
              className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-pill shadow-sm"
              disabled={loading || saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>{t('dashboard.saving', 'Saving...')}</span>
                </>
              ) : (
                <>
                  <FiSave />
                  <span>{t('dashboard.save_note', 'Save Note')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyNoteWidget;
