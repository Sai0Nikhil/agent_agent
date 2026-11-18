import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DiyaPulse A2A — Autonomous Research-to-App Multi-Agent Studio",
  description:
    "Diwali Festiverse A2A Hackathon (Research — Data & Build): Data Agent (Lyzr + Finch) collaborates with Builder Agent (AdaL + Agent37) over BAND to turn live web research into deployed interactive dashboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="diya-bg min-h-screen antialiased selection:bg-amber-500/30 selection:text-amber-100">
        {children}
      </body>
    </html>
  );
}
