import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_COLLECTION_NAME || "Buzquitos"} — Whitelist`,
  description: "Join the whitelist. Meet the pixels. Be part of the story.",
  metadataBase: new URL("https://example.com")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
