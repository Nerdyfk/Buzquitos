import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/buzquitos';
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoIndexesInitialized: boolean | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const c = await clientPromise;
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
      // Ignore index errors during hot reload or restricted permissions
    }
  }
  return db;
}

export default clientPromise;

