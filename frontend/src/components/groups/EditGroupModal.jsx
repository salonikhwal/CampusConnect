import React, { useState, useEffect } from 'react';

export default function EditGroupModal({ isOpen, onClose, group, onGroupUpdated, onDeleteGroup }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('hackathon');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name || '');
      setDescription(group.description || '');
      setCategory(group.category || 'academic');
      setAvatarUrl(group.avatarUrl || '');
    }
  }, [group]);

  if (!isOpen || !group) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Group name cannot be empty.');
      return;
    }
    if (name.trim().length < 3) {
      setError('Group name must be at least 3 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          avatarUrl: avatarUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update group details');
      }

      onGroupUpdated(data.group);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete group');
      }
      onDeleteGroup(group.id);
      onClose();
    } catch (err) {
      setError(err.message);
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
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </div>
            <div>
              <h2 className="font-heading text-headline-sm font-bold text-on-surface">
                Manage Group Workspace
              </h2>
              <p className="font-sans text-body-sm text-on-surface-variant">
                Creator settings and group workspace metadata.
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
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface font-sans text-body-md px-3.5 py-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface font-sans text-body-sm px-3.5 py-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest"
            >
              <option value="hackathon">🚀 Sphinx Hackathon & Build</option>
              <option value="academic">📚 Academic & Labs</option>
              <option value="hostel">🏢 Hostel & Social</option>
              <option value="hobby">⚡ Hobby & Tech Circles</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1">
              Description / Sprint Goal
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-surface-container-low text-on-surface font-sans text-body-sm px-3.5 py-2 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest"
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block font-heading text-label-md font-semibold text-on-surface mb-1">
              Photo / Avatar URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-surface-container-low text-on-surface font-sans text-body-sm px-3.5 py-2 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest"
            />
          </div>

          {/* Creator badge note */}
          <div className="p-3 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 flex items-center gap-2 text-on-surface-variant text-[11px] font-sans">
            <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
            <span>Only you (as the creator) can modify workspace information or remove peers.</span>
          </div>

          {/* Danger Zone: Delete Group */}
          <div className="p-3 rounded-xl border border-error/30 bg-error/5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading text-label-sm font-bold text-error">Delete Group Workspace</h4>
                <p className="font-sans text-[11px] text-on-surface-variant">Permanently deletes this group and all its messages.</p>
              </div>
              {!deleteConfirmOpen ? (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-error/40 text-error hover:bg-error/10 font-heading text-label-sm font-semibold transition-colors"
                >
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="px-2 py-1 text-xs text-on-surface-variant hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg bg-error text-on-error font-heading text-label-sm font-semibold hover:bg-red-700 transition-colors shadow-2xs"
                  >
                    Confirm Delete
                  </button>
                </div>
              )}
            </div>
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
