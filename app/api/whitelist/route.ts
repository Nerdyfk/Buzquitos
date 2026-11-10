import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getWhitelistTasks } from '@/lib/whitelist-tasks';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wallet = String(body.wallet || '').trim();
    const x_username = String(body.x_username || '').trim().replace(/^@/, '');
    const reply_link = String(body.reply_link || '').trim();
    const responses = (body.responses && typeof body.responses === 'object') ? body.responses : {};

    // Validate wallet
    if (wallet.length < 10 || wallet.length > 100) {
      return NextResponse.json({ error: 'Enter a valid wallet address.' }, { status: 400 });
    }

    // Load active tasks to validate against current admin requirements
    const tasks = await getWhitelistTasks();
    const xTask = tasks.find(t => t.field_key === 'x_username');
    const replyTask = tasks.find(t => t.field_key === 'reply_link');

    if (xTask?.required || x_username) {
      if (xTask?.required && !x_username) {
        return NextResponse.json({ error: 'X / Twitter username is required.' }, { status: 400 });
      }
      if (x_username && !/^[a-zA-Z0-9_]{1,50}$/.test(x_username)) {
        return NextResponse.json(
          { error: 'Enter a valid X username (letters, numbers and underscores).' },
          { status: 400 }
        );
      }
    }

    if (replyTask?.required || reply_link) {
      if (replyTask?.required && !reply_link) {
        return NextResponse.json({ error: 'Reply link is required.' }, { status: 400 });
      }
      if (reply_link && (reply_link.length < 10 || reply_link.length > 500)) {
        return NextResponse.json({ error: 'Please provide a valid Reply Link.' }, { status: 400 });
      }
    }

    // Check custom required tasks
    for (const t of tasks) {
      if (t.field_key === 'custom' && t.required) {
        const val = String(responses[t.id] || '').trim();
        if (!val) {
          return NextResponse.json(
            { error: `Please complete required field: ${t.field_label || t.headline}` },
            { status: 400 }
          );
        }
      }
    }

    const db = await getDb();

    // Check collection settings for open status and capacity
    const settingRows = await db
      .collection('collection_settings')
      .find({ key: { $in: ['whitelist_open', 'whitelist_capacity'] } })
      .toArray();

    const settings = Object.fromEntries(settingRows.map(x => [x.key, x.value]));
    if (settings.whitelist_open === 'false') {
      return NextResponse.json({ error: 'Whitelist submissions are currently closed.' }, { status: 403 });
    }

    const capacity = Number(settings.whitelist_capacity || 0);
    if (Number.isFinite(capacity) && capacity > 0) {
      const count = await db.collection('submissions').countDocuments();
      if (count >= capacity) {
        return NextResponse.json({ error: 'Whitelist capacity has been reached.' }, { status: 409 });
      }
    }

    // Check duplicate wallet (case-insensitive)
    const walletLower = wallet.toLowerCase();
    const existing = await db.collection('submissions').findOne({ wallet_address_lower: walletLower });
    if (existing) {
      return NextResponse.json({ error: 'This wallet has already been submitted.' }, { status: 409 });
    }

    const now = new Date();
    await db.collection('submissions').insertOne({
      wallet_address: wallet,
      wallet_address_lower: walletLower,
      x_username: x_username || null,
      reply_link: reply_link || null,
      responses,
      status: 'pending',
      created_at: now,
      updated_at: now
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    if (e?.code === 11000) {
      return NextResponse.json({ error: 'This wallet has already been submitted.' }, { status: 409 });
    }
    console.error('Whitelist submission error:', e);
    return NextResponse.json(
      { error: 'Unable to save your entry right now. Please try again later.' },
      { status: 500 }
    );
  }
}
