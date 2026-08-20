require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI environment variable is not set');
  process.exit(1);
}

const users = [
  {
    name: 'KDV Admin',
    email: 'admin@kedvasshygieneproducts.com',
    password: 'KdV@dm1n#2026!xQ',
    role: 'admin',
    department: 'Management',
  },
  {
    name: 'KDV Manager',
    email: 'manager@kedvasshygieneproducts.com',
    password: 'KdV@mng#2026!pL',
    role: 'manager',
    department: 'Operations',
  },
  {
    name: 'KDV Viewer',
    email: 'viewer@kedvasshygieneproducts.com',
    password: 'KdV@vwr#2026!mZ',
    role: 'viewer',
    department: 'Sales',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log('User ' + userData.email + ' already exists, skipping');
        continue;
      }
      const user = new User(userData);
      await user.save();
      console.log('Created ' + userData.role + ': ' + userData.email);
    }

    console.log('\nSeed complete. Credentials:');
    console.log('─'.repeat(55));
    users.forEach((u) => {
      console.log(`  ${u.role.padEnd(12)} ${u.email.padEnd(42)} ${u.password}`);
    });
    console.log('─'.repeat(55));

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
