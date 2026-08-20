require('dotenv').config({ path: __dirname + '/.env' });
const { MongoClient } = require('mongodb');

const users = [
  {
    name: 'KDV Admin',
    email: 'admin@kedvasshygieneproducts.com',
    password: '$2b$10$fH8DC59VAOOOC1o/b.mQQ.rSIsaO8unszSUXqAqCG9isNG/.O.IbK',
    role: 'admin',
    department: 'Management',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'KDV Manager',
    email: 'manager@kedvasshygieneproducts.com',
    password: '$2b$10$j1Csq6SHMr78D08SZEYviuxX/rPjbOKgIu5mrQdUb1bj6A3LcLh3K',
    role: 'manager',
    department: 'Operations',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'KDV Viewer',
    email: 'viewer@kedvasshygieneproducts.com',
    password: '$2b$10$10WciVfRQsZrlPTZcDEhz.pwiz2zyrI8dai.z7Q6czP.R90iYSuYa',
    role: 'viewer',
    department: 'Sales',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function seed() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db();
    const coll = db.collection('users');

    for (const u of users) {
      const existing = await coll.findOne({ email: u.email });
      if (existing) {
        console.log('Exists: ' + u.email);
        continue;
      }
      const result = await coll.insertOne(u);
      console.log('Created: ' + u.email + ' (id: ' + result.insertedId + ')');
    }

    console.log('\nSeed complete!');
  } catch (e) {
    console.error('Failed:', e.message);
  } finally {
    await client.close();
  }
}

seed();
