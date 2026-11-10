import { getDb } from '@/lib/mongodb';
import { WhitelistTask, DEFAULT_WHITELIST_TASKS } from '@/types/whitelist-tasks';

export * from '@/types/whitelist-tasks';

export async function getWhitelistTasks(): Promise<WhitelistTask[]> {
  try {
    const db = await getDb();
    const doc = await db.collection('collection_settings').findOne({ key: 'whitelist_tasks' });
    if (doc && doc.value) {
      const parsed = typeof doc.value === 'string' ? JSON.parse(doc.value) : doc.value;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Could not read whitelist tasks from MongoDB, using defaults:', error);
  }
  return DEFAULT_WHITELIST_TASKS;
}

export async function saveWhitelistTasks(tasks: WhitelistTask[]): Promise<boolean> {
  const db = await getDb();
  await db.collection('collection_settings').updateOne(
    { key: 'whitelist_tasks' },
    {
      $set: {
        key: 'whitelist_tasks',
        value: JSON.stringify(tasks),
        updated_at: new Date()
      }
    },
    { upsert: true }
  );
  return true;
}
