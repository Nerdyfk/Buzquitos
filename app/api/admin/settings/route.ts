import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

const ALLOWED_KEYS = [
  'collection_name',
  'tagline',
  'network',
  'supply',
  'mint_price',
  'mint_date',
  'whitelist_open',
  'whitelist_capacity'
];

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const data = await auth.db.collection('collection_settings').find({}).toArray();
    const settings = data.map(item => ({ key: item.key, value: item.value }));
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error loading settings:', error);
    return NextResponse.json({ error: 'Could not load settings.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const { settings } = await req.json();
    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: 'Invalid settings format.' }, { status: 400 });
    }

    const validItems = settings.filter(x => x && typeof x.key === 'string' && ALLOWED_KEYS.includes(x.key));
    if (validItems.length > 0) {
      const operations = validItems.map(item => ({
        updateOne: {
          filter: { key: item.key },
          update: {
            $set: {
              key: item.key,
              value: String(item.value ?? ''),
              updated_at: new Date()
            }
          },
          upsert: true
        }
      }));
      await auth.db.collection('collection_settings').bulkWrite(operations);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Could not save settings.' }, { status: 500 });
  }
}
