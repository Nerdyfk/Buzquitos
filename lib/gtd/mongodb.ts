import {
  type ClientSession,
  type Collection,
  type Db,
  type MongoClient,
} from "mongodb";
import { getClientPromise, getCleanMongoUri } from "@/lib/mongodb";
import type { Grid } from "@/lib/gtd/engine";
import type { CampaignTask } from "@/types/gtd";
import {
  createLocalGtdCollections,
  localStoreMutex,
  MongoDuplicateKeyError,
} from "./local-store";

export type PuzzleStatus = "ACTIVE" | "COMPLETED" | "SUBMITTED" | "EXPIRED";
export type SubmissionStatus =
  | "PENDING_VERIFICATION"
  | "ADDITIONAL_PROOF_REQUESTED"
  | "APPROVED"
  | "REJECTED";
export type CampaignStatus = "ACTIVE" | "ALMOST_FULL" | "FULL" | "PAUSED";
export type AdminRole = "SUPER_ADMIN" | "REVIEWER";

export interface UserDoc {
  _id: string;
  twitterUsername: string;
  displayUsername: string;
  walletAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PuzzleCategory = "math" | "image" | "word";
export type PuzzleType = "math_3x3" | "math_9x9" | "image_3x3" | "word_cipher";

export interface PuzzleDoc {
  _id: string;
  userId: string;
  sessionTokenHash: string;
  category?: PuzzleCategory;
  puzzleType?: PuzzleType;
  gridSize: 3 | 9;
  initialGrid: Grid;
  solution: Grid; // SERVER-ONLY: never returned to frontend
  targetSum: number;
  wordSolution?: string; // SERVER-ONLY for word cipher
  wordChallenge?: {
    clue: string;
    category: string;
    length: number;
    scrambled: string[];
  };
  status: PuzzleStatus;
  attempts: number;
  createdAt: Date;
  completedAt: Date | null;
}

export interface SubmissionDoc {
  _id: string;
  submissionCode: string;
  userId: string;
  puzzleId: string;
  walletAddress: string;
  announcementPostUrl: string;
  commentPostUrl?: string | null;
  proofLinks: string[];
  tasksConfirmed: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  taskProofs?: Array<{ taskId: string; taskTitle: string; url: string }>;

  followVerified: boolean;
  likeVerified: boolean;
  retweetVerified: boolean;
  commentVerified: boolean;
  announcementVerified: boolean;

  status: SubmissionStatus;
  winnerId: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;

  reservedAt: Date;
  reviewedAt: Date | null;
  reviewedByEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignDoc {
  _id: string;
  name: string;
  maxWinners: number;
  approvedCount: number;
  reservedCount: number;
  status: CampaignStatus;
  officialTwitterUrl: string;
  officialTwitterHandle: string;
  pinnedPostUrl: string;
  requiredHashtags: string;
  defaultGridSize: 3 | 9;
  updatedAt: Date;
  blockedIps?: string[];
  isPaused?: boolean;
  tasks?: CampaignTask[];
}

export interface AuditLogDoc {
  _id: string;
  adminEmail: string;
  submissionId: string | null;
  action: string;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface GtdCollections {
  db: Db;
  client: MongoClient;
  users: Collection<UserDoc>;
  puzzles: Collection<PuzzleDoc>;
  submissions: Collection<SubmissionDoc>;
  campaigns: Collection<CampaignDoc>;
  auditLogs: Collection<AuditLogDoc>;
}

export const GTD_COLLECTIONS = {
  users: "gtd_users",
  puzzles: "gtd_puzzles",
  submissions: "gtd_submissions",
  campaigns: "gtd_campaigns",
  auditLogs: "gtd_audit_logs",
} as const;

declare global {
  // eslint-disable-next-line no-var
  var _gtdPuzzleIndexesInitialized: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var _gtdUsingLocalFallback: boolean | undefined;
}

function hasConfiguredMongoUri(): boolean {
  const raw = (process.env.MONGODB_URI || "").trim().replace(/^["']|["']$/g, "");
  return Boolean(
    raw &&
    !raw.toLowerCase().includes("sensitive") &&
    /^mongodb(\+srv)?:\/\//i.test(raw)
  );
}

async function ensureGtdIndexes(db: Db): Promise<void> {
  const users = db.collection<UserDoc>(GTD_COLLECTIONS.users);
  const puzzles = db.collection<PuzzleDoc>(GTD_COLLECTIONS.puzzles);
  const submissions = db.collection<SubmissionDoc>(GTD_COLLECTIONS.submissions);
  const auditLogs = db.collection<AuditLogDoc>(GTD_COLLECTIONS.auditLogs);

  await Promise.all([
    users.createIndex({ twitterUsername: 1 }, { unique: true }),
    users.createIndex(
      { walletAddress: 1 },
      {
        unique: true,
        partialFilterExpression: { walletAddress: { $type: "string" } },
      }
    ),
    users.createIndex({ createdAt: -1 }),

    puzzles.createIndex({ userId: 1, status: 1 }),
    puzzles.createIndex({ status: 1 }),
    puzzles.createIndex({ createdAt: -1 }),

    submissions.createIndex({ submissionCode: 1 }, { unique: true }),
    submissions.createIndex({ userId: 1 }, { unique: true }),
    submissions.createIndex({ puzzleId: 1 }, { unique: true }),
    submissions.createIndex({ walletAddress: 1 }, { unique: true }),
    submissions.createIndex(
      { winnerId: 1 },
      {
        unique: true,
        partialFilterExpression: { winnerId: { $type: "string" } },
      }
    ),
    submissions.createIndex({ status: 1, createdAt: -1 }),
    submissions.createIndex({ reservedAt: -1 }),

    auditLogs.createIndex({ submissionId: 1, createdAt: -1 }),
    auditLogs.createIndex({ createdAt: -1 }),
  ]);
}

export async function getGtdCollections(): Promise<GtdCollections> {
  // If we already detected that we are using local fallback, return local collections directly
  if (global._gtdUsingLocalFallback) {
    return createLocalGtdCollections();
  }

  // If no valid MONGODB_URI is provided (e.g. absent or "[SENSITIVE]"), use local persistence fallback
  if (!hasConfiguredMongoUri()) {
    global._gtdUsingLocalFallback = true;
    return createLocalGtdCollections();
  }

  try {
    const client = await getClientPromise();
    const dbName = process.env.MONGODB_DB?.trim();
    const db = dbName ? client.db(dbName) : client.db();

    if (!global._gtdPuzzleIndexesInitialized) {
      global._gtdPuzzleIndexesInitialized = ensureGtdIndexes(db).catch((err) => {
        global._gtdPuzzleIndexesInitialized = undefined;
        throw err;
      });
    }
    await global._gtdPuzzleIndexesInitialized;

    return {
      db,
      client,
      users: db.collection<UserDoc>(GTD_COLLECTIONS.users),
      puzzles: db.collection<PuzzleDoc>(GTD_COLLECTIONS.puzzles),
      submissions: db.collection<SubmissionDoc>(GTD_COLLECTIONS.submissions),
      campaigns: db.collection<CampaignDoc>(GTD_COLLECTIONS.campaigns),
      auditLogs: db.collection<AuditLogDoc>(GTD_COLLECTIONS.auditLogs),
    };
  } catch (err) {
    console.warn(
      "[GTD Storage] MongoDB connection unavailable. Switching to local persistence store:",
      err instanceof Error ? err.message : err
    );
    global._gtdUsingLocalFallback = true;
    return createLocalGtdCollections();
  }
}

export async function runGtdTransaction<T>(
  fn: (cols: GtdCollections, session: ClientSession) => Promise<T>
): Promise<T> {
  const cols = await getGtdCollections();

  if (global._gtdUsingLocalFallback) {
    return localStoreMutex.runExclusive(async () => {
      const dummySession = cols.client.startSession();
      return fn(cols, dummySession);
    });
  }

  const session = cols.client.startSession();
  try {
    let result!: T;
    try {
      await session.withTransaction(
        async () => {
          result = await fn(cols, session);
        },
        {
          readConcern: { level: "majority" },
          writeConcern: { w: "majority" },
        }
      );
      return result;
    } catch (txErr: any) {
      // If MongoDB is a standalone instance (replica sets not enabled for transactions),
      // run safely under the mutex lock
      if (
        txErr &&
        typeof txErr.message === "string" &&
        txErr.message.includes("Transaction numbers are only allowed on a replica set member")
      ) {
        return await localStoreMutex.runExclusive(async () => {
          return fn(cols, session);
        });
      }
      throw txErr;
    }
  } finally {
    await session.endSession();
  }
}

export function isMongoDuplicateKeyError(err: unknown): {
  isDuplicate: boolean;
  keyPattern?: Record<string, unknown>;
} {
  if (err instanceof MongoDuplicateKeyError) {
    return { isDuplicate: true, keyPattern: err.keyPattern };
  }
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  ) {
    const keyPattern =
      "keyPattern" in err
        ? ((err as { keyPattern?: Record<string, unknown> }).keyPattern ?? {})
        : {};
    return { isDuplicate: true, keyPattern };
  }
  return { isDuplicate: false };
}
