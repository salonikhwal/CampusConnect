import React, { useState } from 'react';

export default function PendingInvitationsBanner({ invitations, onAccept, onDecline }) {
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState(null);

  if (!invitations || invitations.length === 0) return null;

  const handleAction = async (groupId, action) => {
    try {
      setActingId(groupId);
      setError(null);
      const res = await fetch(`/api/groups/${groupId}/invitations/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to ${action} invitation`);
      }
      if (action === 'accept') {
        onAccept(groupId);
      } else {
        onDecline(groupId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="mb-6 p-4 rounded-2xl bg-primary-fixed/20 border border-primary/30 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[22px]">
            mark_email_unread
          </span>
          <h3 className="font-heading text-label-lg font-bold text-on-surface">
            Pending Group Invitations ({invitations.length})
          </h3>
        </div>
        <span className="text-[11px] font-sans text-on-surface-variant bg-surface-container-lowest px-2.5 py-1 rounded-full border border-outline-variant/30">
          Requires your acceptance to join
        </span>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-error/10 text-error text-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {invitations.map((inv) => (
          <div
            key={inv.invitationId}
            className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xs flex flex-col justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-heading font-bold text-base flex-shrink-0 overflow-hidden">
                {inv.avatarUrl ? (
                  <img src={inv.avatarUrl} alt={inv.groupName} className="w-full h-full object-cover" />
                ) : (
                  inv.groupName.charAt(0)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-primary bg-primary-fixed/50 px-2 py-0.5 rounded-full">
                    {inv.category}
                  </span>
                  <span className="text-[11px] text-outline font-mono">
                    {inv.memberCount} members
                  </span>
                </div>
                <h4 className="font-heading text-label-md font-bold text-on-surface mt-1 truncate">
                  {inv.groupName}
                </h4>
                {inv.description && (
                  <p className="font-sans text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
                    {inv.description}
                  </p>
                )}
                <p className="font-sans text-[11px] text-outline mt-1">
                  Invited by <strong className="text-on-surface">{inv.invitedBy?.name || 'Group Creator'}</strong>
                  {inv.invitedBy?.rollNumber ? ` (${inv.invitedBy.rollNumber})` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container/60">
              <button
                type="button"
                onClick={() => handleAction(inv.groupId, 'decline')}
                disabled={actingId === inv.groupId}
                className="px-3 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant font-heading text-label-sm font-semibold transition-colors disabled:opacity-50"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleAction(inv.groupId, 'accept')}
                disabled={actingId === inv.groupId}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-heading text-label-sm font-semibold shadow-2xs transition-all disabled:opacity-50"
              >
                {actingId === inv.groupId ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-[14px]">progress_activity</span>
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    <span>Accept &amp; Join</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
