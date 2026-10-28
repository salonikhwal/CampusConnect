import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  jwtSecret: process.env.JWT_SECRET || 'campusconnect_mnit_jaipur_secret_key_2026_dev_mode',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  allowedEmailDomain: (process.env.ALLOWED_EMAIL_DOMAIN || 'mnit.ac.in').replace(/^@/, '').toLowerCase(),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  cookieName: 'campusconnect_token',
};
