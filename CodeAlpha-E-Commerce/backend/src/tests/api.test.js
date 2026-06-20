const request = require('supertest');
const jwt = require('jsonwebtoken');

// Set env variables before importing app
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';

// Mock the models to isolate route logic and run without DB connection
jest.mock('../models/User', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'CUSTOMER',
    comparePassword: jest.fn().mockResolvedValue(true),
    toProfile: jest.fn().mockReturnValue({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'CUSTOMER'
    }),
    save: jest.fn().mockResolvedValue(true),
    changed: jest.fn()
  };
  
  return {
    findOne: jest.fn().mockResolvedValue(mockUser),
    findByPk: jest.fn().mockResolvedValue(mockUser),
    create: jest.fn().mockResolvedValue(mockUser)
  };
});

jest.mock('../models/Product', () => {
  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 99.99,
    stock: 10,
    imageUrl: 'https://example.com/img.jpg',
    toAPI: jest.fn().mockReturnValue({
      id: '1',
      name: 'Test Product',
      price: 99.99,
      image: 'https://example.com/img.jpg'
    }),
    save: jest.fn().mockResolvedValue(true)
  };
  return {
    findAndCountAll: jest.fn().mockResolvedValue({ count: 1, rows: [mockProduct] }),
    findByPk: jest.fn().mockResolvedValue(mockProduct),
    create: jest.fn().mockResolvedValue(mockProduct),
    count: jest.fn().mockResolvedValue(1)
  };
});

jest.mock('../models/Category', () => {
  const mockCat = {
    id: 1,
    name: 'Electronics',
    slug: 'electronics',
    toJSON: jest.fn().mockReturnValue({ id: 1, name: 'Electronics', slug: 'electronics' })
  };
  return {
    findAll: jest.fn().mockResolvedValue([mockCat]),
    findByPk: jest.fn().mockResolvedValue(mockCat)
  };
});

jest.mock('../models/Cart', () => {
  const mockCart = {
    id: 1,
    userId: 1,
    toAPI: jest.fn().mockReturnValue({ id: '1', items: [], total: 0, itemCount: 0 })
  };
  return {
    findOrCreate: jest.fn().mockResolvedValue([mockCart]),
    findOne: jest.fn().mockResolvedValue(mockCart)
  };
});

jest.mock('../models/CartItem', () => {
  return {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    destroy: jest.fn().mockResolvedValue(1)
  };
});

jest.mock('../models/Order', () => {
  const mockOrder = {
    id: 1,
    orderNumber: 'PK-12345',
    total: 150.00,
    toAPI: jest.fn().mockReturnValue({ id: '1', orderNumber: 'PK-12345', total: 150.00, items: [] })
  };
  return {
    create: jest.fn().mockResolvedValue(mockOrder),
    findAll: jest.fn().mockResolvedValue([mockOrder]),
    findOne: jest.fn().mockResolvedValue(mockOrder),
    findByPk: jest.fn().mockResolvedValue(mockOrder)
  };
});

jest.mock('../models/OrderItem', () => {
  return {
    create: jest.fn().mockResolvedValue({})
  };
});

jest.mock('../models/Review', () => {
  const mockReview = {
    id: 1,
    rating: 5,
    toAPI: jest.fn().mockReturnValue({ id: '1', rating: 5, content: 'Great!' })
  };
  return {
    findAll: jest.fn().mockResolvedValue([mockReview]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(mockReview)
  };
});

jest.mock('../models/Wishlist', () => {
  return {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    destroy: jest.fn().mockResolvedValue(1)
  };
});

// Mock db connection to prevent actual connection attempts
jest.mock('../config/db', () => {
  const { Sequelize } = require('sequelize');
  return {
    sequelize: {
      sync: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(true),
      authenticate: jest.fn().mockResolvedValue(true)
    },
    connectDB: jest.fn().mockResolvedValue(true)
  };
});

// Now import the app
const app = require('../app'); // Wait, we export app from server.js? No, server.js runs startServer().
// Let's create a separate app.js file that boots Express, and exports app, and let server.js import it.
// This is the standard, cleaner architectural pattern for Node.js projects (enables testing app without booting server port listener!).

describe('ApexBazaar API Endpoints', () => {
  let token;

  beforeAll(() => {
    token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
  });

  // Health check test
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'OK');
    });
  });

  // Auth tests
  describe('Auth Flow', () => {
    it('should login an existing user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should return profile for authorized request', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toHaveProperty('id', '1');
    });
  });

  // Products tests
  describe('Products Flow', () => {
    it('should return product catalog', async () => {
      const res = await request(app).get('/api/products');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('products');
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it('should return single product details', async () => {
      const res = await request(app).get('/api/products/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('product');
    });
  });

  // Categories tests
  describe('Categories Flow', () => {
    it('should return category list', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('categories');
    });
  });

  // Cart tests
  describe('Cart Flow', () => {
    it('should fetch user cart', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('cart');
    });
  });

  // Orders tests
  describe('Orders Flow', () => {
    it('should create an order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [{ productId: 1, quantity: 2, price: 99.99 }],
          shippingAddress: { name: 'Test Address', street: '123 Test St', city: 'Test City', state: 'TS', zip: '123456', country: 'Testland' },
          paymentMethod: 'cod',
          totalAmount: 200.00
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('total');
    });

    it('should fetch user orders', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
