const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

class Order extends Model {
  // Translate to the API response structure expected by frontend
  toAPI(itemsList = []) {
    const items = itemsList.map(item => {
      const p = item.Product;
      return {
        id: item.id.toString(),
        productId: item.productId.toString(),
        quantity: item.quantity,
        price: parseFloat(item.unitPrice),
        total: parseFloat(item.quantity * item.unitPrice),
        product: p ? p.toAPI() : null
      };
    });

    return {
      id: this.id.toString(),
      orderNumber: this.orderNumber,
      userId: this.userId.toString(),
      status: this.status,
      paymentStatus: this.paymentStatus,
      currency: this.currency,
      subtotal: parseFloat(this.subtotal),
      tax: parseFloat(this.tax || 0),
      shipping: parseFloat(this.shipping || 0),
      discount: parseFloat(this.discount || 0),
      total: parseFloat(this.total),
      notes: this.notes,
      shippingAddress: this.shippingAddress,
      billingAddress: this.billingAddress,
      paymentId: this.paymentId,
      items: items,
      createdAt: this.createdAt ? new Date(this.createdAt).toISOString() : null,
      updatedAt: this.updatedAt ? new Date(this.updatedAt).toISOString() : null,
    };
  }
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'),
      defaultValue: 'PENDING',
    },
    paymentStatus: {
      type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'),
      defaultValue: 'PENDING',
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'INR',
    },
    subtotal: {
      type: DataTypes.NUMERIC(12, 2),
      allowNull: false,
    },
    tax: {
      type: DataTypes.NUMERIC(12, 2),
      defaultValue: 0.00,
    },
    shipping: {
      type: DataTypes.NUMERIC(12, 2),
      defaultValue: 0.00,
    },
    discount: {
      type: DataTypes.NUMERIC(12, 2),
      defaultValue: 0.00,
    },
    total: {
      type: DataTypes.NUMERIC(12, 2),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    paymentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    underscored: true,
    hooks: {
      beforeValidate: (order) => {
        if (!order.orderNumber) {
          order.orderNumber = `PK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        }
      },
    },
  }
);

Order.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Order, { foreignKey: 'userId' });

module.exports = Order;
