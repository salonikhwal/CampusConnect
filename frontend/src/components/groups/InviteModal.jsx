import React, { useState, useEffect } from 'react';

export default function InviteModal({ isOpen, onClose, groupId, groupName, onInvitationSent }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!isOpen || !groupId) return;
    loadCandidates('');
  }, [isOpen, groupId]);

  const loadCandidates = async (query) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const url = `/api/groups/${groupId}/invite-candidates${query ? `?q=${encodeURIComponent(query)}` : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setCandidates(data.candidates || []);
      } else {
        setErrorMessage(data.message || 'Failed to search students');
      }
    } catch (err) {
      setErrorMessage('Network error while searching campus directory');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    loadCandidates(val);
  };

  const handleSendInvite = async (student) => {
    try {
      setInvitingId(student.id);
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await fetch(`/api/groups/${groupId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: student.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send invitation');
      }

      setSuccessMessage(`Invitation sent to ${student.name} (${student.rollNumber})! They will be added as soon as they accept.`);
      // Remove student from candidate list
      setCandidates((prev) => prev.filter((c) => c.id !== student.id));
      if (onInvitationSent) onInvitationSent(data.invitation);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setInvitingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 animate-in zoom-in-95 duration-200 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <div>
              <h2 className="font-heading text-headline-sm font-bold text-on-surface">
                Invite Peers to Group
              </h2>
              <p className="font-sans text-body-sm text-on-surface-variant truncate max-w-sm">
                Adding peers to <span className="font-semibold text-primary">{groupName}</span>
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

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-body-sm flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by name, roll number, hostel, or skill (e.g. 'Go', 'Kaveri')..."
            className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-sm pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
            autoFocus
          />
        </div>

        {/* Rules note */}
        <div className="px-3 py-2 rounded-xl bg-surface-container-low text-on-surface-variant text-[11px] font-sans flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">info</span>
          <span>Nobody is added without accepting an invitation. Only accepted members can read or post.</span>
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-[260px] max-h-[360px] pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-outline">
              <span className="animate-spin material-symbols-outlined text-[28px] mb-2 text-primary">
                progress_activity
              </span>
              <p className="font-heading text-body-sm">Searching campus directory...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-outline">
              <span className="material-symbols-outlined text-[36px] mb-2 opacity-50">
                group_off
              </span>
              <p className="font-heading text-body-md font-semibold text-on-surface">No eligible peers found</p>
              <p className="font-sans text-body-sm max-w-xs mt-1">
                All matching students are either already accepted members or already have an invitation pending.
              </p>
            </div>
          ) : (
            candidates.map((student) => (
              <div
                key={student.id}
                className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-heading font-bold text-sm flex-shrink-0">
                    {student.avatarUrl ? (
                      <img
                        src={student.avatarUrl}
                        alt={student.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      student.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading text-label-md font-bold text-on-surface truncate">
                        {student.name}
                      </h4>
                      <span className="font-mono text-[10px] text-outline bg-surface-container px-1.5 py-0.5 rounded">
                        {student.rollNumber}
                      </span>
                    </div>
                    <p className="font-sans text-[11px] text-on-surface-variant truncate">
                      {student.hostel ? `${student.hostel} • ` : ''}
                      {student.batchYear ? `Batch of '${String(student.batchYear).slice(2)}` : 'CSE'}
                    </p>
                    {student.skills && student.skills.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 overflow-hidden">
                        {student.skills.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="bg-primary-fixed/40 text-on-primary-fixed-variant text-[9px] font-mono px-1.5 py-0.2 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSendInvite(student)}
                  disabled={invitingId === student.id}
                  className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary font-heading text-label-sm px-3.5 py-1.5 rounded-xl font-semibold shadow-2xs disabled:opacity-50 transition-all flex-shrink-0"
                >
                  {invitingId === student.id ? (
                    <>
                      <span className="animate-spin material-symbols-outlined text-[14px]">progress_activity</span>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[14px]">send</span>
                      <span>Invite</span>
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-container/60">
          <span className="font-mono text-[11px] text-outline">
            MNIT CSE Directory Sync
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-heading text-label-md font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
