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
    name: 'EHN Admin',
    email: 'admin@kedvasshygieneproducts.com',
    password: 'KdV@dm1n#2026!xQ',
    role: 'admin',
    department: 'Executive Administration',
  },
  {
    name: 'EHN Production Team Lead',
    email: 'production@kedvasshygieneproducts.com',
    password: 'KdV@prod#2026!pT',
    role: 'production',
    department: 'Production & Manufacturing',
  },
  {
    name: 'EHN Sales Executive',
    email: 'sales@kedvasshygieneproducts.com',
    password: 'KdV@sales#2026!sT',
    role: 'sales',
    department: 'Sales & Field Operations',
  },
  {
    name: 'EHN Despatch Manager',
    email: 'despatch@kedvasshygieneproducts.com',
    password: 'KdV@desp#2026!dT',
    role: 'despatch',
    department: 'Warehouse & Logistics',
  },
  {
    name: 'EHN Accounts & Billing Head',
    email: 'billing@kedvasshygieneproducts.com',
    password: 'KdV@bill#2026!bT',
    role: 'billing',
    department: 'Finance & Tally Accounting',
  },
  {
    name: 'EHN General Manager',
    email: 'manager@kedvasshygieneproducts.com',
    password: 'KdV@mng#2026!pL',
    role: 'manager',
    department: 'Operations & Management',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    for (const userData of users) {
      try {
        const existing = await User.findOne({ email: userData.email });
        if (existing) {
          console.log(`User ${userData.email} already exists.`);
          continue;
        }
        const user = new User(userData);
        await user.save();
        console.log(`Created ${userData.role}: ${userData.email}`);
      } catch (err) {
        console.log(`Skipping write for ${userData.email}: ${err.message}`);
      }
    }

    console.log('\n✅ Seed complete. All 6 Role Credentials:');
    console.log('─'.repeat(70));
    users.forEach((u) => {
      console.log(`  ${u.role.padEnd(12)} | ${u.email.padEnd(40)} | ${u.password}`);
    });
    console.log('─'.repeat(70));

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(0);
  }
}

seed();
