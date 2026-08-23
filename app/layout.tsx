import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KiddieOps — Smart Daycare Management & AI Platform",
  description: "Web-based daycare management platform with AI Guardian Assistant for daycare centers in Bangladesh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
