export type CampaignStatusType = "ACTIVE" | "ALMOST_FULL" | "FULL" | "PAUSED";
export type PuzzleStatusType = "ACTIVE" | "COMPLETED" | "SUBMITTED" | "EXPIRED";
export type SubmissionStatusType =
  | "PENDING_VERIFICATION"
  | "ADDITIONAL_PROOF_REQUESTED"
  | "APPROVED"
  | "REJECTED";

export type PuzzleCategory = "math" | "image" | "word";
export type PuzzleType = "math_3x3" | "math_9x9" | "image_3x3" | "word_cipher";

export interface CampaignTask {
  id: string;
  title: string;
  actionLabel: string;
  actionUrl: string;
  isRequired: boolean;
  needsUrlInput: boolean;
  urlInputPlaceholder?: string;
  urlInputDescription?: string;
}

export const DEFAULT_CAMPAIGN_TASKS: CampaignTask[] = [
  {
    id: "task_follow",
    title: "Follow official Twitter/X account (@Buzquitos)",
    actionLabel: "FOLLOW ON X",
    actionUrl: "https://x.com/Buzquitos",
    isRequired: true,
    needsUrlInput: false,
  },
  {
    id: "task_pinned",
    title: "Like, Retweet & Comment on our pinned campaign post",
    actionLabel: "OPEN PINNED POST",
    actionUrl: "https://x.com/Buzquitos/status/1890000000000000000",
    isRequired: true,
    needsUrlInput: true,
    urlInputPlaceholder: "https://x.com/username/status/...",
    urlInputDescription:
      "Paste the direct URL to your comment on our pinned post so admins can review your reply.",
  },
  {
    id: "task_post",
    title: "Make a post about Buzquitos GTD Challenge",
    actionLabel: "COMPOSE POST",
    actionUrl: "https://x.com/intent/tweet?text=...",
    isRequired: false,
    needsUrlInput: true,
    urlInputPlaceholder: "https://x.com/username/status/... (Optional)",
    urlInputDescription:
      "Optional: If you made an announcement post about Buzquitos, paste the post link here.",
  },
];

export interface CampaignSnapshot {
  id: string;
  name: string;
  maxWinners: number;
  approvedCount: number;
  reservedCount: number;
  occupiedSpots: number;
  remainingSpots: number;
  status: CampaignStatusType;
  officialTwitterUrl: string;
  officialTwitterHandle: string;
  pinnedPostUrl: string;
  requiredHashtags: string;
  defaultGridSize: number;
  tasks?: CampaignTask[];
}

export interface ClientPuzzle {
  puzzleId: string;
  twitterUsername: string;
  displayUsername: string;
  gridSize: 3 | 9;
  category?: PuzzleCategory;
  puzzleType?: PuzzleType;
  targetSum: number;
  initialGrid: number[][];
  wordChallenge?: {
    clue: string;
    category: string;
    length: number;
    scrambled: string[];
  };
  status: PuzzleStatusType;
  createdAt: string;
  completedAt: string | null;
}

export interface ClientSubmissionSummary {
  submissionCode: string;
  puzzleId: string;
  walletAddress: string;
  status: SubmissionStatusType;
  winnerId?: string | null;
  rejectionReason?: string | null;
  proofRequestNote?: string | null;
  reservedAt: string;
  reviewedAt?: string | null;
}
