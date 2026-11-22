export interface WordChallenge {
  word: string;
  clue: string;
  category: string;
}

export const WORD_CHALLENGES: WordChallenge[] = [
  {
    word: "BUZQUITOS",
    clue: "The official character-driven 5,555 pixel-art PFP collection.",
    category: "COLLECTION",
  },
  {
    word: "ALLOWLIST",
    clue: "Guaranteed Token Distribution whitelist qualification status.",
    category: "WEB3 ACCESS",
  },
  {
    word: "BLOCKCHAIN",
    clue: "The immutable decentralized public ledger powering Web3.",
    category: "PROTOCOL",
  },
  {
    word: "ROBINHOOD",
    clue: "The primary blockchain network for the Buzquitos collection.",
    category: "NETWORK",
  },
  {
    word: "COMMUNITY",
    clue: "The foundation of Web3 culture, creators, and diamond hands.",
    category: "ECOSYSTEM",
  },
];

export function shuffleWordLetters(word: string): string[] {
  const letters = word.toUpperCase().split("");
  let shuffled: string[];
  do {
    shuffled = [...letters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  } while (shuffled.join("") === word.toUpperCase());
  return shuffled;
}
