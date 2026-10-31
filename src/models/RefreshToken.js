import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * ============================================================================
 * REFRESH TOKEN MODEL (SESSION & TOKEN ROTATION MANAGEMENT)
 * ============================================================================
 * 
 * In production:
 * 1. Refresh tokens are stored in the database so they can be explicitly REVOKED (Logout).
 * 2. When a refresh token is used, it is rotated (the old one is invalidated, and a new one is issued).
 */
export class RefreshToken extends Model {
  get isExpired() {
    return new Date() >= this.expires_at;
  }

  get isActive() {
    return !this.revoked_at && !this.isExpired;
  }
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    replaced_by_token: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    indexes: [
      { fields: ['token'] },
      { fields: ['user_id'] },
    ],
  }
);

export default RefreshToken;

