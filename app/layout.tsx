import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViralPrinter — Automated TikTok Generator",
  description: "One-click AI-powered TikTok content creation and posting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
