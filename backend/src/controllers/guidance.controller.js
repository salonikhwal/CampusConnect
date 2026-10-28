import prisma from '../config/prisma.js';

/**
 * Parse JSON or comma-separated values into a clean array
 */
const parseArray = (val) => {
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
 * Determine if a user is a 3rd or 4th-year student
 * - Roll numbers starting with 2021 (4th year) or 2022 (3rd year)
 * - Or batchYear = 3, 4, 2021, 2022, 2025, 2026
 */
export const isSeniorStudent = (user) => {
  if (!user) return false;

  const roll = user.rollNumber ? String(user.rollNumber).toUpperCase() : '';
  if (roll.startsWith('2021') || roll.startsWith('2022')) {
    return true;
  }

  const batch = Number(user.batchYear);
  if (batch === 3 || batch === 4) return true;
  if (batch === 2021 || batch === 2022) return true; // Entry years for 4th & 3rd years
  if (batch === 2025 || batch === 2026) return true; // Graduating years for 4th & 3rd years

  return false;
};

/**
 * Get human-readable Year Label
 */
export const getYearLabel = (user) => {
  const roll = user.rollNumber ? String(user.rollNumber).toUpperCase() : '';
  const batch = Number(user.batchYear);

  if (roll.startsWith('2021') || batch === 2021 || batch === 2025 || batch === 4) {
    return '4th Year (Batch of 2025)';
  }
  if (roll.startsWith('2022') || batch === 2022 || batch === 2026 || batch === 3) {
    return '3rd Year (Batch of 2026)';
  }
  if (roll.startsWith('2023') || batch === 2023 || batch === 2027 || batch === 2) {
    return '2nd Year (Batch of 2027)';
  }
  if (roll.startsWith('2024') || batch === 2024 || batch === 2028 || batch === 1) {
    return '1st Year (Batch of 2028)';
  }
  return 'MNIT Student';
};

/**
 * GET /api/guidance/status
 * Check current user's eligibility and opt-in status as a guidance provider
 */
export const getGuidanceStatus = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        name: true,
        rollNumber: true,
        batchYear: true,
        isGuidanceProvider: true,
        guidanceTopics: true,
        guidanceBio: true,
        guidanceAvailability: true,
      },
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const isEligible = isSeniorStudent(user);

    return res.status(200).json({
      status: 'success',
      isEligibleSenior: isEligible,
      yearLabel: getYearLabel(user),
      isGuidanceProvider: Boolean(user.isGuidanceProvider),
      guidanceTopics: parseArray(user.guidanceTopics),
      guidanceBio: user.guidanceBio || '',
      guidanceAvailability: user.guidanceAvailability || '',
    });
  } catch (error) {
    console.error('getGuidanceStatus error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve guidance status' });
  }
};

/**
 * POST /api/guidance/opt-in
 * Opt in or update guidance provider profile.
 * Only 3rd and 4th-year students can opt in.
 */
export const optInGuidance = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, rollNumber: true, batchYear: true },
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Role check: Only 3rd and 4th-year students
    if (!isSeniorStudent(user)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only 3rd and 4th-year students can opt in as guidance providers.',
      });
    }

    const { guidanceTopics, guidanceBio, guidanceAvailability } = req.body;

    const topicsList = parseArray(guidanceTopics);
    if (topicsList.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please specify at least one topic you are open to helping juniors with.',
      });
    }

    const updated = await prisma.user.update({
      where: { id: currentUserId },
      data: {
        isGuidanceProvider: true,
        guidanceTopics: JSON.stringify(topicsList),
        guidanceBio: guidanceBio ? String(guidanceBio).trim() : null,
        guidanceAvailability: guidanceAvailability ? String(guidanceAvailability).trim() : null,
      },
      select: {
        id: true,
        name: true,
        rollNumber: true,
        batchYear: true,
        isGuidanceProvider: true,
        guidanceTopics: true,
        guidanceBio: true,
        guidanceAvailability: true,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'You have successfully opted in as a guidance provider! Juniors can now reach out for advice.',
      guidanceProfile: {
        ...updated,
        guidanceTopics: parseArray(updated.guidanceTopics),
      },
    });
  } catch (error) {
    console.error('optInGuidance error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to opt in for guidance' });
  }
};

/**
 * POST /api/guidance/opt-out
 * Opt out of being a guidance provider
 */
export const optOutGuidance = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    await prisma.user.update({
      where: { id: currentUserId },
      data: {
        isGuidanceProvider: false,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'You have paused your guidance provider profile. Juniors will no longer see you in active guidance listings.',
      isGuidanceProvider: false,
    });
  } catch (error) {
    console.error('optOutGuidance error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to opt out of guidance' });
  }
};

/**
 * GET /api/guidance/providers
 * List 3rd and 4th-year seniors who have opted in as guidance providers.
 * Supports filtering by topic and search query.
 */
export const getGuidanceProviders = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { topic, search } = req.query;

    // Check blocks
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

    // Fetch active guidance providers
    const providers = await prisma.user.findMany({
      where: {
        isGuidanceProvider: true,
        isOnboarded: true,
        id: { notIn: Array.from(blockedUserIds) },
      },
      select: {
        id: true,
        name: true,
        rollNumber: true,
        batchYear: true,
        department: true,
        hostel: true,
        roomNo: true,
        bio: true,
        about: true,
        avatarUrl: true,
        skills: true,
        interests: true,
        courses: true,
        guidanceTopics: true,
        guidanceBio: true,
        guidanceAvailability: true,
        privacySettings: true,
      },
      orderBy: [
        { batchYear: 'asc' }, // 4th years (2021) then 3rd years (2022)
        { name: 'asc' },
      ],
    });

    // Check existing conversations with current user
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
      },
    });

    const convMap = new Map();
    for (const c of conversations) {
      const otherId = c.participant1Id === currentUserId ? c.participant2Id : c.participant1Id;
      convMap.set(otherId, c);
    }

    // Filter and format
    const filtered = providers.filter((p) => {
      // Strictly ensure provider is 3rd or 4th year
      if (!isSeniorStudent(p)) return false;

      const topics = parseArray(p.guidanceTopics);

      // Topic filter
      if (topic && topic !== 'All Topics' && topic !== 'All') {
        const match = topics.some((t) => t.toLowerCase().includes(topic.toLowerCase()));
        if (!match) return false;
      }

      // Search filter
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        const inName = p.name?.toLowerCase().includes(q);
        const inRoll = p.rollNumber?.toLowerCase().includes(q);
        const inBio = p.bio?.toLowerCase().includes(q) || p.about?.toLowerCase().includes(q);
        const inGuidanceBio = p.guidanceBio?.toLowerCase().includes(q);
        const inHostel = p.hostel?.toLowerCase().includes(q);
        const inTopics = topics.some((t) => t.toLowerCase().includes(q));
        const inSkills = parseArray(p.skills).some((s) => s.toLowerCase().includes(q));

        if (!inName && !inRoll && !inBio && !inGuidanceBio && !inHostel && !inTopics && !inSkills) {
          return false;
        }
      }

      return true;
    });

    const formatted = filtered.map((p) => {
      const privacy = p.privacySettings ? JSON.parse(p.privacySettings) : {};
      const existingConv = convMap.get(p.id);

      return {
        id: p.id,
        name: p.name,
        rollNumber: p.rollNumber,
        batchYear: p.batchYear,
        yearLabel: getYearLabel(p),
        department: p.department,
        hostel: p.hostel,
        roomNo: privacy.showRoomNumber ? p.roomNo : null,
        avatarUrl: p.avatarUrl,
        bio: p.bio,
        about: p.about,
        skills: parseArray(p.skills),
        interests: parseArray(p.interests),
        courses: p.courses ? p.courses.split(',').map((c) => c.trim()) : [],
        guidanceTopics: parseArray(p.guidanceTopics),
        guidanceBio: p.guidanceBio,
        guidanceAvailability: p.guidanceAvailability,
        isSelf: p.id === currentUserId,
        hasExistingConversation: Boolean(existingConv),
        existingConversationId: existingConv?.id || null,
        awaitingReply:
          existingConv &&
          existingConv.initiatorId === currentUserId &&
          !existingConv.hasRecipientReplied,
      };
    });

    return res.status(200).json({
      status: 'success',
      count: formatted.length,
      seniors: formatted,
    });
  } catch (error) {
    console.error('getGuidanceProviders error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve guidance providers' });
  }
};

/**
 * GET /api/guidance/faqs
 * Retrieve curated "Questions students often ask"
 */
export const getGuidanceFaqs = async (req, res) => {
  try {
    const { category, topic } = req.query;
    const where = {};

    if (category && category !== 'All') {
      where.category = category;
    }
    if (topic && topic !== 'All') {
      where.topicTag = { contains: topic };
    }

    const faqs = await prisma.guidanceFaq.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({
      status: 'success',
      count: faqs.length,
      faqs,
    });
  } catch (error) {
    console.error('getGuidanceFaqs error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve FAQs' });
  }
};

/**
 * GET /api/guidance/topics
 * Get dynamic list of guidance topics across all active providers
 */
export const getGuidanceTopics = async (req, res) => {
  try {
    const providers = await prisma.user.findMany({
      where: { isGuidanceProvider: true },
      select: { guidanceTopics: true },
    });

    const topicSet = new Set();
    // Default high-demand topics
    [
      'Nachos OS Lab',
      'Competitive Programming',
      'Distributed Systems',
      'Course Electives',
      'Open Source & GSoC',
      'Systems Projects',
      'Research & BTP',
      'Campus Life & Hackathons',
    ].forEach((t) => topicSet.add(t));

    providers.forEach((p) => {
      parseArray(p.guidanceTopics).forEach((t) => topicSet.add(t));
    });

    return res.status(200).json({
      status: 'success',
      topics: Array.from(topicSet),
    });
  } catch (error) {
    console.error('getGuidanceTopics error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve topics' });
  }
};
