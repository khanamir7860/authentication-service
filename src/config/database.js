import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ============================================================================
 * PRODUCTION SEQUELIZE DATABASE CONFIGURATION
 * ============================================================================
 * 
 * Supports both:
 * 1. Local PostgreSQL (e.g., localhost:5432)
 * 2. Live Cloud PostgreSQL (Neon, Supabase, Render, AWS RDS)
 *    Cloud instances require SSL enabled (`dialectOptions.ssl`).
 */

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/auth_db';
const isCloudDatabase = DATABASE_URL.includes('neon.tech') || 
                        DATABASE_URL.includes('supabase.co') || 
                        DATABASE_URL.includes('render.com') ||
                        process.env.NODE_ENV === 'production';

export const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'production' ? false : console.log,
  
  // Connection Pool configuration for production scaling
  pool: {
    max: 10,        // Maximum number of connections in pool
    min: 0,         // Minimum number of connections in pool
    acquire: 30000, // Maximum time (ms) that pool will try to get connection before throwing error
    idle: 10000,    // Maximum time (ms) that a connection can be idle before being released
  },

  // Dialect options (SSL for cloud providers like Neon / Supabase)
  dialectOptions: isCloudDatabase
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Allows connection with cloud SSL certificates
        },
      }
    : {},

  // Define global options for all models
  define: {
    timestamps: true,       // Automatically adds createdAt and updatedAt
    underscored: true,      // Uses snake_case for database columns (e.g., created_at)
    freezeTableName: true,  // Prevents Sequelize from pluralizing table names
  },
});

export default sequelize;

