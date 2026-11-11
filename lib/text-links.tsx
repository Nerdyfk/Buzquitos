import React from 'react';

/**
 * Parses any @mention in the provided text and renders it as an active Twitter / X link.
 * Safe for both React Server Components (RSC) and Client Components.
 * e.g. "@Buzquitos" -> <a href="https://x.com/Buzquitos">@Buzquitos</a>
 *      "@Mical_xz"  -> <a href="https://x.com/Mical_xz">@Mical_xz</a>
 */
export function renderSocialMentions(text: any, linkClass?: string) {
  if (!text) return null;
  const str = typeof text === 'string' ? text : String(text || '');
  if (!str) return null;

  try {
    const parts = str.split(/(@[a-zA-Z0-9_]+)/g);

    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <a
            key={i}
            href={`https://x.com/${username}`}
            target="_blank"
            rel="noreferrer"
            className={
              linkClass ||
              'font-bold underline decoration-current/40 underline-offset-2 hover:text-[#e42c24] hover:decoration-[#e42c24] transition-colors'
            }
          >
            {part}
          </a>
        );
      }
      return part;
    });
  } catch {
    return str;
  }
}
