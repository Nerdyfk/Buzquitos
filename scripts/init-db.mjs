import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/buzquitos';
const client = new MongoClient(uri);

async function main() {
  console.log(`Connecting to MongoDB at: ${uri}`);
  await client.connect();
  const db = client.db();

  console.log('Setting up collections and indexes...');

  // 1. Submissions collection
  const submissions = db.collection('submissions');
  await submissions.createIndex({ wallet_address_lower: 1 }, { unique: true });
  await submissions.createIndex({ created_at: -1 });
  await submissions.createIndex({ status: 1 });
  console.log('✓ Submissions collection & indexes ready');

  // 2. Collection settings
  const settings = db.collection('collection_settings');
  await settings.createIndex({ key: 1 }, { unique: true });

  const defaultSettings = [
    { key: 'collection_name', value: 'Buzquitos' },
    { key: 'tagline', value: 'Small pixels. Big personalities.' },
    { key: 'network', value: 'ROBINHOOD' },
    { key: 'supply', value: '5555' },
    { key: 'mint_price', value: 'TBA' },
    { key: 'mint_date', value: 'To be announced' },
    { key: 'whitelist_open', value: 'true' },
    { key: 'whitelist_capacity', value: '5555' }
  ];

  for (const s of defaultSettings) {
    await settings.updateOne(
      { key: s.key },
      { $setOnInsert: { key: s.key, value: s.value, updated_at: new Date() } },
      { upsert: true }
    );
  }
  console.log('✓ Default collection settings seeded (Buzquitos)');

  // 3. Admin collection
  const admins = db.collection('admin_users');
  await admins.createIndex({ email: 1 }, { unique: true });
  console.log('✓ Admin users collection & indexes ready');

  console.log('\nAll done! MongoDB is ready for Buzquitos.');
  await client.close();
}

main().catch(err => {
  console.error('Initialization error:', err);
  process.exit(1);
});
