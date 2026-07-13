/**
 * Production-Ready Node.js + Express Backend Entry File
 * Configured for deployment on Railway
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Import database connection configurations
const db = require('./config/db');

// Import route files
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Import middleware files
const errorHandler = require('./middleware/errorHandler');

// Initialize the Express application
const app = express();

// Configure Server Port (Priority given to environment variable PORT)
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS) for external frontend requests
app.use(cors());

// Parse incoming requests with JSON payloads (max limit defined as 10mb for image uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static route to serve uploaded user/restaurant media files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register API Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/orders', orderRoutes);

/**
 * Root API Endpoint (GET /)
 * Returns the successful service status
 */
app.get('/', (req, res) => {
  res.send('Backend is running successfully');
});

// Register proper centralized Error Handling Middleware (must be registered last)
app.use(errorHandler);

/**
 * Start the application server
 * Performs database synchronization before starting the HTTP listener
 */
async function startServer() {
  try {
    // Test the database connection
    await db.authenticate();
    console.log('Database connected successfully');

    // Synchronize DB models with the database schema
    await db.sync({ alter: true });
    console.log('Database synchronized');

    // Open port and listen to incoming requests
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server due to connection or sync error:', error);
    
    // In local dev without DB, you might still want the server to listen.
    // For production/Railway we exit to trigger a restart.
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log('Starting server in fallback mode without active DB sync...');
      app.listen(PORT, () => {
        console.log(`Fallback server running on port ${PORT}`);
      });
    }
  }
}

startServer();
