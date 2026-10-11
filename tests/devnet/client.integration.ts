import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { EscrowClient } from "../../lib/solana/client";
import { DEVNET_GENESIS, DEVNET_PROGRAM_ID } from "../../lib/solana/interface";

it("decodes actual Devnet campaign/vault state with the generated Rust interface", async () => {
  const proof = JSON.parse(readFileSync("docs/devnet-proof.json", "utf8"));
  const client = new EscrowClient();
  const state = await client.snapshot();
  expect(state.genesis).toBe(DEVNET_GENESIS);
  expect(client.config.programId).toBe(DEVNET_PROGRAM_ID);
  const success = state.campaigns.find(
    (campaign) => campaign.address === proof.success.campaign,
  )!;
  expect(success.status).toBe("Activated");
  expect(success.balance).toBe(0n);
  expect(success.escrowed_amount).toBe(0n);
  expect(success.venue_allocation).toBe(80_000_000n);
  expect(success.instructor_allocation).toBe(120_000_000n);
  expect(success.venue_approved && success.instructor_approved).toBe(true);
  expect(success.decimals).toBe(6);
  const expiry = state.campaigns.find(
    (campaign) => campaign.address === proof.expiry.campaign,
  )!;
  expect(expiry.status).toBe("FullyRefunded");
  expect(expiry.balance).toBe(0n);
  expect(state.clock >= expiry.deadline).toBe(true);
  expect(
    (await client.history(success.address)).some(
      (tx) => tx.signature === proof.success.activationSignature && !tx.err,
    ),
  ).toBe(true);
});
