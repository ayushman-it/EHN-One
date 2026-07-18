const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://anshchourasia768_db_user:It98g2KAWace3sSG@cluster0.7et62zj.mongodb.net/ehnone_inventory?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📦 Database: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
