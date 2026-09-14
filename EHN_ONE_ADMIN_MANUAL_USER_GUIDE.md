# 📘 EHN ONE ENTERPRISE ERP - OFFICIAL ADMIN MANUAL & USER GUIDE

> **Kedvass Hygiene Products**  
> *From the makers of Rosinol • Quality & Trust Since 1984*  
> **System Version:** EHN ONE v2.6 Gateway & Automation  
> **Target Audience:** Administrator, Managing Directors, Operations Heads, Department Leads

---

## 📌 TABLE OF CONTENTS

1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Chapter 1: Getting Started & Login](#chapter-1-getting-started--login)
3. [Chapter 2: User Creation & Security Role Management](#chapter-2-user-creation--security-role-management)
4. [Chapter 3: Mastering the 12 Admin Front Page Windows](#chapter-3-mastering-the-12-admin-front-page-windows)
5. [Chapter 4: Complete Menu & Gateway Module Directory](#chapter-4-complete-menu--gateway-module-directory)
6. [Chapter 5: Sales Order, Billing & Tally Voucher Workflow](#chapter-5-sales-order-billing--tally-voucher-workflow)
7. [Chapter 6: Udhaari Management & WhatsApp Vasuli Bot](#chapter-6-udhaari-management--whatsapp-vasuli-bot)
8. [Chapter 7: Production & Despatch DPR Challan Operations](#chapter-7-production--despatch-dpr-challan-operations)
9. [Chapter 8: Keyboard Shortcuts & Troubleshooting](#chapter-8-keyboard-shortcuts--troubleshooting)

---

## 1. SYSTEM OVERVIEW & ARCHITECTURE

**EHN ONE** is an enterprise-grade Inventory & ERP Suite engineered specifically for Kedvass Hygiene Products. It connects:
- **Tally ERP / Tally Prime** via live ODBC & XML voucher sync.
- **Multi-Godown Stock Control** for Finished Goods & Raw Materials.
- **Field Sales Operations** (Sales Bit Routes, Salesman DPR, Live Orders).
- **Logistics & Delivery** (Despatch DPR Delivery Challan & Gate Passes).
- **Financial Udhaari & Automated WhatsApp Reminders**.

---

## CHAPTER 1: GETTING STARTED & LOGIN

### Step 1.1: Accessing EHN ONE
Open your web browser (Google Chrome or Microsoft Edge recommended) and navigate to your EHN ONE Web Address:
- **Local Application Server:** `http://localhost:3000` (or `http://127.0.0.1:3000`)
- **Server API:** `http://localhost:5000`

### Step 1.2: Signing In
1. On the Login Screen, enter your **Registered Email Address** (e.g., `admin@kedvasshygieneproducts.com`).
2. Enter your **Account Password**.
3. Click **Sign In**.
4. Upon successful verification, you will be redirected to the **Main Gateway Dashboard**.

---

## CHAPTER 2: USER CREATION & SECURITY ROLE MANAGEMENT

> [!IMPORTANT]
> **Admin Control Only:** Only accounts with `Admin` rights can create, edit, or deactivate user accounts. Default demo buttons have been disabled for security; all accounts must be created dynamically through this screen.

### Step 2.1: Opening the User Management Panel
1. From the top sidebar menu, click **`System & Utilities -> User Security Roles`** (or click the **`+ User Accounts`** button on the top Dashboard banner).
2. You will see the **User & Security Roles Register**.

### Step 2.2: How to Create a New User Account (Step-by-Step)
1. Click the green **`+ Create New User Account`** button in the top right corner.
2. **Select Department Role Profile:**
   - 🔴 **Admin**: Full access to all 12 modules, financial data, and user permissions.
   - 🟠 **Production Team**: Access to Raw Materials, Production Batches, Stock In/Out.
   - 🔵 **Sales Team**: Access to Daily Sales Orders, Sales Bits, Salesman DPR, Customer Directory.
   - 🟣 **Despatch Team**: Access to Despatch Challans, Vehicle Gate Passes, Stock Out.
   - 🟢 **Accounting / Billing**: Access to Sales Vouchers (Tally), Invoices, Udhaari List, Supplier Creditors.
   - 🔵 **Managerial Team**: Access to Stock Summaries, Financial & Business Analytics.
3. **Fill User Credentials:**
   - **Full Name:** Enter employee's real name (e.g., `Rahul Sharma`).
   - **Email Address (Login ID):** Enter employee email (e.g., `rahul@kedvasshygieneproducts.com`).
   - **Password:** Assign an initial password (minimum 6 characters).
   - **Department:** Automatically pre-filled based on role (or type custom department).
   - **Contact Phone:** Enter employee mobile number.
4. **Customize Granular Module Permissions:**
   - Check or uncheck specific permissions (e.g., `products.add`, `invoices.view`, `tally.view`, `dpr.view`, `challan.view`).
5. Click **`Create User Account`**.
6. The user can now immediately log in with their email and password!

### Step 2.3: Deactivating or Editing a User
- **To Edit:** Click the **`Edit`** button next to any user row, modify details/password/permissions, and click **Save Changes**.
- **To Deactivate:** Click **`Deactivate`** to temporarily suspend access without deleting data.

---

## CHAPTER 3: MASTERING THE 12 ADMIN FRONT PAGE WINDOWS

The main Gateway Dashboard features **12 interactive live module windows**:

| # | Window Name | Description & Primary Function | Quick Action Link |
| :--- | :--- | :--- | :--- |
| **1** | 🧾 **Sales Voucher Generation (Tally)** | Displays total vouchers generated, Tally ODBC sync count, and pending vouchers. | `+ Generate Sales Voucher` |
| **2** | 📦 **Stock Summary** | Live stock count of finished goods SKUs, total stock units, and rupee inventory valuation. | `Open Stock Register` |
| **3** | 🏭 **Production Summary** | Manufacturing batch targets, completed batches, efficiency %, and units produced today. | `Production Batch Logs` |
| **4** | 🛒 **Daily Sales Order** | Booked sales order count today, today's booked revenue, and pending despatch orders. | `View All Sales Orders` |
| **5** | 💰 **Udhaari List (Receivables)** | Outstanding customer credit balances, overdue credit days, and payment alerts. | `Full Udhaari Ledger` |
| **6** | 🗺️ **Sales Bit Summary** | Field sales route coverage, assigned salesman, visited shops vs target shops. | `Bit Coverage Details` |
| **7** | 📋 **Salesman Daily DPR** | Live feed of Daily Progress Reports submitted by field sales representatives. | `View DPR Feed` |
| **8** | ⏰ **Order Reminder** | Time-sensitive reminders for delayed orders or orders awaiting customer approval. | `Manage Order Alerts` |
| **9** | 🔔 **Vasuli Reminder (Collection)** | Payment collection due dates with automated WhatsApp reminder triggers. | `Trigger Vasuli Bot` |
| **10** | 🧱 **Raw Material Stock Summary** | Inventory counts for raw materials (pulp, packaging film, chemicals) and shortage alerts. | `View Raw Materials` |
| **11** | 💳 **Purchase Creditors Summary** | Supplier payables breakdown, upcoming bill due dates, and payment schedules. | `Supplier Payables` |
| **12** | 🚚 **Despatch DPR Challan** | Vehicle delivery challan records, driver names, box counts, and gate pass status. | `Delivery Challans` |

---

## CHAPTER 4: COMPLETE MENU & GATEWAY MODULE DIRECTORY

### 1. MAIN GATEWAY
- **Gateway Dashboard (`/`)**: Main hub featuring the 12 Admin Front Page Windows.
- **EHN AI Assistant (`/ai-assistant`)**: Intelligent AI chatbot for inventory queries & business recommendations.

### 2. GATEWAY MASTERS
- **Stock Items Master (`/products`)**: Add, edit, price, and catalog all finished goods SKUs.
- **Stock Groups (`/categories`)**: Group items by product category (Tissue Rolls, Hand Towels, Napkins).
- **Customer Ledgers (`/customers`)**: Manage customer details, credit limits, phone numbers, and balances.
- **Supplier Directory (`/suppliers`)**: Manage supplier vendor details, raw material sources, and payables.
- **Godown Masters (`/warehouse`)**: Track multiple factory godowns and warehouse locations.
- **Company Firms Master (`/company-firms`)**: Multi-firm company billing configuration.

### 3. VOUCHERS & TRANSACTIONS
- **Sales Billing Voucher (`/invoices`)**: Create sales invoices, print GST bills, and sync with Tally.
- **Stock Ledger Daybook (`/transactions`)**: Audit trail of every stock entry and movement.
- **Stock In Entry (`/stock-in`)**: Record inward stock arrivals from factory or suppliers.
- **Stock Out Entry (`/stock-out`)**: Record outward stock dispatches to distributors.
- **Low Stock Alerts (`/low-stock`)**: View items below reorder threshold.

### 4. STATUTORY & REPORTS
- **Financial Reports (`/reports`)**: Sales ledgers, stock valuation reports, and GST summaries.
- **Business Analytics (`/analytics`)**: Growth trends, top selling items, and sales rep performance.

### 5. SYSTEM & UTILITIES
- **Document Customizer (`/document-customizer`)**: Customize invoice templates, logos, and header text.
- **Bot Automations (`/automations`)**: Configure automated WhatsApp payment reminders.
- **System Settings (`/settings`)**: Company profile, currency format, and backup settings.
- **User Security Roles (`/users`)**: Create and manage user accounts and permissions.
- **Support Helpdesk (`/support`)**: Help documentation and technical support contact.

---

## CHAPTER 5: SALES ORDER, BILLING & TALLY VOUCHER WORKFLOW

### Step 5.1: How to Add a New Sales Order
1. Go to **`VOUCHERS & TRANSACTIONS -> Daily Sales Orders`** (or click **`View All Sales Orders`** on Dashboard).
2. Click **`+ Create New Sales Order`**.
3. Select **Customer Name** from the ledger dropdown.
4. Select **Products**, enter **Quantities**, and set discounts.
5. Click **Save Order**. The order will now reflect in **Daily Sales Orders** on the Dashboard.

### Step 5.2: Converting Sales Order to Tally Billing Voucher
1. Go to **`VOUCHERS & TRANSACTIONS -> Sales Billing Voucher`** (`/invoices`).
2. Click **`+ New Sales Voucher`**.
3. Import order details or select Customer.
4. Verify item pricing, GST rates, and total amount.
5. Click **`Save & Sync to Tally`**.
6. The voucher status will automatically update to **Synced to Tally (ODBC)**!

---

## CHAPTER 6: UDHAARI MANAGEMENT & WHATSAPP VASULI BOT

### Step 6.1: Viewing Outstanding Customer Credit (Udhaari)
1. Go to **`GATEWAY MASTERS -> Customer Ledgers`** (`/customers`).
2. Sort by **Balance Due**.
3. View overdue days (e.g., Overdue: 18 Days).

### Step 6.2: Sending WhatsApp Vasuli Reminders
1. Go to **`SYSTEM & UTILITIES -> Bot Automations`** (`/automations`).
2. Select **Vasuli Payment Reminders**.
3. Click **`Send WhatsApp Reminder`** next to the customer.
4. The system will dispatch an automated WhatsApp message with bill details and payment due date!

---

## CHAPTER 7: PRODUCTION & DESPATCH DPR CHALLAN OPERATIONS

### Step 7.1: Logging Daily Production Batches
1. Go to **`Finished Goods Production`** (`/finished-goods`).
2. Click **`+ Add Production Batch`**.
3. Select Product Item, enter **Batch Number**, and **Units Manufactured**.
4. Click **Submit**. Stock quantities update automatically.

### Step 7.2: Generating Despatch DPR Delivery Challan & Gate Pass
1. Go to **`Stock Out Entry`** (`/stock-out`).
2. Click **`+ Generate Delivery Challan`**.
3. Enter **Vehicle Number** (e.g. `MP-04-GB-9921`), **Driver Name**, **Total Box Count**, and **Delivery Address**.
4. Click **Print Gate Pass / Challan**.

---

## CHAPTER 8: KEYBOARD SHORTCUTS & TROUBLESHOOTING

### Quick Keyboard Shortcuts
- **`F2`**: Quick open Stock Register (`/transactions`)
- **`F4`**: Quick open Sales Vouchers (`/invoices`)
- **`F5`**: Refresh Dashboard & Sync Data

### Common Troubleshooting Q&A

**Q1: What should I do if a user forgets their password?**  
*Answer:* Log in as Admin, go to **User Security Roles**, click **Edit** next to the user, enter a new password, and click **Save Changes**.

**Q2: How do I know if Tally is connected?**  
*Answer:* Look at Window #1 (**Sales Voucher Generation - Tally**) on the Dashboard. It will show `Status: Connected (Tally Prime ODBC)`.

**Q3: Can a Sales Team user modify factory stock?**  
*Answer:* No. Sales Team users only have access to view products and create sales orders/DPRs unless explicit stock edit permission is granted by Admin.

---

*Manual Compiled & Certified for Kedvass Hygiene Products • EHN ONE Enterprise ERP v2.6*
