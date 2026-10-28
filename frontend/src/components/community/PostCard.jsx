import React, { useState } from 'react';

export default function PostCard({
  post,
  currentUser,
  onOpenEdit,
  onDeletePost,
  onSayHi,
  onAddComment,
  onDeleteComment,
}) {
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState(null);
  const [hasLiked, setHasLiked] = useState(Boolean(post.hasLiked));
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [likeLoading, setLikeLoading] = useState(false);

  const isAuthor = post.isAuthor || post.author?.id === currentUser?.id;
  const isPinned = Boolean(post.isPinned);

  const handleToggleLike = async () => {
    if (likeLoading) return;
    try {
      setLikeLoading(true);
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setHasLiked(data.hasLiked);
        setLikeCount(data.likeCount);
      }
    } catch (err) {
      console.warn('Like toggle failed:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!post.codeSnippet) return;
    navigator.clipboard.writeText(post.codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      setDeletingPost(true);
      setError(null);
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete post');
      }
      onDeletePost(post.id);
    } catch (err) {
      setError(err.message);
      setDeletingPost(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e?.preventDefault();
    if (!newCommentText.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      setError(null);
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newCommentText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit comment');
      }
      setNewCommentText('');
      onAddComment(post.id, data.comment);
      setCommentsExpanded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (parentCommentId) => {
    if (!replyText.trim() || submittingReply) return;

    try {
      setSubmittingReply(true);
      setError(null);
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: replyText.trim(),
          parentId: parentCommentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to post reply');
      }
      setReplyText('');
      setReplyingToCommentId(null);
      onAddComment(post.id, data.comment, parentCommentId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await fetch(`/api/posts/${post.id}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete comment');
      onDeleteComment(post.id, commentId);
    } catch (err) {
      alert(err.message);
    }
  };

  // Category styling
  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Questions':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'Projects':
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
      case 'College Life':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'Opportunities':
        return 'bg-primary-fixed text-on-primary-fixed-variant border-primary/30';
      default:
        return 'bg-surface-container text-on-surface-variant border-outline-variant/30';
    }
  };

  return (
    <article
      className={`rounded-2xl p-5 shadow-xs border transition-all flex flex-col gap-3.5 ${
        isPinned
          ? 'bg-primary-fixed/15 border-primary/40 ring-1 ring-primary/20'
          : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant/60'
      }`}
    >
      {/* Top Banner if Pinned */}
      {isPinned && (
        <div className="flex items-center gap-1.5 text-primary text-[11px] font-heading font-bold uppercase tracking-wider pb-1">
          <span className="material-symbols-outlined text-[16px]">push_pin</span>
          <span>Pinned Announcement</span>
        </div>
      )}

      {/* Author Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-heading font-bold text-sm flex-shrink-0 overflow-hidden shadow-2xs">
            {post.author?.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.name}
                className="w-full h-full object-cover"
              />
            ) : (
              post.author?.name?.charAt(0) || 'U'
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading text-label-lg font-bold text-on-surface truncate">
                {post.author?.name}
              </span>
              <span className="font-mono text-[11px] text-outline bg-surface-container px-1.5 py-0.2 rounded">
                {post.author?.rollNumber}
              </span>
              {isAuthor && (
                <span className="bg-primary/10 text-primary font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold">
                  Author
                </span>
              )}
            </div>

            <p className="font-sans text-[11px] text-on-surface-variant truncate">
              {post.author?.hostel ? `${post.author.hostel} • ` : ''}
              {post.author?.batchYear ? `Batch '${String(post.author.batchYear).slice(2)}` : 'CSE'}
              <span className="text-outline font-mono ml-1.5">
                • {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </p>
          </div>
        </div>

        {/* Right Action: Say Hi OR Author Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* SAY HI BUTTON - Absolutely NO Connect button! */}
          {currentUser && currentUser.id !== post.author?.id && (
            <button
              type="button"
              onClick={() => onSayHi(post.author)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed-variant font-heading text-label-sm font-semibold shadow-2xs transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">waving_hand</span>
              <span>Say Hi</span>
            </button>
          )}

          {/* Author Controls: Edit & Delete */}
          {isAuthor && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpenEdit(post)}
                className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                title="Edit Post"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button
                type="button"
                onClick={handleDeletePost}
                disabled={deletingPost}
                className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                title="Delete Post"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-error/10 text-error text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Category Badge & Post Title */}
      <div>
        <div className="mb-1.5">
          <span
            className={`font-heading text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryBadge(
              post.category
            )}`}
          >
            {post.category}
          </span>
        </div>

        {post.title && (
          <h2 className="font-heading text-headline-sm font-bold text-on-surface leading-snug">
            {post.title}
          </h2>
        )}
      </div>

      {/* Content */}
      <p className="font-sans text-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Code Snippet Card (if present) */}
      {post.codeSnippet && (
        <div className="rounded-xl overflow-hidden bg-slate-950 text-slate-100 border border-slate-800 text-xs font-mono my-1">
          <div className="bg-slate-900/90 px-3.5 py-1.5 flex items-center justify-between border-b border-slate-800 text-[11px] text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              <span className="font-bold text-slate-300 uppercase">
                {post.codeLanguage || 'cpp'}
              </span>
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">
                {copiedCode ? 'check' : 'content_copy'}
              </span>
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3.5 overflow-x-auto text-[12px] leading-relaxed font-mono">
            <code>{post.codeSnippet}</code>
          </pre>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.tags.map((t) => (
            <span
              key={t}
              className="bg-surface-container text-primary font-mono text-[11px] px-2.5 py-0.5 rounded-full font-medium"
            >
              #{t.replace(/^#/, '')}
            </span>
          ))}
        </div>
      )}

      {/* Footer / Likes & Comments Toggle */}
      <div className="pt-3 flex items-center justify-between border-t border-surface-container/60 gap-2 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={likeLoading}
            className={`inline-flex items-center gap-1.5 font-heading text-[12px] font-semibold transition-colors px-2.5 py-1 rounded-xl ${
              hasLiked
                ? 'text-primary bg-primary/10'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
            }`}
            title={hasLiked ? 'Unlike post' : 'Like post'}
          >
            <span className={`material-symbols-outlined text-[17px] ${hasLiked ? 'fill-1' : ''}`}>
              favorite
            </span>
            <span>{likeCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setCommentsExpanded(!commentsExpanded)}
            className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary font-heading text-label-md font-semibold transition-colors px-2 py-1 rounded-xl hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">
              {commentsExpanded ? 'chat_bubble' : 'chat_bubble_outline'}
            </span>
            <span>
              {post.commentCount} {post.commentCount === 1 ? 'Thought' : 'Thoughts'}
            </span>
            <span className="material-symbols-outlined text-[16px]">
              {commentsExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        <span className="font-mono text-[11px] text-outline">
          MNIT CSE Peer Commons
        </span>
      </div>

      {/* Threaded Comments & Replies Section */}
      {commentsExpanded && (
        <div className="pt-3 border-t border-surface-container/60 flex flex-col gap-3 animate-in fade-in duration-200">
          
          {/* Add top-level comment input */}
          <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Share a thoughtful reply or answer..."
              className="flex-1 bg-surface-container-low text-on-surface placeholder:text-outline font-sans text-body-sm px-3.5 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest"
            />
            <button
              type="submit"
              disabled={!newCommentText.trim() || submittingComment}
              className="bg-primary hover:bg-primary-container text-on-primary font-heading text-label-sm px-4 py-2 rounded-xl font-semibold shadow-2xs disabled:opacity-40 transition-all flex-shrink-0"
            >
              {submittingComment ? 'Posting...' : 'Comment'}
            </button>
          </form>

          {/* Comments List */}
          {post.comments && post.comments.length > 0 ? (
            <div className="flex flex-col gap-3 pt-2">
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20 flex flex-col gap-2"
                >
                  {/* Comment Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-heading font-bold text-xs flex-shrink-0">
                        {comment.author?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="font-heading text-label-sm font-bold text-on-surface">
                        {comment.author?.name}
                      </span>
                      <span className="font-mono text-[10px] text-outline">
                        {comment.author?.rollNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentUser && currentUser.id !== comment.author?.id && (
                        <button
                          type="button"
                          onClick={() => onSayHi(comment.author)}
                          className="text-primary hover:underline text-[11px] font-heading font-semibold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">waving_hand</span>
                          <span>Say Hi</span>
                        </button>
                      )}

                      {comment.isAuthor && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-outline hover:text-error p-0.5"
                          title="Delete Comment"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment Content */}
                  <p className="font-sans text-body-sm text-on-surface-variant pl-9 leading-relaxed">
                    {comment.content}
                  </p>

                  {/* Reply Action */}
                  <div className="pl-9 flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setReplyingToCommentId(
                          replyingToCommentId === comment.id ? null : comment.id
                        )
                      }
                      className="text-primary hover:underline text-xs font-heading font-semibold flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">reply</span>
                      <span>Reply</span>
                    </button>
                  </div>

                  {/* Nested Reply Input Box */}
                  {replyingToCommentId === comment.id && (
                    <div className="pl-9 pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${comment.author?.name}...`}
                        className="flex-1 bg-surface-container-lowest text-on-surface placeholder:text-outline font-sans text-body-sm px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={!replyText.trim() || submittingReply}
                        className="bg-primary text-on-primary font-heading text-label-sm px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40"
                      >
                        {submittingReply ? '...' : 'Reply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyingToCommentId(null)}
                        className="text-outline hover:text-on-surface text-xs font-sans px-1"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Nested Replies List */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="pl-9 pt-2 flex flex-col gap-2 border-l-2 border-primary/20 ml-3.5 my-1">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-heading font-bold text-[10px]">
                                {reply.author?.name?.charAt(0) || 'U'}
                              </div>
                              <span className="font-heading text-label-sm font-bold text-on-surface">
                                {reply.author?.name}
                              </span>
                              <span className="font-mono text-[9px] text-outline">
                                {reply.author?.rollNumber}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {currentUser && currentUser.id !== reply.author?.id && (
                                <button
                                  type="button"
                                  onClick={() => onSayHi(reply.author)}
                                  className="text-primary hover:underline text-[10px] font-heading font-semibold"
                                >
                                  Say Hi
                                </button>
                              )}
                              {reply.isAuthor && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="text-outline hover:text-error"
                                  title="Delete Reply"
                                >
                                  <span className="material-symbols-outlined text-[13px]">delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="font-sans text-body-sm text-on-surface-variant pl-7">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </div>
          ) : (
            <p className="text-center font-sans text-xs text-outline py-2">
              No thoughts yet. Be the first to start the discussion!
            </p>
          )}

        </div>
      )}
    </article>
  );
}
