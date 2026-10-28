import React from 'react';

export default function GroupInfoPanel({
  group,
  members,
  isCreator,
  currentUser,
  onOpenEditModal,
  onOpenInviteModal,
  onLeaveGroup,
  onClose,
}) {
  if (!group) return null;

  const creatorMember = members.find((m) => m.id === group.createdById);

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 shadow-xs flex flex-col gap-5 sticky top-20">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-container/60">
        <h3 className="font-heading text-label-lg font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">info</span>
          <span>Group Information</span>
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors lg:hidden"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Banner & Avatar */}
      <div className="relative rounded-xl overflow-hidden aspect-video bg-surface-container-high border border-outline-variant/20">
        {group.avatarUrl ? (
          <img
            src={group.avatarUrl}
            alt={group.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-primary-container/30 text-primary">
            <span className="material-symbols-outlined text-[36px]">groups</span>
            <span className="font-heading text-label-sm font-bold mt-1">CampusConnect Group</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
            {group.category}
          </span>
        </div>
      </div>

      {/* Title & Description */}
      <div>
        <h4 className="font-heading text-headline-sm font-bold text-on-surface">
          {group.name}
        </h4>
        <p className="font-sans text-body-sm text-on-surface-variant mt-1 leading-relaxed">
          {group.description || 'No description provided for this group.'}
        </p>
      </div>

      {/* Key Details */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-surface-container/60 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-outline font-sans">Created by</span>
          <span className="font-heading font-bold text-on-surface">
            {creatorMember ? creatorMember.name : (group.creator?.name || 'Group Admin')}
            {isCreator ? ' (You)' : ''}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-outline font-sans">Active Members</span>
          <span className="font-mono font-semibold text-primary">
            {members.length} Accepted
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-outline font-sans">Created Date</span>
          <span className="font-mono text-outline">
            {new Date(group.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-outline font-sans">Workspace Status</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            Active // Online
          </span>
        </div>
      </div>

      {/* Permissions / Privacy summary */}
      <div className="p-3 rounded-xl bg-surface-container-low text-on-surface-variant text-[11px] font-sans flex items-start gap-2 leading-relaxed">
        <span className="material-symbols-outlined text-[16px] text-primary mt-0.5 flex-shrink-0">
          security
        </span>
        <span>
          <strong>Campus Ground Rules:</strong> Only accepted members can read or post. Nobody is added without accepting an invitation.
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2 border-t border-surface-container/60">
        {isCreator ? (
          <>
            <button
              type="button"
              onClick={onOpenInviteModal}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-heading text-label-md py-2.5 rounded-xl font-semibold shadow-2xs transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Invite Students</span>
            </button>
            <button
              type="button"
              onClick={onOpenEditModal}
              className="w-full inline-flex items-center justify-center gap-2 border border-outline-variant/40 hover:bg-surface-container text-on-surface font-heading text-label-md py-2 rounded-xl font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>Edit Details &amp; Settings</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onLeaveGroup}
            className="w-full inline-flex items-center justify-center gap-2 border border-error/30 text-error hover:bg-error/10 font-heading text-label-md py-2 rounded-xl font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Leave Group</span>
          </button>
        )}
      </div>
    </div>
  );
}
