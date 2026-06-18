const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');
const Category = require('./Category');
const User = require('./User');

class Product extends Model {
  // Translate to the API response structure expected by the rest of the application
  toAPI(category, seller) {
    const images = this.galleryImages && this.galleryImages.length > 0 
      ? this.galleryImages 
      : (this.imageUrl ? [this.imageUrl] : []);

    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      brand: this.brand || '',
      description: this.description,
      price: parseFloat(this.price),
      discountPrice: this.discountPrice ? parseFloat(this.discountPrice) : null,
      comparePrice: this.discountPrice ? parseFloat(this.discountPrice) : null, // for frontend compatibility
      sku: this.sku,
      stock: this.stock,
      quantity: this.stock, // compatibility with legacy client schema (which expects quantity)
      inStock: this.stock > 0,
      image: this.imageUrl || null,
      imageUrl: this.imageUrl,
      images: images,
      galleryImages: this.galleryImages || [],
      status: this.status,
      featured: this.featured,
      tags: this.tags || [],
      categoryId: this.categoryId,
      sellerId: this.sellerId,
      createdAt: this.createdAt ? new Date(this.createdAt).toISOString() : null,
      updatedAt: this.updatedAt ? new Date(this.updatedAt).toISOString() : null,
      category: category 
        ? { id: category.id, name: category.name, slug: category.slug } 
        : (this.Category ? { id: this.Category.id, name: this.Category.name, slug: this.Category.slug } : undefined),
      seller: seller 
        ? { id: seller.id, storeName: seller.storeName || seller.name, user: { name: seller.name } } 
        : (this.Seller ? { id: this.Seller.id, storeName: this.Seller.storeName || this.Seller.name, user: { name: this.Seller.name } } : undefined),
      averageRating: parseFloat(this.rating || 0),
      reviewCount: this.reviewCount || 0,
      rating: parseFloat(this.rating || 0),
      reviews: this.reviewCount || 0,
    };
  }
}

Product.init(
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
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Generic',
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
    price: {
      type: DataTypes.NUMERIC(12, 2),
      allowNull: false,
    },
    discountPrice: {
      type: DataTypes.NUMERIC(12, 2),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    rating: {
      type: DataTypes.NUMERIC(3, 2),
      defaultValue: 0.0,
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true, // Implements duplicate image URL prevention at the database level!
    },
    galleryImages: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'),
      defaultValue: 'ACTIVE',
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    underscored: true,
  }
);

// Setup associations
Product.belongsTo(Category, { foreignKey: 'categoryId' });
Category.hasMany(Product, { foreignKey: 'categoryId' });

Product.belongsTo(User, { as: 'Seller', foreignKey: 'sellerId' });
User.hasMany(Product, { as: 'Products', foreignKey: 'sellerId' });

module.exports = Product;
