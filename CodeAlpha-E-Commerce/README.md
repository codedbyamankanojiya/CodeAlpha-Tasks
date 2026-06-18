# 🛒 ApexBazaar — Premium Multi-Vendor E-Commerce Marketplace

> **Developed by [Aman Kanojiya](https://github.com/codedbyamankanojiya) for the CodeAlpha Full-Stack Development Internship Program.**  
> **ApexBazaar** is a complete, production-ready, premium multi-vendor e-commerce platform built from scratch. It features a beautiful glassmorphism dark-theme layout, robust customer transactions, comprehensive seller catalog administration, dynamic admin dashboard with live Chart.js graphs, persistent database shopping carts, and role-based security systems.

---

## 📂 Project Directory Structure

```
CodeAlpha-E-Commerce/
├── backend/                  # Node.js + Express + PostgreSQL API & Static File Server
│   ├── src/                  # Core API Source directory
│   │   ├── config/           # Database connection & Sequelize configs
│   │   ├── middleware/       # Auth validation, role checks, and error handlers
│   │   ├── models/           # PostgreSQL / Sequelize ORM Models
│   │   ├── routes/           # API endpoint definitions
│   │   ├── tests/            # Jest/Supertest integration test suites
│   │   ├── utils/            # Image duplicate validator and helpers
│   │   ├── app.js            # Express app setup & frontend static routing
│   │   ├── server.js         # Port listener bootstrapper
│   │   └── seed.js           # 100+ unique products database seeder script
│   └── package.json          # Backend package dependencies
├── frontend/                 # Static Website Assets (Served directly by Express backend)
│   ├── admin.html            # Administrator control dashboard
│   ├── seller.html           # Seller catalog & shop profile portal
│   ├── index.html            # Homepage (hero, category grids, search suggestions)
│   ├── product.html          # Product details, related products, reviews
│   ├── cart.html             # Persistent cart, discount coupons, GST & shipping
│   ├── checkout.html         # Multi-step checkout wizard flow
│   ├── login.html            # Sign-in portal with validation
│   ├── signup.html           # Register portal
│   ├── profile.html          # Profile settings and order history downloader
│   ├── wishlist.html         # Customer saved wishlist items
│   └── src/                  # Client source code files
│       ├── css/              # Core CSS file (styles.css - glassmorphism design system)
│       └── js/               # Reusable JS page handlers and api helpers
└── README.md                 # Project guide & reference manual
```

---

## ✨ Features

### 👤 For Customers
- **Fluid Browsing**: Premium glassmorphic dark UI showcasing product items filterable by category, price range, and tags.
- **Autocomplete Search**: Real-time debounce suggestion box as you type.
- **Persistent Shopping Cart**: Live state synchronized with PostgreSQL storage via Sequelize.
- **Checkout Wizard**: Multi-step flow for address book selections, shipping/tax estimation, coupon application, and payment gateway stubs.
- **Wishlist Manager**: Save items and easily transfer to the cart.
- **Personalized Area**: Account settings, invoice `.txt` downloads, and order log tracker.

### 💼 For Sellers
- **Interactive Portal**: Visual metrics showing views/clicks, verification status, and commission rates.
- **Product Management**: Upload new products and manage inventory with unique image URL validation.
- **Store Profile**: Modify store name, descriptions, and contact info in real-time.

### 🛡️ For Administrators
- **Platform Analytics**: Total revenue, orders, products, and customer stats with live line graphs using Chart.js.
- **CRUD Operations**: Override or modify any product listing, SKU, or pricing.
- **Order Control**: Complete list of platform orders with state dropdowns (Delivered, Shipped, Cancelled).
- **User moderation**: Review and moderate customer accounts or approve/reject seller verification applications.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Vanilla HTML5, CSS3, Vanilla ES6+ JavaScript, Chart.js (CDN), Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL with Sequelize ORM |
| **Testing** | Jest, Supertest |
| **Security** | JWT (jsonwebtoken), bcryptjs, CORS, Express-Rate-Limit, Helmet |

---

## ⚙️ Installation & Local Setup

### Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.x or newer)
- **PostgreSQL** (Local database instance)

---

### Step-by-Step Server Setup

All dependencies and configurations are loaded in the `backend/` directory.

#### 1. Navigate to backend and install packages:
```bash
cd backend
npm install
```

#### 2. Configure Environment Variables:
Create a `.env` file inside the `backend/` directory:
```bash
cp .env.example .env
```

Set your PostgreSQL connection credentials in `.env` (it defaults to user `postgres` and passwordless connections on local port `5432`):
```env
PORT=3001
DATABASE_URL=postgres://postgres@localhost:5432/apexbazaar
JWT_SECRET=apexbazaar_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=30d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

#### 3. Initialize and Seed the Database:
This command will connect to your local PostgreSQL server, automatically create the database `apexbazaar` if it does not exist, build all table schemas, and seed 100+ unique products:
```bash
npm run seed
```

#### 4. Run the Website:
Start the Express application:
```bash
npm run dev
```
*The website will be served directly at:* **`http://localhost:3001`**

---

### 🔌 API Reference Table

### Authentication API
| Method | Endpoint | Description | Headers |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user | None |
| `POST` | `/api/auth/login` | Login user, return token | None |
| `GET` | `/api/auth/me` | Fetch active user credentials | `Bearer <token>` |

### Users & Administration API
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/users` | List all user records | Admin |
| `DELETE` | `/api/users/:id` | Delete/suspend a user account | Admin |
| `PATCH` | `/api/users/:id/role` | Update user roles (Customer/Seller/Admin) | Admin |
| `PATCH` | `/api/users/:id/verification` | Approve/reject seller profiles | Admin |
| `PUT` | `/api/users/profile` | Update current profile / store details | Protected |
| `PUT` | `/api/users/addresses` | Update customer address book | Protected |

### Products Catalog API
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/products` | Query products list (with filters & search) | Public |
| `GET` | `/api/products/:id` | Fetch detailed single product info | Public |
| `POST` | `/api/products` | Create a new catalog listing | Seller / Admin |
| `PUT` | `/api/products/:id` | Update existing listing metadata | Seller / Admin |
| `DELETE` | `/api/products/:id` | Remove catalog item | Seller / Admin |
| `GET` | `/api/products/seller/my-products` | Fetch current seller's listings | Seller / Admin |

### Shopping Cart API
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/cart` | Get current user's DB cart items | Customer |
| `POST` | `/api/cart/add` | Append item to cart | Customer |
| `PUT` | `/api/cart/items/:itemId` | Edit quantity of item in cart | Customer |
| `DELETE` | `/api/cart/items/:itemId` | Delete item from cart | Customer |
| `DELETE` | `/api/cart/clear` | Flush all items from user cart | Customer |

### Orders & Payments API
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/orders` | Instantiate customer order | Customer |
| `GET` | `/api/orders` | Fetch user orders list | Customer |
| `GET` | `/api/orders/:id` | Retrieve single order details | Customer |
| `GET` | `/api/orders/admin/all` | Retrieve all system orders | Admin |
| `PATCH` | `/api/orders/:id/status` | Update order/payment status | Admin / Seller |

---

## 🔒 Security Features
- **Strict Role Guards**: Protected API paths are guarded by JWT middleware and role validation (`protect`, `requireRole`).
- **Cryptographic Security**: Hashing of passwords using `bcryptjs` (10 rounds).
- **CORS Config**: Restricts API calls to approved domain endpoints.
- **Double Image Checks**: Product creation validates the database to prevent duplicate image listings on the marketplace.

---

*Crafted with ❤️ by Aman Kanojiya as part of the CodeAlpha Internship.*
