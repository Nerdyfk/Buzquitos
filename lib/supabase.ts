import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

export interface GtdClaimRecord {
  id: string;
  wallet_address: string;
  pass_code: string;
  puzzle_type: "image_tile" | "mathematical" | "word_cipher";
  moves: number;
  time_seconds: number;
  chain_id: number;
  status: "CONFIRMED" | "PENDING" | "REVOKED";
  created_at: string;
}

export interface SaveGtdClaimParams {
  walletAddress: string;
  passCode: string;
  moves: number;
  timeSeconds: number;
  puzzleType?: "image_tile" | "mathematical" | "word_cipher";
  chainId?: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      })
    : null;

// Local persistent file fallback for seamless local testing
const LOCAL_DATA_DIR = path.join(process.cwd(), ".data");
const LOCAL_STORE_FILE = path.join(LOCAL_DATA_DIR, "gtd_allowlist.json");

function ensureLocalStore(): GtdClaimRecord[] {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const raw = fs.readFileSync(LOCAL_STORE_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch {
    // Fallback to empty array
  }
  return [];
}

function writeLocalStore(records: GtdClaimRecord[]): void {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    const tmp = `${LOCAL_STORE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(records, null, 2), "utf8");
    fs.renameSync(tmp, LOCAL_STORE_FILE);
  } catch (err) {
    console.error("[GTD Allowlist] Failed to write local store:", err);
  }
}

export async function getGtdClaimByWallet(
  walletAddress: string
): Promise<GtdClaimRecord | null> {
  const normalized = walletAddress.trim().toLowerCase();

  // 1. Try Supabase if configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("gtd_allowlist")
        .select("*")
        .ilike("wallet_address", normalized)
        .maybeSingle();

      if (!error && data) {
        return data as GtdClaimRecord;
      }
    } catch (err) {
      console.warn("[GTD Allowlist] Supabase query error, checking local store:", err);
    }
  }

  // 2. Fall back to local store
  const localList = ensureLocalStore();
  const found = localList.find(
    (item) => item.wallet_address.toLowerCase() === normalized
  );
  return found || null;
}

export async function saveGtdClaim(
  params: SaveGtdClaimParams
): Promise<{ success: boolean; record: GtdClaimRecord; isDuplicate?: boolean }> {
  const normalizedWallet = params.walletAddress.trim().toLowerCase();

  // Check if wallet already claimed
  const existing = await getGtdClaimByWallet(normalizedWallet);
  if (existing) {
    return { success: false, record: existing, isDuplicate: true };
  }

  const newRecord: GtdClaimRecord = {
    id: crypto.randomUUID(),
    wallet_address: normalizedWallet,
    pass_code: params.passCode,
    puzzle_type: params.puzzleType || "image_tile",
    moves: Math.max(0, Math.floor(params.moves)),
    time_seconds: Math.max(0, Math.floor(params.timeSeconds)),
    chain_id: params.chainId || 8453, // Base Mainnet
    status: "CONFIRMED",
    created_at: new Date().toISOString(),
  };

  // 1. Try inserting to Supabase if configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("gtd_allowlist")
        .insert({
          id: newRecord.id,
          wallet_address: newRecord.wallet_address,
          pass_code: newRecord.pass_code,
          puzzle_type: newRecord.puzzle_type,
          moves: newRecord.moves,
          time_seconds: newRecord.time_seconds,
          chain_id: newRecord.chain_id,
          status: newRecord.status,
          created_at: newRecord.created_at,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Unique violation
          const existingRow = await getGtdClaimByWallet(normalizedWallet);
          return {
            success: false,
            record: existingRow || newRecord,
            isDuplicate: true,
          };
        }
        console.warn("[GTD Allowlist] Supabase insert failed, saving locally:", error);
      } else if (data) {
        return { success: true, record: data as GtdClaimRecord };
      }
    } catch (err) {
      console.warn("[GTD Allowlist] Supabase unexpected error, saving locally:", err);
    }
  }

  // 2. Save locally
  const localList = ensureLocalStore();
  const exists = localList.some(
    (x) => x.wallet_address.toLowerCase() === normalizedWallet
  );
  if (exists) {
    const existingRow = localList.find(
      (x) => x.wallet_address.toLowerCase() === normalizedWallet
    )!;
    return { success: false, record: existingRow, isDuplicate: true };
  }

  localList.unshift(newRecord);
  writeLocalStore(localList);

  return { success: true, record: newRecord };
}

export async function getGtdAllowlistStats(): Promise<{
  totalConfirmed: number;
  recentClaims: GtdClaimRecord[];
}> {
  if (supabase) {
    try {
      const { count } = await supabase
        .from("gtd_allowlist")
        .select("*", { count: "exact", head: true });

      const { data } = await supabase
        .from("gtd_allowlist")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      return {
        totalConfirmed: count ?? 0,
        recentClaims: (data as GtdClaimRecord[]) ?? [],
      };
    } catch {
      // Fallback
    }
  }

  const localList = ensureLocalStore();
  return {
    totalConfirmed: localList.length,
    recentClaims: localList.slice(0, 10),
  };
}
