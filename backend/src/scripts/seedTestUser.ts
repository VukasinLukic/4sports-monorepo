/**
 * Seed Test User Script
 * Run with: npx ts-node src/scripts/seedTestUser.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User';
import Club from '../models/Club';

const FIREBASE_UID = '1yAB3YuWDPZ6SZHeiAuBMXOHveA3';

async function seedTestUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in .env');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ firebaseUid: FIREBASE_UID });
    if (existingUser) {
      console.log('⚠️ User already exists:', existingUser.email);
      await mongoose.disconnect();
      return;
    }

    // Create a test club first
    const club = await Club.create({
      name: 'Test Sports Club',
      subscriptionPlan: 'PRO',
      memberLimit: 500,
      currentMembers: 0,
      address: 'Test Address 123',
      phoneNumber: '+381601234567',
      email: 'club@test.com',
    });
    console.log('✅ Created club:', club.name, club._id);

    // Create the test user as OWNER
    const user = await User.create({
      firebaseUid: FIREBASE_UID,
      email: 'test@4sports.com',
      fullName: 'Test Owner',
      phoneNumber: '+381601234567',
      role: 'OWNER',
      clubId: club._id,
    });
    console.log('✅ Created user:', user.email, user._id);

    // Update club with owner
    await Club.findByIdAndUpdate(club._id, { ownerId: user._id });
    console.log('✅ Updated club with owner');

    console.log('\n🎉 Test user seeded successfully!');
    console.log('Firebase UID:', FIREBASE_UID);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Club ID:', club._id);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedTestUser();
