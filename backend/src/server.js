import app from './app.js';
import { config } from './config/env.js';
import prisma from './config/prisma.js';

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log(' Connected to SQLite database via Prisma');

    const server = app.listen(config.port, () => {
      console.log(` CampusConnect Backend running on http://localhost:${config.port}`);
      console.log(` Allowed email domain: @${config.allowedEmailDomain}`);
      console.log(` Cookie auth name: ${config.cookieName}`);
    });

    const shutdown = async () => {
      console.log('\nShutting down CampusConnect server...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
