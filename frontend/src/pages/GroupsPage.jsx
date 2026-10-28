import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import CreateGroupModal from '../components/groups/CreateGroupModal';
import InviteModal from '../components/groups/InviteModal';
import EditGroupModal from '../components/groups/EditGroupModal';
import PendingInvitationsBanner from '../components/groups/PendingInvitationsBanner';
import GroupChatView from '../components/groups/GroupChatView';
import MemberList from '../components/groups/MemberList';
import GroupInfoPanel from '../components/groups/GroupInfoPanel';

export default function GroupsPage() {
  const { groupId: routeGroupId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(routeGroupId || null);
  const [workspace, setWorkspace] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [workspaceError, setWorkspaceError] = useState(null);

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'members' | 'tasks' | 'info'
  const [categoryFilter, setCategoryFilter] = useState('All Groups');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(true);

  // Workspace Sprint Tasks State
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Load Groups and Invitations on Mount
  const fetchGroupsAndInvitations = async () => {
    try {
      setLoadingGroups(true);
      const [groupsRes, invitesRes] = await Promise.all([
        fetch('/api/groups', { credentials: 'include' }),
        fetch('/api/groups/invitations', { credentials: 'include' }),
      ]);

      const groupsData = await groupsRes.json();
      const invitesData = await invitesRes.json();

      if (groupsRes.ok) {
        setGroups(groupsData.groups || []);
        // If route has groupId, use it; otherwise pick first group
        const targetId = routeGroupId || groupsData.groups?.[0]?.id || null;
        setSelectedGroupId(targetId);
      }

      if (invitesRes.ok) {
        setInvitations(invitesData.invitations || []);
      }
    } catch (err) {
      console.error('Failed to load groups data:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchGroupsAndInvitations();
  }, []);

  // Fetch Workspace when selectedGroupId changes
  const fetchWorkspace = async (id) => {
    if (!id) {
      setWorkspace(null);
      return;
    }

    try {
      setLoadingWorkspace(true);
      setWorkspaceError(null);
      const res = await fetch(`/api/groups/${id}`, { credentials: 'include' });
      const data = await res.json();

      if (res.ok) {
        setWorkspace(data);
      } else {
        setWorkspaceError(data.message || 'Failed to load workspace.');
      }
    } catch (err) {
      setWorkspaceError('Network error connecting to group workspace.');
    } finally {
      setLoadingWorkspace(false);
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      fetchWorkspace(selectedGroupId);
    }
  }, [selectedGroupId]);

  // Handle Group Selection
  const handleSelectGroup = (id) => {
    setSelectedGroupId(id);
    navigate(`/groups/${id}`, { replace: true });
  };

  // Handle Group Creation
  const handleGroupCreated = (newGroup) => {
    setGroups((prev) => [newGroup, ...prev]);
    setSelectedGroupId(newGroup.id);
    navigate(`/groups/${newGroup.id}`, { replace: true });
    setActiveTab('chat');
  };

  // Handle Accepting Invitation
  const handleAcceptInvitation = (groupId) => {
    setInvitations((prev) => prev.filter((i) => i.groupId !== groupId));
    fetchGroupsAndInvitations();
    setSelectedGroupId(groupId);
    navigate(`/groups/${groupId}`, { replace: true });
  };

  // Handle Declining Invitation
  const handleDeclineInvitation = (groupId) => {
    setInvitations((prev) => prev.filter((i) => i.groupId !== groupId));
  };

  // Handle Member Removed
  const handleMemberRemoved = (targetUserId) => {
    if (workspace) {
      setWorkspace((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== targetUserId),
      }));
    }
    setGroups((prev) =>
      prev.map((g) =>
        g.id === selectedGroupId
          ? { ...g, memberCount: Math.max(1, g.memberCount - 1) }
          : g
      )
    );
  };

  // Handle Leaving Group
  const handleLeaveGroup = () => {
    setGroups((prev) => prev.filter((g) => g.id !== selectedGroupId));
    const nextGroup = groups.find((g) => g.id !== selectedGroupId);
    if (nextGroup) {
      setSelectedGroupId(nextGroup.id);
      navigate(`/groups/${nextGroup.id}`, { replace: true });
    } else {
      setSelectedGroupId(null);
      navigate('/groups', { replace: true });
    }
  };

  // Handle Group Updated
  const handleGroupUpdated = (updatedGroup) => {
    setWorkspace((prev) => (prev ? { ...prev, group: updatedGroup } : prev));
    setGroups((prev) =>
      prev.map((g) => (g.id === updatedGroup.id ? { ...g, ...updatedGroup } : g))
    );
  };

  // Handle Group Deleted
  const handleGroupDeleted = (groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    const nextGroup = groups.find((g) => g.id !== groupId);
    if (nextGroup) {
      setSelectedGroupId(nextGroup.id);
      navigate(`/groups/${nextGroup.id}`, { replace: true });
    } else {
      setSelectedGroupId(null);
      navigate('/groups', { replace: true });
    }
  };

  // Add Task
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: newTaskTitle.trim(),
        status: 'BACKLOG',
        assignee: currentUser?.name?.split(' ')[0] || 'Me',
      },
    ]);
    setNewTaskTitle('');
  };

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    // Category filter
    if (categoryFilter !== 'All Groups') {
      const catKey = categoryFilter.toLowerCase();
      if (catKey.includes('hackathon') && g.category !== 'hackathon') return false;
      if (catKey.includes('academic') && g.category !== 'academic') return false;
      if (catKey.includes('hostel') && g.category !== 'hostel') return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = g.name.toLowerCase().includes(q);
      const matchDesc = (g.description || '').toLowerCase().includes(q);
      return matchName || matchDesc;
    }
    return true;
  });

  const categories = [
    'All Groups',
    '🚀 Hackathon & Build',
    '📚 Academic & Labs',
    '🏢 Hostel & Social',
  ];

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner for Pending Invitations */}
      <PendingInvitationsBanner
        invitations={invitations}
        onAccept={handleAcceptInvitation}
        onDecline={handleDeclineInvitation}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-display-mobile sm:text-headline-lg font-bold text-on-surface">
              Study &amp; Project Groups
            </h1>
            <span className="bg-primary-fixed text-on-primary-fixed-variant font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Sphinx Workspace
            </span>
          </div>
          <p className="font-sans text-body-md text-on-surface-variant mt-1">
            Collaborative team workspaces for MNIT CSE course labs, Sphinx hackathons, and hostel circles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {invitations.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-fixed text-primary font-heading text-label-sm font-bold animate-pulse">
              <span className="material-symbols-outlined text-[16px]">mail</span>
              <span>{invitations.length} Invites Pending</span>
            </div>
          )}

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-heading text-label-md px-4 py-2.5 rounded-xl font-semibold shadow-xs transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Groups List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl font-heading text-label-sm whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? 'bg-primary text-on-primary font-semibold shadow-2xs'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-outline-variant/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Groups */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter your campus groups..."
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-sans text-body-sm pl-9 pr-3 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            />
          </div>

          {/* Groups List */}
          <div className="flex flex-col gap-2.5">
            {loadingGroups ? (
              <div className="p-8 text-center text-outline">
                <span className="animate-spin material-symbols-outlined text-[24px] text-primary mb-2">
                  progress_activity
                </span>
                <p className="font-heading text-body-sm">Loading your groups...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[32px] text-outline mb-2">groups</span>
                <p className="font-heading text-label-md font-bold text-on-surface">No groups match</p>
                <p className="font-sans text-body-sm text-outline mt-1">
                  Create a new group or accept an invitation to start collaborating.
                </p>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-3 text-primary font-heading text-label-sm font-semibold hover:underline"
                >
                  + Create Group
                </button>
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isSelected = selectedGroupId === group.id;
                return (
                  <div
                    key={group.id}
                    onClick={() => handleSelectGroup(group.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-surface-container-lowest border-primary shadow-xs ring-2 ring-primary/20'
                        : 'bg-surface-container-lowest hover:bg-surface-container-low border-outline-variant/30 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="bg-primary-fixed text-on-primary-fixed-variant font-heading text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {group.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {group.hasUnread && (
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        )}
                        <span className="text-[11px] font-mono text-outline">
                          {group.memberCount} members
                        </span>
                      </div>
                    </div>

                    <h3 className="font-heading text-label-lg font-bold text-on-surface flex items-center gap-1.5">
                      <span className="truncate">{group.name}</span>
                      {group.isCreator && (
                        <span className="material-symbols-outlined text-[16px] text-amber-500" title="You created this group">
                          verified
                        </span>
                      )}
                    </h3>

                    {group.description && (
                      <p className="font-sans text-body-sm text-on-surface-variant line-clamp-2 mt-1">
                        {group.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-mono text-outline mt-3 pt-2 border-t border-surface-container/60">
                      <span>Sphinx Node CC-03</span>
                      <span>
                        {new Date(group.lastMessageAt || group.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Workspace (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {loadingWorkspace ? (
            <div className="p-16 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col items-center justify-center text-outline">
              <span className="animate-spin material-symbols-outlined text-[32px] text-primary mb-2">
                progress_activity
              </span>
              <p className="font-heading text-body-md font-semibold">Opening Sphinx Workspace...</p>
            </div>
          ) : workspaceError ? (
            <div className="p-8 rounded-2xl bg-surface-container-lowest border border-error/30 text-center">
              <span className="material-symbols-outlined text-[36px] text-error mb-2">lock</span>
              <h3 className="font-heading text-headline-sm font-bold text-on-surface">Access Restricted</h3>
              <p className="font-sans text-body-sm text-on-surface-variant mt-1 max-w-md mx-auto">
                {workspaceError}
              </p>
              <div className="mt-4 p-3 bg-surface-container-low rounded-xl text-xs font-mono text-outline max-w-sm mx-auto">
                Nobody is added without accepting an invitation. Only accepted members can read or post.
              </div>
            </div>
          ) : !workspace ? (
            <div className="p-16 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-center text-outline">
              <span className="material-symbols-outlined text-[48px] text-primary/40 mb-3">
                workspaces
              </span>
              <h3 className="font-heading text-headline-sm font-bold text-on-surface">Select a Group Workspace</h3>
              <p className="font-sans text-body-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                Choose a study group from the left panel or create a new workspace to start collaborating.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Workspace Top Action Bar */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-heading font-bold text-lg overflow-hidden flex-shrink-0 shadow-2xs">
                    {workspace.group.avatarUrl ? (
                      <img
                        src={workspace.group.avatarUrl}
                        alt={workspace.group.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      workspace.group.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-heading text-headline-sm font-bold text-on-surface">
                        {workspace.group.name}
                      </h2>
                      <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Sphinx Active
                      </span>
                    </div>
                    <p className="font-sans text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
                      {workspace.group.description || 'Sphinx hackathon collaboration workspace.'}
                    </p>
                  </div>
                </div>

                {/* Workspace Header Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {workspace.isCreator ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setInviteModalOpen(true)}
                        className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary font-heading text-label-sm px-3.5 py-1.5 rounded-xl font-semibold shadow-2xs transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">person_add</span>
                        <span>Invite Peers</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditModalOpen(true)}
                        className="p-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-on-surface transition-colors"
                        title="Group Settings & Details"
                      >
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLeaveGroup}
                      className="inline-flex items-center gap-1.5 border border-error/30 text-error hover:bg-error/10 font-heading text-label-sm px-3 py-1.5 rounded-xl font-semibold transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      <span>Leave</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                    className={`p-2 rounded-xl border transition-colors ${
                      showInfoPanel
                        ? 'bg-surface-container border-primary text-primary'
                        : 'border-outline-variant/40 hover:bg-surface-container text-outline'
                    }`}
                    title="Toggle Info Panel"
                  >
                    <span className="material-symbols-outlined text-[18px]">info</span>
                  </button>
                </div>
              </div>

              {/* Workspace Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-surface-container/60 pb-2 overflow-x-auto scrollbar-none">
                {[
                  { id: 'chat', label: 'Group Chat (Sphinx Live)', icon: 'terminal' },
                  { id: 'members', label: `Members (${workspace.members.length})`, icon: 'group' },
                  { id: 'tasks', label: 'Sprint & Tasks', icon: 'view_kanban' },
                  { id: 'info', label: 'Group Info', icon: 'description', mobileOnly: true },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-heading text-label-md transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-primary-fixed text-on-primary-fixed-variant font-bold shadow-2xs'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest'
                    } ${tab.mobileOnly ? 'lg:hidden' : ''}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Workspace Tab Content + Collapsible Info Rail */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Main Tab Area */}
                <div className={`${showInfoPanel ? 'lg:col-span-8' : 'lg:col-span-12'} flex flex-col gap-4`}>
                  
                  {activeTab === 'chat' && (
                    <GroupChatView
                      groupId={workspace.group.id}
                      groupName={workspace.group.name}
                      groupCategory={workspace.group.category}
                      members={workspace.members}
                      currentUser={currentUser}
                    />
                  )}

                  {activeTab === 'members' && (
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-xs">
                      <MemberList
                        groupId={workspace.group.id}
                        groupName={workspace.group.name}
                        members={workspace.members}
                        pendingInvites={workspace.pendingInvites}
                        isCreator={workspace.isCreator}
                        currentUser={currentUser}
                        onMemberRemoved={handleMemberRemoved}
                        onLeaveGroup={handleLeaveGroup}
                        onOpenInviteModal={() => setInviteModalOpen(true)}
                      />
                    </div>
                  )}

                  {activeTab === 'tasks' && (
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-xs flex flex-col gap-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="font-heading text-headline-sm font-bold text-on-surface">
                            Sphinx Sprint Board
                          </h3>
                          <p className="font-sans text-body-sm text-on-surface-variant">
                            Live sprint tasks for {workspace.group.name}.
                          </p>
                        </div>
                      </div>

                      {/* Task Input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                          placeholder="Add new sprint task (e.g. 'Test Nachos MLFQ timer interrupts')..."
                          className="flex-1 bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-sm px-3.5 py-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest"
                        />
                        <button
                          type="button"
                          onClick={handleAddTask}
                          className="bg-primary hover:bg-primary-container text-on-primary font-heading text-label-sm px-4 py-2.5 rounded-xl font-semibold shadow-2xs"
                        >
                          + Add Task
                        </button>
                      </div>

                      {/* Kanban Columns */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                        {[
                          { key: 'BACKLOG', label: 'Backlog / Todo', color: 'bg-outline/10 text-outline' },
                          { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-secondary-fixed/50 text-on-secondary-fixed-variant' },
                          { key: 'DONE', label: 'Completed', color: 'bg-primary-fixed/50 text-on-primary-fixed-variant' },
                        ].map((col) => {
                          const colTasks = tasks.filter((t) => t.status === col.key);
                          return (
                            <div
                              key={col.key}
                              className="bg-surface-container-low/70 rounded-xl p-3 border border-outline-variant/20 flex flex-col gap-2 min-h-[220px]"
                            >
                              <div className="flex items-center justify-between pb-1 border-b border-surface-container/60">
                                <span className={`text-[11px] font-heading font-bold px-2 py-0.5 rounded-full uppercase ${col.color}`}>
                                  {col.label}
                                </span>
                                <span className="text-[11px] font-mono text-outline">{colTasks.length}</span>
                              </div>

                              {colTasks.length === 0 ? (
                                <div className="py-8 text-center text-outline text-[12px] font-sans">
                                  No tasks in {col.label.toLowerCase()}
                                </div>
                              ) : (
                                colTasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className="p-3 bg-surface-container-lowest rounded-xl shadow-2xs border border-outline-variant/30 flex flex-col gap-2"
                                  >
                                    <span className="font-heading text-label-md font-semibold text-on-surface">
                                      {task.title}
                                    </span>
                                    <div className="flex items-center justify-between text-[11px] text-outline font-sans pt-1 border-t border-surface-container/60">
                                      <span>Assignee: {task.assignee}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTasks((prev) =>
                                            prev.map((t) =>
                                              t.id === task.id
                                                ? {
                                                    ...t,
                                                    status:
                                                      t.status === 'BACKLOG'
                                                        ? 'IN_PROGRESS'
                                                        : t.status === 'IN_PROGRESS'
                                                        ? 'DONE'
                                                        : 'BACKLOG',
                                                  }
                                                : t
                                            )
                                          );
                                        }}
                                        className="text-primary hover:underline font-heading font-semibold"
                                      >
                                        Next →
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === 'info' && (
                    <div className="lg:hidden">
                      <GroupInfoPanel
                        group={workspace.group}
                        members={workspace.members}
                        isCreator={workspace.isCreator}
                        currentUser={currentUser}
                        onOpenEditModal={() => setEditModalOpen(true)}
                        onOpenInviteModal={() => setInviteModalOpen(true)}
                        onLeaveGroup={handleLeaveGroup}
                      />
                    </div>
                  )}

                </div>

                {/* Right Rail Info Panel (4 cols on lg, toggleable) */}
                {showInfoPanel && (
                  <div className="hidden lg:block lg:col-span-4">
                    <GroupInfoPanel
                      group={workspace.group}
                      members={workspace.members}
                      isCreator={workspace.isCreator}
                      currentUser={currentUser}
                      onOpenEditModal={() => setEditModalOpen(true)}
                      onOpenInviteModal={() => setInviteModalOpen(true)}
                      onLeaveGroup={handleLeaveGroup}
                      onClose={() => setShowInfoPanel(false)}
                    />
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

      {workspace && (
        <>
          <InviteModal
            isOpen={inviteModalOpen}
            onClose={() => setInviteModalOpen(false)}
            groupId={workspace.group.id}
            groupName={workspace.group.name}
            onInvitationSent={(inv) => {
              setWorkspace((prev) =>
                prev ? { ...prev, pendingInvites: [...(prev.pendingInvites || []), inv] } : prev
              );
            }}
          />

          <EditGroupModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            group={workspace.group}
            onGroupUpdated={handleGroupUpdated}
            onDeleteGroup={handleGroupDeleted}
          />
        </>
      )}
    </div>
  );
}
