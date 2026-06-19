const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

class User extends Model {
  // Method to check passwords
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Convert model instance to API shape matching frontend expectation
  toProfile() {
    const obj = {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      phone: this.phone,
      avatar: this.avatar,
      gender: this.gender,
      dateOfBirth: this.dateOfBirth,
      bio: this.bio,
    };
    if (this.role === 'CUSTOMER') {
      obj.customerProfile = { 
        addresses: this.addresses || [], 
        preferences: this.preferences || {} 
      };
    }
    if (this.role === 'SELLER') {
      obj.sellerProfile = {
        id: this.id,
        storeName: this.storeName,
        storeDescription: this.storeDescription,
        businessEmail: this.businessEmail,
        businessPhone: this.businessPhone,
        verificationStatus: this.verificationStatus,
        commissionRate: this.commissionRate,
      };
    }
    return obj;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100],
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'),
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('CUSTOMER', 'SELLER', 'ADMIN'),
      defaultValue: 'CUSTOMER',
    },
    // Customer-specific details
    addresses: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    // Seller-specific details
    storeName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    storeDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    businessEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    businessPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verificationStatus: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    commissionRate: {
      type: DataTypes.FLOAT,
      defaultValue: 0.1,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

module.exports = User;
