import prisma from '../config/prisma.js';

/**
 * Helper to parse JSON arrays safely
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
 * Format batchYear to human readable label
 */
const getYearLabel = (user) => {
  const roll = user.rollNumber ? String(user.rollNumber).toUpperCase() : '';
  const batch = Number(user.batchYear);
  if (roll.startsWith('2021') || batch === 2021 || batch === 2025 || batch === 4) return '4th Year';
  if (roll.startsWith('2022') || batch === 2022 || batch === 2026 || batch === 3) return '3rd Year';
  if (roll.startsWith('2023') || batch === 2023 || batch === 2027 || batch === 2) return '2nd Year';
  if (roll.startsWith('2024') || batch === 2024 || batch === 2028 || batch === 1) return '1st Year';
  return 'MNIT Student';
};

/**
 * GET /api/search?q=...
 * Omni-search across People (students), Posts (community discussions), and Groups (campus groups).
 */
export const globalSearch = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(200).json({
        status: 'success',
        query: '',
        results: { people: [], posts: [], groups: [] },
      });
    }

    const query = q.trim();

    // 1. Fetch blocked users to exclude from people search
    const blocks = await prisma.block.findMany({
      where: {
        OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
      },
    });
    const blockedUserIds = new Set(
      blocks.map((b) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId))
    );

    // 2. Perform parallel searches across User, Post, Group
    const [peopleMatches, postMatches, groupMatches] = await Promise.all([
      // A) Search People
      prisma.user.findMany({
        where: {
          isOnboarded: true,
          id: { notIn: Array.from(blockedUserIds) },
          OR: [
            { name: { contains: query } },
            { rollNumber: { contains: query } },
            { department: { contains: query } },
            { hostel: { contains: query } },
            { skills: { contains: query } },
            { interests: { contains: query } },
            { courses: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          rollNumber: true,
          batchYear: true,
          avatarUrl: true,
          department: true,
          hostel: true,
          skills: true,
        },
        take: 8,
      }),

      // B) Search Posts
      prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
            { tags: { contains: query } },
          ],
        },
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          tags: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              rollNumber: true,
            },
          },
        },
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),

      // C) Search Groups
      prisma.group.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            { category: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          avatarUrl: true,
          _count: {
            select: {
              members: {
                where: { status: 'accepted' },
              },
            },
          },
        },
        take: 8,
        orderBy: { lastMessageAt: 'desc' },
      }),
    ]);

    // Format people
    const formattedPeople = peopleMatches.map((u) => ({
      id: u.id,
      name: u.name,
      rollNumber: u.rollNumber,
      yearLabel: getYearLabel(u),
      avatarUrl: u.avatarUrl,
      hostel: u.hostel,
      skills: parseArray(u.skills).slice(0, 3),
      isSelf: u.id === currentUserId,
    }));

    // Format posts
    const formattedPosts = postMatches.map((p) => ({
      id: p.id,
      title: p.title,
      snippet: p.content.slice(0, 120),
      category: p.category,
      tags: p.tags ? p.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      author: p.author,
      createdAt: p.createdAt,
    }));

    // Format groups
    const formattedGroups = groupMatches.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      category: g.category,
      avatarUrl: g.avatarUrl,
      memberCount: g._count.members,
    }));

    return res.status(200).json({
      status: 'success',
      query,
      results: {
        people: formattedPeople,
        posts: formattedPosts,
        groups: formattedGroups,
      },
    });
  } catch (error) {
    console.error('globalSearch error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to perform global search.',
    });
  }
};
