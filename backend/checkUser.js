require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function checkUser() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('test');

    // Find user
    const user = await db.collection('users').findOne({ email: 'aman@gmail.com' });
    console.log('\n=== USER ===');
    console.log(JSON.stringify(user, null, 2));

    // Find club if exists
    if (user && user.clubId) {
      const club = await db.collection('clubs').findOne({ _id: new ObjectId(user.clubId) });
      console.log('\n=== CLUB ===');
      console.log(JSON.stringify(club, null, 2));
    } else {
      console.log('\n⚠️  User has no clubId');
    }

  } finally {
    await client.close();
  }
}

checkUser().catch(console.error);
