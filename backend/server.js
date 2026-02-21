const dotenv = require('dotenv');

// Load env vars before anything else
dotenv.config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initEventListeners } = require('./src/services/eventListener.service');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    initEventListeners();

    app.listen(PORT, () => {
      console.log(
        `🚀 FinTrust server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
