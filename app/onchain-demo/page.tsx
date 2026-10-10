import type { Metadata } from "next";
import { OnchainDemo } from "@/components/onchain-demo";
export const metadata: Metadata = {
  title: "Solana Localnet",
  description:
    "Real FUSE escrow transactions on a disposable local Solana validator.",
};
export default function OnchainPage() {
  return <OnchainDemo />;
}
