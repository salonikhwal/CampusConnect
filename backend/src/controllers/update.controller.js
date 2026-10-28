import prisma from '../config/prisma.js';

/**
 * GET /api/updates
 * List updates and opportunities with tabs, search, category filters, and saved status
 */
export const getUpdates = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const { tab, category, search, tag, isOfficial } = req.query;

    const where = {};

    // Tab filter: 'Announcements', 'Academic Updates', 'Events', 'Opportunities', 'Saved'
    if (tab && tab !== 'All' && tab !== 'All Updates') {
      if (tab === 'Saved') {
        where.savedBy = {
          some: { userId: currentUserId },
        };
      } else {
        where.category = tab;
      }
    } else if (category && category !== 'All') {
      where.category = category;
    }

    // Official filter if provided
    if (isOfficial !== undefined && isOfficial !== '') {
      where.isOfficial = isOfficial === 'true' || isOfficial === true;
    }

    // Search query filter across title, description, organizer, venue, tags
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { organizer: { contains: q } },
        { venue: { contains: q } },
        { tags: { contains: q } },
      ];
    }

    // Tag filter
    if (tag && tag.trim()) {
      where.tags = { contains: tag.trim().replace(/^#/, '') };
    }

    const items = await prisma.updateItem.findMany({
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
            role: true,
          },
        },
        savedBy: {
          where: { userId: currentUserId },
          select: { id: true },
        },
      },
      orderBy: [
        { isOfficial: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const formatted = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      organizer: item.organizer,
      venue: item.venue,
      deadline: item.deadline,
      deadlineText: item.deadlineText,
      linkUrl: item.linkUrl,
      tags: item.tags ? item.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      isOfficial: Boolean(item.isOfficial),
      isSaved: item.savedBy.length > 0,
      isAuthor: item.authorId === currentUserId,
      author: item.author,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return res.status(200).json({
      status: 'success',
      count: formatted.length,
      items: formatted,
    });
  } catch (error) {
    console.error('getUpdates error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve updates and opportunities.',
    });
  }
};

/**
 * POST /api/updates
 * Create a new update or opportunity item.
 * "Only admins can post official items."
 */
export const createUpdate = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    const {
      title,
      description,
      category,
      organizer,
      venue,
      deadline,
      deadlineText,
      linkUrl,
      tags,
      isOfficial,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Title is required.',
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Description is required.',
      });
    }

    // Role check: ONLY ADMINS CAN POST OFFICIAL ITEMS
    const wantsOfficial = Boolean(isOfficial);
    if (wantsOfficial && currentUserRole !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only administrators can post official items.',
      });
    }

    // Category validation
    const validCategories = ['Announcements', 'Academic Updates', 'Events', 'Opportunities'];
    let selectedCategory = 'Announcements';
    if (category) {
      const match = validCategories.find(
        (c) => c.toLowerCase() === category.trim().toLowerCase()
      );
      if (match) selectedCategory = match;
    }

    const item = await prisma.updateItem.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        organizer: organizer?.trim() || null,
        venue: venue?.trim() || null,
        deadline: deadline ? new Date(deadline) : null,
        deadlineText: deadlineText?.trim() || null,
        linkUrl: linkUrl?.trim() || null,
        tags: tags ? (Array.isArray(tags) ? tags.join(',') : tags.trim()) : null,
        isOfficial: wantsOfficial && currentUserRole === 'admin',
        authorId: currentUserId,
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
            role: true,
          },
        },
      },
    });

    return res.status(201).json({
      status: 'success',
      message: item.isOfficial
        ? 'Official notice published to campus noticeboard.'
        : 'Student update posted to campus feed.',
      item: {
        ...item,
        tags: item.tags ? item.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isSaved: false,
        isAuthor: true,
      },
    });
  } catch (error) {
    console.error('createUpdate error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create update item.',
    });
  }
};

/**
 * GET /api/updates/:id
 * Get single update item details
 */
export const getUpdateById = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const { id } = req.params;

    const item = await prisma.updateItem.findUnique({
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
            role: true,
          },
        },
        savedBy: {
          where: { userId: currentUserId },
          select: { id: true },
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Update item not found.',
      });
    }

    return res.status(200).json({
      status: 'success',
      item: {
        ...item,
        tags: item.tags ? item.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isSaved: item.savedBy.length > 0,
        isAuthor: item.authorId === currentUserId,
      },
    });
  } catch (error) {
    console.error('getUpdateById error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve update item.',
    });
  }
};

/**
 * PUT /api/updates/:id
 * Edit update item. Only author or admin can edit.
 */
export const updateUpdate = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    const { id } = req.params;
    const {
      title,
      description,
      category,
      organizer,
      venue,
      deadline,
      deadlineText,
      linkUrl,
      tags,
      isOfficial,
    } = req.body;

    const item = await prisma.updateItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Update item not found.',
      });
    }

    // Permission check
    const isAuthor = item.authorId === currentUserId;
    const isAdmin = currentUserRole === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the author or an administrator can edit this item.',
      });
    }

    // If changing to official, must be admin
    if (isOfficial !== undefined && isOfficial && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Only administrators can mark items as official.',
      });
    }

    const updated = await prisma.updateItem.update({
      where: { id },
      data: {
        title: title ? title.trim() : item.title,
        description: description ? description.trim() : item.description,
        category: category || item.category,
        organizer: organizer !== undefined ? organizer?.trim() : item.organizer,
        venue: venue !== undefined ? venue?.trim() : item.venue,
        deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : item.deadline,
        deadlineText: deadlineText !== undefined ? deadlineText?.trim() : item.deadlineText,
        linkUrl: linkUrl !== undefined ? linkUrl?.trim() : item.linkUrl,
        tags: tags !== undefined ? (Array.isArray(tags) ? tags.join(',') : tags) : item.tags,
        isOfficial: isOfficial !== undefined ? (isAdmin ? Boolean(isOfficial) : item.isOfficial) : item.isOfficial,
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
            role: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Item updated successfully.',
      item: {
        ...updated,
        tags: updated.tags ? updated.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isAuthor: true,
      },
    });
  } catch (error) {
    console.error('updateUpdate error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update item.',
    });
  }
};

/**
 * DELETE /api/updates/:id
 * Delete update item. Only author or admin can delete.
 */
export const deleteUpdate = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    const { id } = req.params;

    const item = await prisma.updateItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Update item not found.',
      });
    }

    const isAuthor = item.authorId === currentUserId;
    const isAdmin = currentUserRole === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the author or an administrator can delete this item.',
      });
    }

    await prisma.updateItem.delete({ where: { id } });

    return res.status(200).json({
      status: 'success',
      message: 'Item deleted successfully.',
    });
  } catch (error) {
    console.error('deleteUpdate error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete item.',
    });
  }
};

/**
 * POST /api/updates/:id/save
 * Bookmark / Save an item
 */
export const saveItem = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const item = await prisma.updateItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Update item not found.',
      });
    }

    await prisma.savedItem.upsert({
      where: {
        userId_updateItemId: {
          userId: currentUserId,
          updateItemId: id,
        },
      },
      update: {},
      create: {
        userId: currentUserId,
        updateItemId: id,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Item saved to your bookmarks.',
      isSaved: true,
    });
  } catch (error) {
    console.error('saveItem error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save item.',
    });
  }
};

/**
 * POST /api/updates/:id/unsave
 * Unsave / Remove bookmark
 */
export const unsaveItem = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const existing = await prisma.savedItem.findUnique({
      where: {
        userId_updateItemId: {
          userId: currentUserId,
          updateItemId: id,
        },
      },
    });

    if (existing) {
      await prisma.savedItem.delete({
        where: { id: existing.id },
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Item removed from saved bookmarks.',
      isSaved: false,
    });
  } catch (error) {
    console.error('unsaveItem error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to unsave item.',
    });
  }
};
