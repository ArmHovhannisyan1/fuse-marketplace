import type { Page } from "@playwright/test";
import {
  generateKeyPairSigner,
  getAddressEncoder,
  getTransactionDecoder,
  getTransactionEncoder,
  partiallySignTransaction,
} from "@solana/kit";
import type {
  Wallet,
  WalletAccount,
  WindowAppReadyEvent,
} from "@wallet-standard/base";
// Test-only Wallet Standard provider, backed by a real ephemeral Ed25519 key.
// It is never included in the application, and never auto-signs as a fixture role.
export async function installTestWallet(
  page: Page,
  chains = ["solana:localnet"],
  reject = false,
) {
  const signer = await generateKeyPairSigner();
  await page.exposeFunction("localTestSign", async (bytes: number[]) => {
    if (reject)
      throw new Error("User rejected the transaction in the test wallet.");
    const transaction = getTransactionDecoder().decode(Uint8Array.from(bytes));
    return Array.from(
      getTransactionEncoder().encode(
        await partiallySignTransaction([signer.keyPair], transaction),
      ),
    );
  });
  await page.addInitScript(
    ({ publicAddress, publicKey, chains }) => {
      const listeners = new Set<
        (changes: { accounts: WalletAccount[] }) => void
      >();
      const account: WalletAccount = {
        address: publicAddress,
        publicKey: Uint8Array.from(publicKey),
        chains: chains as WalletAccount["chains"],
        features: ["solana:signTransaction"],
      };
      let connected = false;
      const wallet: Wallet = {
        version: "1.0.0",
        name: "Disposable local test signer",
        icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=",
        chains: chains as Wallet["chains"],
        get accounts() {
          return connected ? [account] : [];
        },
        features: {
          "standard:connect": {
            version: "1.0.0",
            connect: async () => {
              connected = true;
              listeners.forEach((listener) =>
                listener({ accounts: [account] }),
              );
              return { accounts: [account] };
            },
          },
          "standard:disconnect": {
            version: "1.0.0",
            disconnect: async () => {
              connected = false;
              listeners.forEach((listener) => listener({ accounts: [] }));
            },
          },
          "standard:events": {
            version: "1.0.0",
            on: (
              _event: string,
              listener: (changes: { accounts: WalletAccount[] }) => void,
            ) => {
              listeners.add(listener);
              return () => listeners.delete(listener);
            },
          },
          "solana:signTransaction": {
            version: "1.0.0",
            supportedTransactionVersions: ["legacy"],
            signTransaction: async (input: { transaction: Uint8Array }) => {
              const sign = (
                window as unknown as {
                  localTestSign: (bytes: number[]) => Promise<number[]>;
                }
              ).localTestSign;
              return [
                {
                  signedTransaction: Uint8Array.from(
                    await sign(Array.from(input.transaction)),
                  ),
                },
              ];
            },
          },
        },
      };
      window.addEventListener("wallet-standard:app-ready", (event: Event) => {
        (event as WindowAppReadyEvent).detail.register(wallet);
      });
    },
    {
      publicAddress: signer.address,
      publicKey: Array.from(getAddressEncoder().encode(signer.address)),
      chains,
    },
  );
  return signer;
}
