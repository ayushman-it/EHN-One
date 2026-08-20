const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📦 Database: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('');
    console.log('⚠️  Possible Solutions:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for testing)');
    console.log('   3. Confirm database credentials are correct');
    console.log('   4. Check if MongoDB Atlas cluster is active');
    console.log('');
    console.log('✅ Server will continue running with limited functionality...');
    // Don't exit - let server run anyway
    // process.exit(1);
  }
};

module.exports = connectDB;
