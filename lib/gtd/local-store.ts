import fs from "node:fs";
import path from "node:path";
import type {
  UserDoc,
  PuzzleDoc,
  SubmissionDoc,
  CampaignDoc,
  AuditLogDoc,
  GtdCollections,
} from "./mongodb";

interface LocalStoreData {
  users: UserDoc[];
  puzzles: PuzzleDoc[];
  submissions: SubmissionDoc[];
  campaigns: CampaignDoc[];
  auditLogs: AuditLogDoc[];
}

export class MongoDuplicateKeyError extends Error {
  code = 11000;
  keyPattern: Record<string, number>;
  constructor(field: string) {
    super(`E11000 duplicate key error collection: index: ${field}_1 dup key`);
    this.name = "MongoServerError";
    this.keyPattern = { [field]: 1 };
  }
}

class Mutex {
  private queue: Promise<void> = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void = () => {};
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    const current = this.queue;
    this.queue = current.then(() => wait);
    await current;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

export const localStoreMutex = new Mutex();

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "gtd_store.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadData(): LocalStoreData {
  ensureDirectory();
  if (fs.existsSync(STORE_PATH)) {
    try {
      const raw = fs.readFileSync(STORE_PATH, "utf8");
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users || [],
        puzzles: parsed.puzzles || [],
        submissions: parsed.submissions || [],
        campaigns: parsed.campaigns || [],
        auditLogs: parsed.auditLogs || [],
      };
    } catch {
      // If parsing fails, fall back to empty
    }
  }
  return {
    users: [],
    puzzles: [],
    submissions: [],
    campaigns: [],
    auditLogs: [],
  };
}

let inMemoryData: LocalStoreData | null = null;

function getData(): LocalStoreData {
  if (!inMemoryData) {
    inMemoryData = loadData();
  }
  return inMemoryData;
}

function saveData() {
  ensureDirectory();
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(getData(), null, 2), "utf8");
  fs.renameSync(tmpPath, STORE_PATH);
}

// Deep clone helper to avoid reference mutation bugs
function clone<T>(val: T): T {
  if (val === undefined || val === null) return val;
  return JSON.parse(JSON.stringify(val), (_key, value) => {
    // Revive dates if string format
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value);
    }
    return value;
  });
}

function matchDoc(doc: any, filter: any): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, expected] of Object.entries(filter)) {
    if (key === "$expr") {
      const expr = expected as any;
      if (expr && expr.$lt) {
        const [left, right] = expr.$lt;
        let leftVal = 0;
        if (left && left.$add) {
          leftVal = left.$add.reduce((sum: number, f: string) => {
            const fieldName = f.replace(/^\$/, "");
            return sum + (Number(doc[fieldName]) || 0);
          }, 0);
        }
        let rightVal = 0;
        if (typeof right === "string" && right.startsWith("$")) {
          rightVal = Number(doc[right.replace(/^\$/, "")]) || 0;
        } else {
          rightVal = Number(right) || 0;
        }
        if (!(leftVal < rightVal)) return false;
      }
      continue;
    }

    if (key === "$or") {
      const orList = expected as any[];
      if (!orList.some((subFilter) => matchDoc(doc, subFilter))) {
        return false;
      }
      continue;
    }

    const actual = doc[key];

    if (expected && typeof expected === "object" && !Array.isArray(expected) && !(expected instanceof Date)) {
      if ("$in" in expected) {
        const inList = (expected as any).$in;
        if (!inList.includes(actual)) return false;
      } else if ("$gte" in expected) {
        if (!(actual >= (expected as any).$gte)) return false;
      } else if ("$lte" in expected) {
        if (!(actual <= (expected as any).$lte)) return false;
      } else if ("$gt" in expected) {
        if (!(actual > (expected as any).$gt)) return false;
      } else if ("$lt" in expected) {
        if (!(actual < (expected as any).$lt)) return false;
      } else if ("$ne" in expected) {
        if (actual === (expected as any).$ne) return false;
      } else if ("$regex" in expected) {
        const reg = new RegExp((expected as any).$regex, (expected as any).$options || "");
        if (!reg.test(String(actual || ""))) return false;
      } else {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) return false;
      }
    } else {
      if (actual instanceof Date && expected instanceof Date) {
        if (actual.getTime() !== expected.getTime()) return false;
      } else if (actual !== expected) {
        return false;
      }
    }
  }

  return true;
}

function applyUpdate(doc: any, update: any) {
  if (update.$set) {
    for (const [k, v] of Object.entries(update.$set)) {
      doc[k] = v;
    }
  }
  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      doc[k] = (Number(doc[k]) || 0) + Number(v);
    }
  }
}

class LocalCursor<T> {
  private items: T[];
  private skipCount = 0;
  private limitCount = Infinity;

  constructor(items: T[]) {
    this.items = items;
  }

  sort(sortSpec: Record<string, 1 | -1>): this {
    const entries = Object.entries(sortSpec);
    if (entries.length === 0) return this;
    this.items.sort((a: any, b: any) => {
      for (const [field, dir] of entries) {
        const valA = a[field];
        const valB = b[field];
        if (valA === valB) continue;
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        const comp = valA > valB ? 1 : -1;
        return dir === 1 ? comp : -comp;
      }
      return 0;
    });
    return this;
  }

  skip(n: number): this {
    this.skipCount = n;
    return this;
  }

  limit(n: number): this {
    this.limitCount = n;
    return this;
  }

  async toArray(): Promise<T[]> {
    return clone(this.items.slice(this.skipCount, this.skipCount + this.limitCount));
  }
}

export class LocalCollection<T extends { _id: string }> {
  constructor(
    private collectionName: keyof LocalStoreData,
    private uniqueKeys: string[] = []
  ) {}

  private getList(): T[] {
    return getData()[this.collectionName] as unknown as T[];
  }

  private checkUnique(doc: any, excludeId?: string) {
    const list = this.getList();
    for (const key of this.uniqueKeys) {
      const val = doc[key];
      if (val !== undefined && val !== null && val !== "") {
        const conflict = list.find((item: any) => item._id !== excludeId && item[key] === val);
        if (conflict) {
          throw new MongoDuplicateKeyError(key);
        }
      }
    }
  }

  async createIndex(): Promise<string> {
    return "index_ok";
  }

  async findOne(filter: any, options?: any): Promise<T | null> {
    const list = this.getList();
    let matched = list.filter((item) => matchDoc(item, filter));
    if (options?.sort) {
      const cursor = new LocalCursor(matched);
      cursor.sort(options.sort);
      matched = await cursor.toArray();
    }
    const item = matched[0];
    return item ? clone(item) : null;
  }

  find(filter: any = {}): LocalCursor<T> {
    const list = this.getList();
    const matched = list.filter((item) => matchDoc(item, filter));
    return new LocalCursor(matched);
  }

  async insertOne(doc: T): Promise<{ insertedId: string; acknowledged: boolean }> {
    this.checkUnique(doc);
    const item = clone(doc);
    this.getList().push(item);
    saveData();
    return { insertedId: item._id, acknowledged: true };
  }

  async updateOne(
    filter: any,
    update: any,
    options?: { upsert?: boolean }
  ): Promise<{ matchedCount: number; modifiedCount: number; upsertedId?: string }> {
    const list = this.getList();
    const idx = list.findIndex((item) => matchDoc(item, filter));

    if (idx !== -1) {
      const doc = list[idx];
      const target = clone(doc);
      applyUpdate(target, update);
      this.checkUnique(target, doc._id);
      applyUpdate(doc, update);
      saveData();
      return { matchedCount: 1, modifiedCount: 1 };
    }

    if (options?.upsert) {
      const newDoc: any = {};
      if (update.$setOnInsert) {
        Object.assign(newDoc, update.$setOnInsert);
      }
      for (const [k, v] of Object.entries(filter)) {
        if (!k.startsWith("$") && typeof v !== "object") {
          newDoc[k] = v;
        }
      }
      applyUpdate(newDoc, update);
      if (!newDoc._id) {
        newDoc._id = crypto.randomUUID();
      }
      this.checkUnique(newDoc);
      list.push(newDoc);
      saveData();
      return { matchedCount: 0, modifiedCount: 0, upsertedId: newDoc._id };
    }

    return { matchedCount: 0, modifiedCount: 0 };
  }

  async updateMany(
    filter: any,
    update: any
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const list = this.getList();
    let count = 0;
    for (const item of list) {
      if (matchDoc(item, filter)) {
        applyUpdate(item, update);
        count++;
      }
    }
    if (count > 0) {
      saveData();
    }
    return { matchedCount: count, modifiedCount: count };
  }

  async findOneAndUpdate(
    filter: any,
    update: any,
    options?: { returnDocument?: "before" | "after" }
  ): Promise<T | null> {
    const list = this.getList();
    const idx = list.findIndex((item) => matchDoc(item, filter));
    if (idx === -1) return null;

    const doc = list[idx];
    const before = clone(doc);
    const target = clone(doc);
    applyUpdate(target, update);
    this.checkUnique(target, doc._id);
    applyUpdate(doc, update);
    saveData();

    return options?.returnDocument === "after" ? clone(doc) : before;
  }

  async countDocuments(filter: any = {}): Promise<number> {
    const list = this.getList();
    return list.filter((item) => matchDoc(item, filter)).length;
  }

  async deleteOne(filter: any): Promise<{ deletedCount: number }> {
    const list = this.getList();
    const idx = list.findIndex((item) => matchDoc(item, filter));
    if (idx !== -1) {
      list.splice(idx, 1);
      saveData();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter: any = {}): Promise<{ deletedCount: number }> {
    const list = this.getList();
    const initialLen = list.length;
    const remaining = list.filter((item) => !matchDoc(item, filter));
    list.length = 0;
    list.push(...remaining);
    saveData();
    return { deletedCount: initialLen - remaining.length };
  }
}

export function resetLocalStore(): void {
  inMemoryData = {
    users: [],
    puzzles: [],
    submissions: [],
    campaigns: [
      {
        _id: "primary",
        name: "Buzquitos GTD Challenge",
        maxWinners: 500,
        approvedCount: 0,
        reservedCount: 0,
        status: "ACTIVE",
        officialTwitterUrl: "https://x.com/Buzquitos",
        officialTwitterHandle: "@Buzquitos",
        pinnedPostUrl: "https://x.com/Buzquitos/status/1890000000000000000",
        requiredHashtags: "#Buzquitos #GTDWhitelist #GTDChallenge",
        defaultGridSize: 3,
        updatedAt: new Date(),
        blockedIps: [],
      } as any,
    ],
    auditLogs: [],
  };
  saveData();
}

export function createLocalGtdCollections(): GtdCollections {
  const users = new LocalCollection<UserDoc>("users", ["twitterUsername", "walletAddress"]) as any;
  const puzzles = new LocalCollection<PuzzleDoc>("puzzles", []) as any;
  const submissions = new LocalCollection<SubmissionDoc>("submissions", [
    "submissionCode",
    "userId",
    "puzzleId",
    "walletAddress",
    "winnerId",
  ]) as any;
  const campaigns = new LocalCollection<CampaignDoc>("campaigns", ["_id"]) as any;
  const auditLogs = new LocalCollection<AuditLogDoc>("auditLogs", []) as any;

  return {
    db: {} as any,
    client: {
      startSession: () => ({
        withTransaction: async (fn: any) => fn(),
        endSession: async () => {},
      }),
    } as any,
    users,
    puzzles,
    submissions,
    campaigns,
    auditLogs,
  };
}
