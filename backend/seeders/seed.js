const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Warehouse = require('../models/Warehouse');

const seedData = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...\n');

    // Note: Skipping delete operations as this is MongoDB Atlas SQL endpoint

    // Seed Users
    console.log('👥 Seeding users...');
    const usersData = [
      {
        name: 'KDV Admin',
        email: 'admin@kedvasshygieneproducts.com',
        password: 'KdV@dm1n#2026!xQ',
        role: 'admin',
        department: 'Management',
        phone: '+91 98765 43210',
        status: 'active',
      },
      {
        name: 'KDV Manager',
        email: 'manager@kedvasshygieneproducts.com',
        password: 'KdV@mng#2026!pL',
        role: 'manager',
        department: 'Operations',
        phone: '+91 98765 43211',
        status: 'active',
      },
      {
        name: 'KDV Viewer',
        email: 'viewer@kedvasshygieneproducts.com',
        password: 'KdV@vwr#2026!mZ',
        role: 'viewer',
        department: 'Sales',
        phone: '+91 98765 43212',
        status: 'active',
      },
    ];

    const users = await Promise.all(
      usersData.map(async (u) => {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        return { ...u, password: hashedPassword };
      })
    );

    await User.insertMany(users);
    console.log('✅ Users seeded with bcrypt hashed passwords\n');

    // Seed Categories
    console.log('📁 Seeding categories...');
    const electronics = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and components',
      icon: 'bi-cpu',
      color: '#7367f0',
      status: 'active',
    });

    const furniture = await Category.create({
      name: 'Furniture',
      slug: 'furniture',
      description: 'Office and home furniture',
      icon: 'bi-house',
      color: '#ff9f43',
      status: 'active',
    });

    // Sub-categories
    await Category.insertMany([
      {
        name: 'Laptops',
        slug: 'laptops',
        parent: electronics._id,
        icon: 'bi-laptop',
        color: '#00cfe8',
        status: 'active',
      },
      {
        name: 'Mobile Phones',
        slug: 'mobile-phones',
        parent: electronics._id,
        icon: 'bi-phone',
        color: '#28c76f',
        status: 'active',
      },
      {
        name: 'Office Chairs',
        slug: 'office-chairs',
        parent: furniture._id,
        icon: 'bi-chair',
        color: '#ea5455',
        status: 'active',
      },
    ]);
    console.log('✅ Categories seeded\n');

    // Seed Suppliers
    console.log('🚚 Seeding suppliers...');
    const suppliers = await Supplier.insertMany([
      {
        name: 'Tech Supplies India',
        contactPerson: 'Rajesh Kumar',
        email: 'rajesh@techsupplies.com',
        phone: '+91 98765 11111',
        address: '123 Tech Park, Bangalore',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        status: 'active',
        rating: 4.5,
      },
      {
        name: 'Office Mart',
        contactPerson: 'Sneha Patel',
        email: 'sneha@officemart.com',
        phone: '+91 98765 22222',
        address: '456 Business Street, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        status: 'active',
        rating: 4.0,
      },
    ]);
    console.log('✅ Suppliers seeded\n');

    // Seed Warehouses
    console.log('🏢 Seeding warehouses...');
    const warehouses = await Warehouse.insertMany([
      {
        name: 'Main Warehouse Delhi',
        code: 'WH-DEL-001',
        location: 'Sector 63, Noida',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        manager: 'Amit Sharma',
        phone: '+91 98765 33333',
        email: 'delhi@ehnone.com',
        capacity: 50000,
        status: 'active',
        type: 'Main Warehouse',
      },
      {
        name: 'Mumbai Distribution Center',
        code: 'WH-MUM-001',
        location: 'Andheri MIDC',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        manager: 'Priya Desai',
        phone: '+91 98765 44444',
        email: 'mumbai@ehnone.com',
        capacity: 30000,
        status: 'active',
        type: 'Distribution Center',
      },
    ]);
    console.log('✅ Warehouses seeded\n');

    // Seed Products
    console.log('📦 Seeding products...');
    await Product.insertMany([
      {
        name: 'Wireless Mouse',
        sku: 'WM-001',
        description: 'Ergonomic wireless mouse with USB receiver',
        category: electronics._id,
        supplier: suppliers[0]._id,
        warehouse: warehouses[0]._id,
        quantity: 45,
        price: 799,
        lowStockThreshold: 10,
        status: 'active',
      },
      {
        name: 'Mechanical Keyboard',
        sku: 'KB-002',
        description: 'Backlit mechanical keyboard with blue switches',
        category: electronics._id,
        supplier: suppliers[0]._id,
        warehouse: warehouses[0]._id,
        quantity: 8,
        price: 2499,
        lowStockThreshold: 10,
        status: 'active',
      },
      {
        name: 'USB-C Hub 7-in-1',
        sku: 'HB-003',
        description: '7-port USB-C hub with HDMI and SD card',
        category: electronics._id,
        supplier: suppliers[0]._id,
        warehouse: warehouses[1]._id,
        quantity: 0,
        price: 1299,
        lowStockThreshold: 5,
        status: 'active',
      },
      {
        name: 'Office Chair Executive',
        sku: 'CH-004',
        description: 'Ergonomic executive office chair with lumbar support',
        category: furniture._id,
        supplier: suppliers[1]._id,
        warehouse: warehouses[0]._id,
        quantity: 22,
        price: 8999,
        lowStockThreshold: 5,
        status: 'active',
      },
      {
        name: 'Laptop Stand Aluminum',
        sku: 'LS-005',
        description: 'Adjustable aluminum laptop stand',
        category: electronics._id,
        supplier: suppliers[1]._id,
        warehouse: warehouses[1]._id,
        quantity: 60,
        price: 1499,
        lowStockThreshold: 15,
        status: 'active',
      },
    ]);
    console.log('✅ Products seeded\n');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Categories: 5`);
    console.log(`   Suppliers: 2`);
    console.log(`   Warehouses: 2`);
    console.log(`   Products: 5`);
    console.log('\n✅ Ready to start the server!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
