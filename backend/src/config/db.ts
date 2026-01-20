import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas
 * @description Establishes connection to MongoDB using Mongoose
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    // Exit process with failure
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 * @description Gracefully closes MongoDB connection
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected');
  } catch (error) {
    console.error('❌ MongoDB Disconnection Error:', error);
    process.exit(1);
  }
};
