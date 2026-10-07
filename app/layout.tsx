import type { Metadata } from "next";
import { Header, Footer, StorageNotice } from "@/components/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FUSE — Commit together. Make it happen.",
    template: "%s | FUSE",
  },
  description:
    "Bring people, funding, and suppliers into one conditional booking. Explore the FUSE interactive prototype with simulated demo tokens.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Header />
        <StorageNotice />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
