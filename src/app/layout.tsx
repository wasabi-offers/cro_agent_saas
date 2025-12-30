import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Email Reverse Agent",
  description: "Your SaaS Dashboard",
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
