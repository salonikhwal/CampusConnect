import prisma from '../config/prisma.js';

// Helper to safely parse JSON arrays
const parseJsonArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch {
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }
};

/**
 * POST /api/groups
 * Create group (name, description, optional photo/avatarUrl, category)
 * Creator is automatically added with role: 'admin' and status: 'accepted'.
 * Nobody else is added without accepting an invitation.
 */
export const createGroup = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { name, description, category, avatarUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Group name is required.',
      });
    }

    if (name.trim().length < 3) {
      return res.status(400).json({
        status: 'error',
        message: 'Group name must be at least 3 characters long.',
      });
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || 'academic',
        avatarUrl: avatarUrl?.trim() || null,
        createdById: currentUserId,
        lastMessageAt: new Date(),
        members: {
          create: {
            userId: currentUserId,
            role: 'admin',
            status: 'accepted',
            joinedAt: new Date(),
          },
        },
      },
      include: {
        members: {
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
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Group created successfully.',
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        category: group.category,
        avatarUrl: group.avatarUrl,
        createdById: group.createdById,
        createdAt: group.createdAt,
        membersCount: 1,
        members: group.members.map((m) => ({
          id: m.userId,
          name: m.user.name,
          rollNumber: m.user.rollNumber,
          role: m.role,
          status: m.status,
        })),
      },
    });
  } catch (error) {
    console.error('createGroup error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create group.',
    });
  }
};

/**
 * GET /api/groups
 * List all groups for the authenticated user where they are an accepted member
 */
export const getGroups = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { search, category } = req.query;

    const whereClause = {
      members: {
        some: {
          userId: currentUserId,
          status: 'accepted',
        },
      },
    };

    if (category && category !== 'All Groups') {
      whereClause.category = category.toLowerCase().includes('hackathon')
        ? 'hackathon'
        : category.toLowerCase().includes('hostel')
        ? 'hostel'
        : category.toLowerCase().includes('hobby')
        ? 'hobby'
        : 'academic';
    }

    const groups = await prisma.group.findMany({
      where: whereClause,
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
                labGroup: true,
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
          name: g.name,
          description: g.description,
          category: g.category,
          avatarUrl: g.avatarUrl,
          createdById: g.createdById,
          isCreator: g.createdById === currentUserId,
          memberCount: g.members.length,
          members: g.members.map((m) => ({
            id: m.userId,
            name: m.user.name,
            rollNumber: m.user.rollNumber,
            avatarUrl: m.user.avatarUrl,
            batchYear: m.user.batchYear,
            hostel: m.user.hostel,
            labGroup: m.user.labGroup,
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
 * GET /api/groups/invitations
 * Get pending group invitations for the authenticated user
 */
export const getPendingInvitations = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const invitations = await prisma.groupMember.findMany({
      where: {
        userId: currentUserId,
        status: 'pending',
      },
      include: {
        group: {
          include: {
            members: {
              where: { status: 'accepted' },
              include: {
                user: {
                  select: { id: true, name: true, rollNumber: true },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Fetch inviter names for items where invitedById is set
    const inviterIds = invitations.map((i) => i.invitedById || i.group.createdById).filter(Boolean);
    const inviters = await prisma.user.findMany({
      where: { id: { in: inviterIds } },
      select: { id: true, name: true, rollNumber: true, avatarUrl: true },
    });
    const inviterMap = new Map(inviters.map((u) => [u.id, u]));

    const formatted = invitations.map((inv) => {
      const inviter = inviterMap.get(inv.invitedById || inv.group.createdById);
      return {
        invitationId: inv.id,
        groupId: inv.groupId,
        groupName: inv.group.name,
        description: inv.group.description,
        category: inv.group.category,
        avatarUrl: inv.group.avatarUrl,
        memberCount: inv.group.members.length,
        invitedBy: inviter
          ? {
              id: inviter.id,
              name: inviter.name,
              rollNumber: inviter.rollNumber,
              avatarUrl: inviter.avatarUrl,
            }
          : null,
        invitedAt: inv.joinedAt,
      };
    });

    return res.status(200).json({
      status: 'success',
      invitations: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('getPendingInvitations error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve invitations.',
    });
  }
};

/**
 * GET /api/groups/:id
 * Get single group workspace details. Only accepted members can view.
 * If user has a pending invitation, returns limited invitation preview.
 */
export const getGroupById = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                rollNumber: true,
                batchYear: true,
                hostel: true,
                roomNo: true,
                labGroup: true,
                avatarUrl: true,
                skills: true,
                interests: true,
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

    const myMembership = group.members.find((m) => m.userId === currentUserId);

    // If user has a pending invitation, allow preview with action flag
    if (myMembership && myMembership.status === 'pending') {
      return res.status(200).json({
        status: 'success',
        isPendingInvitation: true,
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          category: group.category,
          avatarUrl: group.avatarUrl,
          createdById: group.createdById,
          createdAt: group.createdAt,
          memberCount: group.members.filter((m) => m.status === 'accepted').length,
        },
      });
    }

    // Strictly check: Only accepted members can access workspace
    if (!myMembership || myMembership.status !== 'accepted') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only accepted members can view this group workspace.',
      });
    }

    // Update lastReadAt
    await prisma.groupMember.update({
      where: { id: myMembership.id },
      data: { lastReadAt: new Date() },
    });

    const isCreator = group.createdById === currentUserId;

    // Filter accepted members
    const acceptedMembers = group.members
      .filter((m) => m.status === 'accepted')
      .map((m) => ({
        id: m.user.id,
        name: m.user.name,
        rollNumber: m.user.rollNumber,
        batchYear: m.user.batchYear,
        hostel: m.user.hostel,
        roomNo: m.user.roomNo,
        labGroup: m.user.labGroup,
        avatarUrl: m.user.avatarUrl,
        skills: parseJsonArray(m.user.skills),
        interests: parseJsonArray(m.user.interests),
        role: m.role,
        isCreator: m.user.id === group.createdById,
        joinedAt: m.joinedAt,
      }));

    // Only the creator can see pending invitations
    let pendingInvites = [];
    if (isCreator) {
      pendingInvites = group.members
        .filter((m) => m.status === 'pending')
        .map((m) => ({
          membershipId: m.id,
          id: m.user.id,
          name: m.user.name,
          rollNumber: m.user.rollNumber,
          batchYear: m.user.batchYear,
          hostel: m.user.hostel,
          avatarUrl: m.user.avatarUrl,
          invitedAt: m.joinedAt,
        }));
    }

    return res.status(200).json({
      status: 'success',
      isPendingInvitation: false,
      isCreator,
      myRole: myMembership.role,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        category: group.category,
        avatarUrl: group.avatarUrl,
        createdById: group.createdById,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        lastMessageAt: group.lastMessageAt,
        memberCount: acceptedMembers.length,
      },
      members: acceptedMembers,
      pendingInvites,
    });
  } catch (error) {
    console.error('getGroupById error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve group details.',
    });
  }
};

/**
 * PUT /api/groups/:id
 * Edit group details. ONLY THE CREATOR CAN MANAGE DETAILS.
 */
export const updateGroup = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { name, description, category, avatarUrl } = req.body;

    const group = await prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found.',
      });
    }

    // Permission check: Only creator can manage group details
    if (group.createdById !== currentUserId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the creator can manage group details.',
      });
    }

    if (name && name.trim().length < 3) {
      return res.status(400).json({
        status: 'error',
        message: 'Group name must be at least 3 characters long.',
      });
    }

    const updated = await prisma.group.update({
      where: { id },
      data: {
        name: name ? name.trim() : group.name,
        description: description !== undefined ? description?.trim() : group.description,
        category: category ? category.trim() : group.category,
        avatarUrl: avatarUrl !== undefined ? avatarUrl?.trim() : group.avatarUrl,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Group details updated successfully.',
      group: updated,
    });
  } catch (error) {
    console.error('updateGroup error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update group.',
    });
  }
};

/**
 * GET /api/groups/:id/invite-candidates
 * Search students to invite.
 * Excludes students who are already accepted members or pending invitees.
 */
export const searchInviteCandidates = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { q } = req.query;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          select: { userId: true },
        },
      },
    });

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found.',
      });
    }

    // Only accepted members or creator can search invite candidates
    const isMember = group.members.some((m) => m.userId === currentUserId);
    if (!isMember) {
      return res.status(403).json({
        status: 'error',
        message: 'Only members can view invite candidates.',
      });
    }

    const existingMemberIds = group.members.map((m) => m.userId);

    const query = (q || '').trim().toLowerCase();

    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: existingMemberIds },
        isOnboarded: true,
        ...(query
          ? {
              OR: [
                { name: { contains: query } },
                { rollNumber: { contains: query.toUpperCase() } },
                { skills: { contains: query } },
                { interests: { contains: query } },
                { hostel: { contains: query } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        rollNumber: true,
        batchYear: true,
        hostel: true,
        labGroup: true,
        avatarUrl: true,
        skills: true,
        interests: true,
      },
      take: 15,
      orderBy: { rollNumber: 'asc' },
    });

    const formatted = candidates.map((u) => ({
      id: u.id,
      name: u.name,
      rollNumber: u.rollNumber,
      batchYear: u.batchYear,
      hostel: u.hostel,
      labGroup: u.labGroup,
      avatarUrl: u.avatarUrl,
      skills: parseJsonArray(u.skills),
      interests: parseJsonArray(u.interests),
    }));

    return res.status(200).json({
      status: 'success',
      candidates: formatted,
    });
  } catch (error) {
    console.error('searchInviteCandidates error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to search students to invite.',
    });
  }
};

/**
 * POST /api/groups/:id/invitations
 * Send invitation to student.
 * ONLY THE CREATOR CAN MANAGE MEMBERS.
 * "Nobody is added without accepting an invitation."
 */
export const sendInvitation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required to send an invitation.',
      });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found.',
      });
    }

    // Permission check: Only creator can invite members
    if (group.createdById !== currentUserId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the creator can manage members and send invitations.',
      });
    }

    // Target user check
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, rollNumber: true, avatarUrl: true },
    });

    if (!targetUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found in directory.',
      });
    }

    // Check existing membership or pending invite
    const existing = group.members.find((m) => m.userId === userId);
    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({
          status: 'error',
          message: `${targetUser.name} is already an accepted member of this group.`,
        });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({
          status: 'error',
          message: `An invitation is already pending for ${targetUser.name}.`,
        });
      }
    }

    // Nobody is added without accepting: status is strictly 'pending'
    const newInvitation = await prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: id,
          userId,
        },
      },
      update: {
        status: 'pending',
        role: 'member',
        invitedById: currentUserId,
        joinedAt: new Date(),
      },
      create: {
        groupId: id,
        userId,
        role: 'member',
        status: 'pending',
        invitedById: currentUserId,
        joinedAt: new Date(),
      },
    });

    return res.status(200).json({
      status: 'success',
      message: `Invitation successfully sent to ${targetUser.name} (${targetUser.rollNumber}). They will join once they accept.`,
      invitation: {
        id: newInvitation.id,
        userId: targetUser.id,
        name: targetUser.name,
        rollNumber: targetUser.rollNumber,
        avatarUrl: targetUser.avatarUrl,
        status: 'pending',
        invitedAt: newInvitation.joinedAt,
      },
    });
  } catch (error) {
    console.error('sendInvitation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send invitation.',
    });
  }
};

/**
 * POST /api/groups/:id/invitations/accept
 * Accept an invitation to join the group.
 * User transitions to status: 'accepted' and can now read and post.
 */
export const acceptInvitation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId: currentUserId,
        },
      },
      include: {
        group: true,
      },
    });

    if (!membership) {
      return res.status(404).json({
        status: 'error',
        message: 'No invitation found for this group.',
      });
    }

    if (membership.status === 'accepted') {
      return res.status(200).json({
        status: 'success',
        message: 'You are already an accepted member of this group.',
        group: membership.group,
      });
    }

    const updated = await prisma.groupMember.update({
      where: { id: membership.id },
      data: {
        status: 'accepted',
        joinedAt: new Date(),
        lastReadAt: new Date(),
      },
      include: {
        group: true,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: `You have joined "${updated.group.name}"! Welcome to the group workspace.`,
      group: updated.group,
    });
  } catch (error) {
    console.error('acceptInvitation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to accept invitation.',
    });
  }
};

/**
 * POST /api/groups/:id/invitations/decline
 * Decline an invitation.
 * Removes the pending membership.
 */
export const declineInvitation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId: currentUserId,
        },
      },
    });

    if (!membership || membership.status !== 'pending') {
      return res.status(404).json({
        status: 'error',
        message: 'No pending invitation found for this group.',
      });
    }

    await prisma.groupMember.delete({
      where: { id: membership.id },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Invitation declined.',
    });
  } catch (error) {
    console.error('declineInvitation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to decline invitation.',
    });
  }
};

/**
 * DELETE /api/groups/:id/members/:userId
 * Manage members:
 * - If userId === currentUserId: "Members can leave."
 * - If userId !== currentUserId: "Only the creator can manage members."
 */
export const removeMemberOrLeave = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id, userId } = req.params;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found.',
      });
    }

    const targetMembership = group.members.find((m) => m.userId === userId);
    if (!targetMembership) {
      return res.status(404).json({
        status: 'error',
        message: 'Student is not a member of this group.',
      });
    }

    const isSelf = userId === currentUserId;
    const isCreator = group.createdById === currentUserId;

    // Self leaving
    if (isSelf) {
      if (isCreator) {
        // If creator is leaving, check if there are other members
        const remainingMembers = group.members.filter(
          (m) => m.userId !== currentUserId && m.status === 'accepted'
        );
        if (remainingMembers.length > 0) {
          // Promote next accepted member to creator & admin
          const nextLeader = remainingMembers[0];
          await prisma.$transaction([
            prisma.group.update({
              where: { id },
              data: { createdById: nextLeader.userId },
            }),
            prisma.groupMember.update({
              where: { id: nextLeader.id },
              data: { role: 'admin' },
            }),
            prisma.groupMember.delete({
              where: { id: targetMembership.id },
            }),
          ]);
          return res.status(200).json({
            status: 'success',
            message: 'You have left the group. Ownership transferred to the next active peer.',
          });
        } else {
          // No other members, delete the group entirely
          await prisma.group.delete({ where: { id } });
          return res.status(200).json({
            status: 'success',
            message: 'You have left and deleted the group as there were no other members.',
            groupDeleted: true,
          });
        }
      }

      // Normal member leaving
      await prisma.groupMember.delete({
        where: { id: targetMembership.id },
      });

      return res.status(200).json({
        status: 'success',
        message: 'You have left the group.',
      });
    }

    // Removing another member: ONLY CREATOR ALLOWED
    if (!isCreator) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the creator can manage members and remove peers.',
      });
    }

    await prisma.groupMember.delete({
      where: { id: targetMembership.id },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Member removed from group.',
    });
  } catch (error) {
    console.error('removeMemberOrLeave error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process member removal or leave.',
    });
  }
};

/**
 * GET /api/groups/:id/messages
 * Retrieve group messages. Strictly enforced: ONLY ACCEPTED MEMBERS CAN READ.
 */
export const getGroupMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
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

    const messages = await prisma.groupMessage.findMany({
      where: { groupId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
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
      messages,
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
 * POST /api/groups/:id/messages
 * Send a message within a group chat.
 * Strictly enforced: ONLY ACCEPTED MEMBERS CAN POST.
 */
export const sendGroupMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Message content cannot be empty.',
      });
    }

    // Security check: ONLY ACCEPTED MEMBERS CAN POST
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
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
        groupId: id,
        senderId: currentUserId,
        content: content.trim(),
      },
      include: {
        sender: {
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

    // Update group's lastMessageAt
    await prisma.group.update({
      where: { id },
      data: { lastMessageAt: new Date() },
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
 * DELETE /api/groups/:id
 * Delete group. ONLY THE CREATOR CAN DELETE THE GROUP.
 */
export const deleteGroup = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return res.status(404).json({
        status: 'error',
        message: 'Group not found.',
      });
    }

    if (group.createdById !== currentUserId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the group creator can delete this group.',
      });
    }

    await prisma.group.delete({ where: { id } });

    return res.status(200).json({
      status: 'success',
      message: 'Group deleted successfully.',
    });
  } catch (error) {
    console.error('deleteGroup error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete group.',
    });
  }
};
