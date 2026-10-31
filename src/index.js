import app from './app.js';
import { sequelize } from './models/index.js';

const PORT = process.env.PORT || 5001;

/**
 * ============================================================================
 * SERVER BOOTSTRAP (PRODUCTION ENTRYPOINT)
 * ============================================================================
 * 
 * 1. Authenticates connection to PostgreSQL.
 * 2. Synchronizes Sequelize models with the database.
 * 3. Starts listening for HTTP requests on the designated PORT.
 */
async function startServer() {
  try {
    console.log('⏳ Connecting to PostgreSQL with Sequelize ORM...');
    
    // 1. Verify connection
    await sequelize.authenticate();
    console.log('🐘 PostgreSQL connected successfully via Sequelize!');

    // 2. Sync database models (creates table/indexes if they don\'t exist)
    // Note: In production with huge databases, migrations (Sequelize CLI) are preferred
    // over sync(). For development and microservices, sync({ alter: true }) is fast and safe.
    await sequelize.sync({ alter: true });
    console.log('✅ Sequelize models synchronized with PostgreSQL schema.');

    // 3. Start Express HTTP Server
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🔐 Auth Microservice (Sequelize) listening on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL with Sequelize:', error.message);
    console.warn(
      '\n💡 Troubleshooting Tip:\n' +
      '   1. Ensure PostgreSQL is running locally on port 5432, OR\n' +
      '   2. Provide a live cloud connection string (e.g. Neon.tech / Supabase) in `auth-service/.env`:\n' +
      '      DATABASE_URL=postgresql://user:pass@ep-host.neon.tech/auth_db?sslmode=require\n'
    );
  }
}

startServer();
