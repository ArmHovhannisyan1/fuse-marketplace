"use client";

import { CheckCircle2, CircleDashed, ShieldCheck } from "lucide-react";
import type { Signature } from "@solana/kit";
import type { ChainCampaign, Snapshot } from "@/lib/solana/client";
import {
  activationReason,
  tokenAmount,
  explorerLink,
  type DemoNetwork,
} from "@/lib/solana/interface";
import type { LocalWallet, WalletConnection } from "@/lib/solana/wallet";

const date = (seconds: bigint) =>
  new Date(Number(seconds) * 1000).toLocaleString();

interface CampaignPanelProps {
  network: DemoNetwork;
  campaign: ChainCampaign | undefined;
  state: Snapshot | null;
  busy: boolean;
  loading: boolean;
  blocked: string | null;
  onSelect: (value: string) => void;
  onReview: () => void;
}
export function CampaignPanel({
  network,
  campaign,
  state,
  busy,
  loading,
  blocked,
  onSelect,
  onReview,
}: CampaignPanelProps) {
  const tokenLabel =
    network === "devnet" ? "valueless Devnet test tokens" : "local test tokens";
  return (
    <section className="chain-panel" aria-labelledby="campaign-heading">
      <h2 id="campaign-heading">Workshop escrow</h2>
      {campaign && state ? (
        <>
          <label htmlFor="chain-campaign">Campaign from the validator</label>
          <select
            id="chain-campaign"
            value={campaign.address}
            disabled={busy}
            onChange={(event) => onSelect(event.target.value)}
          >
            {state.campaigns.map((item) => (
              <option key={item.address} value={item.address}>
                Campaign {item.identifier.toString()} · {item.status} ·{" "}
                {item.address.slice(0, 8)}…
              </option>
            ))}
          </select>
          <p className="chain-address" data-testid="chain-campaign-address">
            {campaign.address}
          </p>
          {network === "devnet" && (
            <a
              className="chain-explorer"
              href={explorerLink("address", campaign.address)}
              target="_blank"
              rel="noreferrer"
            >
              Inspect campaign on Devnet Explorer
            </a>
          )}
          <span className="status-badge">
            <ShieldCheck size={14} aria-hidden="true" />
            <span data-testid="chain-status">
              {campaign.status === "Open" &&
              !activationReason(campaign, state.clock)
                ? "Ready to activate"
                : campaign.status === "Open" && state.clock >= campaign.deadline
                  ? "Expired — refunds available"
                  : campaign.status}
            </span>
          </span>
          <dl className="chain-facts">
            <div>
              <dt>Seats funded</dt>
              <dd>
                {campaign.funded_seats.toString()} of{" "}
                {campaign.required_seats.toString()} ·{" "}
                {tokenAmount(campaign.seat_price, campaign.decimals)}{" "}
                {tokenLabel} / seat
              </dd>
            </div>
            <div>
              <dt>Actual escrow token balance</dt>
              <dd data-testid="chain-vault-balance">
                {tokenAmount(campaign.balance, campaign.decimals)} {tokenLabel}
              </dd>
              <dd>
                {campaign.balance.toString()} base units · {campaign.decimals}{" "}
                decimals
              </dd>
            </div>
            <div>
              <dt>Contract accounting / target</dt>
              <dd>
                {tokenAmount(campaign.escrowed_amount, campaign.decimals)} /{" "}
                {tokenAmount(campaign.target_amount, campaign.decimals)}{" "}
                {tokenLabel}
              </dd>
            </div>
            <div>
              <dt>Token mint</dt>
              <dd>{campaign.mint}</dd>
            </div>
            <div>
              <dt>Escrow account</dt>
              <dd>{campaign.vault}</dd>
            </div>
            <div>
              <dt>Fixed deadline</dt>
              <dd>{date(campaign.deadline)}</dd>
            </div>
          </dl>
          <ul className="chain-approvals">
            {[
              [
                "Venue",
                campaign.venue_approved,
                campaign.venue,
                campaign.venue_allocation,
              ],
              [
                "Instructor",
                campaign.instructor_approved,
                campaign.instructor,
                campaign.instructor_allocation,
              ],
            ].map(([role, approved, supplier, amount]) => (
              <li key={String(role)}>
                {approved ? (
                  <CheckCircle2 size={17} aria-hidden="true" />
                ) : (
                  <CircleDashed size={17} aria-hidden="true" />
                )}
                <div>
                  <strong>
                    {String(role)}:{" "}
                    {approved ? "approved" : "awaiting approval"}
                  </strong>
                  <span>
                    {tokenAmount(amount as bigint, campaign.decimals)}{" "}
                    {tokenLabel}
                  </span>
                  <span className="chain-address">{String(supplier)}</span>
                </div>
              </li>
            ))}
          </ul>
          <button
            className="button button-primary"
            disabled={busy || loading || !!blocked}
            aria-describedby="chain-action-reason"
            onClick={onReview}
          >
            Activate with my wallet
          </button>
          <p id="chain-action-reason">
            {blocked ||
              "All conditions met. Your wallet signs activation and pays the test SOL fee. No test-token balance is needed to activate. Suppliers separately signed their approvals."}
          </p>
          <p>
            No mock role selection is used here. Deposits, approvals and refunds
            are demonstrated by the independently verified developer script.
          </p>
        </>
      ) : (
        <p>
          Connect to RPC to load actual campaign state. No simulated balance is
          substituted.
        </p>
      )}
    </section>
  );
}
interface WalletPanelProps {
  network: DemoNetwork;
  connection: WalletConnection | null;
  wallets: LocalWallet[];
  walletIndex: string;
  setWalletIndex: (index: string) => void;
  balance: bigint | null;
  mismatch: string | null;
  walletError: string;
  transaction: { status: string; signature?: Signature };
  busy: boolean;
  rpcReady: boolean;
  connect: () => void;
  disconnect: () => void;
  transact: (action: "airdrop") => void;
}
export function WalletPanel({
  network,
  connection,
  wallets,
  walletIndex,
  setWalletIndex,
  balance,
  mismatch,
  walletError,
  transaction,
  busy,
  rpcReady,
  connect,
  disconnect,
  transact,
}: WalletPanelProps) {
  return (
    <aside className="chain-panel" aria-labelledby="wallet-heading">
      <h2 id="wallet-heading">Your signing wallet</h2>
      <p>
        Use a disposable wallet configured for {network}. Keys stay in your
        wallet; the website has no signing keys.
      </p>
      {connection ? (
        <>
          <dl className="chain-facts">
            <div>
              <dt>Connected address</dt>
              <dd data-testid="chain-wallet-address">
                {connection.account.address}
              </dd>
            </div>
            <div>
              <dt>
                {network === "devnet" ? "Valueless Devnet SOL" : "Local SOL"}{" "}
                for transaction fees
              </dt>
              <dd>
                {mismatch
                  ? "Unavailable on a mismatched network"
                  : balance === null
                    ? "Not loaded"
                    : `${tokenAmount(balance, 9)} ${network === "devnet" ? "Devnet test SOL" : "local SOL"}`}
              </dd>
            </div>
          </dl>
          <div className="chain-buttons">
            <button
              className="button button-outline"
              disabled={busy}
              onClick={() => void disconnect()}
            >
              Disconnect wallet
            </button>
            {network === "localnet" && (
              <button
                className="button button-outline"
                disabled={busy || !!mismatch || !rpcReady}
                onClick={() => void transact("airdrop")}
              >
                Request local test SOL
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <label htmlFor="chain-wallet">Wallet Standard wallet</label>
          <select
            id="chain-wallet"
            value={walletIndex}
            disabled={busy || !wallets.length}
            onChange={(event) => setWalletIndex(event.target.value)}
          >
            {wallets.length ? (
              wallets.map((wallet, index) => (
                <option key={`${wallet.name}-${index}`} value={index}>
                  {wallet.name}
                </option>
              ))
            ) : (
              <option value="0">No compatible wallet detected</option>
            )}
          </select>
          <button
            className="button button-primary"
            disabled={busy}
            onClick={() => void connect()}
          >
            Connect wallet
          </button>
          <p>
            {network} and legacy signing support are required. If your extension
            does not support them, use the real CLI scenarios; no wallet
            extension is needed there.
          </p>
        </>
      )}
      {(walletError || mismatch) && (
        <p className="chain-error" role="alert">
          {walletError || mismatch}
        </p>
      )}
      {transaction.status && (
        <div className="chain-transaction" role="status">
          <strong>{transaction.status}</strong>
          {transaction.signature && (
            <p data-testid="chain-transaction-signature">
              {network === "devnet" ? (
                <a
                  href={explorerLink("tx", transaction.signature)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {transaction.signature}
                </a>
              ) : (
                transaction.signature
              )}
            </p>
          )}
        </div>
      )}
      <p className="chain-safety">
        {network === "devnet" && (
          <>
            Fund fee SOL manually using the{" "}
            <a
              href="https://faucet.solana.com"
              target="_blank"
              rel="noreferrer"
            >
              official Devnet faucet
            </a>
            . The page never requests Devnet funds automatically.{" "}
          </>
        )}
        Unaudited proof of concept. Valueless test tokens only. Payment does not
        guarantee a physical workshop will happen.
      </p>
    </aside>
  );
}
