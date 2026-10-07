import type { Metadata } from "next";
import { Marketplace } from "@/components/marketplace";
export const metadata: Metadata = { title: "Marketplace" };
export default function MarketplacePage() {
  return <Marketplace />;
}
