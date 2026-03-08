// Load environment variables FIRST (before any imports that use process.env)
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';
import './config/cloudinary'; // Initialize Cloudinary
import { startScheduler } from './services/schedulerService';
import routes from './routes';

// Initialize Express app
const app = express();

// ========================================
// MIDDLEWARE
// ========================================

// Security middleware - sets various HTTP headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      process.env.WEB_ADMIN_URL || 'http://localhost:5173',
      process.env.MOBILE_APP_URL || 'exp://localhost:19000',
      process.env.PROMO_SITE_URL,
    ].filter(Boolean) as string[];

    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production, check against allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 1000, // Higher limit for development
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

// API Routes
app.use('/api/v1', routes);

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

    // Cloudinary is initialized on import

    // Start scheduled jobs
    startScheduler();

    // Start Express server - bind to 0.0.0.0 to allow external connections
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log('');
      console.log('🚀 ========================================');
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🚀 Listening on all interfaces (0.0.0.0)`);
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
