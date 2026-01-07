import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "CRO Agent - Conversion Rate Optimization",
  description: "AI-powered CRO insights from Clarity, Crazy Egg, and Google Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-black">
          <Sidebar />
          <main className="pl-[280px]">{children}</main>
        </div>
      </body>
    </html>
  );
}
