const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

class Cart extends Model {
  // Return cart data formatted for frontend compatibility
  toAPI(itemsList = []) {
    const items = itemsList.map(item => {
      const p = item.Product;
      return {
        id: item.id.toString(),
        productId: item.productId.toString(),
        quantity: item.quantity,
        price: parseFloat(item.price || (p ? p.price : 0)),
        product: p ? p.toAPI() : null
      };
    });

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: this.id.toString(),
      userId: this.userId.toString(),
      items: items,
      itemCount: itemCount,
      total: total,
      createdAt: this.createdAt ? new Date(this.createdAt).toISOString() : null,
      updatedAt: this.updatedAt ? new Date(this.updatedAt).toISOString() : null
    };
  }
}

Cart.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'Cart',
    tableName: 'carts',
    underscored: true,
  }
);

Cart.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Cart, { foreignKey: 'userId' });

module.exports = Cart;
