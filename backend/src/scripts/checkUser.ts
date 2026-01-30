import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db';
import User from '../models/User';
import Club from '../models/Club';

async function checkUser() {
  try {
    await connectDB();

    // Find user
    const user = await User.findOne({ email: 'aman@gmail.com' });
    console.log('\n=== USER ===');
    console.log(JSON.stringify(user, null, 2));

    // Find club if exists
    if (user && user.clubId) {
      const club = await Club.findById(user.clubId);
      console.log('\n=== CLUB ===');
      console.log(JSON.stringify(club, null, 2));
    } else {
      console.log('\n⚠️  User has no clubId');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
