const express = require('express');
const { Op } = require('sequelize');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const { sequelize } = require('../config/db');

const router = express.Router();

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, minPrice, maxPrice, featured, search, sortBy, sortOrder } = req.query;
    
    const whereClause = { status: 'ACTIVE' };

    // Category filter
    if (category) {
      const cat = await Category.findOne({ 
        where: { 
          [Op.or]: [
            { slug: category },
            { name: { [Op.iLike]: category } }
          ]
        } 
      });
      if (cat) {
        whereClause.categoryId = cat.id;
      } else {
        // If category query doesn't match anything, return empty list
        return res.json({
          products: [],
          pagination: { page: Number(page), limit: Number(limit), total: 0, pages: 0 },
        });
      }
    }

    // Price filters
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
    }

    // Featured filter
    if (featured === 'true') {
      whereClause.featured = true;
    }

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        // For tags which is JSONB, we cast it to text or perform check
        sequelize.where(
          sequelize.cast(sequelize.col('tags'), 'text'),
          { [Op.iLike]: `%${search}%` }
        )
      ];
    }

    // Sorting parameters
    const orderField = sortBy || 'createdAt';
    const orderDirection = sortOrder && sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const order = [[orderField, orderDirection]];

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Fetch count and items in one query using findAndCountAll
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [Category, { model: User, as: 'Seller' }],
      order,
      limit: limitNum,
      offset
    });

    const formatted = products.map(p => p.toAPI());

    res.json({
      products: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/seller/my-products (must be before /:id)
router.get('/seller/my-products', protect, requireRole('SELLER', 'ADMIN'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, sortBy, sortOrder } = req.query;
    
    const whereClause = { sellerId: req.user.id };
    
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    const orderField = sortBy || 'createdAt';
    const orderDirection = sortOrder && sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const order = [[orderField, orderDirection]];

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [Category, { model: User, as: 'Seller' }],
      order,
      limit: limitNum,
      offset
    });

    const formatted = products.map(p => p.toAPI());

    res.json({
      products: formatted,
      pagination: { 
        page: pageNum, 
        limit: limitNum, 
        total: count, 
        pages: Math.ceil(count / limitNum) 
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [Category, { model: User, as: 'Seller' }]
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product: product.toAPI() });
  } catch (err) {
    next(err);
  }
});

// POST /api/products (seller)
router.post('/', protect, requireRole('SELLER', 'ADMIN'), async (req, res, next) => {
  try {
    const { name, brand, description, price, comparePrice, sku, quantity, images, status, featured, tags, categoryId } = req.body;
    
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now()}`;
    
    const mainImage = images && images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&w=800&q=80';
    
    // Check for duplicate image URLs before saving
    const { isDuplicateImageUrl } = require('../utils/imageValidator');
    const isDup = await isDuplicateImageUrl(mainImage);
    if (isDup) {
      return res.status(400).json({ message: 'This product image is already used by another listing.' });
    }

    const product = await Product.create({
      name,
      slug,
      brand: brand || 'Generic',
      description,
      price: parseFloat(price),
      discountPrice: comparePrice ? parseFloat(comparePrice) : null,
      sku,
      stock: quantity || 0, // stock maps to quantity
      imageUrl: mainImage,
      galleryImages: images || [mainImage],
      status: status || 'ACTIVE',
      featured: featured || false,
      tags: tags || [],
      categoryId: parseInt(categoryId),
      sellerId: req.user.id,
    });
    
    // Fetch newly created product with joined associations
    const freshProduct = await Product.findByPk(product.id, {
      include: [Category, { model: User, as: 'Seller' }]
    });

    res.status(201).json({ message: 'Product created', product: freshProduct.toAPI() });
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id
router.put('/:id', protect, requireRole('SELLER', 'ADMIN'), async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    if (product.sellerId.toString() !== req.user.id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not your product' });
    }

    const { name, brand, description, price, comparePrice, sku, quantity, images, status, featured, tags, categoryId } = req.body;
    
    if (name) {
      product.name = name;
      product.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${product.id}`;
    }
    if (brand) product.brand = brand;
    if (description) product.description = description;
    if (price !== undefined) product.price = parseFloat(price);
    if (comparePrice !== undefined) product.discountPrice = comparePrice ? parseFloat(comparePrice) : null;
    if (sku) product.sku = sku;
    if (quantity !== undefined) product.stock = parseInt(quantity);
    if (status) product.status = status;
    if (featured !== undefined) product.featured = featured;
    if (tags) product.tags = tags;
    if (categoryId) product.categoryId = parseInt(categoryId);
    
    if (images && images.length > 0) {
      const mainImage = images[0];
      const { isDuplicateImageUrl } = require('../utils/imageValidator');
      const isDup = await isDuplicateImageUrl(mainImage, product.id);
      if (isDup) {
        return res.status(400).json({ message: 'This product image is already used by another listing.' });
      }
      product.imageUrl = mainImage;
      product.galleryImages = images;
    }

    await product.save();
    
    const freshProduct = await Product.findByPk(product.id, {
      include: [Category, { model: User, as: 'Seller' }]
    });

    res.json({ message: 'Product updated', product: freshProduct.toAPI() });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, requireRole('SELLER', 'ADMIN'), async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    if (product.sellerId.toString() !== req.user.id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not your product' });
    }
    
    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
