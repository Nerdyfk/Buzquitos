import { NextResponse } from 'next/server';
import { getWhitelistTasks } from '@/lib/whitelist-tasks';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasks = await getWhitelistTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching public whitelist tasks:', error);
    return NextResponse.json({ tasks: [] }, { status: 500 });
  }
}

