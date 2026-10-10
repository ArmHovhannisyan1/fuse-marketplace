import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { LocalnetClient } from "../../lib/solana/client";
import { PROGRAM_ID } from "../../lib/solana/interface";

it("generated TypeScript client decodes the deployed Rust campaign and vault states", async () => {
  const receipt = JSON.parse(
    readFileSync("anchor/localnet/receipt.json", "utf8"),
  );
  const client = new LocalnetClient();
  const state = await client.snapshot();
  expect(client.config.programId).toBe(PROGRAM_ID);
  expect(state.genesis).toBe(receipt.genesisHash);
  const success = state.campaigns.find(
    (campaign) => campaign.address === receipt.success.campaign,
  )!;
  expect(success.status).toBe("Activated");
  expect(success.balance).toBe(0n);
  expect(success.escrowed_amount).toBe(0n);
  expect(success.venue_allocation).toBe(80_000_000n);
  expect(success.instructor_allocation).toBe(120_000_000n);
  expect(success.venue_approved && success.instructor_approved).toBe(true);
  expect(success.decimals).toBe(6);
  const expired = state.campaigns.find(
    (campaign) => campaign.address === receipt.expiry.campaign,
  )!;
  expect(expired.status).toBe("FullyRefunded");
  expect(expired.balance).toBe(0n);
  expect(state.clock >= expired.deadline).toBe(true);
  await expect
    .poll(
      async () =>
        (await client.history(success.address)).some(
          (transaction) =>
            transaction.signature === receipt.success.activationSignature &&
            !transaction.err,
        ),
      { timeout: 30_000, interval: 1_000 },
    )
    .toBe(true);
});
