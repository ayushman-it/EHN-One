# EHN One - Quick Start Guide 🚀

## 🎯 Complete Inventory Management System

This is a full-stack inventory management system with React frontend and Node.js + MongoDB backend.

---

## ⚡ Quick Start (3 Steps)

### Step 1: Start Backend Server
```bash
# Open Command Prompt
cd backend
npm install
npm run seed
npm start
```

**Backend will run on:** `http://localhost:5000`

### Step 2: Start Frontend App
```bash
# Open another Command Prompt
cd frontend
npm install
npm start
```

**Frontend will open automatically at:** `http://localhost:3000`

### Step 3: Login
Use one of these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| **Administrator** | admin@ehnsystem.com | admin123 |
| **Manager** | manager@ehnsystem.com | manager123 |
| **Viewer** | viewer@ehnsystem.com | viewer123 |

---

## 🎨 Features

### ✅ **Already Implemented**

1. **Dashboard** - Real-time inventory statistics
2. **Products Management** - Full CRUD with sorting and import/export
3. **Categories** - Hierarchical categories with icons
4. **Suppliers** - Supplier management with ratings
5. **Warehouses** - Warehouse locations with capacity tracking
6. **Transactions** - Stock in/out with history
7. **Invoices** - Customer invoicing with auto-fill
8. **Users Management** - Role-based access control
9. **Automations** - WhatsApp reminders and alerts
10. **Settings** - WhatsApp API, Email SMTP, Company info
11. **Notifications** - Real-time dropdown with auto-refresh

### 🔐 **Role-Based Access**

#### Administrator (Full Access)
- ✅ View, Add, Edit, Delete everything
- ✅ Manage users and permissions
- ✅ Access all settings

#### Manager (Limited)
- ✅ View, Add, Edit products and inventory
- ❌ Cannot delete data
- ❌ Cannot manage users

#### Viewer (Read-Only)
- ✅ View dashboards and reports
- ❌ Cannot add, edit, or delete anything

---

## 📁 Project Structure

```
EHN One/
├── frontend/                  # React Application
│   ├── src/
│   │   ├── pages/            # 11 main pages
│   │   ├── components/       # Reusable components
│   │   ├── context/          # Auth context
│   │   └── services/         # API integration
│   └── package.json
│
├── backend/                   # Express API
│   ├── models/               # 9 Mongoose models
│   ├── routes/               # 12 API route files
│   ├── config/               # Database config
│   ├── seeders/              # Default data seeder
│   └── server.js             # Main server file
│
└── Documentation/             # 20+ MD files with guides
```

---

## 🌐 API Endpoints

**Base URL:** `http://localhost:5000/api`

### Main Endpoints
- `/auth/login` - User authentication
- `/products` - Products CRUD
- `/categories` - Categories CRUD
- `/suppliers` - Suppliers CRUD
- `/warehouses` - Warehouses CRUD
- `/transactions` - Stock in/out
- `/invoices` - Invoice management
- `/users` - User management
- `/automations` - Automation rules
- `/settings` - System settings
- `/dashboard/stats` - Dashboard data
- `/notifications` - Notifications

---

## 🔧 Configuration

### Frontend Configuration
Create `.env` file in `frontend/` folder:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Backend Configuration
MongoDB connection is already configured in `backend/config/db.js`

Database: MongoDB Atlas (Cloud)

---

## 🎨 Design System

### Color Scheme
- **Primary**: Purple (#7367f0)
- **Success**: Green (#28c76f)
- **Warning**: Orange (#ff9f43)
- **Danger**: Red (#ea5455)
- **Info**: Blue (#00cfe8)

### Layout
- **White Sidebar** with clean borders
- **Brand**: EHN One
- **Font**: System fonts (optimized for Windows)
- **Icons**: Bootstrap Icons

---

## 📊 Default Data (After Seeding)

### Users
- **3 users** (Administrator, Manager, Viewer)

### Categories
- **Electronics** (with Laptops, Mobile Phones subcategories)
- **Furniture** (with Office Chairs subcategory)

---

## 🧪 Testing

### Test Backend
1. Open: `http://localhost:5000`
2. Should see: API welcome message with all endpoints

### Test Frontend
1. Open: `http://localhost:3000`
2. Login with admin credentials
3. Navigate through all modules
4. Check DevTools Network tab for API calls

---

## 📱 Pages Available

1. **Dashboard** - `/` - Overview statistics
2. **Products** - `/products` - Product management
3. **Transactions** - `/transactions` - Stock movements
4. **Stock In** - `/stock-in` - Add inventory
5. **Stock Out** - `/stock-out` - Remove inventory
6. **Low Stock Alerts** - `/low-stock` - Products below threshold
7. **Invoices** - `/invoices` - Customer invoices
8. **Categories** - `/categories` - Category management
9. **Suppliers** - `/suppliers` - Supplier management
10. **Warehouse** - `/warehouse` - Warehouse locations
11. **Automations** - `/automations` - WhatsApp alerts
12. **Settings** - `/settings` - System configuration
13. **Users** - `/users` - User management

---

## 🚀 Deployment

### Backend Deployment (Heroku/Railway)
```bash
# Add to package.json
"engines": {
  "node": "18.x"
}

# Deploy
git push heroku main
```

### Frontend Deployment (Vercel/Netlify)
```bash
# Build
npm run build

# Deploy build folder
```

### Update Frontend API URL
```env
REACT_APP_API_URL=https://your-backend-url.com/api
```

---

## 🐛 Common Issues

### Port 5000 Already in Use
```bash
# Windows - Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB Connection Failed
- Check internet connection
- Verify MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for testing)
- Confirm credentials in `backend/config/db.js`

### Module Not Found
```bash
cd backend
del /s node_modules
npm install
```

---

## 📚 Documentation Files

### Setup Guides
- `BACKEND_SETUP_GUIDE.md` - Backend installation
- `BACKEND_INTEGRATION_COMPLETE.md` - Backend details
- `BACKEND_FRONTEND_INTEGRATION_COMPLETE.md` - Full integration

### Feature Documentation
- `NOTIFICATION_DROPDOWN_COMPLETE.md` - Notifications
- `AUTOMATIONS_REMINDERS_COMPLETE.md` - Automations
- `SETTINGS_PAGE_COMPLETE.md` - Settings
- `PRODUCTS_CATEGORY_DROPDOWN.md` - Products
- `INVOICE_MODULE_COMPLETE.md` - Invoices
- `USER_MANAGEMENT_README.md` - Users
- `WAREHOUSE_MODULE_COMPLETE.md` - Warehouses
- `SUPPLIERS_MODULE_COMPLETE.md` - Suppliers
- `CATEGORIES_MODULE_COMPLETE.md` - Categories

### Design Documentation
- `DESIGN_UPDATE_WHITE_SIDEBAR.md` - UI design
- `MODAL_SCROLL_FIX.md` - Modal improvements
- `SORTING_AND_IMPORT_EXPORT.md` - Table features

### Integration Guides
- `WHATSAPP_API_INTEGRATION.md` - WhatsApp setup
- `PROJECT_COMPLETE_SUMMARY.md` - Complete overview

---

## 🎯 What to Do Next

### For Development
1. ✅ Start both servers (backend + frontend)
2. ✅ Login and explore all features
3. ✅ Check network requests in DevTools
4. ✅ Test CRUD operations
5. ✅ Review code structure

### For Customization
1. **Change Brand Name**: Search and replace "EHN One"
2. **Update Colors**: Edit CSS variables in `App.css`
3. **Add Features**: Create new components and routes
4. **Modify Database**: Edit Mongoose models
5. **Add API Endpoints**: Create new route files

### For Production
1. **Add Security**: JWT tokens, password hashing
2. **Optimize**: Code splitting, lazy loading
3. **Add Tests**: Unit tests, integration tests
4. **Deploy**: Heroku + Vercel
5. **Monitor**: Add logging and error tracking

---

## 💡 Tips

### Batch File for Easy Start
Double-click `START_BACKEND.bat` to start backend automatically!

### Hot Reload
Both frontend and backend auto-reload on file changes during development.

### API Testing
Use Postman or Thunder Client VS Code extension to test API endpoints.

### Database Browser
Use MongoDB Compass to browse your database visually:
```
mongodb+srv://anshchourasia768_db_user:It98g2KAWace3sSG@cluster0.7et62zj.mongodb.net/?appName=Cluster0
```

---

## 📞 System Information

- **Backend Port**: 5000
- **Frontend Port**: 3000
- **Database**: MongoDB Atlas (Cloud)
- **Database Name**: ehnone_inventory
- **Collections**: 9 (User, Product, Category, Supplier, Warehouse, Transaction, Invoice, Automation, Settings)

---

## 🎉 Status

✅ **Frontend**: Complete (11 pages)  
✅ **Backend**: Complete (12 route files)  
✅ **Database**: Connected (MongoDB Atlas)  
✅ **Authentication**: Integrated  
✅ **Notifications**: Real-time polling  
✅ **Documentation**: 20+ guide files  
✅ **Ready to Use**: Yes! 🚀

---

## 📖 Learn More

### React Documentation
- [React Docs](https://react.dev/)
- [React Router](https://reactrouter.com/)

### Backend Documentation
- [Express.js](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### Deployment Guides
- [Vercel Deployment](https://vercel.com/docs)
- [Heroku Deployment](https://devcenter.heroku.com/)
- [Railway Deployment](https://docs.railway.app/)

---

**Ready to build amazing inventory management! 🚀**

**Happy Coding! 💻**

---

**Built with ❤️ for EHN One Inventory Management System**
