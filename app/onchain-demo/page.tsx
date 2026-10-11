import type { Metadata } from "next";
import { OnchainDemo } from "@/components/onchain-demo";
export const metadata: Metadata = {
  title: "Solana Test Networks",
  description:
    "Authentic FUSE escrow transactions on Solana Devnet or a local validator. Valueless test tokens only.",
};
export default async function OnchainPage({
  searchParams,
}: {
  searchParams: Promise<{ network?: string }>;
}) {
  const { network } = await searchParams;
  const selected =
    network === "localnet" || network === "devnet" ? network : undefined;
  return <OnchainDemo key={selected || "configured"} network={selected} />;
}
