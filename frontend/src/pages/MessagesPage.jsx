import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/messages/ReportModal';

export default function MessagesPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Primary Tabs: 'direct' or 'groups'
  const [activeTab, setActiveTab] = useState('direct');
  const [searchQuery, setSearchQuery] = useState('');

  // Conversations State
  const [directConvs, setDirectConvs] = useState([]);
  const [groupConvs, setGroupConvs] = useState([]);
  const [activeId, setActiveId] = useState(null); // conversationId or groupId

  // Active Chat State
  const [messages, setMessages] = useState([]);
  const [activeDetails, setActiveDetails] = useState(null); // Direct conversation details or Group details
  const [draft, setDraft] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Right Side Profile / Group Summary Panel (Visible by default on desktop)
  const [showSummaryPanel, setShowSummaryPanel] = useState(true);
  const [reportTargetUser, setReportTargetUser] = useState(null);

  // Auto-scroll ref
  const messagesEndRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return 'CC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Scroll to bottom of message list smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch conversations list (Direct or Groups)
  const fetchLists = async (silent = false) => {
    if (!silent) setLoadingList(true);

    try {
      // Direct
      const directRes = await fetch(`/api/messages/conversations?search=${encodeURIComponent(searchQuery)}`);
      if (directRes.ok) {
        const directData = await directRes.json();
        setDirectConvs(directData.conversations || []);
      }

      // Groups
      const groupRes = await fetch(`/api/messages/groups?search=${encodeURIComponent(searchQuery)}`);
      if (groupRes.ok) {
        const groupData = await groupRes.json();
        setGroupConvs(groupData.groups || []);
      }
    } catch (err) {
      console.error('fetchLists error:', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  // Initial fetch and on search change
  useEffect(() => {
    fetchLists(false);
  }, [searchQuery]);

  // Set default active conversation on first load if none selected
  useEffect(() => {
    if (!activeId) {
      if (activeTab === 'direct' && directConvs.length > 0) {
        setActiveId(directConvs[0].id);
      } else if (activeTab === 'groups' && groupConvs.length > 0) {
        setActiveId(groupConvs[0].id);
      }
    }
  }, [activeTab, directConvs, groupConvs]);

  // 2. Fetch active chat messages
  const fetchActiveChat = async (id, type, silent = false) => {
    if (!id) return;
    if (!silent) setLoadingChat(true);

    try {
      const endpoint =
        type === 'groups'
          ? `/api/messages/groups/${id}`
          : `/api/messages/conversations/${id}`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access restricted: You do not belong to this conversation.');
        }
        throw new Error('Failed to load chat history.');
      }

      const data = await res.json();
      setMessages(data.messages || []);
      setActiveDetails(type === 'groups' ? data.group : data.conversation);

      if (!silent) {
        setTimeout(scrollToBottom, 60);
      }
    } catch (err) {
      console.error('fetchActiveChat error:', err);
      setErrorMsg(err.message || 'Unable to load chat.');
    } finally {
      if (!silent) setLoadingChat(false);
    }
  };

  useEffect(() => {
    if (activeId) {
      fetchActiveChat(activeId, activeTab, false);
    } else {
      setMessages([]);
      setActiveDetails(null);
    }
  }, [activeId, activeTab]);

  // 3. Polling every 3.5 seconds for new messages and unread indicator updates
  useEffect(() => {
    const pollTimer = setInterval(() => {
      // Background poll list
      fetchLists(true);
      // Background poll active chat
      if (activeId) {
        fetchActiveChat(activeId, activeTab, true);
      }
    }, 3500);

    return () => clearInterval(pollTimer);
  }, [activeId, activeTab, searchQuery]);

  // Handle switching tabs
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setErrorMsg('');
    setDraft('');
    const list = tab === 'direct' ? directConvs : groupConvs;
    if (list.length > 0) {
      setActiveId(list[0].id);
    } else {
      setActiveId(null);
    }
  };

  // 4. Send Message (with Shift+Enter for newline, plain Enter to send)
  const handleSendMessage = async () => {
    if (!draft.trim() || !activeId || sendingMessage) return;

    setSendingMessage(true);
    setErrorMsg('');
    const content = draft.trim();

    try {
      const endpoint =
        activeTab === 'groups'
          ? `/api/messages/groups/${activeId}/messages`
          : `/api/messages/conversations/${activeId}/messages`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'AWAITING_REPLY') {
          setErrorMsg(data.message || 'Awaiting recipient reply.');
        } else {
          throw new Error(data.message || 'Failed to dispatch message.');
        }
        return;
      }

      setDraft('');
      // Append optimistically or from response
      setMessages((prev) => [...prev, data.message]);
      fetchLists(true);
      setTimeout(scrollToBottom, 60);
    } catch (err) {
      setErrorMsg(err.message || 'Could not send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e) => {
    // Shift + Enter: inserts newline
    // Enter without Shift: sends message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Recipient Action: Ignore Introduction
  const handleIgnore = async () => {
    if (!activeId || activeTab !== 'direct') return;
    if (!window.confirm('Quietly ignore this introductory note? It will be archived from your inbox.')) return;

    try {
      const res = await fetch(`/api/messages/conversations/${activeId}/ignore`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to ignore conversation.');
      showToast('Introduction archived quietly.');
      fetchLists(false);
      setActiveId(null);
    } catch (err) {
      alert(err.message || 'Error ignoring conversation.');
    }
  };

  // Block User
  const handleBlock = async (targetUserId) => {
    if (!targetUserId) return;
    if (!window.confirm('Block this user? Blocked students cannot send or receive messages from each other.')) return;

    try {
      const res = await fetch('/api/messages/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      if (!res.ok) throw new Error('Failed to block user.');
      showToast('User blocked. Messaging disabled.');
      fetchLists(true);
      fetchActiveChat(activeId, activeTab, false);
    } catch (err) {
      alert(err.message || 'Error blocking user.');
    }
  };

  // Unblock User
  const handleUnblock = async (targetUserId) => {
    if (!targetUserId) return;

    try {
      const res = await fetch('/api/messages/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      if (!res.ok) throw new Error('Failed to unblock user.');
      showToast('User unblocked.');
      fetchLists(true);
      fetchActiveChat(activeId, activeTab, false);
    } catch (err) {
      alert(err.message || 'Error unblocking user.');
    }
  };

  // Derived state for active chat
  const isDirect = activeTab === 'direct';
  const otherUser = isDirect ? activeDetails?.otherUser : null;
  const isBlocked = Boolean(isDirect && activeDetails?.isBlocked);
  const isAwaitingReply = Boolean(isDirect && activeDetails?.isAwaitingReply);
  const isNewIntroForMe = Boolean(
    isDirect && directConvs.find((c) => c.id === activeId)?.isNewIntroForMe
  );

  const displayedList = isDirect ? directConvs : groupConvs;
  const totalDirectUnread = directConvs.filter((c) => c.hasUnread).length;
  const totalGroupUnread = groupConvs.filter((g) => g.hasUnread).length;

  return (
    <div className="max-w-[1400px] mx-auto w-full px-space-md lg:px-space-xl py-space-md">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-surface py-2.5 px-4 rounded-xl shadow-lg font-heading text-label-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container Card (3-column layout on wide screens) */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 overflow-hidden flex flex-col md:flex-row h-[800px]">
        
        {/* COLUMN 1: Conversation List (320px) */}
        <div className="w-full md:w-80 lg:w-84 border-r border-surface-container/60 flex flex-col bg-surface-container-lowest flex-shrink-0">
          
          {/* Header */}
          <div className="p-space-md border-b border-surface-container/60 flex items-center justify-between">
            <div>
              <h1 className="font-heading text-headline-sm font-bold text-on-surface">
                Messages
              </h1>
              <p className="font-sans text-body-xs text-on-surface-variant">
                MNIT CSE quiet intranet communications
              </p>
            </div>
            <button
              onClick={() => navigate('/discover')}
              className="p-1.5 rounded-lg text-primary hover:bg-surface-container transition-colors"
              title="Discover classmates"
            >
              <span className="material-symbols-outlined text-[20px]">person_search</span>
            </button>
          </div>

          {/* Primary Tabs: Direct Messages vs Groups */}
          <div className="p-2 border-b border-surface-container/60 flex items-center gap-1 bg-surface-container-low/50">
            <button
              onClick={() => handleTabSwitch('direct')}
              className={`flex-1 py-1.5 px-2 rounded-xl font-heading text-label-md transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'direct'
                  ? 'bg-primary text-on-primary font-semibold shadow-2xs'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>Direct</span>
              {totalDirectUnread > 0 && (
                <span className="w-2 h-2 rounded-full bg-secondary-container" title="Unread messages" />
              )}
            </button>

            <button
              onClick={() => handleTabSwitch('groups')}
              className={`flex-1 py-1.5 px-2 rounded-xl font-heading text-label-md transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'groups'
                  ? 'bg-primary text-on-primary font-semibold shadow-2xs'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">groups</span>
              <span>Groups</span>
              {totalGroupUnread > 0 && (
                <span className="w-2 h-2 rounded-full bg-secondary-container" title="Unread messages" />
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-space-sm border-b border-surface-container/60">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isDirect ? "Search classmates, notes..." : "Search groups, topics..."}
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-xs pl-8 pr-3 py-1.5 rounded-lg border border-outline-variant/20 focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Conversation List Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-surface-container/60">
            {loadingList ? (
              <div className="p-8 text-center text-outline font-heading text-label-sm">
                Loading conversations...
              </div>
            ) : displayedList.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl text-outline">
                  {searchQuery ? 'search_off' : isDirect ? 'chat_bubble_outline' : 'groups_2'}
                </span>
                <p className="font-heading text-label-sm font-semibold">
                  {searchQuery
                    ? 'No matches found'
                    : isDirect
                    ? 'No direct messages yet'
                    : 'No group chats yet'}
                </p>
                <p className="font-sans text-body-xs text-outline max-w-[200px]">
                  {searchQuery
                    ? 'Try searching with a different term or clear the filter.'
                    : isDirect
                    ? 'Explore Discover People to Say Hi to classmates.'
                    : 'You will see course and hackathon groups here.'}
                </p>
                {!searchQuery && isDirect && (
                  <button
                    onClick={() => navigate('/discover')}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-heading text-label-xs font-semibold"
                  >
                    Discover Classmates
                  </button>
                )}
              </div>
            ) : (
              displayedList.map((item) => {
                const isSelected = item.id === activeId;
                const hasUnread = item.hasUnread;

                if (isDirect) {
                  const peer = item.otherUser;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveId(item.id)}
                      className={`p-space-sm cursor-pointer transition-colors flex items-start gap-3 relative ${
                        isSelected
                          ? 'bg-surface-container-high'
                          : 'hover:bg-surface-container-low'
                      }`}
                    >
                      {/* Unread Indicator Bar */}
                      {hasUnread && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r" />
                      )}

                      {/* Avatar */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-fixed to-secondary-fixed flex items-center justify-center font-heading font-bold text-on-primary-fixed-variant text-sm">
                          {getInitials(peer?.name)}
                        </div>
                        {peer?.isAvailable && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary-container rounded-full ring-2 ring-surface-container-lowest" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`font-heading text-label-md truncate ${hasUnread ? 'font-bold text-on-surface' : 'font-semibold text-on-surface'}`}>
                            {peer?.name}
                          </span>
                          {item.isNewIntroForMe && (
                            <span className="text-[10px] bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.2 rounded font-heading font-bold flex-shrink-0">
                              NEW INTRO
                            </span>
                          )}
                          {item.isAwaitingReply && (
                            <span className="text-[10px] bg-surface-container text-outline px-1.5 py-0.2 rounded font-heading flex-shrink-0">
                              Awaiting
                            </span>
                          )}
                        </div>

                        <p className={`font-sans text-body-xs truncate ${hasUnread ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>
                          {item.lastMessage?.content || 'Started conversation'}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-sans text-outline">
                          <span>{peer?.rollNumber}</span>
                          <span>•</span>
                          <span>{peer?.hostel?.split('•')[0].trim() || 'Campus'}</span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Group Chat Item
                  const group = item;
                  return (
                    <div
                      key={group.id}
                      onClick={() => setActiveId(group.id)}
                      className={`p-space-sm cursor-pointer transition-colors flex items-start gap-3 relative ${
                        isSelected
                          ? 'bg-surface-container-high'
                          : 'hover:bg-surface-container-low'
                      }`}
                    >
                      {hasUnread && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r" />
                      )}

                      {/* Group Icon Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">
                          {group.category === 'hackathon'
                            ? 'rocket_launch'
                            : group.category === 'academic'
                            ? 'science'
                            : 'apartment'}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`font-heading text-label-md truncate ${hasUnread ? 'font-bold text-on-surface' : 'font-semibold text-on-surface'}`}>
                            {group.name}
                          </span>
                          <span className="text-[10px] uppercase font-heading font-semibold text-outline">
                            {group.category}
                          </span>
                        </div>

                        <p className={`font-sans text-body-xs truncate ${hasUnread ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>
                          {group.lastMessage?.sender?.name ? `${group.lastMessage.sender.name.split(' ')[0]}: ` : ''}
                          {group.lastMessage?.content || 'No messages yet'}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-sans text-outline">
                          <span>{group.memberCount} members</span>
                        </div>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: Chat Window & Composer (Flexible Center) */}
        <div className="flex-1 flex flex-col bg-surface-container-lowest h-full overflow-hidden border-r border-surface-container/60">
          {activeDetails ? (
            <>
              {/* Chat Top Header */}
              <div className="p-space-sm md:p-space-md border-b border-surface-container/60 flex items-center justify-between bg-surface-container-lowest/90 backdrop-blur-xs">
                <div className="flex items-center gap-space-sm">
                  {isDirect ? (
                    <div 
                      className="flex items-center gap-space-sm cursor-pointer group"
                      onClick={() => navigate(`/profile/${otherUser?.rollNumber || otherUser?.id}`)}
                      title="View classmate profile"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-fixed to-secondary-fixed flex items-center justify-center font-heading font-bold text-on-primary-fixed-variant text-sm shadow-2xs group-hover:scale-105 transition-transform">
                        {getInitials(otherUser?.name)}
                      </div>
                      <div>
                        <h2 className="font-heading text-title-sm font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <span>{otherUser?.name}</span>
                          <span className="font-heading text-label-xs font-normal text-outline">
                            ({otherUser?.rollNumber})
                          </span>
                        </h2>
                        <p className="font-heading text-label-xs text-on-surface-variant">
                          {otherUser?.hostel || 'Hostel'} • Lab Group {otherUser?.labGroup || 'CC-03'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-space-sm">
                      <div className="w-10 h-10 rounded-xl bg-primary-fixed/50 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">
                          {activeDetails.category === 'hackathon' ? 'rocket_launch' : 'groups'}
                        </span>
                      </div>
                      <div>
                        <h2 className="font-heading text-title-sm font-bold text-on-surface flex items-center gap-2">
                          <span>{activeDetails.name}</span>
                          <span className="bg-surface-container text-on-surface-variant font-heading text-[10px] px-2 py-0.5 rounded-full font-medium uppercase">
                            {activeDetails.category}
                          </span>
                        </h2>
                        <p className="font-heading text-label-xs text-on-surface-variant">
                          {activeDetails.members?.length || 0} enrolled campus members
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Toggle Profile Summary Panel */}
                  <button
                    type="button"
                    onClick={() => setShowSummaryPanel(!showSummaryPanel)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      showSummaryPanel
                        ? 'bg-surface-container text-primary font-semibold'
                        : 'text-outline hover:text-on-surface hover:bg-surface-container'
                    }`}
                    title={showSummaryPanel ? 'Hide details panel' : 'Show details panel'}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isDirect ? 'person' : 'info'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Protocol Banner: If Awaiting Recipient Reply */}
              {isAwaitingReply && (
                <div className="p-3 bg-primary-fixed/20 border-b border-primary-fixed/40 flex items-center gap-2.5 px-space-md">
                  <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">
                    hourglass_empty
                  </span>
                  <p className="font-sans text-body-xs text-on-primary-fixed-variant leading-relaxed">
                    <strong>Awaiting {otherUser?.name}'s reply:</strong> To keep CampusConnect low-pressure and respectful, you can send another message once they reply.
                  </p>
                </div>
              )}

              {/* Protocol Banner: If New Introduction for Recipient */}
              {isNewIntroForMe && (
                <div className="p-3 bg-secondary-fixed/30 border-b border-secondary-fixed/50 flex items-center justify-between gap-3 px-space-md">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👋</span>
                    <p className="font-sans text-body-xs text-on-secondary-fixed-variant">
                      <strong>Say Hi Introduction:</strong> {otherUser?.name} sent you an introductory note. Replying unlocks regular two-way conversation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleIgnore}
                    className="text-on-secondary-fixed-variant hover:underline font-heading text-label-xs font-semibold flex-shrink-0"
                  >
                    Quietly Ignore
                  </button>
                </div>
              )}

              {/* Blocked Banner */}
              {isBlocked && (
                <div className="p-3 bg-error-container/20 border-b border-error/30 flex items-center justify-between gap-3 px-space-md text-error">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">block</span>
                    <p className="font-sans text-body-xs">
                      Communication with this student is blocked. Blocked users cannot message each other.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnblock(otherUser?.id)}
                    className="underline font-heading text-label-xs font-semibold"
                  >
                    Unblock
                  </button>
                </div>
              )}

              {/* Messages Scroll Stream */}
              <div className="flex-1 p-space-md overflow-y-auto flex flex-col gap-space-sm bg-surface-container-lowest">
                {loadingChat ? (
                  <div className="py-16 text-center text-outline font-heading text-label-sm">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center text-outline font-sans text-body-sm flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl">chat</span>
                    <span>No messages yet in this conversation.</span>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUser?.id;
                    const senderName = m.sender?.name || (isMe ? 'You' : otherUser?.name || 'Classmate');

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col max-w-[80%] ${
                          isMe ? 'self-end items-end' : 'self-start items-start'
                        }`}
                      >
                        {/* Sender Label for Group Chat */}
                        {!isDirect && !isMe && (
                          <span className="text-[11px] font-heading font-semibold text-on-surface-variant mb-1 px-1">
                            {senderName}
                          </span>
                        )}

                        {/* Icebreaker Tag */}
                        {m.isIcebreaker && (
                          <div className="flex items-center gap-1 mb-1 text-[10px] font-heading font-semibold text-primary uppercase tracking-wider">
                            <span>👋</span>
                            <span>Introductory Starter Note</span>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`p-3 rounded-2xl font-sans text-body-sm shadow-2xs leading-relaxed whitespace-pre-wrap break-words ${
                            isMe
                              ? 'bg-primary text-on-primary rounded-tr-xs'
                              : 'bg-surface-container-low text-on-surface rounded-tl-xs border border-outline-variant/30'
                          }`}
                        >
                          {m.content}
                        </div>

                        {/* Timestamp */}
                        <span className="font-sans text-[10px] text-outline mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Composer with Shift+Enter for newline */}
              <div className="p-space-sm md:p-space-md border-t border-surface-container/60 bg-surface-container-lowest">
                {errorMsg && (
                  <div className="mb-2 p-2 rounded-xl bg-error-container/20 border border-error/30 text-error font-sans text-body-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-end gap-space-sm">
                    <textarea
                      rows={2}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isBlocked || isAwaitingReply || sendingMessage}
                      placeholder={
                        isBlocked
                          ? 'Cannot message a blocked user'
                          : isAwaitingReply
                          ? 'Awaiting reply. You can send another message once they respond...'
                          : isNewIntroForMe
                          ? 'Type a reply to unlock regular conversation... (Enter to send)'
                          : 'Write a calm message... (Enter to send, Shift+Enter for newline)'
                      }
                      className="flex-1 bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-sm p-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                    />

                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={isBlocked || isAwaitingReply || !draft.trim() || sendingMessage}
                      className="px-4 py-3 rounded-xl bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary font-heading font-semibold text-label-md transition-colors shadow-xs flex items-center justify-center flex-shrink-0"
                      title="Send message (Enter)"
                    >
                      {sendingMessage ? (
                        <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-[20px]">send</span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-1 text-[11px] font-sans text-outline">
                    <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for newline</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary mb-3 shadow-xs">
                <span className="material-symbols-outlined text-3xl">
                  {isDirect ? 'chat' : 'groups'}
                </span>
              </div>
              <h3 className="font-heading text-title-md font-bold text-on-surface">
                {isDirect ? 'Select a Classmate Conversation' : 'Select a Campus Group Chat'}
              </h3>
              <p className="font-sans text-body-sm text-outline max-w-sm mt-1 mb-4">
                {isDirect
                  ? 'Connect for lab viva review, sphinx hackathon teams, or evening canteen chai.'
                  : 'Collaborate with your course lab group or technical fest committees.'}
              </p>
              {isDirect && (
                <button
                  onClick={() => navigate('/discover')}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary font-heading font-semibold text-label-md shadow-xs hover:bg-primary-container transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">person_search</span>
                  <span>Discover Classmates</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* COLUMN 3: Profile / Group Summary Panel (320px Right Rail) */}
        {showSummaryPanel && activeDetails && (
          <div className="w-full md:w-80 lg:w-84 border-l border-surface-container/60 bg-surface-container-lowest flex flex-col overflow-y-auto flex-shrink-0 animate-in slide-in-from-right duration-200">
            {isDirect && otherUser ? (
              /* Direct Classmate Profile Summary */
              <div className="p-space-md flex flex-col gap-space-md">
                
                {/* Header Profile Info */}
                <div className="flex flex-col items-center text-center pb-space-sm border-b border-surface-container/60">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-fixed to-secondary-fixed flex items-center justify-center font-heading font-bold text-on-primary-fixed-variant text-xl shadow-xs mb-2">
                    {getInitials(otherUser.name)}
                  </div>
                  <h3 className="font-heading text-title-sm font-bold text-on-surface">
                    {otherUser.name}
                  </h3>
                  <span className="font-heading text-label-xs text-outline mt-0.5">
                    {otherUser.rollNumber} • B.Tech CSE '{otherUser.batchYear || '2027'}
                  </span>
                  <div className="flex items-center gap-1 mt-1 text-[11px] font-sans text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px] text-primary">apartment</span>
                    <span>
                      {otherUser.hostel}
                      {otherUser.roomNo ? ` • Room ${otherUser.roomNo}` : otherUser.roomHidden ? ' • Room Hidden' : ''}
                    </span>
                  </div>
                </div>

                {/* About & Bio */}
                <div>
                  <h4 className="font-heading text-label-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    About
                  </h4>
                  <p className="font-sans text-body-xs text-on-surface leading-relaxed">
                    {otherUser.bio || otherUser.about || 'MNIT CSE student.'}
                  </p>
                </div>

                {/* Currently Learning Card */}
                {otherUser.currentlyLearning && (
                  <div className="p-2.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/30 flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0 mt-1" />
                    <div>
                      <span className="text-[10px] font-heading font-bold text-primary uppercase block">
                        Currently Learning:
                      </span>
                      <p className="font-sans text-body-xs text-on-surface">
                        {otherUser.currentlyLearning}
                      </p>
                    </div>
                  </div>
                )}

                {/* Technical Skills */}
                {otherUser.skills && otherUser.skills.length > 0 && (
                  <div>
                    <h4 className="font-heading text-label-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Technical Skills
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {otherUser.skills.map((skill) => (
                        <span
                          key={skill}
                          className="bg-surface-container-low text-primary font-heading text-[10px] px-2 py-0.5 rounded-md font-medium"
                        >
                          #{skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Open To Collaboration */}
                {otherUser.openTo && otherUser.openTo.length > 0 && (
                  <div>
                    <h4 className="font-heading text-label-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Open To
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {otherUser.openTo.map((item) => (
                        <span
                          key={item}
                          className="bg-surface-container-high/60 text-on-surface-variant font-heading text-[10px] px-2 py-0.5 rounded-full"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Privacy State */}
                <div className="p-2.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 flex flex-col gap-1">
                  <span className="text-[10px] font-heading font-bold text-outline uppercase">
                    Contact Visibility
                  </span>
                  {otherUser.contactHidden ? (
                    <div className="flex items-center gap-1.5 text-outline text-body-xs font-sans">
                      <span className="material-symbols-outlined text-[15px]">lock</span>
                      <span>Hidden by student's privacy preferences</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5 text-body-xs font-sans text-on-surface">
                      {otherUser.email && <span>Email: {otherUser.email}</span>}
                      {otherUser.phone && <span>Phone: {otherUser.phone}</span>}
                    </div>
                  )}
                </div>

                {/* Actions: View Profile, Ignore, Block, Report */}
                <div className="flex flex-col gap-2 pt-2 border-t border-surface-container/60">
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${otherUser.rollNumber || otherUser.id}`)}
                    className="w-full py-2 px-3 rounded-xl bg-primary text-on-primary font-heading text-label-sm font-semibold hover:bg-primary-container transition-colors text-center flex items-center justify-center gap-1 shadow-xs"
                  >
                    <span>View Full Commons Profile</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </button>

                  {isNewIntroForMe && (
                    <button
                      type="button"
                      onClick={handleIgnore}
                      className="w-full py-1.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-heading text-label-sm transition-colors text-center"
                    >
                      Quietly Ignore Introduction
                    </button>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    {isBlocked ? (
                      <button
                        type="button"
                        onClick={() => handleUnblock(otherUser.id)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-surface-container text-primary font-heading text-label-xs font-semibold hover:bg-surface-container-high transition-colors"
                      >
                        Unblock User
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBlock(otherUser.id)}
                        className="flex-1 py-1.5 px-2 rounded-lg border border-outline-variant/30 text-outline hover:text-error hover:bg-surface-container font-heading text-label-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">block</span>
                        <span>Block</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setReportTargetUser(otherUser)}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-outline-variant/30 text-outline hover:text-error hover:bg-surface-container font-heading text-label-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">flag</span>
                      <span>Report</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* Group Chat Details Summary */
              <div className="p-space-md flex flex-col gap-space-md">
                <div className="pb-space-sm border-b border-surface-container/60">
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed/50 flex items-center justify-center text-primary mb-2 shadow-2xs">
                    <span className="material-symbols-outlined text-[24px]">
                      {activeDetails.category === 'hackathon' ? 'rocket_launch' : 'groups'}
                    </span>
                  </div>
                  <h3 className="font-heading text-title-sm font-bold text-on-surface">
                    {activeDetails.name}
                  </h3>
                  <p className="font-sans text-body-xs text-on-surface-variant mt-1 leading-relaxed">
                    {activeDetails.description || 'Campus collaboration group.'}
                  </p>
                </div>

                <div>
                  <h4 className="font-heading text-label-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Enrolled Members ({activeDetails.members?.length || 0})
                  </h4>
                  <div className="flex flex-col gap-2">
                    {activeDetails.members?.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => navigate(`/profile/${m.rollNumber || m.id}`)}
                        className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low/60 hover:bg-surface-container cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-xs">
                            {getInitials(m.name)}
                          </div>
                          <div>
                            <span className="font-heading text-label-sm font-bold text-on-surface block">
                              {m.name}
                            </span>
                            <span className="text-[10px] font-sans text-outline">
                              {m.rollNumber}
                            </span>
                          </div>
                        </div>

                        {m.role === 'admin' && (
                          <span className="bg-primary-fixed/40 text-on-primary-fixed font-heading text-[10px] px-1.5 py-0.2 rounded font-semibold">
                            Admin
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Safety Report Modal */}
      <ReportModal
        targetUser={reportTargetUser}
        conversationId={activeId}
        isOpen={Boolean(reportTargetUser)}
        onClose={() => setReportTargetUser(null)}
        onSuccess={() => {
          showToast('Report received. Thank you for keeping MNIT CSE safe.');
          fetchLists(true);
        }}
      />
    </div>
  );
}
