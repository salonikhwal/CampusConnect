import React, { useState } from 'react';

export default function ReportModal({ targetUser, conversationId, isOpen, onClose, onSuccess }) {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/messages/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedUserId: targetUser.id,
          reason,
          details,
          conversationId,
          alsoBlock,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit report.');

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while submitting report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-md shadow-xl border border-outline-variant/30 flex flex-col gap-space-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
      >
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[22px]">flag</span>
            <h2 id="report-title" className="font-heading text-title-md font-bold text-on-surface">
              Report {targetUser.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {submitted ? (
          <div className="py-space-md text-center flex flex-col items-center gap-space-sm">
            <div className="w-12 h-12 rounded-full bg-secondary-fixed/50 flex items-center justify-center text-secondary text-2xl">
              ✓
            </div>
            <h3 className="font-heading text-title-sm font-bold text-on-surface">
              Report Submitted
            </h3>
            <p className="font-sans text-body-sm text-on-surface-variant max-w-xs">
              Thank you for keeping MNIT CSE safe. Our moderators will review this interaction.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-space-sm px-6 py-2 rounded-xl bg-primary text-on-primary font-heading font-semibold text-label-md"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-space-sm">
            {errorMsg && (
              <div className="p-2.5 bg-error-container/20 border border-error/30 text-error rounded-xl font-sans text-body-xs">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-heading text-label-sm font-semibold text-on-surface">
                Reason for report:
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'spam', label: 'Spam, unsolicited ads, or bulk promotion' },
                  { value: 'harassment', label: 'Harassment, hostility, or repeated unwanted notes' },
                  { value: 'inappropriate', label: 'Inappropriate language or behavior' },
                  { value: 'academic_integrity', label: 'Academic integrity / plagiarism solicitation' },
                  { value: 'other', label: 'Other campus community violation' },
                ].map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low/60 hover:bg-surface-container cursor-pointer border border-outline-variant/20 text-body-sm font-sans"
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={item.value}
                      checked={reason === item.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="accent-primary"
                    />
                    <span className="text-on-surface">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-heading text-label-sm font-semibold text-on-surface">
                Additional Details (optional):
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Briefly describe what happened..."
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-sm p-2.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="w-4 h-4 rounded text-primary accent-primary"
              />
              <span className="font-sans text-body-xs text-on-surface-variant">
                Also block this user from messaging me
              </span>
            </label>

            <div className="flex items-center justify-between pt-space-xs border-t border-surface-container/60">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-on-surface-variant font-heading text-label-md hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-error hover:bg-error-container text-on-error font-heading font-semibold text-label-md transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
