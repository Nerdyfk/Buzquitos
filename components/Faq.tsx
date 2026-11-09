'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const items = [
  [
    'What is Buzquitos?',
    'Buzquitos is a 5,555 character-driven pixel-art PFP (Profile Picture) collection on the Robinhood chain. Each PFP features custom traits, distinct personalities, and grants holders access to the community.'
  ],
  [
    'How do I apply for the whitelist?',
    'Complete the required social tasks: follow @Buzquitos on X, like, retweet and reply to our pinned post, and submit your wallet address with your direct reply link proof.'
  ],
  [
    'What is the inspiration behind the art?',
    'This art is inspired by Mosquitos — capturing playful, character-driven mosquito-inspired pixel personas with distinct styles, bold traits, and big personalities.'
  ],
  [
    'When will whitelist winners be announced?',
    'Official whitelist selections and mint updates will be announced directly on our official X account (@Buzquitos).'
  ],
  [
    'What is the mint price and supply?',
    'The collection has a capped total supply of 5,555 PFPs on the Robinhood chain. The mint price is TBA (to be announced) on our official X (@Buzquitos).'
  ]
];

export default function Faq() {
  const [active, setActive] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map(([q, a], i) => (
        <div key={q} className="border-2 border-[#171820] bg-[#f7f7ed]">
          <button
            className="flex w-full items-center justify-between gap-3 p-4 text-left font-bold text-sm sm:text-base"
            onClick={() => setActive(active === i ? null : i)}
          >
            <span className="flex items-start sm:items-center">
              <span className="mr-2 sm:mr-3 font-mono text-xs text-[#78834b] shrink-0">0{i + 1}</span>
              <span>{q}</span>
            </span>
            <ChevronDown className={`shrink-0 transition-transform ${active === i ? 'rotate-180' : ''}`} size={18} />
          </button>
          {active === i && (
            <div className="border-t-2 border-[#171820]/15 px-4 pb-4 pt-3 text-xs sm:text-sm leading-relaxed text-[#535744]">
              {a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
