import { getWallets } from "@wallet-standard/app";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import type {
  StandardConnectFeature,
  StandardDisconnectFeature,
  StandardEventsFeature,
} from "@wallet-standard/features";
import type { SolanaSignTransactionFeature } from "@solana/wallet-standard-features";
import { getTransactionDecoder } from "@solana/kit";
import type { DemoNetwork } from "./interface";

export type LocalWallet = Wallet & {
  features: StandardConnectFeature &
    StandardDisconnectFeature &
    StandardEventsFeature &
    SolanaSignTransactionFeature;
};
export type WalletConnection = { wallet: LocalWallet; account: WalletAccount };
export function supportedWallets(): LocalWallet[] {
  return getWallets()
    .get()
    .filter((wallet): wallet is LocalWallet =>
      [
        "standard:connect",
        "standard:disconnect",
        "standard:events",
        "solana:signTransaction",
      ].every((feature) => feature in wallet.features),
    );
}
export function networkReason(
  connection: WalletConnection,
  network: DemoNetwork = "localnet",
): string | null {
  const chain = `solana:${network}` as const;
  if (
    !connection.wallet.chains.includes(chain) ||
    !connection.account.chains.includes(chain)
  ) {
    return `Wallet network mismatch: select ${network === "devnet" ? "Devnet" : "the local validator at http://127.0.0.1:8899"}. This wallet must advertise ${chain} support.`;
  }
  if (
    !connection.account.features.includes("solana:signTransaction") ||
    !connection.wallet.features[
      "solana:signTransaction"
    ].supportedTransactionVersions.includes("legacy")
  ) {
    return "This wallet account must support signing legacy Solana transactions.";
  }
  return null;
}
export async function signWithWallet(
  connection: WalletConnection,
  unsigned: Uint8Array,
  network: DemoNetwork = "localnet",
): Promise<Uint8Array> {
  const reason = networkReason(connection, network);
  if (reason) throw new Error(reason);
  const [output] = await connection.wallet.features[
    "solana:signTransaction"
  ].signTransaction({
    account: connection.account,
    chain: `solana:${network}`,
    transaction: unsigned,
  });
  if (!output) throw new Error("Wallet returned no signed transaction.");
  // Restrict this small proof of concept to the exact reviewed transaction.
  const before = getTransactionDecoder().decode(unsigned).messageBytes;
  const after = getTransactionDecoder().decode(
    output.signedTransaction,
  ).messageBytes;
  if (
    before.length !== after.length ||
    !before.every((byte, index) => after[index] === byte)
  ) {
    throw new Error(
      "Wallet changed the reviewed transaction. Nothing was submitted.",
    );
  }
  return output.signedTransaction;
}
