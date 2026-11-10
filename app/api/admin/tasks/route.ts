import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getWhitelistTasks, saveWhitelistTasks, WhitelistTask } from '@/lib/whitelist-tasks';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const tasks = await getWhitelistTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching admin tasks:', error);
    return NextResponse.json({ error: 'Could not load whitelist tasks.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!auth.db) return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });

  try {
    const body = await req.json();
    const tasks: WhitelistTask[] = body.tasks;

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Invalid tasks data. Expected an array.' }, { status: 400 });
    }

    // Sanitize and validate tasks
    const sanitized: WhitelistTask[] = tasks.map((t, index) => ({
      id: String(t.id || `task-${index + 1}`),
      headline: String(t.headline || '').trim() || `Task ${index + 1}`,
      description: String(t.description || '').trim(),
      links: Array.isArray(t.links)
        ? t.links
            .filter(l => l && typeof l.label === 'string' && typeof l.url === 'string')
            .map(l => ({
              label: String(l.label).trim() || 'Link',
              url: String(l.url).trim() || 'https://x.com'
            }))
        : [],
      field_key: ['x_username', 'reply_link', 'custom', 'none'].includes(t.field_key)
        ? t.field_key
        : 'none',
      field_label: String(t.field_label || '').trim(),
      field_placeholder: String(t.field_placeholder || '').trim(),
      required: Boolean(t.required)
    }));

    await saveWhitelistTasks(sanitized);
    return NextResponse.json({ ok: true, tasks: sanitized });
  } catch (error) {
    console.error('Error saving whitelist tasks:', error);
    return NextResponse.json({ error: 'Could not save tasks.' }, { status: 500 });
  }
}

