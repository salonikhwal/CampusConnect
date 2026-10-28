import React, { useState } from 'react';

const CATEGORIES = [
  { id: 'Questions', label: '❓ Questions', desc: 'Lab viva, assignments, or code debugging' },
  { id: 'Projects', label: '🚀 Projects', desc: 'Sphinx hackathon builds, web tools, or open source' },
  { id: 'College Life', label: '☕ College Life', desc: 'Hostel discussions, evening canteen chai, or campus tips' },
  { id: 'Opportunities', label: '💼 Opportunities', desc: 'Internship referrals, contest qualifiers, or research callouts' },
];

const CODE_LANGUAGES = [
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'go', label: 'Go' },
  { id: 'sql', label: 'SQL' },
];

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Questions');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('cpp');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [tags, setTags] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Post content cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim() || null,
          content: content.trim(),
          category,
          codeSnippet: showCodeInput && codeSnippet.trim() ? codeSnippet.trim() : null,
          codeLanguage: showCodeInput ? codeLanguage : null,
          tags: tags.trim() || null,
          isPinned,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to publish post');
      }

      onPostCreated(data.post);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
            </div>
            <div>
              <h2 className="font-heading text-headline-sm font-bold text-on-surface">
                Create Community Post
              </h2>
              <p className="font-sans text-body-sm text-on-surface-variant">
                Share a lab question, project showcase, or campus announcement.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Category Picker */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1.5">
              Category <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    category === cat.id
                      ? 'bg-primary-fixed/30 border-primary shadow-2xs ring-1 ring-primary'
                      : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                  }`}
                >
                  <p className="font-heading text-label-sm font-bold text-on-surface">
                    {cat.label}
                  </p>
                  <p className="font-sans text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">
                    {cat.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1">
              Headline / Topic
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CS204 Nachos OS: Condition::Wait() deadlock fix, Sphinx Track Ideas"
              className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-sm px-3.5 py-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1">
              Post Content <span className="text-error">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your question, project architecture, or discussion topic..."
              rows={4}
              required
              className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-sm px-3.5 py-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
            />
          </div>

          {/* Code Snippet Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <button
                type="button"
                onClick={() => setShowCodeInput(!showCodeInput)}
                className="inline-flex items-center gap-1.5 text-primary font-heading text-label-sm font-semibold hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">code</span>
                <span>{showCodeInput ? '− Remove Code Snippet' : '+ Add Code / Terminal Snippet'}</span>
              </button>

              {showCodeInput && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-outline">Language:</span>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="bg-surface-container text-on-surface font-mono text-xs px-2 py-1 rounded-lg border border-outline-variant/30"
                  >
                    {CODE_LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {showCodeInput && (
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="// Paste snippet or function implementation here..."
                rows={5}
                className="w-full bg-slate-950 text-emerald-300 font-mono text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1">
              Tags / Keywords
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. CS204, NachosOS, Synchronization, Sphinx2025"
              className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-sm px-3.5 py-2 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest text-xs"
            />
          </div>

          {/* Optional Pin toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPinnedCheck"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            <label htmlFor="isPinnedCheck" className="font-heading text-label-sm text-on-surface cursor-pointer select-none">
              Pin as important announcement (displayed in Pinned Announcements section)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-on-surface-variant font-heading text-label-md hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-heading text-label-md px-5 py-2.5 rounded-xl font-semibold shadow-xs disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>Publish Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
