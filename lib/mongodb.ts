import { MongoClient, Db } from 'mongodb';

const rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/buzquitos';
const uri = rawUri.trim().replace(/^["']|["']$/g, '');
const options = {
  serverSelectionTimeoutMS: 4000,
  connectTimeoutMS: 4000,
  maxPoolSize: 10
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoIndexesInitialized: boolean | undefined;
}

export function getClientPromise(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    const c = new MongoClient(uri, options);
    global._mongoClientPromise = c.connect().catch(err => {
      // Reset global promise on connection error so next call can retry
      global._mongoClientPromise = undefined;
      throw err;
    });
  }
  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const c = await getClientPromise();
  const db = c.db();
  if (!global._mongoIndexesInitialized) {
    try {
      await Promise.all([
        db.collection('submissions').createIndex(
          { wallet_address_lower: 1 },
          { unique: true, background: true }
        ),
        db.collection('submissions').createIndex(
          { created_at: -1 },
          { background: true }
        ),
        db.collection('collection_settings').createIndex(
          { key: 1 },
          { unique: true, background: true }
        ),
        db.collection('admin_users').createIndex(
          { email: 1 },
          { unique: true, background: true }
        )
      ]);
      global._mongoIndexesInitialized = true;
    } catch {
      // Ignore index creation errors
    }
  }
  return db;
}
