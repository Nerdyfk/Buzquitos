"use client";

import type { CampaignSnapshot, PuzzleType } from "@/types/gtd";
import { ChallengeWorkspace } from "@/components/gtd/ChallengeWorkspace";

interface MultiPuzzleHubProps {
  initialCampaign: CampaignSnapshot;
  defaultPuzzleType?: PuzzleType;
}

export function MultiPuzzleHub({
  initialCampaign,
  defaultPuzzleType = "image_3x3",
}: MultiPuzzleHubProps) {
  return (
    <ChallengeWorkspace
      initialCampaign={initialCampaign}
      initialPuzzleType={defaultPuzzleType}
    />
  );
}
