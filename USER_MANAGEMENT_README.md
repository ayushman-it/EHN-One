# 👥 User Management System

## Overview
Complete user management interface with role-based access control (RBAC), designed exclusively for **Administrator** access.

---

## 🎯 Features

### 1. **User Dashboard**
- **Statistics Cards:**
  - Total Users
  - Active Users
  - Total Administrators
  - Total Managers

### 2. **Advanced Filtering**
- Search by name, email, or department
- Filter by role (Admin, Manager, Viewer)
- Filter by status (Active, Inactive, Suspended)
- Clear all filters button

### 3. **User CRUD Operations**

#### ✅ Create User
- Full name, email, phone, department
- Role assignment with permission preview
- Password field
- Real-time role permission display

#### 📝 Edit User
- Update user details (email locked)
- Change role
- Optional password update
- Cannot edit your own account (self-protection)

#### 👁️ View Details
- Complete user profile card
- Contact information
- Last login timestamp
- Creation date
- All permissions listed
- Quick status change actions

#### 🗑️ Delete User
- Confirmation modal with user details
- Warning about permanent deletion
- Cannot delete yourself

### 4. **Status Management**
Three status levels:
- **Active** 🟢 — Full access to system
- **Inactive** ⚪ — Temporarily disabled
- **Suspended** 🔴 — Blocked from system

Quick status toggle from user details modal.

---

## 🎨 UI Components

### Users Table
| Column | Description |
|--------|-------------|
| User | Avatar + Name + Email |
| Role | Color-coded badge (Admin/Manager/Viewer) |
| Department | User's department |
| Status | Active/Inactive/Suspended badge |
| Last Login | Formatted date/time |
| Actions | View, Edit, Delete buttons |

### Role Permission Cards
Each role shows its exact permissions:
- **Admin:** Full system access, manage users, delete products, all reports
- **Manager:** View/edit inventory, stock in/out, cannot delete/manage users
- **Viewer:** Read-only, view reports, no edit/action permissions

---

## 🔐 Security Features

1. **Self-Protection:** Users cannot edit or delete their own account
2. **Role-Based Access:** Only admins can access `/users` page
3. **Email Lock:** Email addresses cannot be changed (identity protection)
4. **Confirmation Modals:** Delete requires explicit confirmation

---

## 📊 Sample Users (Pre-loaded)

| Name | Email | Role | Status | Department |
|------|-------|------|--------|------------|
| Arjun Sharma | admin@inventrack.com | Admin | Active | IT |
| Priya Mehta | manager@inventrack.com | Manager | Active | Operations |
| Rahul Verma | viewer@inventrack.com | Viewer | Active | Finance |
| Sneha Patel | sneha@inventrack.com | Manager | Active | Warehouse |
| Amit Kumar | amit@inventrack.com | Viewer | Inactive | Sales |
| Neha Singh | neha@inventrack.com | Manager | Suspended | Procurement |

---

## 🚀 Usage

### Access User Management
1. Login as **Administrator** (admin@inventrack.com / admin123)
2. Navigate to **Administration → User Management** in sidebar
3. View, create, edit, or delete users

### Create New User
1. Click **"Add User"** button
2. Fill in required fields (name, email, role, password)
3. Optional: phone, department
4. Review role permissions in the card
5. Click **"Create User"**

### Edit Existing User
1. Click **pencil icon** in actions column
2. Modify fields (email is locked)
3. Leave password blank to keep current
4. Click **"Update User"**

### View User Details
1. Click **eye icon** in actions column
2. View complete profile
3. Use **Quick Actions** to change status
4. Click **"Close"** to exit

### Delete User
1. Click **trash icon** in actions column
2. Review warning in confirmation modal
3. Click **"Delete User"** to confirm

---

## 🎨 Design Highlights

- **Color-Coded Roles:**
  - Admin: Red gradient
  - Manager: Orange gradient
  - Viewer: Cyan gradient

- **Responsive Grid:** Works on desktop, tablet, mobile
- **Modal System:** Smooth animations, backdrop blur
- **Empty States:** Helpful messages when no results
- **Badge System:** Visual status indicators

---

## 🔧 Technical Details

**Component:** `src/pages/Users.js`

**State Management:**
- Local state with mock database
- Real-time updates
- In-memory CRUD operations

**Modals:**
1. `UserFormModal` — Add/Edit form
2. `UserDetailsModal` — View profile
3. `DeleteConfirmModal` — Delete confirmation

**Integration:**
- Uses `AuthContext` for permission checks
- Reads `ROLES` config for badges and permissions
- Protected with `users.view` and `users.manage` permissions

---

## ✅ Permission Requirements

| Action | Permission Required |
|--------|-------------------|
| View page | `users.view` |
| Add user | `users.manage` |
| Edit user | `users.manage` |
| Delete user | `users.manage` |
| Change status | `users.manage` |

Only **Administrators** have these permissions.

---

## 📱 Mobile Responsive

- Filters stack vertically on mobile
- Table scrolls horizontally
- Modals adapt to small screens
- Touch-friendly buttons

---

## 🎉 Ready to Use!

Run the app:
```bash
npm start
```

Login as admin and navigate to **User Management** page! 🚀
