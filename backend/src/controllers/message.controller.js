import prisma from '../config/prisma.js';

/**
 * Helper to ensure canonical participant order
 */
const getOrderedParticipants = (idA, idB) => {
  return idA < idB ? [idA, idB] : [idB, idA];
};

/**
 * Check if a block exists in either direction between two users
 */
const checkBlock = async (userAId, userBId) => {
  return prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId },
      ],
    },
  });
};

/**
 * Parse JSON safely
 */
const parseJsonArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }
};

const safeParticipantSelect = {
  id: true,
  name: true,
  rollNumber: true,
  batchYear: true,
  department: true,
  hostel: true,
  roomNo: true,
  email: true,
  phone: true,
  bio: true,
  about: true,
  avatarUrl: true,
  skills: true,
  interests: true,
  openTo: true,
  projects: true,
  courses: true,
  labGroup: true,
  isAvailable: true,
  currentStatus: true,
  privacySettings: true,
};

/**
 * Format user for Profile Summary Panel with privacy masking
 */
const formatProfileSummary = (user) => {
  if (!user) return null;
  let privacySettings = { showContactDetails: false, showRoomNumber: false };
  if (user.privacySettings) {
    try {
      privacySettings = JSON.parse(user.privacySettings);
    } catch {}
  }

  const skills = parseJsonArray(user.skills);
  const interests = parseJsonArray(user.interests);
  const openTo = parseJsonArray(user.openTo);
  let projects = [];
  if (user.projects) {
    try {
      projects = JSON.parse(user.projects);
    } catch {}
  }

  return {
    id: user.id,
    name: user.name,
    rollNumber: user.rollNumber,
    batchYear: user.batchYear,
    department: user.department,
    hostel: user.hostel || 'Hostel 4 (Kaveri)',
    roomNo: privacySettings.showRoomNumber ? user.roomNo : null,
    roomHidden: !privacySettings.showRoomNumber,
    email: privacySettings.showContactDetails ? user.email : null,
    phone: privacySettings.showContactDetails ? user.phone : null,
    contactHidden: !privacySettings.showContactDetails,
    bio: user.bio || user.about || '',
    about: user.about || user.bio || '',
    currentlyLearning: user.currentlyLearning || '',
    skills,
    interests,
    openTo,
    projects,
    courses: user.courses ? user.courses.split(',').map((c) => c.trim()) : [],
    labGroup: user.labGroup || 'CC-03',
    isAvailable: user.isAvailable,
    currentStatus: user.currentStatus || null,
  };
};

/**
 * POST /api/messages/say-hi
 * Send an icebreaker starter note and initiate a 1-on-1 direct conversation.
 */
export const sayHi = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { recipientId, note } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        status: 'error',
        message: 'Recipient identifier is required.',
      });
    }

    if (!note || !note.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'A friendly starter note is required to Say Hi.',
      });
    }

    const recipient = await prisma.user.findFirst({
      where: {
        OR: [{ id: recipientId }, { rollNumber: recipientId }],
      },
    });

    if (!recipient) {
      return res.status(404).json({
        status: 'error',
        message: 'Student recipient not found.',
      });
    }

    if (recipient.id === currentUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot send a Say Hi note to yourself.',
      });
    }

    const existingBlock = await checkBlock(currentUserId, recipient.id);
    if (existingBlock) {
      return res.status(403).json({
        status: 'error',
        message: 'Communication with this student is blocked.',
      });
    }

    const [p1, p2] = getOrderedParticipants(currentUserId, recipient.id);
    const isP1 = currentUserId === p1;

    let conversation = await prisma.conversation.findUnique({
      where: {
        participant1Id_participant2Id: {
          participant1Id: p1,
          participant2Id: p2,
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (conversation) {
      if (conversation.initiatorId === currentUserId && !conversation.hasRecipientReplied) {
        return res.status(400).json({
          status: 'error',
          code: 'AWAITING_REPLY',
          message:
            'You have already sent an introductory note. To keep conversations respectful and low-pressure, please wait for their reply before sending another message.',
          conversationId: conversation.id,
        });
      }

      const updateData = {
        lastMessageAt: new Date(),
        ...(isP1 ? { participant1LastReadAt: new Date() } : { participant2LastReadAt: new Date() }),
      };
      if (conversation.status.startsWith('ignored_')) {
        updateData.status = 'active';
      }

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: updateData,
      });

      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: currentUserId,
          content: note.trim(),
          isIcebreaker: true,
        },
        include: {
          sender: {
            select: { id: true, name: true, rollNumber: true, avatarUrl: true },
          },
        },
      });

      return res.status(200).json({
        status: 'success',
        message: `Friendly note dispatched to ${recipient.name}!`,
        conversation,
        sentMessage: message,
      });
    }

    conversation = await prisma.conversation.create({
      data: {
        participant1Id: p1,
        participant2Id: p2,
        initiatorId: currentUserId,
        hasRecipientReplied: false,
        status: 'active',
        participant1LastReadAt: isP1 ? new Date() : new Date(0),
        participant2LastReadAt: !isP1 ? new Date() : new Date(0),
        lastMessageAt: new Date(),
      },
    });

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: currentUserId,
        content: note.trim(),
        isIcebreaker: true,
      },
      include: {
        sender: {
          select: { id: true, name: true, rollNumber: true, avatarUrl: true },
        },
      },
    });

    return res.status(201).json({
      status: 'success',
      message: `Direct conversation started with ${recipient.name}!`,
      conversation,
      sentMessage: message,
    });
  } catch (error) {
    console.error('sayHi error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send starter note.',
    });
  }
};

/**
 * GET /api/messages/conversations
 * List all direct conversations for authenticated user with unread indicators
 */
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { includeIgnored, search } = req.query;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: currentUserId },
          { participant2Id: currentUserId },
        ],
      },
      include: {
        participant1: { select: safeParticipantSelect },
        participant2: { select: safeParticipantSelect },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const myBlocks = await prisma.block.findMany({
      where: {
        OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
      },
    });
    const blockedIds = new Set(
      myBlocks.map((b) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId))
    );

    const formatted = conversations
      .map((c) => {
        const isP1 = c.participant1Id === currentUserId;
        const rawOtherUser = isP1 ? c.participant2 : c.participant1;
        const myLastReadAt = isP1 ? c.participant1LastReadAt : c.participant2LastReadAt;
        const otherUser = formatProfileSummary(rawOtherUser);

        const isBlocked = blockedIds.has(otherUser.id);
        const isInitiator = c.initiatorId === currentUserId;
        const isIgnoredByMe = c.status === `ignored_by_${currentUserId}`;
        const isAwaitingReply = isInitiator && !c.hasRecipientReplied;
        const isNewIntroForMe = !isInitiator && !c.hasRecipientReplied;

        const lastMessage = c.messages[0] || null;
        const hasUnread =
          Boolean(lastMessage) &&
          lastMessage.senderId !== currentUserId &&
          new Date(lastMessage.createdAt) > new Date(myLastReadAt);

        return {
          id: c.id,
          type: 'direct',
          otherUser,
          isBlocked,
          isInitiator,
          isAwaitingReply,
          isNewIntroForMe,
          hasRecipientReplied: c.hasRecipientReplied,
          status: c.status,
          isIgnored: isIgnoredByMe,
          hasUnread,
          lastMessage,
          lastMessageAt: c.lastMessageAt,
          createdAt: c.createdAt,
        };
      })
      .filter((c) => {
        if (includeIgnored !== 'true' && c.isIgnored) return false;
        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          const nameMatch = c.otherUser?.name?.toLowerCase().includes(q);
          const rollMatch = c.otherUser?.rollNumber?.toLowerCase().includes(q);
          const msgMatch = c.lastMessage?.content?.toLowerCase().includes(q);
          return nameMatch || rollMatch || msgMatch;
        }
        return true;
      });

    return res.status(200).json({
      status: 'success',
      conversations: formatted,
      unreadCount: formatted.filter((c) => c.hasUnread).length,
    });
  } catch (error) {
    console.error('getConversations error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve conversations.',
    });
  }
};

/**
 * GET /api/messages/conversations/:conversationId
 * Retrieve message history for a direct conversation.
 * Strictly verifies participant membership.
 */
export const getConversationMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participant1: { select: safeParticipantSelect },
        participant2: { select: safeParticipantSelect },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, name: true, rollNumber: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found.',
      });
    }

    // Security: Make sure a user can only read conversations they belong to
    if (
      conversation.participant1Id !== currentUserId &&
      conversation.participant2Id !== currentUserId
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not a participant in this conversation.',
      });
    }

    const isP1 = conversation.participant1Id === currentUserId;
    const rawOtherUser = isP1 ? conversation.participant2 : conversation.participant1;
    const otherUser = formatProfileSummary(rawOtherUser);

    // Update read timestamp for the current user
    await prisma.conversation.update({
      where: { id: conversationId },
      data: isP1
        ? { participant1LastReadAt: new Date() }
        : { participant2LastReadAt: new Date() },
    });

    const block = await checkBlock(currentUserId, otherUser.id);
    const isBlocked = Boolean(block);
    const isInitiator = conversation.initiatorId === currentUserId;
    const isAwaitingReply = isInitiator && !conversation.hasRecipientReplied;
    const canSend = !isBlocked && (!isInitiator || conversation.hasRecipientReplied);

    return res.status(200).json({
      status: 'success',
      type: 'direct',
      conversation: {
        id: conversation.id,
        otherUser,
        isBlocked,
        isInitiator,
        hasRecipientReplied: conversation.hasRecipientReplied,
        isAwaitingReply,
        canSend,
        status: conversation.status,
      },
      messages: conversation.messages,
    });
  } catch (error) {
    console.error('getConversationMessages error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve messages.',
    });
  }
};

/**
 * POST /api/messages/conversations/:conversationId/messages
 * Send a message within a direct conversation
 */
export const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Message content cannot be empty.',
      });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found.',
      });
    }

    // Security: Only participants can send messages
    if (
      conversation.participant1Id !== currentUserId &&
      conversation.participant2Id !== currentUserId
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not a participant in this conversation.',
      });
    }

    const otherUserId =
      conversation.participant1Id === currentUserId
        ? conversation.participant2Id
        : conversation.participant1Id;

    const block = await checkBlock(currentUserId, otherUserId);
    if (block) {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot send messages to a blocked user.',
      });
    }

    if (
      conversation.initiatorId === currentUserId &&
      !conversation.hasRecipientReplied
    ) {
      return res.status(400).json({
        status: 'error',
        code: 'AWAITING_REPLY',
        message:
          'Awaiting recipient reply. You cannot send another message until they respond.',
      });
    }

    const isRecipientReplying = currentUserId !== conversation.initiatorId;
    const isP1 = conversation.participant1Id === currentUserId;

    const updates = {
      lastMessageAt: new Date(),
      ...(isP1 ? { participant1LastReadAt: new Date() } : { participant2LastReadAt: new Date() }),
    };

    if (isRecipientReplying && !conversation.hasRecipientReplied) {
      updates.hasRecipientReplied = true;
      updates.status = 'active';
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: updates,
    });

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: currentUserId,
        content: content.trim(),
        isIcebreaker: false,
      },
      include: {
        sender: {
          select: { id: true, name: true, rollNumber: true, avatarUrl: true },
        },
      },
    });

    return res.status(201).json({
      status: 'success',
      message,
      hasRecipientReplied: isRecipientReplying || conversation.hasRecipientReplied,
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send message.',
    });
  }
};

/**
 * POST /api/messages/conversations/:conversationId/read
 * Mark direct conversation as read
 */
export const markConversationRead = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ status: 'error', message: 'Conversation not found.' });
    }

    const isP1 = conversation.participant1Id === currentUserId;
    if (!isP1 && conversation.participant2Id !== currentUserId) {
      return res.status(403).json({ status: 'error', message: 'Not authorized.' });
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: isP1
        ? { participant1LastReadAt: new Date() }
        : { participant2LastReadAt: new Date() },
    });

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('markConversationRead error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to mark as read.' });
  }
};

/**
 * GET /api/messages/groups
 * List all group conversations for authenticated user with unread indicators
 */
export const getGroups = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { search } = req.query;

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId: currentUserId, status: 'accepted' },
        },
      },
      include: {
        members: {
          where: { status: 'accepted' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                rollNumber: true,
                avatarUrl: true,
                batchYear: true,
                hostel: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true, rollNumber: true },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const formatted = groups
      .map((g) => {
        const myMembership = g.members.find((m) => m.userId === currentUserId);
        const myLastReadAt = myMembership?.lastReadAt || new Date(0);
        const lastMsg = g.messages[0] || null;

        const hasUnread =
          Boolean(lastMsg) &&
          lastMsg.senderId !== currentUserId &&
          new Date(lastMsg.createdAt) > new Date(myLastReadAt);

        return {
          id: g.id,
          type: 'group',
          name: g.name,
          description: g.description,
          category: g.category,
          memberCount: g.members.length,
          members: g.members.map((m) => ({
            id: m.userId,
            name: m.user.name,
            rollNumber: m.user.rollNumber,
            role: m.role,
          })),
          hasUnread,
          lastMessage: lastMsg,
          lastMessageAt: g.lastMessageAt,
          createdAt: g.createdAt,
        };
      })
      .filter((g) => {
        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          const nameMatch = g.name.toLowerCase().includes(q);
          const descMatch = (g.description || '').toLowerCase().includes(q);
          const msgMatch = g.lastMessage?.content?.toLowerCase().includes(q);
          return nameMatch || descMatch || msgMatch;
        }
        return true;
      });

    return res.status(200).json({
      status: 'success',
      groups: formatted,
      unreadCount: formatted.filter((g) => g.hasUnread).length,
    });
  } catch (error) {
    console.error('getGroups error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve groups.',
    });
  }
};

/**
 * GET /api/messages/groups/:groupId
 * Retrieve group messages. Strictly enforces membership.
 */
export const getGroupMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { groupId } = req.params;

    // Security: Make sure a user can only read conversations they belong to
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: currentUserId,
        },
      },
    });

    if (!membership || membership.status !== 'accepted') {
      return res.status(403).json({
        status: 'error',
        message: 'Only accepted members can read group messages.',
      });
    }

    // Update user's lastReadAt
    await prisma.groupMember.update({
      where: { id: membership.id },
      data: { lastReadAt: new Date() },
    });

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { status: 'accepted' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                rollNumber: true,
                batchYear: true,
                hostel: true,
                roomNo: true,
                avatarUrl: true,
                labGroup: true,
                bio: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                rollNumber: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found.',
      });
    }

    return res.status(200).json({
      status: 'success',
      type: 'group',
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        category: group.category,
        createdById: group.createdById,
        createdAt: group.createdAt,
        members: group.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          rollNumber: m.user.rollNumber,
          batchYear: m.user.batchYear,
          hostel: m.user.hostel,
          labGroup: m.user.labGroup,
          role: m.role,
        })),
      },
      messages: group.messages,
    });
  } catch (error) {
    console.error('getGroupMessages error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve group messages.',
    });
  }
};

/**
 * POST /api/messages/groups/:groupId/messages
 * Send a message within a group chat
 */
export const sendGroupMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { groupId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Message content cannot be empty.',
      });
    }

    // Security: Ensure sender is a member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: currentUserId,
        },
      },
    });

    if (!membership || membership.status !== 'accepted') {
      return res.status(403).json({
        status: 'error',
        message: 'Only accepted members can post in this group.',
      });
    }

    const message = await prisma.groupMessage.create({
      data: {
        groupId,
        senderId: currentUserId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, name: true, rollNumber: true, avatarUrl: true },
        },
      },
    });

    await prisma.group.update({
      where: { id: groupId },
      data: { lastMessageAt: new Date() },
    });

    await prisma.groupMember.update({
      where: { id: membership.id },
      data: { lastReadAt: new Date() },
    });

    return res.status(201).json({
      status: 'success',
      message,
    });
  } catch (error) {
    console.error('sendGroupMessage error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send group message.',
    });
  }
};

/**
 * POST /api/messages/conversations/:conversationId/ignore
 * Recipient ignores an incoming introduction
 */
export const ignoreConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found.',
      });
    }

    if (
      conversation.participant1Id !== currentUserId &&
      conversation.participant2Id !== currentUserId
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized.',
      });
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: `ignored_by_${currentUserId}`,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Introduction ignored and archived.',
    });
  } catch (error) {
    console.error('ignoreConversation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to ignore conversation.',
    });
  }
};

/**
 * POST /api/messages/block
 */
export const blockUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'Target user ID is required to block.',
      });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot block yourself.',
      });
    }

    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: currentUserId,
          blockedId: targetUserId,
        },
      },
    });

    if (!existingBlock) {
      await prisma.block.create({
        data: {
          blockerId: currentUserId,
          blockedId: targetUserId,
        },
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'User blocked. You will no longer receive messages from each other.',
    });
  } catch (error) {
    console.error('blockUser error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to block user.',
    });
  }
};

/**
 * POST /api/messages/unblock
 */
export const unblockUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { targetUserId } = req.body;

    await prisma.block.deleteMany({
      where: {
        blockerId: currentUserId,
        blockedId: targetUserId,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'User unblocked.',
    });
  } catch (error) {
    console.error('unblockUser error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to unblock user.',
    });
  }
};

/**
 * GET /api/messages/blocks
 */
export const getBlockedUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const blocks = await prisma.block.findMany({
      where: { blockerId: currentUserId },
      include: {
        blocked: {
          select: { id: true, name: true, rollNumber: true, avatarUrl: true },
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      blocks: blocks.map((b) => b.blocked),
    });
  } catch (error) {
    console.error('getBlockedUsers error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve blocked users.',
    });
  }
};

/**
 * POST /api/messages/report
 */
export const reportUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { reportedUserId, reason, details, alsoBlock } = req.body;

    if (!reportedUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'Reported user ID is required.',
      });
    }

    if (!reason) {
      return res.status(400).json({
        status: 'error',
        message: 'A report reason is required.',
      });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: currentUserId,
        reportedId: reportedUserId,
        reason,
        details: details ? details.trim() : null,
      },
    });

    if (alsoBlock) {
      const existingBlock = await prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: currentUserId,
            blockedId: reportedUserId,
          },
        },
      });

      if (!existingBlock) {
        await prisma.block.create({
          data: {
            blockerId: currentUserId,
            blockedId: reportedUserId,
          },
        });
      }
    }

    return res.status(201).json({
      status: 'success',
      message: 'Thank you for your report. The MNIT CSE safety team has been notified.',
      reportId: report.id,
    });
  } catch (error) {
    console.error('reportUser error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to submit report.',
    });
  }
};
