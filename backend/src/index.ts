import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';
import { initializeFirebase } from './config/firebase';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ========================================
// MIDDLEWARE
// ========================================

// Security middleware - sets various HTTP headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: [
    process.env.WEB_ADMIN_URL || 'http://localhost:5173',
    process.env.MOBILE_APP_URL || 'exp://localhost:19000',
  ],
  credentials: true,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// ========================================
// ROUTES
// ========================================

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: '4Sports API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes will be added here
// app.use('/api/v1', routes);

// 404 handler - route not found
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
});

// ========================================
// SERVER INITIALIZATION
// ========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize Firebase Admin SDK
    initializeFirebase();

    // Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ========================================');
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🚀 Health check: http://localhost:${PORT}/health`);
      console.log('🚀 ========================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();
