require('dotenv').config();
const app = require('./app');
const { sequelize, connectDB } = require('./config/db');

// Start
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // 1. Establish database connection
    await connectDB();
    
    // 2. Sync database schemas (alter to add new columns)
    console.log('🔄 Syncing PostgreSQL database models...');
    await sequelize.sync({ alter: true });
    console.log('✔ Database models synced successfully.');

    // 3. Listen
    app.listen(PORT, () => {
      console.log(`🚀 ApexBazaar API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('✘ Server initialization failed:', error.message);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await sequelize.close();
  console.log('✔ PostgreSQL connection closed.');
  process.exit(0);
});
