import { getDb } from '@/lib/mongodb';

const defaults: Record<string, string> = {
  collection_name: process.env.NEXT_PUBLIC_COLLECTION_NAME || 'Buzquitos',
  tagline: process.env.NEXT_PUBLIC_COLLECTION_TAGLINE || 'Small pixels. Big personalities.',
  network: process.env.NEXT_PUBLIC_NETWORK || 'Ethereum',
  supply: process.env.NEXT_PUBLIC_SUPPLY || '5555',
  mint_price: process.env.NEXT_PUBLIC_MINT_PRICE || 'TBA',
  mint_date: process.env.NEXT_PUBLIC_MINT_DATE || 'To be announced',
  whitelist_open: 'true',
  whitelist_capacity: '5555'
};

export async function getCollectionSettings(): Promise<Record<string, string>> {
  const values = { ...defaults };
  try {
    const db = await getDb();
    const rows = await db.collection('collection_settings').find({}).toArray();
    for (const item of rows) {
      if (item.key && item.key in values && item.value !== undefined) {
        values[item.key] = String(item.value);
      }
    }
  } catch {
    // If MongoDB is not yet reached or configured, return defaults
  }
  return values;
}
