"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getWallets } from "@wallet-standard/app";
import { address, type Signature } from "@solana/kit";
import { RefreshCw } from "lucide-react";
import { CampaignPanel, WalletPanel } from "./onchain-panels";
import { Dialog, PageIntro } from "./ui";
import {
  EscrowClient,
  type Snapshot,
  type ChainSignature,
} from "@/lib/solana/client";
import {
  activationReason,
  DEVNET_PROGRAM_ID,
  DEVNET_RPC,
  explorerLink,
  localnetConfig,
  networkConfig,
  type DemoNetwork,
  tokenAmount,
} from "@/lib/solana/interface";
import {
  networkReason,
  signWithWallet,
  supportedWallets,
  type LocalWallet,
  type WalletConnection,
} from "@/lib/solana/wallet";

const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "The test-network transaction could not complete.";
const date = (seconds: bigint) =>
  new Date(Number(seconds) * 1000).toLocaleString();
export function OnchainDemo({ network }: { network?: DemoNetwork }) {
  const setup = useMemo(() => {
    try {
      const config =
        network === "localnet"
          ? localnetConfig()
          : network === "devnet"
            ? networkConfig(DEVNET_RPC, DEVNET_PROGRAM_ID, "devnet")
            : networkConfig();
      return { client: new EscrowClient(config), error: "" };
    } catch (error) {
      return { client: null, error: message(error) };
    }
  }, [network]);
  const [state, setState] = useState<Snapshot | null>(null);
  const [rpcError, setRpcError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [wallets, setWallets] = useState<LocalWallet[]>([]);
  const [walletIndex, setWalletIndex] = useState("0");
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [walletError, setWalletError] = useState("");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(false);
  const [transaction, setTransaction] = useState<{
    status: string;
    signature?: Signature;
  }>({ status: "" });
  const [history, setHistory] = useState<readonly ChainSignature[]>([]);
  const [historyError, setHistoryError] = useState("");
  const client = setup.client;
  const currentNetwork = client?.config.network || network || "devnet";
  const networkName = currentNetwork === "devnet" ? "Devnet" : "Localnet";
  const campaign =
    state?.campaigns.find((item) => item.address === selected) ||
    state?.campaigns[0];
  const campaignAddress = campaign?.address;
  const mismatch = connection
    ? networkReason(connection, currentNetwork)
    : null;
  const blocked = !connection
    ? "Connect a wallet to sign your own transaction."
    : mismatch ||
      (currentNetwork === "devnet" && balance === 0n
        ? `No ${networkName} test SOL for transaction fees. Fund your disposable wallet first.`
        : null) ||
      (campaign && state
        ? activationReason(campaign, state.clock)
        : "Load a campaign first.");

  const refresh = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const snapshot = await client.snapshot();
      snapshot.campaigns.sort((a, b) =>
        a.deadline > b.deadline
          ? -1
          : a.deadline < b.deadline
            ? 1
            : a.address.localeCompare(b.address),
      );
      setState(snapshot);
      setRpcError("");
    } catch (error) {
      setState(null); // Never leave stale funds looking current when RPC fails.
      setBalance(null);
      setHistory([]);
      setRpcError(
        `${client.config.network === "localnet" ? "Local RPC unavailable or invalid. Start the FUSE validator" : "Devnet RPC unavailable or invalid. The free public RPC may be rate-limited; wait briefly"}, then refresh. ${message(error)}`,
      );
    } finally {
      setLoading(false);
    }
  }, [client]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const registry = getWallets();
    const update = () => setWallets(supportedWallets());
    // Discovery is deferred to the browser; no automatic wallet authorization.
    queueMicrotask(update);
    const offRegister = registry.on("register", update);
    const offUnregister = registry.on("unregister", update);
    return () => {
      offRegister();
      offUnregister();
    };
  }, []);
  useEffect(() => {
    if (!connection) return;
    return connection.wallet.features["standard:events"].on(
      "change",
      (changes) => {
        if (changes.accounts) {
          const account =
            changes.accounts.find(
              (item) => item.address === connection.account.address,
            ) || changes.accounts[0];
          setConnection(
            account ? { wallet: connection.wallet, account } : null,
          );
          setBalance(null);
          setReview(false);
        } else if (changes.chains || changes.features) {
          setConnection({ ...connection });
          setReview(false);
        }
      },
    );
  }, [connection]);
  useEffect(() => {
    let active = true;
    if (client && connection && !mismatch) {
      client
        .solBalance(address(connection.account.address))
        .then((value) => {
          if (active) setBalance(value);
        })
        .catch(() => {
          if (active) setBalance(null);
        });
    }
    return () => {
      active = false;
    };
  }, [client, connection, mismatch, transaction.status]);
  useEffect(() => {
    let active = true;
    let pending = false;
    const update = async () => {
      if (!client || !campaignAddress || pending) return;
      pending = true;
      try {
        const entries = await client.history(campaignAddress);
        if (active) {
          setHistory(entries);
          setHistoryError("");
        }
      } catch (error) {
        if (active) {
          setHistory([]);
          setHistoryError(message(error));
        }
      } finally {
        pending = false;
      }
    };
    // The validator's history index can lag account confirmation/rooting.
    void update();
    const timer = setInterval(
      () => void update(),
      currentNetwork === "devnet" ? 15_000 : 4_000,
    );
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [client, campaignAddress, state, currentNetwork]);

  async function connect() {
    const wallet = wallets[Number(walletIndex)];
    if (!wallet) {
      setWalletError(
        `No compatible wallet found. Enable a Wallet Standard wallet with ${currentNetwork} and legacy signing support. The CLI demo needs no extension.`,
      );
      return;
    }
    setBusy(true);
    setWalletError("");
    try {
      const { accounts } = await wallet.features["standard:connect"].connect();
      if (!accounts[0])
        throw new Error("The wallet did not authorize an account.");
      address(accounts[0].address);
      setConnection({ wallet, account: accounts[0] });
      setBalance(null);
    } catch (error) {
      setWalletError(message(error));
    } finally {
      setBusy(false);
    }
  }
  async function disconnect() {
    try {
      await connection?.wallet.features["standard:disconnect"].disconnect();
    } catch (error) {
      setWalletError(message(error));
    }
    setConnection(null);
    setBalance(null);
    setReview(false);
  }
  async function transact(action: "activate" | "airdrop") {
    if (
      !client ||
      !connection ||
      mismatch ||
      (action === "activate" && (!campaign || blocked))
    )
      return;
    const activeCampaign = campaignAddress;
    const signer = connection;
    setReview(false);
    setBusy(true);
    setWalletError("");
    setTransaction({
      status:
        action === "activate"
          ? "Pending — preparing your wallet transaction."
          : "Pending — requesting local test SOL.",
    });
    const submitted = (signature: Signature) =>
      setTransaction({
        status: "Pending — submitted, awaiting validator confirmation.",
        signature,
      });
    try {
      let signature: Signature;
      if (action === "airdrop") {
        signature = await client.airdrop(
          address(signer.account.address),
          submitted,
        );
      } else {
        const bytes = await client.activationBytes(
          activeCampaign!,
          address(signer.account.address),
        );
        setTransaction({
          status: "Pending — approve the transaction in your wallet.",
        });
        const signed = await signWithWallet(signer, bytes, currentNetwork);
        signature = await client.broadcast(signed, submitted);
      }
      setTransaction({
        status:
          action === "activate"
            ? `Confirmed — activation executed on ${currentNetwork === "localnet" ? "the local validator" : "Solana Devnet"}.`
            : "Confirmed — local test SOL received.",
        signature,
      });
      await refresh();
    } catch (error) {
      setTransaction((previous) => ({
        ...previous,
        status: `Failed or unconfirmed — ${message(error)}`,
      }));
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container onchain-page">
      <PageIntro
        eyebrow="SEPARATE BLOCKCHAIN DEMONSTRATION"
        title={`Solana ${networkName} — Real Program Transactions`}
      >
        <p>
          Read the deployed escrow and sign a real activation. Tokens and SOL on
          this test network have no monetary value. The{" "}
          <Link href="/marketplace">original marketplace</Link> remains an
          independent simulation.
        </p>
      </PageIntro>
      <nav className="chain-buttons" aria-label="Demonstration network">
        <Link
          className="button button-outline"
          href="/onchain-demo?network=devnet"
          aria-current={currentNetwork === "devnet" ? "page" : undefined}
        >
          Solana Devnet
        </Link>
        <Link
          className="button button-outline"
          href="/onchain-demo?network=localnet"
          aria-current={currentNetwork === "localnet" ? "page" : undefined}
        >
          Local validator
        </Link>
      </nav>
      <section className="chain-panel" aria-labelledby="network-heading">
        <div className="chain-panel-heading">
          <h2 id="network-heading">Solana {networkName}</h2>
          <button
            className="button button-outline"
            disabled={loading || busy}
            onClick={() => void refresh()}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {loading ? "Loading RPC…" : "Refresh on-chain state"}
          </button>
        </div>
        <dl className="chain-facts">
          <div>
            <dt>
              RPC ·{" "}
              {currentNetwork === "devnet"
                ? "public test network"
                : "local development only"}
            </dt>
            <dd>{client?.config.rpcUrl || "Invalid configuration"}</dd>
          </div>
          <div>
            <dt>Program ID · generated from Rust</dt>
            <dd>{client?.config.programId || "Invalid configuration"}</dd>
            {currentNetwork === "devnet" && client && (
              <dd>
                <a
                  href={explorerLink("address", client.config.programId)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Inspect program on Devnet Explorer
                </a>
              </dd>
            )}
          </div>
          {state && (
            <>
              <div>
                <dt>Validator genesis hash</dt>
                <dd>{state.genesis}</dd>
              </div>
              <div>
                <dt>Confirmed slot / validator time</dt>
                <dd>
                  {state.slot.toString()} / {date(state.clock)}
                </dd>
              </div>
            </>
          )}
        </dl>
        {(setup.error || rpcError) && (
          <p role="alert" className="chain-error">
            {setup.error || rpcError}
          </p>
        )}
        {!loading && state?.campaigns.length === 0 && (
          <p>
            No campaigns found. Run{" "}
            <code>
              {currentNetwork === "devnet"
                ? "bash anchor/scripts/devnet.sh scenarios"
                : "bash anchor/scripts/run-linux.sh localnet"}
            </code>{" "}
            in WSL to create the real transaction fixtures.
          </p>
        )}
      </section>
      <div className="chain-layout">
        <CampaignPanel
          network={currentNetwork}
          campaign={campaign}
          state={state}
          busy={busy}
          loading={loading}
          blocked={blocked}
          onSelect={(value) => {
            setSelected(value);
            setHistory([]);
            setReview(false);
          }}
          onReview={() => setReview(true)}
        />
        <WalletPanel
          network={currentNetwork}
          connection={connection}
          wallets={wallets}
          walletIndex={walletIndex}
          setWalletIndex={setWalletIndex}
          balance={balance}
          mismatch={mismatch}
          walletError={walletError}
          transaction={transaction}
          busy={busy}
          rpcReady={!!state}
          connect={connect}
          disconnect={disconnect}
          transact={transact}
        />
      </div>
      <section className="chain-panel" aria-labelledby="history-heading">
        <h2 id="history-heading">Actual campaign transactions</h2>
        <p>
          Latest confirmed records returned by RPC. Failed transactions are
          labeled.
          {currentNetwork === "devnet"
            ? " Explorer links select Devnet. History refreshes every 15 seconds."
            : " Public explorers cannot resolve localnet signatures. History refreshes every four seconds."}{" "}
          Indexing can lag account confirmation.
        </p>
        {historyError && (
          <p role="alert" className="chain-error">
            {historyError}
          </p>
        )}
        {campaign ? (
          <>
            {!history.length && !historyError && (
              <p aria-live="polite">
                Loading confirmed history. Public RPC indexing can lag; refresh
                if records remain unavailable.
              </p>
            )}
            <ol className="chain-history">
              {history.map((entry) => (
                <li key={entry.signature}>
                  <span>
                    {entry.err ? "Failed on-chain" : "Confirmed"} · slot{" "}
                    {entry.slot.toString()}
                  </span>
                  {currentNetwork === "devnet" ? (
                    <a
                      href={explorerLink("tx", entry.signature)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <code>{entry.signature}</code>
                    </a>
                  ) : (
                    <code>{entry.signature}</code>
                  )}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p>History appears after a campaign is loaded.</p>
        )}
      </section>
      {review && campaign && connection && (
        <Dialog
          title={`Review real ${currentNetwork} activation`}
          onClose={() => setReview(false)}
        >
          <p>
            Your wallet will sign an activation that pays the designated venue{" "}
            <strong>
              {tokenAmount(campaign.venue_allocation, campaign.decimals)}
            </strong>{" "}
            and instructor{" "}
            <strong>
              {tokenAmount(campaign.instructor_allocation, campaign.decimals)}
            </strong>{" "}
            valueless test tokens, together. There are no refunds after
            activation in this version.
          </p>
          <p>
            Network: {networkName}. Deadline: {date(campaign.deadline)}. You pay
            the test SOL transaction fee. The contract rechecks all conditions
            when executed.
          </p>
          <p className="chain-address">Campaign: {campaign.address}</p>
          <p className="chain-address">Signer: {connection.account.address}</p>
          <div className="dialog-actions">
            <button
              className="button button-outline"
              onClick={() => setReview(false)}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              onClick={() => void transact("activate")}
            >
              Sign real activation
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
