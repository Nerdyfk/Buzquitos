import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_COLLECTION_NAME || "Buzquitos"} — 5,555 Pixel Art PFP Collection | Whitelist`,
  description: "Join the whitelist for Buzquitos, a character-driven 5,555 pixel-art PFP collection on the Robinhood chain. Complete tasks to apply.",
  metadataBase: new URL("https://example.com"),
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/favicon.ico' }
    ],
    apple: [
      { url: '/logo.png', type: 'image/png' }
    ]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="overflow-x-hidden">{children}</body>
    </html>
  );
}
