import type { Metadata } from "next";
import "./globals.css";
import SideNav from "@/components/SideNav";

export const metadata: Metadata = {
  title: "5H4D0W_D45HB04RD [50V3R31GN_MN7R]",
  description: "Real-time telemetry for the 50V3R31GN-M4CH1N4 system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-mono flex">
        <SideNav />
        <div className="flex-1 min-w-0">{children}</div>
      </body>
    </html>
  );
}
