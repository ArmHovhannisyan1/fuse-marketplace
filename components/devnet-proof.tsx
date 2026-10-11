import proof from "@/docs/devnet-proof.json";
import browserProof from "@/docs/devnet-browser-proof.json";
import { explorerLink, tokenAmount } from "@/lib/solana/interface";

const recorded = (label: string) =>
  proof.transactions.find((transaction) => transaction.label === label)!;
const evidence = [
  {
    transaction: recorded("A: Deposit eight seats"),
    detail: "Attendee test tokens enter the campaign escrow.",
  },
  {
    transaction: recorded("A: Full funding alone cannot activate"),
    detail:
      "Rejected as expected: full funding cannot replace supplier approvals.",
  },
  {
    transaction: recorded("A: Authentic venue approval"),
    detail: "The designated venue signs its approval.",
  },
  {
    transaction: recorded("A: Authentic instructor approval"),
    detail: "The designated instructor signs its approval.",
  },
  {
    transaction: recorded("A: Activate and pay suppliers"),
    detail: `Exact payouts: venue ${tokenAmount(BigInt(proof.success.venueBaseUnits), proof.decimals)}, instructor ${tokenAmount(BigInt(proof.success.instructorBaseUnits), proof.decimals)} test tokens; escrow ${tokenAmount(BigInt(proof.success.vaultBaseUnits), proof.decimals)} after this activation.`,
  },
  {
    transaction: recorded("B: Contributor claims own refund"),
    detail: `Expired, unactivated campaign: ${tokenAmount(BigInt(proof.expiry.refundBaseUnits), proof.decimals)} test tokens returned to the signing contributor.`,
  },
];

export function DevnetProof() {
  return (
    <section className="chain-panel" aria-labelledby="proof-heading">
      <h2 id="proof-heading">Verified Devnet evidence · historical</h2>
      <p>
        Full funding and both supplier approvals are required before the
        deadline. Activation releases the exact agreed payouts together. After
        expiry, an unactivated campaign allows contributors to claim their own
        refunds.
      </p>
      <p>
        These are earlier recorded on-chain transactions with valueless test
        tokens, not a new run or current balances. They remain available to
        inspect when a campaign has already settled or live RPC is unavailable.
        No wallet connection is needed to review this evidence.
      </p>
      <ol className="chain-history">
        {evidence.map(({ transaction, detail }) => (
          <li key={transaction.signature}>
            <a
              href={explorerLink("tx", transaction.signature)}
              target="_blank"
              rel="noreferrer"
            >
              {transaction.label}
            </a>
            <p>
              <strong>
                {transaction.error
                  ? "Failed on-chain as expected"
                  : "Confirmed"}
              </strong>{" "}
              · {detail}
            </p>
          </li>
        ))}
      </ol>
      <p>
        <a
          href={explorerLink("tx", browserProof.signature)}
          target="_blank"
          rel="noreferrer"
        >
          Earlier wallet-signed browser activation
        </a>{" "}
        used a test provider with a real disposable signer. An installed wallet
        extension still needs manual testing. Current account state appears
        separately below.
      </p>
    </section>
  );
}
