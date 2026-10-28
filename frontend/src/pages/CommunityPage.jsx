import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

import CreatePostModal from '../components/community/CreatePostModal';
import EditPostModal from '../components/community/EditPostModal';
import PinnedAnnouncements from '../components/community/PinnedAnnouncements';
import PostCard from '../components/community/PostCard';
import SayHiModal from '../components/messages/SayHiModal';

const CATEGORIES = [
  'All Topics',
  'Questions',
  'Projects',
  'College Life',
  'Opportunities',
];

const POPULAR_TAGS = [
  '#CS204',
  '#NachosOS',
  '#Sphinx2025',
  '#Synchronization',
  '#TailwindCSS',
  '#Placements',
  '#Hostel5',
];

export default function CommunityPage() {
  const { currentUser } = useAuth();

  const [pinnedPosts, setPinnedPosts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeGroups, setActiveGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState('All Topics');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [sayHiPeer, setSayHiPeer] = useState(null);
  const [sayHiSuccessBanner, setSayHiSuccessBanner] = useState(null);

  // Fetch active campus groups for sidebar
  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setActiveGroups(data.groups || []);
      }
    } catch (e) {
      console.warn('Failed to load active study circles:', e);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Fetch posts from backend API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (activeCategory !== 'All Topics') {
        params.append('category', activeCategory);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (activeTag) {
        params.append('tag', activeTag);
      }

      const queryString = params.toString();
      const url = `/api/posts${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();

      if (res.ok) {
        setPinnedPosts(data.pinnedPosts || []);
        setPosts(data.posts || []);
      } else {
        throw new Error(data.message || 'Failed to fetch community posts');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeCategory, activeTag]);

  // Handle Search on Submit or Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  // Handle Post Created
  const handlePostCreated = (newPost) => {
    if (newPost.isPinned) {
      setPinnedPosts((prev) => [newPost, ...prev]);
    } else {
      setPosts((prev) => [newPost, ...prev]);
    }
  };

  // Handle Post Updated
  const handlePostUpdated = (updatedPost) => {
    if (updatedPost.isPinned) {
      setPinnedPosts((prev) =>
        prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
      );
    } else {
      setPosts((prev) =>
        prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
      );
    }
  };

  // Handle Post Deleted
  const handleDeletePost = (postId) => {
    setPinnedPosts((prev) => prev.filter((p) => p.id !== postId));
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // Handle Add Comment or Reply
  const handleAddComment = (postId, newComment, parentCommentId = null) => {
    const updatePostInList = (list) =>
      list.map((post) => {
        if (post.id !== postId) return post;

        let updatedComments = [...(post.comments || [])];
        if (parentCommentId) {
          // Add reply to target parent comment
          updatedComments = updatedComments.map((c) => {
            if (c.id === parentCommentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newComment],
              };
            }
            return c;
          });
        } else {
          // Add top-level comment
          updatedComments.push(newComment);
        }

        return {
          ...post,
          commentCount: post.commentCount + 1,
          comments: updatedComments,
        };
      });

    setPinnedPosts(updatePostInList);
    setPosts(updatePostInList);
  };

  // Handle Delete Comment
  const handleDeleteComment = (postId, commentId) => {
    const updatePostInList = (list) =>
      list.map((post) => {
        if (post.id !== postId) return post;

        let countRemoved = 0;
        // Check top-level or replies
        const updatedComments = post.comments
          .filter((c) => {
            if (c.id === commentId) {
              countRemoved += 1 + (c.replies ? c.replies.length : 0);
              return false;
            }
            return true;
          })
          .map((c) => ({
            ...c,
            replies: (c.replies || []).filter((r) => {
              if (r.id === commentId) {
                countRemoved += 1;
                return false;
              }
              return true;
            }),
          }));

        return {
          ...post,
          commentCount: Math.max(0, post.commentCount - countRemoved),
          comments: updatedComments,
        };
      });

    setPinnedPosts(updatePostInList);
    setPosts(updatePostInList);
  };

  // Handle Say Hi
  const handleOpenSayHi = (peer) => {
    setSayHiPeer(peer);
  };

  const handleSayHiSuccess = (conv, message) => {
    setSayHiSuccessBanner(`Introductory note dispatched to ${sayHiPeer?.name}!`);
    setTimeout(() => setSayHiSuccessBanner(null), 5000);
  };

  return (
    <div className="max-w-[1360px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Say Hi Success Toast */}
      {sayHiSuccessBanner && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-heading text-label-md flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">waving_hand</span>
            <span>{sayHiSuccessBanner}</span>
          </div>
          <Link to="/messages" className="underline font-semibold hover:text-emerald-900">
            View in Messages →
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-display-mobile sm:text-headline-lg font-bold text-on-surface">
              CSE Community Commons
            </h1>
            <span className="bg-primary-fixed text-on-primary-fixed-variant font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live Feed
            </span>
          </div>
          <p className="font-sans text-body-md text-on-surface-variant mt-1">
            Peer-led technical discussions, lab survival guides, and collaborative archives across all CSE batches at MNIT.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-heading text-label-md px-4 py-2.5 rounded-xl font-semibold shadow-xs transition-all flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Create Post</span>
        </button>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setActiveTag('');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-heading text-label-sm whitespace-nowrap transition-all ${
                activeCategory === cat && !activeTag
                  ? 'bg-primary text-on-primary font-bold shadow-2xs'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-outline-variant/30'
              }`}
            >
              {cat === 'Questions' && '❓ '}
              {cat === 'Projects' && '🚀 '}
              {cat === 'College Life' && '☕ '}
              {cat === 'Opportunities' && '💼 '}
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[260px] sm:min-w-[320px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts, topics, code or authors..."
            className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-sans text-body-sm pl-9 pr-9 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchPosts();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </form>
      </div>

      {/* Active Tag Filter Indicator */}
      {activeTag && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-outline font-sans">Filtered by tag:</span>
          <span className="inline-flex items-center gap-1 bg-primary-fixed text-on-primary-fixed-variant text-xs font-mono px-2.5 py-1 rounded-full font-semibold">
            <span>{activeTag}</span>
            <button
              type="button"
              onClick={() => setActiveTag('')}
              className="hover:text-primary p-0.5"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </span>
        </div>
      )}

      {/* Main Grid: Feed (8 cols) + Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-body-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{error}</span>
              </div>
              <button onClick={fetchPosts} className="underline hover:text-error">
                Retry
              </button>
            </div>
          )}

          {/* 1. SEPARATE PINNED ANNOUNCEMENTS SECTION */}
          {pinnedPosts.length > 0 && (
            <PinnedAnnouncements
              pinnedPosts={pinnedPosts}
              currentUser={currentUser}
              onOpenEdit={(p) => setEditingPost(p)}
              onDeletePost={handleDeletePost}
              onSayHi={handleOpenSayHi}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
            />
          )}

          {/* 2. REGULAR STUDENT POSTS SECTION */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1">
              <h2 className="font-heading text-headline-sm font-bold text-on-surface">
                Student Discussions &amp; Peer Posts
              </h2>
              <span className="text-[11px] font-mono text-outline">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </span>
            </div>

            {loading ? (
              <div className="p-16 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col items-center justify-center text-outline">
                <span className="animate-spin material-symbols-outlined text-[32px] text-primary mb-2">
                  progress_activity
                </span>
                <p className="font-heading text-body-md font-semibold">Loading community feed...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="p-12 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 text-center text-on-surface-variant flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-[42px] text-outline mb-2">
                  forum
                </span>
                <h3 className="font-heading text-headline-sm font-bold text-on-surface">
                  No posts found
                </h3>
                <p className="font-sans text-body-sm text-outline mt-1 max-w-sm">
                  {searchQuery || activeCategory !== 'All Topics'
                    ? 'No matching community posts for this category or search filter.'
                    : 'Be the first student to post a question or project in the commons!'}
                </p>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-4 bg-primary text-on-primary font-heading text-label-sm px-4 py-2 rounded-xl font-semibold shadow-xs"
                >
                  + Create Post
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onOpenEdit={(p) => setEditingPost(p)}
                  onDeletePost={handleDeletePost}
                  onSayHi={handleOpenSayHi}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                />
              ))
            )}
          </div>
        </div>

        {/* Community Side Rail (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-5 sticky top-20">
          
          {/* Active Study Circles */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container/60">
              <h3 className="font-heading text-label-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
                <span>Active Study Circles</span>
              </h3>
              <Link to="/groups" className="text-primary hover:underline text-xs font-heading font-semibold">
                View All →
              </Link>
            </div>

            <div className="flex flex-col gap-2.5">
              {activeGroups.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface-container-low text-center text-outline text-xs">
                  <span>No study circles yet. </span>
                  <Link to="/groups" className="text-primary hover:underline font-semibold">
                    Create one →
                  </Link>
                </div>
              ) : (
                activeGroups.slice(0, 4).map((group) => (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 flex flex-col gap-1 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-label-sm font-bold text-on-surface truncate">
                        {group.name}
                      </span>
                      <span className="text-[10px] font-mono bg-primary-fixed/50 text-on-primary-fixed-variant px-1.5 py-0.2 rounded font-semibold uppercase flex-shrink-0">
                        {group.category || 'Group'}
                      </span>
                    </div>
                    <p className="font-sans text-[11px] text-outline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-primary">groups</span>
                      <span>{group.memberCount} members</span>
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Popular Community Tags */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex flex-col gap-3">
            <h3 className="font-heading text-label-lg font-bold text-on-surface flex items-center gap-2 pb-2 border-b border-surface-container/60">
              <span className="material-symbols-outlined text-primary text-[20px]">tag</span>
              <span>Popular Tags</span>
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {Array.from(
                new Set([
                  ...posts.flatMap((p) => (p.tags || []).map((t) => (t.startsWith('#') ? t : `#${t}`))),
                  ...POPULAR_TAGS,
                ])
              )
                .slice(0, 9)
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setActiveTag(tag);
                      setActiveCategory('All Topics');
                    }}
                    className={`px-3 py-1 rounded-full font-mono text-[11px] transition-all ${
                      activeTag === tag
                        ? 'bg-primary text-on-primary font-bold shadow-2xs'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
            </div>
          </div>

          {/* Campus Commons Ground Rules */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/20 flex flex-col gap-2.5 text-xs text-on-surface-variant leading-relaxed">
            <h4 className="font-heading text-label-md font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
              <span>CampusConnect Principles</span>
            </h4>
            <p>
              • <strong>Say Hi, Not Connect:</strong> Start meaningful conversations directly with post authors using the Say Hi note.
            </p>
            <p>
              • <strong>Zero Vanity Metrics:</strong> No follower counts, popularity scores, or viral algorithms anywhere.
            </p>
            <p>
              • <strong>Author Sovereignty:</strong> You retain complete ownership to edit or delete your posts and comments at any time.
            </p>
          </div>

        </aside>

      </div>

      {/* Modals */}
      <CreatePostModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      {editingPost && (
        <EditPostModal
          isOpen={Boolean(editingPost)}
          onClose={() => setEditingPost(null)}
          post={editingPost}
          onPostUpdated={handlePostUpdated}
        />
      )}

      {sayHiPeer && (
        <SayHiModal
          peer={sayHiPeer}
          isOpen={Boolean(sayHiPeer)}
          onClose={() => setSayHiPeer(null)}
          onSuccess={handleSayHiSuccess}
        />
      )}
    </div>
  );
}
