import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { ObjectId } from 'mongodb';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const list = await auth.db
      .collection('submissions')
      .find({})
      .sort({ created_at: -1 })
      .limit(1000)
      .toArray();

    const submissions = list.map(doc => ({
      id: doc._id.toString(),
      wallet_address: doc.wallet_address,
      x_username: doc.x_username,
      reply_link: doc.reply_link || null,
      status: doc.status,
      created_at: doc.created_at instanceof Date ? doc.created_at.toISOString() : doc.created_at
    }));

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Could not load submissions.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const { id, status } = await req.json();
    if (!id || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });
    }

    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const res = await auth.db.collection('submissions').updateOne(query as any, {
      $set: { status, updated_at: new Date() }
    });

    if (res.matchedCount === 0) {
      return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ error: 'Could not update submission.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing submission id.' }, { status: 400 });

    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    await auth.db.collection('submissions').deleteOne(query as any);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json({ error: 'Could not delete submission.' }, { status: 500 });
  }
}
