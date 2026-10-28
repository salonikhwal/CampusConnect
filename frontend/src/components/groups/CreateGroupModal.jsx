import React, { useState } from 'react';

const AVATAR_PRESETS = [
  {
    label: 'Sphinx Cyber Matrix',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Terminal & Code',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Prabha Bhawan Campus',
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Hostel Night Drill',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&auto=format&fit=crop&q=80',
  },
];

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('hackathon');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0].url);
  const [customAvatar, setCustomAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a group name.');
      return;
    }
    if (name.trim().length < 3) {
      setError('Group name must be at least 3 characters long.');
      return;
    }

    try {
      setLoading(true);
      const finalAvatar = customAvatar.trim() || avatarUrl;

      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          avatarUrl: finalAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create group');
      }

      onGroupCreated(data.group);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">group_add</span>
            </div>
            <div>
              <h2 className="font-heading text-headline-sm font-bold text-on-surface">
                Create New Campus Group
              </h2>
              <p className="font-sans text-body-sm text-on-surface-variant">
                Form a lab study circle, Sphinx hackathon squad, or hostel team.
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
          {/* Group Name */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1">
              Group Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sphinx Hackathon 2025 Core, CS204 OS Lab CC-03"
              className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-md px-3.5 py-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'hackathon', label: '🚀 Sphinx Hackathon & Build', desc: 'Fest projects & coding sprints' },
                { id: 'academic', label: '📚 Academic & Labs', desc: 'Course viva & assignment prep' },
                { id: 'hostel', label: '🏢 Hostel & Social', desc: 'Hostel 4, Gargi & campus circles' },
                { id: 'hobby', label: '⚡ Hobby & Tech Circles', desc: 'Open source, robotics & CP' },
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    category === cat.id
                      ? 'bg-primary-fixed/30 border-primary shadow-xs ring-1 ring-primary'
                      : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                  }`}
                >
                  <p className="font-heading text-label-sm font-bold text-on-surface">
                    {cat.label}
                  </p>
                  <p className="font-sans text-[11px] text-on-surface-variant mt-0.5">
                    {cat.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1">
              Description / Sprint Goal
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this team working on? e.g. Building an offline-first mesh protocol in Go for Rajasthan IT hackathon qualifier."
              rows={3}
              className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-sm px-3.5 py-2 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
            />
          </div>

          {/* Group Photo / Avatar */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1.5">
              Group Avatar / Photo
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {AVATAR_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => {
                    setAvatarUrl(p.url);
                    setCustomAvatar('');
                  }}
                  className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                    avatarUrl === p.url && !customAvatar
                      ? 'border-primary ring-2 ring-primary/40'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-black/40 flex items-end p-1 text-[9px] text-white font-heading font-medium truncate">
                    {p.label.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>

            <input
              type="url"
              value={customAvatar}
              onChange={(e) => {
                setCustomAvatar(e.target.value);
                setAvatarUrl(e.target.value);
              }}
              placeholder="Or paste custom image URL..."
              className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-sm px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs"
            />
          </div>

          {/* Note about invitations */}
          <div className="p-3 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0 mt-0.5">
              lock
            </span>
            <p className="font-sans text-[12px] text-on-surface-variant leading-relaxed">
              <strong>Campus Privacy Guarantee:</strong> You will be the creator. You can search students to invite afterwards. <em>Nobody is added without accepting an invitation</em>, and only accepted members can read or post.
            </p>
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
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  <span>Create Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
