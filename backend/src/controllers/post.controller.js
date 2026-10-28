import prisma from '../config/prisma.js';

// Helper to format comments with nested replies
const buildCommentTree = (comments, currentUserId) => {
  const commentMap = new Map();
  const topLevel = [];

  // Initialize nodes
  comments.forEach((c) => {
    commentMap.set(c.id, {
      id: c.id,
      content: c.content,
      postId: c.postId,
      authorId: c.authorId,
      parentId: c.parentId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      isAuthor: c.authorId === currentUserId,
      author: {
        id: c.author.id,
        name: c.author.name,
        rollNumber: c.author.rollNumber,
        avatarUrl: c.author.avatarUrl,
        batchYear: c.author.batchYear,
        hostel: c.author.hostel,
        labGroup: c.author.labGroup,
      },
      replies: [],
    });
  });

  // Link children to parents
  commentMap.forEach((node) => {
    if (node.parentId && commentMap.has(node.parentId)) {
      commentMap.get(node.parentId).replies.push(node);
    } else {
      topLevel.push(node);
    }
  });

  return topLevel;
};

/**
 * GET /api/posts
 * List community posts with search, category filter, comments, and separate pinned announcements
 */
export const getPosts = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const { category, search, tag } = req.query;

    const where = {};

    // Filter by Category if provided (case-insensitive mapping)
    if (category && category !== 'All Topics' && category !== 'all') {
      const catLower = category.toLowerCase();
      if (catLower.includes('question')) where.category = 'Questions';
      else if (catLower.includes('project')) where.category = 'Projects';
      else if (catLower.includes('college') || catLower.includes('life')) where.category = 'College Life';
      else if (catLower.includes('opportunit')) where.category = 'Opportunities';
      else where.category = category;
    }

    // Filter by Tag if provided
    if (tag && tag.trim()) {
      where.tags = { contains: tag.trim().replace(/^#/, '') };
    }

    // Search query filter across title, content, codeSnippet, tags, or author name/rollNumber
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } },
        { codeSnippet: { contains: q } },
        { tags: { contains: q } },
        { author: { name: { contains: q } } },
        { author: { rollNumber: { contains: q.toUpperCase() } } },
      ];
    }

    // Fetch all matching posts
    const allMatchingPosts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            avatarUrl: true,
            batchYear: true,
            hostel: true,
            labGroup: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                rollNumber: true,
                avatarUrl: true,
                batchYear: true,
                hostel: true,
                labGroup: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatPost = (p) => {
      const commentTree = buildCommentTree(p.comments, currentUserId);
      return {
        id: p.id,
        title: p.title,
        content: p.content,
        codeSnippet: p.codeSnippet,
        codeLanguage: p.codeLanguage || 'cpp',
        category: p.category,
        tags: p.tags ? p.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isPinned: Boolean(p.isPinned),
        isAuthor: p.authorId === currentUserId,
        author: {
          id: p.author.id,
          name: p.author.name,
          rollNumber: p.author.rollNumber,
          avatarUrl: p.author.avatarUrl,
          batchYear: p.author.batchYear,
          hostel: p.author.hostel,
          labGroup: p.author.labGroup,
        },
        commentCount: p.comments.length,
        comments: commentTree,
        likeCount: p.likes ? p.likes.length : 0,
        hasLiked: p.likes ? p.likes.some((l) => l.userId === currentUserId) : false,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    };

    // Separate pinned announcements from student posts
    const pinnedPosts = allMatchingPosts
      .filter((p) => p.isPinned)
      .map(formatPost);

    const studentPosts = allMatchingPosts
      .filter((p) => !p.isPinned)
      .map(formatPost);

    return res.status(200).json({
      status: 'success',
      totalCount: allMatchingPosts.length,
      pinnedCount: pinnedPosts.length,
      pinnedPosts,
      posts: studentPosts,
    });
  } catch (error) {
    console.error('getPosts error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve community posts.',
    });
  }
};

/**
 * GET /api/posts/:id
 * Get single post details with full comments and replies
 */
export const getPostById = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            avatarUrl: true,
            batchYear: true,
            hostel: true,
            labGroup: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                rollNumber: true,
                avatarUrl: true,
                batchYear: true,
                hostel: true,
                labGroup: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found.',
      });
    }

    const commentTree = buildCommentTree(post.comments, currentUserId);

    return res.status(200).json({
      status: 'success',
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        codeSnippet: post.codeSnippet,
        codeLanguage: post.codeLanguage || 'cpp',
        category: post.category,
        tags: post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isPinned: Boolean(post.isPinned),
        isAuthor: post.authorId === currentUserId,
        author: post.author,
        commentCount: post.comments.length,
        comments: commentTree,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (error) {
    console.error('getPostById error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve post details.',
    });
  }
};

/**
 * POST /api/posts
 * Create a new community post
 */
export const createPost = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { title, content, category, codeSnippet, codeLanguage, tags, isPinned } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Post content cannot be empty.',
      });
    }

    // Canonical category validation
    const validCategories = ['Questions', 'Projects', 'College Life', 'Opportunities'];
    let selectedCategory = 'Questions';
    if (category) {
      const match = validCategories.find(
        (c) => c.toLowerCase() === category.trim().toLowerCase()
      );
      if (match) selectedCategory = match;
    }

    const post = await prisma.post.create({
      data: {
        authorId: currentUserId,
        title: title?.trim() || null,
        content: content.trim(),
        category: selectedCategory,
        codeSnippet: codeSnippet?.trim() || null,
        codeLanguage: codeLanguage?.trim() || 'cpp',
        tags: tags ? (Array.isArray(tags) ? tags.join(',') : tags.trim()) : null,
        isPinned: req.user?.role === 'admin' && isPinned !== undefined ? Boolean(isPinned) : false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            avatarUrl: true,
            batchYear: true,
            hostel: true,
            labGroup: true,
          },
        },
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Post published to campus community.',
      post: {
        ...post,
        tags: post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isAuthor: true,
        commentCount: 0,
        comments: [],
      },
    });
  } catch (error) {
    console.error('createPost error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create post.',
    });
  }
};

/**
 * PUT /api/posts/:id
 * Edit post. ONLY THE AUTHOR CAN EDIT.
 */
export const updatePost = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { title, content, category, codeSnippet, codeLanguage, tags, isPinned } = req.body;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found.',
      });
    }

    // Permission check: ONLY AUTHOR CAN EDIT
    if (post.authorId !== currentUserId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the author can edit this post.',
      });
    }

    const validCategories = ['Questions', 'Projects', 'College Life', 'Opportunities'];
    let selectedCategory = post.category;
    if (category) {
      const match = validCategories.find(
        (c) => c.toLowerCase() === category.trim().toLowerCase()
      );
      if (match) selectedCategory = match;
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title: title !== undefined ? (title ? title.trim() : null) : post.title,
        content: content ? content.trim() : post.content,
        category: selectedCategory,
        codeSnippet: codeSnippet !== undefined ? (codeSnippet ? codeSnippet.trim() : null) : post.codeSnippet,
        codeLanguage: codeLanguage !== undefined ? codeLanguage : post.codeLanguage,
        tags: tags !== undefined ? (Array.isArray(tags) ? tags.join(',') : tags) : post.tags,
        isPinned: req.user?.role === 'admin' && isPinned !== undefined ? Boolean(isPinned) : post.isPinned,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            avatarUrl: true,
            batchYear: true,
            hostel: true,
            labGroup: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Post updated successfully.',
      post: {
        ...updated,
        tags: updated.tags ? updated.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isAuthor: true,
      },
    });
  } catch (error) {
    console.error('updatePost error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update post.',
    });
  }
};

/**
 * DELETE /api/posts/:id
 * Delete post. ONLY THE AUTHOR CAN DELETE.
 */
export const deletePost = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found.',
      });
    }

    // Permission check: ONLY AUTHOR CAN DELETE
    if (post.authorId !== currentUserId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the author can delete this post.',
      });
    }

    await prisma.post.delete({ where: { id } });

    return res.status(200).json({
      status: 'success',
      message: 'Post deleted successfully.',
    });
  } catch (error) {
    console.error('deletePost error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete post.',
    });
  }
};

/**
 * POST /api/posts/:id/comments
 * Add a comment or reply to a post
 */
export const createComment = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { content, parentId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Comment content cannot be empty.',
      });
    }

    // Ensure target post exists
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found.',
      });
    }

    // If replying to another comment, verify parent exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parentComment || parentComment.postId !== id) {
        return res.status(404).json({
          status: 'error',
          message: 'Parent comment not found on this post.',
        });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        postId: id,
        authorId: currentUserId,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            avatarUrl: true,
            batchYear: true,
            hostel: true,
            labGroup: true,
          },
        },
      },
    });

    return res.status(201).json({
      status: 'success',
      message: parentId ? 'Reply added.' : 'Comment added.',
      comment: {
        id: comment.id,
        content: comment.content,
        postId: comment.postId,
        authorId: comment.authorId,
        parentId: comment.parentId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        isAuthor: true,
        author: comment.author,
        replies: [],
      },
    });
  } catch (error) {
    console.error('createComment error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to add comment.',
    });
  }
};

/**
 * PUT /api/posts/:id/comments/:commentId
 * Edit a comment. ONLY THE AUTHOR CAN EDIT.
 */
export const updateComment = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Comment content cannot be empty.',
      });
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found.',
      });
    }

    // Permission check: ONLY AUTHOR CAN EDIT COMMENT
    if (comment.authorId !== currentUserId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the author can edit this comment.',
      });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            avatarUrl: true,
            batchYear: true,
            hostel: true,
            labGroup: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Comment updated.',
      comment: {
        ...updated,
        isAuthor: true,
      },
    });
  } catch (error) {
    console.error('updateComment error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update comment.',
    });
  }
};

/**
 * DELETE /api/posts/:id/comments/:commentId
 * Delete a comment. ONLY THE AUTHOR CAN DELETE.
 */
export const deleteComment = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found.',
      });
    }

    // Permission check: ONLY AUTHOR CAN DELETE COMMENT
    if (comment.authorId !== currentUserId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the author can delete this comment.',
      });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return res.status(200).json({
      status: 'success',
      message: 'Comment deleted.',
    });
  } catch (error) {
    console.error('deleteComment error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete comment.',
    });
  }
};

/**
 * POST /api/posts/:id/like
 * Toggle like status on a post
 */
export const togglePostLike = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id: postId } = req.params;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found.',
      });
    }

    const existing = await prisma.postLike.findUnique({
      where: {
        postId_userId: { postId, userId: currentUserId },
      },
    });

    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.postLike.create({
        data: { postId, userId: currentUserId },
      });
    }

    const likeCount = await prisma.postLike.count({ where: { postId } });
    return res.status(200).json({
      status: 'success',
      hasLiked: !existing,
      likeCount,
    });
  } catch (error) {
    console.error('togglePostLike error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to toggle like on post.',
    });
  }
};

