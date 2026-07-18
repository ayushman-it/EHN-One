const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');

const seedData = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    console.log('✅ Data cleared\n');

    // Seed Users
    console.log('👥 Seeding users...');
    const users = [
      {
        name: 'Arjun Sharma',
        email: 'admin@ehnone.com',
        password: 'admin123',
        role: 'admin',
        department: 'Management',
        phone: '+91 98765 43210',
        status: 'active',
      },
      {
        name: 'Priya Mehta',
        email: 'manager@ehnone.com',
        password: 'manager123',
        role: 'manager',
        department: 'Operations',
        phone: '+91 98765 43211',
        status: 'active',
      },
      {
        name: 'Rahul Verma',
        email: 'viewer@ehnone.com',
        password: 'viewer123',
        role: 'viewer',
        department: 'Sales',
        phone: '+91 98765 43212',
        status: 'active',
      },
    ];
    await User.insertMany(users);
    console.log('✅ Users seeded\n');

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

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Categories: 5`);
    console.log('\n✅ Ready to start the server!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
