import React, { useState, useEffect } from 'react';

const CATEGORIES = [
  { id: 'Questions', label: '❓ Questions' },
  { id: 'Projects', label: '🚀 Projects' },
  { id: 'College Life', label: '☕ College Life' },
  { id: 'Opportunities', label: '💼 Opportunities' },
];

export default function EditPostModal({ isOpen, onClose, post, onPostUpdated }) {
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

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setCategory(post.category || 'Questions');
      setCodeSnippet(post.codeSnippet || '');
      setCodeLanguage(post.codeLanguage || 'cpp');
      setShowCodeInput(Boolean(post.codeSnippet));
      setTags(Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || '');
      setIsPinned(Boolean(post.isPinned));
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Content cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
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
        throw new Error(data.message || 'Failed to update post');
      }

      onPostUpdated(data.post);
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
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </div>
            <div>
              <h2 className="font-heading text-headline-sm font-bold text-on-surface">
                Edit Your Post
              </h2>
              <p className="font-sans text-body-sm text-on-surface-variant">
                Only the author can edit or delete this post.
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
          {/* Category */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1">
              Category
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
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1">
              Headline
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface font-sans text-body-sm px-3.5 py-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              className="w-full bg-surface-container-low text-on-surface font-sans text-body-sm px-3.5 py-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest"
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
                <span>{showCodeInput ? '− Hide Code' : '+ Add Code Snippet'}</span>
              </button>
            </div>

            {showCodeInput && (
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                rows={5}
                className="w-full bg-slate-950 text-emerald-300 font-mono text-xs p-3 rounded-xl border border-slate-800"
              />
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface font-sans text-body-sm px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs"
            />
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
