import React, { useState } from 'react';

export default function CreateUpdateModal({
  isOpen,
  onClose,
  currentUser,
  onCreated,
}) {
  const isAdmin = currentUser?.role === 'admin';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Announcements');
  const [isOfficial, setIsOfficial] = useState(isAdmin);
  const [organizer, setOrganizer] = useState(isAdmin ? 'Academic Section / Dept. of CSE' : currentUser?.name || '');
  const [venue, setVenue] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineText, setDeadlineText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'preview'

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please provide a title for the update.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please provide a description.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        organizer: organizer.trim() || undefined,
        venue: venue.trim() || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        deadlineText: deadlineText.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        tags: tagsInput
          ? tagsInput.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
          : [],
        isOfficial: isAdmin ? isOfficial : false,
      };

      const res = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create update item');
      }

      onCreated(data.item);
      handleResetAndClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setTitle('');
    setDescription('');
    setCategory('Announcements');
    setIsOfficial(isAdmin);
    setOrganizer(isAdmin ? 'Academic Section / Dept. of CSE' : currentUser?.name || '');
    setVenue('');
    setDeadline('');
    setDeadlineText('');
    setLinkUrl('');
    setTagsInput('');
    setErrorMsg('');
    setActiveTab('form');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-surface-container-lowest rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-outline-variant/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
                isAdmin && isOfficial
                  ? 'bg-primary text-on-primary'
                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {isAdmin && isOfficial ? 'campaign' : 'post_add'}
              </span>
            </div>
            <div>
              <h2 className="font-heading text-title-lg font-bold text-on-surface">
                {isAdmin ? 'Create Campus Notice / Opportunity' : 'Share Student Update / Initiative'}
              </h2>
              <p className="font-sans text-[12px] text-on-surface-variant">
                {isAdmin
                  ? 'Publish official circulars, exam schedules, or student opportunities'
                  : 'Share study groups, hackathon teams, and peer initiatives'}
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-outline hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Admin/Student Banner */}
        <div
          className={`px-6 py-2.5 text-[12px] font-sans flex items-center justify-between border-b ${
            isAdmin
              ? 'bg-primary-container/20 border-primary/20 text-primary'
              : 'bg-surface-container border-outline-variant/20 text-on-surface-variant'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">
              {isAdmin ? 'admin_panel_settings' : 'info'}
            </span>
            <span>
              {isAdmin ? (
                <>
                  Posting with <strong>Administrator Privileges</strong> ({currentUser?.name})
                </>
              ) : (
                <>
                  Posting as <strong>Student Peer</strong> ({currentUser?.name} • {currentUser?.rollNumber})
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-surface-container-highest/60 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-heading font-semibold transition-all ${
                activeTab === 'form'
                  ? 'bg-surface text-primary shadow-2xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Form
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-heading font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-surface text-primary shadow-2xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-error-container/40 border border-error/30 rounded-2xl flex items-center gap-2 text-error text-[13px]">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'form' ? (
            <form id="create-update-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Official Toggle (Only admins can mark official) */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isAdmin
                    ? 'bg-surface-container-low border-primary/25'
                    : 'bg-surface-container/40 border-outline-variant/30 opacity-80'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 p-1 rounded-lg ${
                      isOfficial && isAdmin ? 'text-primary' : 'text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isAdmin ? 'verified' : 'lock'}
                    </span>
                  </div>
                  <div>
                    <label
                      htmlFor="isOfficialToggle"
                      className="font-heading text-label-md font-bold text-on-surface cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Mark as Official Institute Notice</span>
                      {isAdmin && (
                        <span className="text-[10px] bg-primary text-on-primary px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                          Admin Only
                        </span>
                      )}
                    </label>
                    <p className="font-sans text-[12px] text-on-surface-variant mt-0.5">
                      {isAdmin
                        ? 'Official circulars receive high-contrast blue/gold badges and verified crest.'
                        : 'Only department administrators can post official circulars. Your item will be listed with the student community badge.'}
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  id="isOfficialToggle"
                  disabled={!isAdmin}
                  checked={isAdmin ? isOfficial : false}
                  onChange={(e) => setIsOfficial(e.target.checked)}
                  className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block font-heading text-label-sm font-semibold text-on-surface mb-1">
                  Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    isOfficial
                      ? 'e.g., End-Term Exam Seating Plan & Lab Viva Guidelines'
                      : 'e.g., Weekend Peer Mock OA & Dynamic Programming Practice'
                  }
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3.5 py-2.5 font-sans text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Category & Organizer Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block font-heading text-label-sm font-semibold text-on-surface mb-1">
                    Category <span className="text-error">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3.5 py-2.5 font-sans text-body-md text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Announcements">Announcements</option>
                    <option value="Academic Updates">Academic Updates</option>
                    <option value="Events">Events</option>
                    <option value="Opportunities">Opportunities</option>
                  </select>
                </div>

                {/* Organizer */}
                <div>
                  <label className="block font-heading text-label-sm font-semibold text-on-surface mb-1">
                    Organizer / Department
                  </label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder={isOfficial ? 'Office of Dean Academics' : 'Name or Club Name'}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3.5 py-2.5 font-sans text-body-md text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Venue & Link Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Venue */}
                <div>
                  <label className="block font-heading text-label-sm font-semibold text-on-surface mb-1">
                    Venue / Mode
                  </label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="VLTC 302 / CC-3 / Online"
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3.5 py-2.5 font-sans text-body-md text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Link URL */}
                <div>
                  <label className="block font-heading text-label-sm font-semibold text-on-surface mb-1">
                    Application / Circular Link
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://erpmsp.mnit.ac.in or form link"
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3.5 py-2.5 font-sans text-body-md text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Deadline Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Deadline Datetime */}
                <div>
                  <label className="block font-heading text-label-sm font-semibold text-on-surface mb-1">
                    Deadline (Calendar Date)
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3.5 py-2.5 font-sans text-body-md text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Deadline Text */}
                <div>
                  <label className="block font-heading text-label-sm font-semibold text-on-surface mb-1">
                    Deadline Label / Schedule Text
                  </label>
                  <input
                    type="text"
                    value={deadlineText}
                    onChange={(e) => setDeadlineText(e.target.value)}
                    placeholder="e.g. Nov 20, 5:00 PM • Report clashes"
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3.5 py-2.5 font-sans text-body-md text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block font-heading text-label-sm font-semibold text-on-surface mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="CS204, Nachos, LabViva, BatchA"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3.5 py-2.5 font-sans text-body-md text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-heading text-label-sm font-semibold text-on-surface mb-1">
                  Description / Notice Body <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide comprehensive details, instructions, eligibility criteria, or schedule..."
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5 font-sans text-body-md text-on-surface focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </form>
          ) : (
            /* Preview Mode */
            <div className="flex flex-col gap-3 py-2">
              <span className="text-[12px] font-heading text-outline font-semibold uppercase tracking-wider">
                Live Card Preview
              </span>
              <div
                className={`rounded-2xl overflow-hidden border p-5 flex flex-col gap-3 ${
                  isAdmin && isOfficial
                    ? 'bg-surface-container-lowest border-2 border-primary/30'
                    : 'bg-surface-container-lowest border border-outline-variant/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isAdmin && isOfficial ? (
                      <span className="bg-primary/10 text-primary font-heading text-[12px] font-bold px-3 py-1 rounded-full border border-primary/25">
                        🏛️ Official Notice
                      </span>
                    ) : (
                      <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-heading text-[12px] font-semibold px-3 py-1 rounded-full border border-emerald-500/25">
                        🌱 Student Submission
                      </span>
                    )}
                    <span className="text-[11px] font-heading font-semibold px-2 py-0.5 rounded bg-surface-container">
                      {category}
                    </span>
                    {organizer && (
                      <span className="text-[12px] text-outline font-sans">
                        by {organizer}
                      </span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-outline text-[20px]">
                    bookmark
                  </span>
                </div>

                <h3 className="font-heading text-headline-sm font-bold text-on-surface">
                  {title || 'Notice Title Will Appear Here'}
                </h3>

                {(deadline || deadlineText || venue) && (
                  <div className="flex items-center gap-3 text-[12px] text-on-surface-variant flex-wrap">
                    {(deadline || deadlineText) && (
                      <span className="bg-primary-container/20 text-primary font-medium px-2 py-0.5 rounded">
                        Deadline: {deadlineText || deadline || 'Upcoming'}
                      </span>
                    )}
                    {venue && (
                      <span className="text-outline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {venue}
                      </span>
                    )}
                  </div>
                )}

                <p className="font-sans text-body-md text-on-surface-variant">
                  {description || 'Notice description and instructions will render here.'}
                </p>

                {tagsInput && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {tagsInput.split(',').map((t) => (
                      <span key={t} className="bg-surface-container text-[11px] px-2 py-0.5 rounded">
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-surface-container bg-surface-container-low/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="px-4 py-2 text-on-surface-variant hover:text-on-surface font-heading text-label-md font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="create-update-form"
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl font-heading text-label-md font-bold shadow-xs transition-all flex items-center gap-2 ${
              isAdmin && isOfficial
                ? 'bg-primary text-on-primary hover:bg-primary/90'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">
                  {isAdmin && isOfficial ? 'campaign' : 'send'}
                </span>
                <span>{isAdmin && isOfficial ? 'Publish Official Notice' : 'Post Student Update'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
