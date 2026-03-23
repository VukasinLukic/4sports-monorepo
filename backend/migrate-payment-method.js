const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect('mongodb+srv://4sportsai_db_user:854N7loqLtis4nB6@4sports.2xhtf6q.mongodb.net/?appName=4sports');
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const transactions = db.collection('transactions');
  const payments = db.collection('payments');

  const txs = await transactions.find({
    paymentId: { $exists: true, $ne: null },
    $or: [
      { paymentMethod: { $exists: false } },
      { paymentMethod: null },
    ],
  }).toArray();

  console.log('Transactions to migrate:', txs.length);

  let updated = 0;
  for (const tx of txs) {
    const payment = await payments.findOne({ _id: tx.paymentId });
    if (payment && payment.paymentMethod && (payment.paymentMethod === 'CASH' || payment.paymentMethod === 'CARD')) {
      await transactions.updateOne(
        { _id: tx._id },
        { $set: { paymentMethod: payment.paymentMethod } }
      );
      updated++;
    }
  }

  console.log('Updated:', updated, 'of', txs.length);
  await mongoose.disconnect();
  console.log('Done!');
}

migrate().catch(e => { console.error(e); process.exit(1); });
