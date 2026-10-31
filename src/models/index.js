import sequelize from '../config/database.js';
import User from './User.js';
import RefreshToken from './RefreshToken.js';

/**
 * ============================================================================
 * MODEL ASSOCIATIONS
 * ============================================================================
 */
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

const db = {
  sequelize,
  User,
  RefreshToken,
};

export { sequelize, User, RefreshToken };
export default db;
