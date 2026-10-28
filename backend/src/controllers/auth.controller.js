import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { config } from '../config/env.js';
import { signToken } from '../utils/jwt.js';
import { getCookieOptions, getClearCookieOptions } from '../utils/cookie.js';

// Helper to remove sensitive password hash
const sanitizeUser = (user) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Register new student account
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      rollNumber,
      batchYear,
      hostel,
      roomNo,
      labGroup,
      department,
      bio,
    } = req.body;

    // Check if email already registered
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return res.status(409).json({
        status: 'error',
        message: 'A student account with this email address already exists.',
      });
    }

    // Check if roll number already registered
    const existingRoll = await prisma.user.findUnique({
      where: { rollNumber },
    });
    if (existingRoll) {
      return res.status(409).json({
        status: 'error',
        message: 'A student account with this roll number already exists.',
      });
    }

    // Hash password with bcrypt
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Auto-detect batch year from roll number if omitted (e.g. "2023UCSE042" -> 2023)
    let parsedBatchYear = batchYear;
    if (!parsedBatchYear && rollNumber) {
      const match = rollNumber.match(/^(\d{4})/);
      if (match) {
        parsedBatchYear = parseInt(match[1], 10);
      }
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        rollNumber,
        batchYear: parsedBatchYear,
        department: department || 'Computer Science & Engineering',
        hostel: hostel || null,
        roomNo: roomNo || null,
        labGroup: labGroup || null,
        bio: bio || null,
      },
    });

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      rollNumber: user.rollNumber,
    });

    // Set JWT in httpOnly cookie
    res.cookie(config.cookieName, token, getCookieOptions());

    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully. Welcome to CampusConnect!',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create student account. Please try again.',
    });
  }
};

/**
 * Log in student account
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    // Compare bcrypt password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      rollNumber: user.rollNumber,
    });

    // Set JWT in httpOnly cookie
    res.cookie(config.cookieName, token, getCookieOptions());

    return res.status(200).json({
      status: 'success',
      message: 'Logged in successfully.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process login request.',
    });
  }
};

/**
 * Log out student and clear httpOnly cookie
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
  res.clearCookie(config.cookieName, getClearCookieOptions());
  return res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.',
  });
};

/**
 * Get current authenticated user
 * GET /api/auth/me (or /api/auth/current-user)
 */
export const getCurrentUser = (req, res) => {
  return res.status(200).json({
    status: 'success',
    user: req.user,
  });
};

/**
 * Update onboarding details (name, year, interests, skills, what they're open to)
 * PUT /api/auth/onboarding
 */
export const updateOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      batchYear,
      interests,
      skills,
      openTo,
      hostel,
      roomNo,
      labGroup,
      bio,
    } = req.body;

    const dataToUpdate = {
      isOnboarded: true,
    };

    if (name) dataToUpdate.name = name;
    if (batchYear) dataToUpdate.batchYear = batchYear;
    if (hostel !== undefined) dataToUpdate.hostel = hostel;
    if (roomNo !== undefined) dataToUpdate.roomNo = roomNo;
    if (labGroup !== undefined) dataToUpdate.labGroup = labGroup;
    if (bio !== undefined) dataToUpdate.bio = bio;

    if (interests !== undefined) {
      dataToUpdate.interests = Array.isArray(interests)
        ? JSON.stringify(interests)
        : interests;
    }
    if (skills !== undefined) {
      dataToUpdate.skills = Array.isArray(skills)
        ? JSON.stringify(skills)
        : skills;
    }
    if (openTo !== undefined) {
      dataToUpdate.openTo = Array.isArray(openTo)
        ? JSON.stringify(openTo)
        : openTo;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Onboarding profile updated successfully.',
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    console.error('Onboarding update error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update onboarding profile.',
    });
  }
};

