/**
 * Seed Member Users
 * Creates Firebase accounts and User documents for existing Members
 * Does NOT delete any existing data
 */

import dotenv from 'dotenv';
dotenv.config();

import admin from 'firebase-admin';
import * as path from 'path';
import { connectDB, disconnectDB } from '../config/db';

import User from '../models/User';
import Member from '../models/Member';
import Club from '../models/Club';

// ─── Firebase Init ───
const serviceAccountPath = path.join(__dirname, '../../firebase-admin-key.json');
const serviceAccount = require(serviceAccountPath);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const DEFAULT_PASSWORD = 'Demo1234!';

// Map member names to emails
function nameToEmail(fullName: string): string {
  const [first, last] = fullName.split(' ');
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/č/g, 'c').replace(/ć/g, 'c')
      .replace(/š/g, 's').replace(/ž/g, 'z')
      .replace(/đ/g, 'dj');
  return `${normalize(first)}.${normalize(last)}@4sports.demo`;
}

async function getOrCreateFirebaseUser(email: string, password: string, displayName: string): Promise<string> {
  try {
    const existing = await admin.auth().getUserByEmail(email);
    console.log(`  ℹ️  Firebase user exists: ${email} (${existing.uid})`);
    return existing.uid;
  } catch {
    const created = await admin.auth().createUser({ email, password, displayName });
    console.log(`  ✅ Firebase user created: ${email} (${created.uid})`);
    return created.uid;
  }
}

async function run() {
  console.log('\n👤 Creating User accounts for existing Members...\n');

  await connectDB();

  // Find the club
  const club = await Club.findOne({ name: 'FK 4Sports' });
  if (!club) {
    console.error('❌ Club "FK 4Sports" not found! Run the main seed first.');
    process.exit(1);
  }

  // Find all members that don't have a userId yet
  const members = await Member.find({ userId: { $exists: false } });
  if (members.length === 0) {
    // Also check for null userId
    const membersNull = await Member.find({ userId: null });
    if (membersNull.length === 0) {
      console.log('ℹ️  All members already have User accounts.');
      await disconnectDB();
      process.exit(0);
    }
    members.push(...membersNull);
  }

  console.log(`Found ${members.length} members without User accounts.\n`);

  let created = 0;
  for (const member of members) {
    const email = nameToEmail(member.fullName);

    try {
      // Create Firebase account
      const firebaseUid = await getOrCreateFirebaseUser(email, DEFAULT_PASSWORD, member.fullName);

      // Check if User document already exists
      const existingUser = await User.findOne({ firebaseUid });
      if (existingUser) {
        // Just link the member
        member.userId = existingUser._id as any;
        await member.save();
        console.log(`  🔗 Linked existing user: ${member.fullName} → ${email}`);
        created++;
        continue;
      }

      // Create User document
      const user = await User.create({
        firebaseUid,
        email,
        fullName: member.fullName,
        role: 'MEMBER',
        clubId: club._id,
      });

      // Link member to user
      member.userId = user._id as any;
      await member.save();

      console.log(`  ✅ ${member.fullName} → ${email}`);
      created++;
    } catch (err: any) {
      console.error(`  ❌ Failed for ${member.fullName}: ${err.message}`);
    }
  }

  console.log(`\n🎉 Done! Created ${created} member user accounts.`);
  console.log(`\n📋 Login credentials (password for all: ${DEFAULT_PASSWORD}):`);

  // Print all member emails
  const allMembers = await Member.find().populate('userId');
  for (const m of allMembers) {
    const email = nameToEmail(m.fullName);
    console.log(`   ${m.fullName} → ${email}`);
  }

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
