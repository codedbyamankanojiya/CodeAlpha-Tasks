const express = require('express');
const Category = require('../models/Category');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    
    // Count products per category
    const result = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.count({ 
          where: { 
            categoryId: cat.id, 
            status: 'ACTIVE' 
          } 
        });
        const obj = cat.toJSON();
        obj._count = { products: count };
        return obj;
      })
    );
    res.json({ categories: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/tree
router.get('/tree', async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Category, as: 'children' }],
      order: [['name', 'ASC']]
    });
    
    const roots = categories.filter((c) => !c.parentId);
    res.json({ categories: roots });
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/:id
router.get('/:id', async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ category: category.toJSON() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
