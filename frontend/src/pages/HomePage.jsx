import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SayHiModal from '../components/messages/SayHiModal';

export default function HomePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // 1. Composer State
  const [composerContent, setComposerContent] = useState('');
  const [composerTitle, setComposerTitle] = useState('');
  const [composerCategory, setComposerCategory] = useState('Questions');
  const [composerTags, setComposerTags] = useState('');
  const [composerPosting, setComposerPosting] = useState(false);
  const [composerError, setComposerError] = useState('');
  const [composerSuccess, setComposerSuccess] = useState(false);

  // 2. Feed Posts State
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [selectedFeedCategory, setSelectedFeedCategory] = useState('All');

  // 3. Pinned Announcements & Deadlines
  const [pinnedUpdates, setPinnedUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(true);

  // 4. Upcoming Events
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  // 5. Group Invitations State
  const [groupInvitations, setGroupInvitations] = useState([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [inviteActionId, setInviteActionId] = useState(null);

  // 6. People You May Know State
  const [suggestedPeers, setSuggestedPeers] = useState([]);
  const [peersLoading, setPeersLoading] = useState(true);

  // 7. Say Hi Modal State
  const [sayHiPeer, setSayHiPeer] = useState(null);
  const [isSayHiOpen, setIsSayHiOpen] = useState(false);

  // Fetch Community Feed Posts
  const fetchPosts = useCallback(async () => {
    try {
      setPostsLoading(true);
      const url =
        selectedFeedCategory && selectedFeedCategory !== 'All'
          ? `/api/posts?category=${encodeURIComponent(selectedFeedCategory)}`
          : '/api/posts';
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.posts) {
        setPosts(data.posts.slice(0, 5)); // Recent 5 posts
      }
    } catch (err) {
      console.warn('Error fetching home posts:', err);
    } finally {
      setPostsLoading(false);
    }
  }, [selectedFeedCategory]);

  // Fetch Pinned Announcements & Deadlines
  const fetchPinnedUpdates = async () => {
    try {
      setUpdatesLoading(true);
      const res = await fetch('/api/updates?isOfficial=true', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.items) {
        setPinnedUpdates(data.items.slice(0, 3));
      }
    } catch (err) {
      console.warn('Error fetching pinned updates:', err);
    } finally {
      setUpdatesLoading(false);
    }
  };

  // Fetch Upcoming Events
  const fetchUpcomingEvents = async () => {
    try {
      const res = await fetch('/api/updates?tab=Events', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.items) {
        setUpcomingEvents(data.items.slice(0, 3));
      }
    } catch (err) {
      console.warn('Error fetching upcoming events:', err);
    }
  };

  // Fetch Pending Group Invitations
  const fetchGroupInvitations = async () => {
    try {
      setInvitationsLoading(true);
      const res = await fetch('/api/groups/invitations', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.invitations) {
        setGroupInvitations(data.invitations);
      }
    } catch (err) {
      console.warn('Error fetching invitations:', err);
    } finally {
      setInvitationsLoading(false);
    }
  };

  // Fetch People You May Know
  const fetchSuggestedPeers = async () => {
    try {
      setPeersLoading(true);
      const res = await fetch('/api/users/discover', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.peers) {
        // Filter out self and take top 6 peers
        const peers = data.peers.filter((p) => p.id !== currentUser?.id).slice(0, 6);
        setSuggestedPeers(peers);
      }
    } catch (err) {
      console.warn('Error fetching suggested peers:', err);
    } finally {
      setPeersLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchPinnedUpdates();
    fetchUpcomingEvents();
    fetchGroupInvitations();
    fetchSuggestedPeers();
  }, [fetchPosts]);

  // Post Submission from Home Composer
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!composerContent.trim()) {
      setComposerError('Please write something before posting.');
      return;
    }

    setComposerPosting(true);
    setComposerError('');

    try {
      const defaultTitle =
        composerTitle.trim() ||
        composerContent.trim().slice(0, 60).replace(/\n/g, ' ') + (composerContent.length > 60 ? '...' : '');

      const payload = {
        title: defaultTitle,
        content: composerContent.trim(),
        category: composerCategory,
        tags: composerTags
          ? composerTags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
          : [],
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to post to feed');
      }

      // Prepend to posts list
      setPosts((prev) => [data.post, ...prev]);
      setComposerContent('');
      setComposerTitle('');
      setComposerTags('');
      setComposerSuccess(true);
      setTimeout(() => setComposerSuccess(false), 2500);
    } catch (err) {
      setComposerError(err.message);
    } finally {
      setComposerPosting(false);
    }
  };

  // Handle Post Like
  const handleLikePost = async (postId) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, hasLiked: data.hasLiked, likeCount: data.likeCount } : p
          )
        );
      }
    } catch (err) {
      console.warn('Like error:', err);
    }
  };

  // Accept Group Invitation
  const handleAcceptInvite = async (groupId, groupName) => {
    setInviteActionId(groupId);
    try {
      const res = await fetch(`/api/groups/${groupId}/invitations/accept`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setGroupInvitations((prev) => prev.filter((inv) => inv.groupId !== groupId));
        alert(`You have joined "${groupName}"!`);
      } else {
        alert(data.message || 'Failed to accept invitation');
      }
    } catch (err) {
      alert(`Error accepting invitation: ${err.message}`);
    } finally {
      setInviteActionId(null);
    }
  };

  // Decline Group Invitation
  const handleDeclineInvite = async (groupId) => {
    setInviteActionId(groupId);
    try {
      const res = await fetch(`/api/groups/${groupId}/invitations/decline`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setGroupInvitations((prev) => prev.filter((inv) => inv.groupId !== groupId));
      } else {
        alert(data.message || 'Failed to decline invitation');
      }
    } catch (err) {
      alert(`Error declining invitation: ${err.message}`);
    } finally {
      setInviteActionId(null);
    }
  };

  // Open Say Hi Modal for a Peer
  const handleOpenSayHi = (peer) => {
    setSayHiPeer(peer);
    setIsSayHiOpen(true);
  };

  const getFirstName = (name) => (name ? name.split(' ')[0] : 'there');

  return (
    <div className="max-w-[1360px] mx-auto w-full px-space-md lg:px-space-xl py-space-md flex flex-col gap-space-lg">
      
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary-container/20 to-surface-container-high p-6 sm:p-8 border border-outline-variant/30 shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-surface-container-lowest text-primary font-heading text-label-sm px-3 py-1 rounded-full shadow-2xs font-bold border border-primary/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                MNIT CSE COMMONS
              </span>
              <span className="text-on-surface-variant font-heading text-label-sm">
                Odd Semester 2024-25 • Department of Computer Science &amp; Engineering
              </span>
            </div>
            <h1 className="font-heading text-headline-lg font-bold text-on-surface tracking-tight flex items-center gap-2">
              Hey, {getFirstName(currentUser?.name)}! <span className="inline-block hover:rotate-12 transition-transform cursor-default">👋</span>
            </h1>
            <p className="font-sans text-body-md text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
              Your genuine CSE community at MNIT Jaipur. Check announcements, ask for lab viva tips, connect with seniors, or collaborate with peers.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
            <Link
              to="/seniors"
              className="inline-flex items-center gap-1.5 bg-surface-container-lowest hover:bg-surface-container text-primary font-heading text-label-md px-3.5 py-2.5 rounded-2xl font-bold border border-outline-variant/30 shadow-2xs transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">school</span>
              <span>Senior Guidance</span>
            </Link>
            <Link
              to="/discover"
              className="inline-flex items-center gap-1.5 bg-primary text-on-primary hover:bg-primary/90 font-heading text-label-md px-4 py-2.5 rounded-2xl font-bold shadow-xs transition-all hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>Discover Peers</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Group Invitations Waiting for Me Banner (If any) */}
      {groupInvitations.length > 0 && (
        <section className="bg-gradient-to-r from-secondary-container/30 via-surface-container-lowest to-surface-container-lowest rounded-3xl p-5 sm:p-6 border-2 border-secondary/30 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">
                mail
              </span>
              <h2 className="font-heading text-title-md font-bold text-on-surface">
                Group invitations waiting for you ({groupInvitations.length})
              </h2>
            </div>
            <Link
              to="/groups"
              className="font-heading text-label-sm font-semibold text-secondary hover:underline"
            >
              Manage all groups →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {groupInvitations.map((inv) => (
              <div
                key={inv.invitationId}
                className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-heading text-label-lg font-bold text-on-surface">
                      {inv.groupName}
                    </span>
                    <span className="text-[10px] bg-secondary/10 text-secondary font-heading font-bold px-2 py-0.5 rounded-full uppercase">
                      {inv.category}
                    </span>
                  </div>
                  <p className="font-sans text-body-sm text-on-surface-variant line-clamp-2">
                    {inv.description}
                  </p>
                  {inv.invitedBy && (
                    <span className="font-sans text-[11px] text-outline block mt-2">
                      Invited by <strong className="text-on-surface">{inv.invitedBy.name}</strong> ({inv.invitedBy.rollNumber})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-surface-container/60">
                  <button
                    onClick={() => handleAcceptInvite(inv.groupId, inv.groupName)}
                    disabled={inviteActionId === inv.groupId}
                    className="flex-1 bg-primary text-on-primary hover:bg-primary/90 font-heading text-label-sm font-bold py-2 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Accept &amp; Join</span>
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(inv.groupId)}
                    disabled={inviteActionId === inv.groupId}
                    className="px-3 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-heading text-label-sm font-semibold rounded-xl transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main 3-Column Asymmetric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        
        {/* Left Column (7 cols): Composer + Feed Preview + People You May Know */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          
          {/* Post Composer Card */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-xs border border-outline-variant/35 transition-all flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <img
                src={
                  currentUser?.avatarUrl ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.name || 'Student'}`
                }
                alt={currentUser?.name}
                className="w-10 h-10 rounded-2xl object-cover border border-outline-variant/30 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <textarea
                  value={composerContent}
                  onChange={(e) => setComposerContent(e.target.value)}
                  placeholder="Share a Nachos lab insight, ask about viva topics, or find project buddies..."
                  rows={2}
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-md p-3 rounded-2xl focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border border-outline-variant/25 transition-all resize-none"
                />
              </div>
            </div>

            {composerError && (
              <span className="text-error text-[12px] font-sans px-1">
                {composerError}
              </span>
            )}

            {composerSuccess && (
              <span className="text-emerald-600 dark:text-emerald-400 text-[12px] font-heading font-semibold px-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Post published to Campus Community!</span>
              </span>
            )}

            {/* Composer Category Strip & Post Button */}
            <div className="pt-2 border-t border-surface-container/70 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'Questions', label: 'Question', icon: 'help_outline' },
                  { id: 'Projects', label: 'Project', icon: 'code' },
                  { id: 'College Life', label: 'Campus Life', icon: 'coffee' },
                  { id: 'Opportunities', label: 'Opportunity', icon: 'campaign' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setComposerCategory(cat.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1.2 rounded-xl text-[12px] font-heading transition-all ${
                      composerCategory === cat.id
                        ? 'bg-primary text-on-primary font-bold shadow-2xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCreatePost}
                disabled={composerPosting}
                className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-on-primary font-heading text-label-sm font-bold px-4 py-2 rounded-xl shadow-xs transition-all hover:scale-[1.02]"
              >
                <span>{composerPosting ? 'Posting...' : 'Post to Feed'}</span>
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </div>
          </div>

          {/* Community Feed Preview Header & Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="font-heading text-title-lg font-bold text-on-surface flex items-center gap-2">
                  <span>Community Feed</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h2>
                <p className="font-sans text-body-sm text-on-surface-variant">
                  Real discussions from MNIT CSE undergrads
                </p>
              </div>

              <Link
                to="/community"
                className="font-heading text-label-sm font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>View all discussions</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[12px]">
              {['All', 'Questions', 'Projects', 'College Life', 'Opportunities'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFeedCategory(cat)}
                  className={`px-3 py-1 rounded-full font-heading font-semibold whitespace-nowrap transition-all ${
                    selectedFeedCategory === cat
                      ? 'bg-primary text-on-primary shadow-2xs'
                      : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-outline-variant/25'
                  }`}
                >
                  {cat === 'All' ? 'All Discussions' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Feed Posts List */}
          <div className="flex flex-col gap-4">
            {postsLoading ? (
              <div className="py-12 text-center text-outline flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[28px] animate-spin text-primary">
                  progress_activity
                </span>
                <span className="text-body-sm font-heading">Loading community posts...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-3xl p-8 text-center border border-outline-variant/30 text-on-surface-variant">
                <p className="font-sans text-body-md">No posts yet in this category. Be the first to start a conversation!</p>
              </div>
            ) : (
              posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-2xs border border-outline-variant/30 hover:border-outline-variant/60 transition-all flex flex-col gap-3"
                >
                  {/* Post Author Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Link to={`/profile/${post.author?.id}`}>
                        <img
                          src={
                            post.author?.avatarUrl ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${post.author?.name}`
                          }
                          alt={post.author?.name}
                          className="w-10 h-10 rounded-2xl object-cover border border-outline-variant/30"
                        />
                      </Link>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/profile/${post.author?.id}`}
                            className="font-heading text-title-sm font-bold text-on-surface hover:text-primary transition-colors"
                          >
                            {post.author?.name}
                          </Link>
                          <span className="bg-surface-container text-on-surface-variant font-heading text-[11px] font-semibold px-2 py-0.5 rounded-full">
                            {post.author?.batchYear ? `Batch '${String(post.author.batchYear).slice(-2)}` : 'CSE'}
                            {post.author?.hostel ? ` • ${post.author.hostel}` : ''}
                          </span>
                        </div>
                        <span className="text-[11px] font-sans text-outline">
                          {new Date(post.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <span className="bg-primary/10 text-primary font-heading text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-primary/20">
                      {post.category}
                    </span>
                  </div>

                  {/* Title & Body */}
                  {post.title && (
                    <h3 className="font-heading text-title-md font-bold text-on-surface leading-snug">
                      {post.title}
                    </h3>
                  )}
                  <p className="font-sans text-body-md text-on-surface-variant leading-relaxed line-clamp-4">
                    {post.content}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-surface-container text-on-surface-variant font-heading text-[11px] font-medium px-2 py-0.5 rounded"
                        >
                          #{tag.replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Actions: Likes, Comments, and SAY HI button */}
                  <div className="pt-3 border-t border-surface-container/70 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className={`inline-flex items-center gap-1 font-heading text-[12px] font-semibold transition-colors px-2.5 py-1 rounded-xl ${
                          post.hasLiked
                            ? 'text-primary bg-primary/10'
                            : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-[17px] ${post.hasLiked ? 'fill-1' : ''}`}>
                          favorite
                        </span>
                        <span>{post.likeCount || 0}</span>
                      </button>

                      <Link
                        to="/community"
                        className="inline-flex items-center gap-1 font-heading text-[12px] font-semibold text-on-surface-variant hover:text-primary px-2.5 py-1 rounded-xl hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-[17px]">forum</span>
                        <span>{post.commentCount || 0} comments</span>
                      </Link>
                    </div>

                    {/* Friendly Say Hi Button (Strictly NO Connect button!) */}
                    {post.author && currentUser?.id !== post.author.id && (
                      <button
                        onClick={() => handleOpenSayHi(post.author)}
                        className="inline-flex items-center gap-1 bg-primary/10 hover:bg-primary hover:text-on-primary text-primary font-heading text-[12px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs border border-primary/20"
                        title={`Say Hi to ${post.author.name}`}
                      >
                        <span>👋</span>
                        <span>Say Hi</span>
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>

          {/* "People you may know" Section */}
          <section className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 border border-outline-variant/35 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="font-heading text-title-lg font-bold text-on-surface flex items-center gap-2">
                  <span>People you may know</span>
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    diversity_3
                  </span>
                </h2>
                <p className="font-sans text-body-sm text-on-surface-variant">
                  Fellow CSE peers in your batch or hostel with similar interests
                </p>
              </div>

              <Link
                to="/discover"
                className="font-heading text-label-sm font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>Browse all peers</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {peersLoading ? (
              <div className="py-8 text-center text-outline">Loading peers...</div>
            ) : suggestedPeers.length === 0 ? (
              <div className="py-6 text-center text-outline text-body-sm">
                No new suggestions at this moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {suggestedPeers.map((peer) => (
                  <div
                    key={peer.id}
                    className="bg-surface-container-low/50 hover:bg-surface-container-low p-4 rounded-2xl border border-outline-variant/25 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <Link to={`/profile/${peer.id}`}>
                        <img
                          src={
                            peer.avatarUrl ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${peer.name}`
                          }
                          alt={peer.name}
                          className="w-11 h-11 rounded-2xl object-cover border border-outline-variant/30 flex-shrink-0 group-hover:ring-2 ring-primary/40 transition-all"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/profile/${peer.id}`}
                          className="font-heading text-title-sm font-bold text-on-surface hover:text-primary transition-colors block truncate"
                        >
                          {peer.name}
                        </Link>
                        <span className="text-[11px] font-sans text-outline block truncate">
                          {peer.batchYear ? `Batch '${String(peer.batchYear).slice(-2)}` : 'CSE'} • {peer.hostel || 'Campus'}
                        </span>
                        {peer.skills && peer.skills.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-1 text-[10px] text-primary">
                            {peer.skills.slice(0, 2).map((s) => (
                              <span key={s} className="bg-primary/10 px-1.5 py-0.2 rounded font-heading font-semibold">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Friendly Say Hi Button on Peer Card */}
                    <div className="pt-2 border-t border-surface-container/60 flex items-center justify-between">
                      <Link
                        to={`/profile/${peer.id}`}
                        className="text-[11px] font-heading font-semibold text-outline hover:text-on-surface"
                      >
                        Profile
                      </Link>

                      <button
                        onClick={() => handleOpenSayHi(peer)}
                        className="inline-flex items-center gap-1 bg-primary text-on-primary hover:bg-primary/90 font-heading text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-all hover:scale-[1.02]"
                        title={`Say Hi to ${peer.name}`}
                      >
                        <span>👋</span>
                        <span>Say Hi</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right Rail (5 cols): Pinned Announcements & Deadlines + Upcoming Events */}
        <aside className="lg:col-span-5 flex flex-col gap-space-lg">
          
          {/* Pinned Announcements & Deadlines */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-xs border border-outline-variant/35 flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[18px]">push_pin</span>
                </div>
                <div>
                  <h2 className="font-heading text-title-md font-bold text-on-surface">
                    Pinned Circulars &amp; Deadlines
                  </h2>
                  <span className="text-[11px] font-sans text-outline">Verified Institute Notices</span>
                </div>
              </div>

              <Link
                to="/opportunities"
                className="text-primary hover:underline text-[12px] font-heading font-semibold"
              >
                View all →
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {updatesLoading ? (
                <div className="py-6 text-center text-outline text-body-sm">
                  Loading circulars...
                </div>
              ) : pinnedUpdates.length === 0 ? (
                <div className="py-6 text-center text-outline text-body-sm">
                  No pinned notices at this time.
                </div>
              ) : (
                pinnedUpdates.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/25 transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="bg-primary/10 text-primary font-heading text-[11px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                        🏛️ Official Notice
                      </span>
                      {item.deadlineText && (
                        <span className="text-[11px] font-heading font-semibold text-error bg-error-container/20 px-2 py-0.5 rounded">
                          {item.deadlineText}
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading text-label-lg font-bold text-on-surface leading-snug">
                      {item.title}
                    </h3>

                    <p className="font-sans text-body-sm text-on-surface-variant line-clamp-2">
                      {item.description}
                    </p>

                    <div className="pt-2 border-t border-surface-container/60 flex items-center justify-between text-[11px]">
                      <span className="text-outline truncate max-w-[180px]">
                        {item.organizer || 'Academic Section'}
                      </span>
                      <Link
                        to="/opportunities"
                        className="text-primary hover:underline font-heading font-semibold"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-xs border border-outline-variant/35 flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[18px]">event</span>
                </div>
                <div>
                  <h2 className="font-heading text-title-md font-bold text-on-surface">
                    Upcoming Events
                  </h2>
                  <span className="text-[11px] font-sans text-outline">Workshops, Hackathons &amp; Vivas</span>
                </div>
              </div>

              <Link
                to="/opportunities"
                className="text-primary hover:underline text-[12px] font-heading font-semibold"
              >
                Calendar →
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {upcomingEvents.length === 0 ? (
                <div className="py-6 text-center text-outline text-body-sm">
                  No upcoming events scheduled.
                </div>
              ) : (
                upcomingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-2xl bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/25 transition-all flex items-start gap-3"
                  >
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex flex-col items-center justify-center text-primary flex-shrink-0 font-heading">
                      <span className="text-[10px] uppercase font-bold text-outline">Date</span>
                      <span className="text-[14px] font-bold">
                        {ev.deadline
                          ? new Date(ev.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : 'TBD'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading text-label-md font-bold text-on-surface leading-tight">
                        {ev.title}
                      </h4>
                      <p className="font-sans text-[12px] text-on-surface-variant truncate mt-0.5">
                        {ev.venue || 'MNIT Campus'}
                      </p>
                      {ev.deadlineText && (
                        <span className="text-[11px] font-heading text-primary font-medium block mt-0.5">
                          {ev.deadlineText}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low-Pressure Campus Note */}
          <div className="p-4 rounded-2xl bg-surface-container-low/40 border border-outline-variant/20 text-center">
            <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
              Saying Hi is never about building follower counts or formal connections. CampusConnect is about casual peer chat, asking about labs, or brainstorming project ideas.
            </p>
          </div>

        </aside>
      </div>

      {/* Say Hi Modal */}
      <SayHiModal
        peer={sayHiPeer}
        isOpen={isSayHiOpen}
        onClose={() => {
          setIsSayHiOpen(false);
          setSayHiPeer(null);
        }}
        onSuccess={() => {
          setIsSayHiOpen(false);
          setSayHiPeer(null);
        }}
      />
    </div>
  );
}
