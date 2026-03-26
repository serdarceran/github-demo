import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Goal Tracker",
  description: "Personal goal tracking with daily progress and penalties",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="t-root-html">
      <body className="t-root-body bg-gray-50 min-h-screen text-gray-900 antialiased pb-16 sm:pb-0">
        {children}
      </body>
    </html>
  );
}
