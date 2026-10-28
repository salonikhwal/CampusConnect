import React, { useState } from 'react';

export default function MemberList({
  groupId,
  groupName,
  members,
  pendingInvites = [],
  isCreator,
  currentUser,
  onMemberRemoved,
  onLeaveGroup,
  onOpenInviteModal,
}) {
  const [removingId, setRemovingId] = useState(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [error, setError] = useState(null);

  const handleRemoveMember = async (targetUserId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from "${groupName}"?`)) {
      return;
    }

    try {
      setRemovingId(targetUserId);
      setError(null);
      const res = await fetch(`/api/groups/${groupId}/members/${targetUserId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to remove member');
      }
      onMemberRemoved(targetUserId);
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      setError(null);
      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to leave group');
      }
      onLeaveGroup();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Header with Invite Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-surface-container/60">
        <div>
          <h3 className="font-heading text-headline-sm font-bold text-on-surface">
            Active Group Members ({members.length})
          </h3>
          <p className="font-sans text-body-sm text-on-surface-variant">
            Accepted members who can collaborate, read, and post in {groupName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCreator && (
            <button
              type="button"
              onClick={onOpenInviteModal}
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary font-heading text-label-md px-3.5 py-2 rounded-xl font-semibold shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Invite Students</span>
            </button>
          )}

          {!isCreator && (
            !leaveConfirmOpen ? (
              <button
                type="button"
                onClick={() => setLeaveConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 border border-error/30 text-error hover:bg-error/10 font-heading text-label-sm px-3 py-2 rounded-xl font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Leave Group</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLeaveConfirmOpen(false)}
                  className="text-xs text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLeaveGroup}
                  className="bg-error text-on-error font-heading text-label-sm px-3 py-1.5 rounded-xl font-semibold shadow-2xs hover:bg-red-700 transition-colors"
                >
                  Confirm Leave
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Accepted Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {members.map((member) => {
          const isMe = member.id === currentUser?.id;
          return (
            <div
              key={member.id}
              className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xs flex items-center justify-between gap-3 hover:border-outline-variant/60 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-heading font-bold text-base flex-shrink-0 overflow-hidden shadow-2xs">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-heading text-label-lg font-bold text-on-surface truncate">
                      {member.name} {isMe && '(You)'}
                    </h4>
                    {member.isCreator ? (
                      <span className="bg-amber-400/20 text-amber-700 dark:text-amber-300 font-heading text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        👑 Creator
                      </span>
                    ) : (
                      <span className="bg-surface-container text-on-surface-variant font-heading text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Member
                      </span>
                    )}
                  </div>

                  <p className="font-mono text-xs text-outline mt-0.5">
                    {member.rollNumber} • {member.hostel || 'Hostel'}
                  </p>

                  {member.labGroup && (
                    <p className="font-sans text-[11px] text-on-surface-variant mt-0.5">
                      Lab Slot: <strong className="font-mono">{member.labGroup}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Creator Controls: Remove Member */}
              {isCreator && !member.isCreator && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.id, member.name)}
                  disabled={removingId === member.id}
                  title={`Remove ${member.name}`}
                  className="p-2 rounded-xl text-outline hover:text-error hover:bg-error/10 transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">person_remove</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pending Invitations Section (Creator View Only) */}
      {isCreator && (
        <div className="pt-4 border-t border-surface-container/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-heading text-label-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[20px]">schedule</span>
                <span>Pending Invitations ({pendingInvites.length})</span>
              </h4>
              <p className="font-sans text-[12px] text-on-surface-variant">
                Peers invited by you. They will appear in the active member list once they accept.
              </p>
            </div>
            <span className="text-[11px] font-mono text-outline bg-surface-container px-2.5 py-1 rounded-full">
              Creator Access
            </span>
          </div>

          {pendingInvites.length === 0 ? (
            <div className="p-4 rounded-xl bg-surface-container-low border border-dashed border-outline-variant/40 text-center text-outline text-body-sm font-sans">
              No pending invitations. Use the "Invite Students" button to search and invite campus peers.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {pendingInvites.map((invitee) => (
                <div
                  key={invitee.id}
                  className="p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/30 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center font-heading font-bold text-xs flex-shrink-0">
                      {invitee.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading text-label-sm font-bold text-on-surface truncate">
                        {invitee.name}
                      </p>
                      <p className="font-mono text-[10px] text-outline truncate">
                        {invitee.rollNumber}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
