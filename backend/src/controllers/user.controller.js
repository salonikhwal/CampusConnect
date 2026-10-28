import prisma from '../config/prisma.js';

// Helper to safely parse JSON arrays or comma-delimited strings
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
 * Get any student profile by ID or Roll Number
 * GET /api/users/:identifier
 */
export const getProfile = async (req, res) => {
  try {
    const { identifier } = req.params;
    const currentUserId = req.user?.id;

    // Support 'me' as shortcut for viewing own profile
    const targetQuery = identifier === 'me' ? currentUserId : identifier;

    // Search by ID or Roll Number (case-insensitive in SQLite)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: targetQuery },
          { rollNumber: targetQuery.toUpperCase() },
        ],
      },
      select: {
        id: true,
        name: true,
        rollNumber: true,
        email: true,
        phone: true,
        roomNo: true,
        hostel: true,
        labGroup: true,
        department: true,
        batchYear: true,
        bio: true,
        about: true,
        currentlyLearning: true,
        interests: true,
        skills: true,
        openTo: true,
        projects: true,
        courses: true,
        isAvailable: true,
        currentStatus: true,
        privacySettings: true,
        createdAt: true,
        posts: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            codeSnippet: true,
            codeLanguage: true,
            category: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found in campus directory.',
      });
    }

    const isOwner = user.id === currentUserId;

    // Default privacy settings
    let privacySettings = {
      showContactDetails: false, // Hidden by default
      showRoomNumber: true,
      allowDirectHi: true,
      showSchedule: true,
    };

    if (user.privacySettings) {
      try {
        privacySettings = {
          ...privacySettings,
          ...(typeof user.privacySettings === 'string'
            ? JSON.parse(user.privacySettings)
            : user.privacySettings),
        };
      } catch (e) {
        console.warn('Could not parse user privacy settings:', e);
      }
    }

    // Parse projects
    let projects = [];
    if (user.projects) {
      try {
        projects = typeof user.projects === 'string' ? JSON.parse(user.projects) : user.projects;
      } catch {
        projects = [];
      }
    }

    // Build response profile object
    const profile = {
      id: user.id,
      name: user.name,
      rollNumber: user.rollNumber,
      batchYear: user.batchYear,
      department: user.department,
      hostel: user.hostel,
      labGroup: user.labGroup,
      bio: user.bio || user.about || '',
      about: user.about || user.bio || '',
      currentlyLearning: user.currentlyLearning || '',
      interests: parseJsonArray(user.interests),
      skills: parseJsonArray(user.skills),
      openTo: parseJsonArray(user.openTo),
      projects,
      courses: user.courses ? user.courses.split(',').map((c) => c.trim()) : [],
      isAvailable: user.isAvailable,
      currentStatus: user.currentStatus,
      createdAt: user.createdAt,
      posts: user.posts || [],
      isOwner,
    };

    // Strict Contact & Privacy Access Control
    if (isOwner) {
      // Owner has full visibility of their own contact info and privacy toggles
      profile.email = user.email;
      profile.phone = user.phone || null;
      profile.roomNo = user.roomNo;
      profile.privacySettings = privacySettings;
    } else {
      // Peer / Classmate View:
      // "Contact details must be hidden unless privacy settings allow them."
      if (privacySettings.showContactDetails) {
        profile.email = user.email;
        profile.phone = user.phone || null;
        profile.contactHidden = false;
      } else {
        profile.email = null;
        profile.phone = null;
        profile.contactHidden = true; // Signals UI that details are kept private
      }

      if (privacySettings.showRoomNumber) {
        profile.roomNo = user.roomNo;
        profile.roomHidden = false;
      } else {
        profile.roomNo = null;
        profile.roomHidden = true;
      }

      // Public peer controls
      profile.allowDirectHi = privacySettings.allowDirectHi ?? true;
      profile.showSchedule = privacySettings.showSchedule ?? true;
    }

    return res.status(200).json({
      status: 'success',
      profile,
    });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve student profile.',
    });
  }
};

/**
 * Edit own profile
 * PUT /api/users/profile or PUT /api/users/:id
 */
export const updateProfile = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id || currentUserId;

    // View any profile, edit only my own
    if (targetUserId !== 'me' && targetUserId !== currentUserId) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You can only edit your own student profile.',
      });
    }

    const {
      name,
      about,
      bio,
      currentlyLearning,
      interests,
      skills,
      projects,
      openTo,
      privacySettings,
      hostel,
      roomNo,
      labGroup,
      phone,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
      courses,
      batchYear,
    } = req.body;

    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (about !== undefined) dataToUpdate.about = about;
    if (bio !== undefined) dataToUpdate.bio = bio;
    if (currentlyLearning !== undefined) dataToUpdate.currentlyLearning = currentlyLearning;
    if (hostel !== undefined) dataToUpdate.hostel = hostel;
    if (roomNo !== undefined) dataToUpdate.roomNo = roomNo;
    if (labGroup !== undefined) dataToUpdate.labGroup = labGroup;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (githubUrl !== undefined) dataToUpdate.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) dataToUpdate.linkedinUrl = linkedinUrl;
    if (portfolioUrl !== undefined) dataToUpdate.portfolioUrl = portfolioUrl;
    if (courses !== undefined) dataToUpdate.courses = courses;
    if (batchYear !== undefined) dataToUpdate.batchYear = batchYear;

    if (interests !== undefined) {
      dataToUpdate.interests = Array.isArray(interests) ? JSON.stringify(interests) : interests;
    }
    if (skills !== undefined) {
      dataToUpdate.skills = Array.isArray(skills) ? JSON.stringify(skills) : skills;
    }
    if (projects !== undefined) {
      dataToUpdate.projects = Array.isArray(projects) ? JSON.stringify(projects) : projects;
    }
    if (openTo !== undefined) {
      dataToUpdate.openTo = Array.isArray(openTo) ? JSON.stringify(openTo) : openTo;
    }
    if (privacySettings !== undefined) {
      dataToUpdate.privacySettings =
        typeof privacySettings === 'object'
          ? JSON.stringify(privacySettings)
          : privacySettings;
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: dataToUpdate,
    });

    const { password, ...sanitized } = updatedUser;

    return res.status(200).json({
      status: 'success',
      message: 'Student profile updated successfully.',
      user: sanitized,
      profile: sanitized,
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update student profile.',
    });
  }
};

/**
 * Create a new post by authenticated user
 * POST /api/users/posts
 */
export const createPost = async (req, res) => {
  try {
    const { content, codeSnippet, codeLanguage, category } = req.body;
    const authorId = req.user.id;

    const post = await prisma.post.create({
      data: {
        content,
        codeSnippet: codeSnippet || null,
        codeLanguage: codeLanguage || 'cpp',
        category: category || 'general',
        authorId,
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Post published to commons successfully.',
      post,
    });
  } catch (error) {
    console.error('createPost error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to publish post.',
    });
  }
};

/**
 * Delete own post
 * DELETE /api/users/posts/:postId
 */
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const authorId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found.',
      });
    }

    if (post.authorId !== authorId) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You can only delete your own posts.',
      });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Post removed successfully.',
    });
  } catch (error) {
    console.error('deletePost error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to remove post.',
    });
  }
};

/**
 * List all students for discovering peers
 * GET /api/users
 */
export const listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        rollNumber: true,
        batchYear: true,
        department: true,
        hostel: true,
        labGroup: true,
        bio: true,
        about: true,
        interests: true,
        skills: true,
        openTo: true,
      },
      orderBy: { rollNumber: 'asc' },
    });

    return res.status(200).json({
      status: 'success',
      users,
    });
  } catch (error) {
    console.error('listUsers error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch student directory.',
    });
  }
};
