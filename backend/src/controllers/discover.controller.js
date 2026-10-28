import prisma from '../config/prisma.js';

/**
 * Safely parse JSON strings or fallback to empty array
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

/**
 * GET /api/users/discover
 * Filter peers by year, interests, skills, "looking for" (openTo), and free-text search (name, tech, hostel).
 * Computes a "Similar Interests" section with NO match percentages.
 */
export const getDiscoverPeers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { year, interest, skill, openTo, search } = req.query;

    // 1. Fetch current user to determine similar interests and check blocks
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        skills: true,
        interests: true,
        openTo: true,
        batchYear: true,
      },
    });

    const mySkills = parseJsonArray(currentUser?.skills).map((s) => s.toLowerCase());
    const myInterests = parseJsonArray(currentUser?.interests).map((s) => s.toLowerCase());

    // 2. Fetch all blocks involving current user (blocked by me, or blocked me)
    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          { blockerId: currentUserId },
          { blockedId: currentUserId },
        ],
      },
    });

    const blockedUserIds = new Set(
      blocks.map((b) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId))
    );
    blockedUserIds.add(currentUserId); // Exclude self

    // 3. Fetch all active conversations involving current user to annotate peer cards
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: currentUserId },
          { participant2Id: currentUserId },
        ],
      },
      select: {
        id: true,
        participant1Id: true,
        participant2Id: true,
        initiatorId: true,
        hasRecipientReplied: true,
        status: true,
      },
    });

    const conversationMap = new Map();
    for (const conv of conversations) {
      const otherId = conv.participant1Id === currentUserId ? conv.participant2Id : conv.participant1Id;
      conversationMap.set(otherId, conv);
    }

    // 4. Fetch all active onboarded users with strict safe projection (no password)
    const allUsers = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(blockedUserIds) },
        isOnboarded: true,
      },
      select: {
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
        courses: true,
        labGroup: true,
        isAvailable: true,
        currentStatus: true,
        privacySettings: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 5. Filter peers based on query params
    const filteredPeers = allUsers.filter((user) => {
      // Filter: Year / Batch
      if (year && year !== 'All Batches') {
        const targetYear = parseInt(year.replace(/\D/g, ''), 10);
        if (targetYear && user.batchYear !== targetYear) {
          // If formatted as e.g. "2023" or "27" (2027)
          if (user.batchYear !== (targetYear > 2000 ? targetYear : 2000 + targetYear)) {
            return false;
          }
        }
      }

      const userSkills = parseJsonArray(user.skills);
      const userInterests = parseJsonArray(user.interests);
      const userOpenTo = parseJsonArray(user.openTo);

      // Filter: Interest
      if (interest && interest !== 'All Interests') {
        const matchesInterest = userInterests.some(
          (i) => i.toLowerCase().includes(interest.toLowerCase())
        );
        if (!matchesInterest) return false;
      }

      // Filter: Skill
      if (skill && skill !== 'All Skills') {
        const matchesSkill = userSkills.some(
          (s) => s.toLowerCase().includes(skill.toLowerCase())
        );
        if (!matchesSkill) return false;
      }

      // Filter: "Looking for" / "Open to"
      if (openTo && openTo !== 'All') {
        const matchesOpenTo = userOpenTo.some(
          (o) => o.toLowerCase().includes(openTo.toLowerCase())
        );
        if (!matchesOpenTo) return false;
      }

      // Filter: Free text search across name, tech (skills/interests), and hostel
      if (search && search.trim()) {
        const query = search.trim().toLowerCase();
        const inName = user.name.toLowerCase().includes(query);
        const inRoll = user.rollNumber.toLowerCase().includes(query);
        const inHostel = (user.hostel || '').toLowerCase().includes(query);
        const inBio = (user.bio || '').toLowerCase().includes(query);
        const inSkills = userSkills.some((s) => s.toLowerCase().includes(query));
        const inInterests = userInterests.some((i) => i.toLowerCase().includes(query));

        if (!inName && !inRoll && !inHostel && !inBio && !inSkills && !inInterests) {
          return false;
        }
      }

      return true;
    });

    // 6. Map and sanitize peer data with privacy masking and conversation state
    const formatPeerCard = (user) => {
      let privacySettings = { showContactDetails: false, showRoomNumber: false };
      if (user.privacySettings) {
        try {
          privacySettings = JSON.parse(user.privacySettings);
        } catch {}
      }

      const userSkills = parseJsonArray(user.skills);
      const userInterests = parseJsonArray(user.interests);
      const userOpenTo = parseJsonArray(user.openTo);

      // Compute shared items for this peer
      const sharedInterests = userInterests.filter((i) =>
        myInterests.includes(i.toLowerCase())
      );
      const sharedSkills = userSkills.filter((s) =>
        mySkills.includes(s.toLowerCase())
      );

      // Conversation metadata
      const conv = conversationMap.get(user.id);
      const hasConversation = Boolean(conv);
      const isInitiator = conv?.initiatorId === currentUserId;
      const isAwaitingReply = Boolean(conv && isInitiator && !conv.hasRecipientReplied);
      const canSayHi = !conv || conv.hasRecipientReplied;

      return {
        id: user.id,
        name: user.name,
        rollNumber: user.rollNumber,
        batchYear: user.batchYear,
        batch: user.batchYear ? `${2027 - user.batchYear + 2}nd Year '${String(user.batchYear + 4).slice(-2)}` : 'CSE Student',
        department: user.department,
        hostel: user.hostel || 'Hostel 4 (Kaveri)',
        roomNo: privacySettings.showRoomNumber ? user.roomNo : null,
        roomHidden: !privacySettings.showRoomNumber,
        contactHidden: !privacySettings.showContactDetails,
        email: privacySettings.showContactDetails ? user.email : null,
        phone: privacySettings.showContactDetails ? user.phone : null,
        bio: user.bio || user.about || '',
        currentlyLearning: user.currentlyLearning || '',
        skills: userSkills,
        interests: userInterests,
        openTo: userOpenTo,
        courses: user.courses ? user.courses.split(',').map((c) => c.trim()) : [],
        labGroup: user.labGroup || 'CC-03',
        isAvailable: user.isAvailable,
        currentStatus: user.currentStatus || null,
        // Shared metadata with ZERO match percentages
        sharedInterests,
        sharedSkills,
        hasSharedContext: sharedInterests.length > 0 || sharedSkills.length > 0,
        // Conversation state
        conversationId: conv?.id || null,
        hasConversation,
        isAwaitingReply,
        canSayHi,
      };
    };

    const peers = filteredPeers.map(formatPeerCard);

    // 7. Compute "Similar Interests" section:
    // Peers who share at least one interest or skill with the current user.
    // Strictly NO match percentages or popularity scores anywhere!
    const similarPeers = allUsers
      .map(formatPeerCard)
      .filter((peer) => peer.hasSharedContext)
      .slice(0, 6);

    return res.status(200).json({
      status: 'success',
      count: peers.length,
      peers,
      similarPeers,
    });
  } catch (error) {
    console.error('getDiscoverPeers error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve discover directory.',
    });
  }
};
