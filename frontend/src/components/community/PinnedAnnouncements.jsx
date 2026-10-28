import React from 'react';
import PostCard from './PostCard';

export default function PinnedAnnouncements({
  pinnedPosts,
  currentUser,
  onOpenEdit,
  onDeletePost,
  onSayHi,
  onAddComment,
  onDeleteComment,
}) {
  if (!pinnedPosts || pinnedPosts.length === 0) return null;

  return (
    <section className="mb-6 flex flex-col gap-3">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">push_pin</span>
          </div>
          <h2 className="font-heading text-headline-sm font-bold text-on-surface">
            Pinned Announcements ({pinnedPosts.length})
          </h2>
        </div>
        <span className="text-[11px] font-mono text-outline bg-surface-container px-2.5 py-1 rounded-full border border-outline-variant/30">
          Official &amp; Core Updates
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {pinnedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
            onOpenEdit={onOpenEdit}
            onDeletePost={onDeletePost}
            onSayHi={onSayHi}
            onAddComment={onAddComment}
            onDeleteComment={onDeleteComment}
          />
        ))}
      </div>
    </section>
  );
}
