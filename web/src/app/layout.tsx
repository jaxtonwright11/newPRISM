import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRISM — Community Perspectives",
  description:
    "Social media redesigned around understanding. Explore how communities experience the same events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-prism-bg-primary text-prism-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
