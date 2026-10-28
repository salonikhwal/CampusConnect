import React, { useState, useEffect } from 'react';

const SUGGESTED_TOPICS = [
  'Nachos OS Lab',
  'Competitive Programming',
  'Distributed Systems',
  'Course Electives',
  'Open Source & GSoC',
  'Systems Projects',
  'Research & BTP',
  'DBMS Internals',
  'Tree & Graph Algorithms',
  'Campus Life & Hackathons',
];

export default function OptInGuidanceModal({
  isOpen,
  onClose,
  currentStatus,
  onUpdated,
}) {
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState('');
  const [guidanceBio, setGuidanceBio] = useState('');
  const [guidanceAvailability, setGuidanceAvailability] = useState('');
  const [loading, setLoading] = useState(false);
  const [optOutLoading, setOptOutLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && currentStatus) {
      setSelectedTopics(currentStatus.guidanceTopics || []);
      setGuidanceBio(currentStatus.guidanceBio || '');
      setGuidanceAvailability(currentStatus.guidanceAvailability || '');
      setErrorMsg('');
      setCustomTopic('');
    }
  }, [isOpen, currentStatus]);

  if (!isOpen) return null;

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleAddCustomTopic = (e) => {
    e.preventDefault();
    const trimmed = customTopic.trim();
    if (trimmed && !selectedTopics.includes(trimmed)) {
      setSelectedTopics([...selectedTopics, trimmed]);
      setCustomTopic('');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (selectedTopics.length === 0) {
      setErrorMsg('Please select at least one topic you are open to helping juniors with.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/guidance/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          guidanceTopics: selectedTopics,
          guidanceBio: guidanceBio.trim(),
          guidanceAvailability: guidanceAvailability.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to opt in for guidance');
      }

      onUpdated(data.guidanceProfile);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptOut = async () => {
    if (!window.confirm('Are you sure you want to pause your guidance provider profile? Juniors will no longer see you in active guidance listings.')) {
      return;
    }

    setOptOutLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/guidance/opt-out', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to opt out');
      }

      onUpdated({ isGuidanceProvider: false, guidanceTopics: [] });
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setOptOutLoading(false);
    }
  };

  const isAlreadyOptedIn = currentStatus?.isGuidanceProvider;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-surface-container-lowest rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-outline-variant/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">school</span>
            </div>
            <div>
              <h2 className="font-heading text-title-lg font-bold text-on-surface">
                {isAlreadyOptedIn ? 'Update Guidance Profile' : 'Opt In as Guidance Provider'}
              </h2>
              <p className="font-sans text-[12px] text-on-surface-variant">
                {currentStatus?.yearLabel || '3rd & 4th Year Senior'} • Help juniors navigate labs, CP, &amp; electives
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-outline hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3.5 bg-error-container/40 border border-error/30 rounded-2xl flex items-center gap-2 text-error text-[13px]">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-primary-container/20 border border-primary/25 rounded-2xl text-[12px] text-primary flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">
              handshake
            </span>
            <span className="leading-relaxed">
              As a 3rd or 4th-year student at MNIT Jaipur, your experience helps 1st and 2nd years avoid common pitfalls. Juniors will be able to search and reach out with a friendly <strong>Say Hi</strong> note.
            </span>
          </div>

          <form id="optin-form" onSubmit={handleSave} className="flex flex-col gap-4">
            {/* Guidance Topics */}
            <div>
              <label className="block font-heading text-label-sm font-semibold text-on-surface mb-1.5">
                Topics you're open to helping juniors with <span className="text-error">*</span>
              </label>
              <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                {SUGGESTED_TOPICS.map((topic) => {
                  const isSelected = selectedTopics.includes(topic);
                  return (
                    <button
                      type="button"
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-1.2 rounded-xl text-[12px] font-heading font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-on-primary font-bold shadow-xs'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/30'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {topic}
                    </button>
                  );
                })}
              </div>

              {/* Custom Topic Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Add custom topic (e.g. Nachos MIPS Sim)..."
                  className="flex-1 bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-1.5 text-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTopic}
                  className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-primary font-heading text-label-sm font-bold rounded-xl border border-outline-variant/30 transition-all"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Guidance Bio */}
            <div>
              <label className="block font-heading text-label-sm font-semibold text-on-surface mb-1">
                Short Guidance Philosophy / Areas of focus
              </label>
              <textarea
                rows={3}
                value={guidanceBio}
                onChange={(e) => setGuidanceBio(e.target.value)}
                placeholder="e.g. Scored 10/10 in CS204 OS lab. Happy to help juniors understand Nachos context switches, thread synchronization, or choosing 5th sem electives."
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 font-sans text-body-sm text-on-surface focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Availability & Office Hours */}
            <div>
              <label className="block font-heading text-label-sm font-semibold text-on-surface mb-1">
                Preferred Office Hours / Availability
              </label>
              <input
                type="text"
                value={guidanceAvailability}
                onChange={(e) => setGuidanceAvailability(e.target.value)}
                placeholder="e.g. Fridays 4:00 PM – 6:00 PM in CC-3 or via Discord"
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3.5 py-2 font-sans text-body-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-container bg-surface-container-low/50 flex items-center justify-between">
          {isAlreadyOptedIn ? (
            <button
              type="button"
              onClick={handleOptOut}
              disabled={optOutLoading}
              className="text-error hover:bg-error-container/20 px-3 py-1.5 rounded-xl font-heading text-[12px] font-semibold transition-all"
            >
              {optOutLoading ? 'Pausing...' : 'Pause Guidance Provider'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-on-surface-variant hover:text-on-surface font-heading text-label-md font-semibold"
            >
              Cancel
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              form="optin-form"
              disabled={loading}
              className="px-5 py-2.5 bg-primary text-on-primary hover:bg-primary/90 font-heading text-label-md font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{isAlreadyOptedIn ? 'Update Guidance Profile' : 'Opt In as Provider'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
