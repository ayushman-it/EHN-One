# EHN One - Backend Setup Guide

## 🚀 Backend API with MongoDB Atlas Integration

This guide will help you set up and run the backend API for the EHN One Inventory Management System.

---

## 📋 Prerequisites

Before starting, make sure you have:
- Node.js installed (v14 or higher)
- MongoDB Atlas account (already configured)
- Terminal/Command Prompt access

---

## 🔧 Setup Instructions

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `nodemon` - Development server (auto-restart)

### Step 3: Seed the Database (Optional but Recommended)
```bash
npm run seed
```

This will:
- Create default users (admin, manager, viewer)
- Create sample categories
- Set up initial data structure

### Step 4: Start the Server
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

---

## 🌐 API Endpoints

### Base URL
```
http://localhost:5000
```

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get single supplier
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Warehouses
- `GET /api/warehouses` - Get all warehouses
- `GET /api/warehouses/:id` - Get single warehouse
- `POST /api/warehouses` - Create warehouse
- `PUT /api/warehouses/:id` - Update warehouse
- `DELETE /api/warehouses/:id` - Delete warehouse

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create transaction

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Automations
- `GET /api/automations` - Get all automations
- `GET /api/automations/:id` - Get single automation
- `POST /api/automations` - Create automation
- `PUT /api/automations/:id` - Update automation
- `DELETE /api/automations/:id` - Delete automation

### Settings
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings

---

## 🗄️ MongoDB Atlas Configuration

### Connection String (Already Configured)
```
mongodb+srv://anshchourasia768_db_user:It98g2KAWace3sSG@cluster0.7et62zj.mongodb.net/ehnone_inventory
```

### Database Name
```
ehnone_inventory
```

### Collections Created
- `users` - User accounts
- `products` - Product inventory
- `categories` - Product categories
- `suppliers` - Supplier information
- `warehouses` - Warehouse locations
- `transactions` - Stock transactions
- `invoices` - Customer invoices
- `automations` - Automation rules
- `settings` - System settings

---

## 👥 Default User Accounts

After running `npm run seed`, you can login with:

### Administrator
- **Email**: admin@ehnone.com
- **Password**: admin123
- **Role**: admin
- **Department**: Management

### Manager
- **Email**: manager@ehnone.com
- **Password**: manager123
- **Role**: manager
- **Department**: Operations

### Viewer
- **Email**: viewer@ehnone.com
- **Password**: viewer123
- **Role**: viewer
- **Department**: Sales

---

## 📂 Backend File Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── models/
│   ├── User.js              # User model
│   ├── Product.js           # Product model
│   ├── Category.js          # Category model
│   ├── Supplier.js          # Supplier model
│   ├── Warehouse.js         # Warehouse model
│   ├── Transaction.js       # Transaction model
│   ├── Invoice.js           # Invoice model
│   ├── Automation.js        # Automation model
│   └── Settings.js          # Settings model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── products.js          # Product routes
│   ├── categories.js        # Category routes
│   ├── suppliers.js         # Supplier routes
│   ├── warehouses.js        # Warehouse routes
│   ├── transactions.js      # Transaction routes
│   ├── invoices.js          # Invoice routes
│   ├── users.js             # User routes
│   ├── automations.js       # Automation routes
│   └── settings.js          # Settings routes
├── seeders/
│   └── seed.js              # Database seeder
├── server.js                # Main server file
└── package.json             # Dependencies
```

---

## 🔒 Security Notes

### Password Hashing
Currently using plain text passwords for development. **For production:**
```bash
npm install bcryptjs
```

Then hash passwords in User model:
```javascript
const bcrypt = require('bcryptjs');

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
```

### Environment Variables
Create `.env` file for sensitive data:
```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_secret_key
```

---

## 🧪 Testing the API

### Using curl
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ehnone.com","password":"admin123"}'

# Get all products
curl http://localhost:5000/api/products

# Create a product
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","sku":"TEST001","price":100,"quantity":50}'
```

### Using Postman
1. Import the base URL: `http://localhost:5000`
2. Test each endpoint from the list above
3. Use JSON body for POST/PUT requests

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### MongoDB Connection Error
- Check internet connection
- Verify MongoDB Atlas credentials
- Ensure IP whitelist includes your IP (or use 0.0.0.0/0 for all)

### Module Not Found
```bash
rm -rf node_modules
npm install
```

---

## 📊 Database Schema

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String,
  role: 'admin' | 'manager' | 'viewer',
  department: String,
  phone: String,
  avatar: String,
  status: 'active' | 'inactive',
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Product Schema
```javascript
{
  name: String,
  sku: String (unique),
  description: String,
  category: ObjectId (ref: Category),
  price: Number,
  cost: Number,
  quantity: Number,
  minStock: Number,
  unit: String,
  supplier: ObjectId (ref: Supplier),
  warehouse: ObjectId (ref: Warehouse),
  barcode: String,
  image: String,
  status: 'active' | 'inactive' | 'discontinued',
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚀 Deployment

### Deploy to Heroku
```bash
heroku create ehnone-api
git push heroku main
heroku config:set MONGO_URI=your_connection_string
```

### Deploy to Vercel
```bash
npm i -g vercel
vercel
```

### Deploy to Railway
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

---

## 📈 Performance Optimization

### Indexing
Add indexes for frequently queried fields:
```javascript
// In Product model
productSchema.index({ name: 'text', sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ quantity: 1 });
```

### Caching
Consider adding Redis for caching:
```bash
npm install redis
```

---

## 🔄 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "count": 10
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

---

## 📞 Support

For issues or questions:
- Check the console logs
- Verify MongoDB Atlas connection
- Ensure all dependencies are installed
- Check network connectivity

---

## ✅ Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Seed database: `npm run seed`
3. ✅ Start server: `npm start`
4. ✅ Test API endpoints
5. ✅ Connect frontend to backend
6. ✅ Deploy to production

---

**Backend API Status**: ✅ Ready  
**MongoDB Atlas**: ✅ Connected  
**Default Port**: 5000  
**Database**: ehnone_inventory  

---

**Built with ❤️ for EHN One Inventory Management System**
