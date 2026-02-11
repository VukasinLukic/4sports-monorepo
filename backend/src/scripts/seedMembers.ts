/**
 * Seed Members Script
 * Run with: npx ts-node src/scripts/seedMembers.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Member from '../models/Member';
import Group from '../models/Group';
import User from '../models/User';
import Payment from '../models/Payment';

const FAKE_MEMBERS = [
  { fullName: 'Marko Petrović', gender: 'MALE', birthYear: 2012 },
  { fullName: 'Stefan Jovanović', gender: 'MALE', birthYear: 2013 },
  { fullName: 'Luka Nikolić', gender: 'MALE', birthYear: 2012 },
  { fullName: 'Nikola Đorđević', gender: 'MALE', birthYear: 2011 },
  { fullName: 'Filip Stojanović', gender: 'MALE', birthYear: 2013 },
  { fullName: 'Aleksa Ilić', gender: 'MALE', birthYear: 2012 },
  { fullName: 'Vuk Popović', gender: 'MALE', birthYear: 2014 },
  { fullName: 'Mihajlo Mitrović', gender: 'MALE', birthYear: 2013 },
  { fullName: 'Andrej Pavlović', gender: 'MALE', birthYear: 2012 },
  { fullName: 'Ognjen Marković', gender: 'MALE', birthYear: 2011 },
  { fullName: 'Sara Todorović', gender: 'FEMALE', birthYear: 2013 },
  { fullName: 'Mia Lazić', gender: 'FEMALE', birthYear: 2012 },
];

async function seedMembers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/4sports';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get first group
    const group = await Group.findOne();
    if (!group) {
      console.error('❌ No groups found. Create a group first.');
      process.exit(1);
    }
    console.log(`📁 Using group: ${group.name} (${group._id})`);

    // Get first coach/owner user to use as fake parent
    const user = await User.findOne({ role: { $in: ['OWNER', 'COACH'] } });
    if (!user) {
      console.error('❌ No coach/owner found.');
      process.exit(1);
    }
    console.log(`👤 Using parent: ${user.fullName} (${user._id})`);

    const clubId = group.clubId;
    console.log(`🏢 Club ID: ${clubId}`);

    // Create members
    let createdCount = 0;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    for (const memberData of FAKE_MEMBERS) {
      // Check if member already exists
      const existing = await Member.findOne({ fullName: memberData.fullName, 'clubs.clubId': clubId });
      if (existing) {
        console.log(`⏭️  Skipping ${memberData.fullName} (already exists)`);
        continue;
      }

      // Random birth date in the specified year
      const birthMonth = Math.floor(Math.random() * 12) + 1;
      const birthDay = Math.floor(Math.random() * 28) + 1;
      const dateOfBirth = new Date(memberData.birthYear, birthMonth - 1, birthDay);

      // Random medical expiry (some valid, some expired, some expiring soon)
      const medicalStatus = Math.random();
      let medicalExpiry: Date | undefined;
      if (medicalStatus < 0.3) {
        // Expired (30%)
        medicalExpiry = new Date();
        medicalExpiry.setMonth(medicalExpiry.getMonth() - Math.floor(Math.random() * 6) - 1);
      } else if (medicalStatus < 0.5) {
        // Expiring soon (20%)
        medicalExpiry = new Date();
        medicalExpiry.setDate(medicalExpiry.getDate() + Math.floor(Math.random() * 25) + 5);
      } else {
        // Valid (50%)
        medicalExpiry = new Date();
        medicalExpiry.setMonth(medicalExpiry.getMonth() + Math.floor(Math.random() * 10) + 2);
      }

      const member = await Member.create({
        fullName: memberData.fullName,
        dateOfBirth,
        gender: memberData.gender,
        parentId: user._id,
        clubs: [{
          clubId,
          groupId: group._id,
          joinedAt: new Date(),
          status: 'ACTIVE',
        }],
        medicalInfo: {
          bloodType: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'][Math.floor(Math.random() * 8)],
          lastCheckDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          expiryDate: medicalExpiry,
        },
        emergencyContact: {
          name: `Parent of ${memberData.fullName.split(' ')[0]}`,
          relationship: 'Parent',
          phoneNumber: `+38160${Math.floor(Math.random() * 9000000) + 1000000}`,
        },
      });

      // Create membership payment for current month (random status)
      const paymentStatus = Math.random();
      let status: 'PAID' | 'PENDING' | 'OVERDUE' = 'PENDING';
      let paidDate: Date | undefined;

      if (paymentStatus < 0.5) {
        status = 'PAID';
        paidDate = new Date();
        paidDate.setDate(paidDate.getDate() - Math.floor(Math.random() * 20));
      } else if (paymentStatus < 0.7) {
        status = 'OVERDUE';
      }

      await Payment.create({
        clubId,
        memberId: member._id,
        type: 'MEMBERSHIP',
        amount: 3000 + Math.floor(Math.random() * 3) * 500,
        dueDate: new Date(currentYear, currentMonth - 1, 15),
        paidDate: status === 'PAID' ? paidDate : undefined,
        status,
        paymentMethod: status === 'PAID' ? 'CASH' : undefined,
        period: { month: currentMonth, year: currentYear },
        createdBy: user._id,
      });

      console.log(`✅ Created: ${memberData.fullName} (Payment: ${status})`);
      createdCount++;
    }

    console.log(`\n🎉 Done! Created ${createdCount} new members.`);

    // Update group member count
    const memberCount = await Member.countDocuments({
      'clubs.groupId': group._id,
      'clubs.status': 'ACTIVE',
    });
    await Group.findByIdAndUpdate(group._id, { memberCount });
    console.log(`📊 Updated group member count to ${memberCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedMembers();
