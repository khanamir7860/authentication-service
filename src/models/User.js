import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import config from '../config/index.js';

/**
 * ============================================================================
 * USER MODEL (PRODUCTION GRADE)
 * ============================================================================
 */
export class User extends Model {
  /**
   * Helper instance method to verify password
   * @param {string} plainPassword 
   * @returns {Promise<boolean>}
   */
  async validatePassword(plainPassword) {
    return await bcrypt.compare(plainPassword, this.password_hash);
  }

  /**
   * Security override: Never expose password_hash, tokens, or OTP in JSON responses
   */
  toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.email_verification_token;
    delete values.email_verification_expires;
    delete values.password_reset_token;
    delete values.password_reset_expires;
    delete values.phone_otp;
    delete values.phone_otp_expires;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notNull: { msg: 'Full name is required.' },
        len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters.' },
      },
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: { name: 'unique_username', msg: 'Username is already taken.' },
      validate: {
        notNull: { msg: 'Username is required.' },
        len: { args: [3, 50], msg: 'Username must be between 3 and 50 characters.' },
      },
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: { name: 'unique_email', msg: 'Email is already registered.' },
      validate: {
        notNull: { msg: 'Email is required.' },
        isEmail: { msg: 'Please provide a valid email address.' },
      },
      set(val) {
        if (val) this.setDataValue('email', val.trim().toLowerCase());
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: { name: 'unique_phone', msg: 'Phone number is already registered.' },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notNull: { msg: 'Password is required.' },
      },
    },
    // Email Verification Status
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    email_verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email_verification_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Phone Verification Status
    is_phone_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    phone_otp: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    phone_otp_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Password Reset
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    indexes: [
      { fields: ['email'] },
      { fields: ['username'] },
      { fields: ['phone'] },
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          const salt = await bcrypt.genSalt(config.security.saltRounds);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          const salt = await bcrypt.genSalt(config.security.saltRounds);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      },
    },
  }
);

export default User;
