import { describe, expect, it } from "vitest";
import { address } from "@solana/kit";
import {
  ACTIVATION,
  CAMPAIGN_SIZE,
  decodeCampaign,
  localnetConfig,
  PROGRAM_ID,
  tokenAmount,
} from "../lib/solana/interface";

describe("real network interface boundaries", () => {
  it("uses the generated program and actual activation instruction", () => {
    expect(localnetConfig().programId).toBe(PROGRAM_ID);
    expect(ACTIVATION.args).toEqual([]);
    expect(ACTIVATION.accounts.map((account) => account.name)).toEqual([
      "caller",
      "campaign",
      "mint",
      "vault",
      "venue_token",
      "instructor_token",
      "token_program",
    ]);
  });
  it("rejects public clusters, credentials and mismatched programs", () => {
    expect(() =>
      localnetConfig("http://127.0.0.1:8899", PROGRAM_ID, "devnet"),
    ).toThrow("Network mismatch");
    for (const rpc of [
      "https://api.devnet.solana.com",
      "http://example.com:8899",
      "http://user:secret@localhost:8899",
      "http://localhost:8899?api-key=example",
    ])
      expect(() => localnetConfig(rpc)).toThrow();
    expect(() =>
      localnetConfig(
        "http://127.0.0.1:8899",
        address("11111111111111111111111111111111"),
      ),
    ).toThrow("Program ID mismatch");
  });
  it("rejects truncated data and wrong account discriminators", () => {
    expect(() => decodeCampaign(new Uint8Array(CAMPAIGN_SIZE - 1))).toThrow();
    expect(() => decodeCampaign(new Uint8Array(CAMPAIGN_SIZE))).toThrow();
  });
  it("formats exact base units above JavaScript's safe integer range", () => {
    expect(tokenAmount(18_446_744_073_709_551_615n, 6)).toBe(
      "18446744073709.551615",
    );
    expect(tokenAmount(80_000_000n, 6)).toBe("80");
    expect(tokenAmount(1n, 6)).toBe("0.000001");
    expect(tokenAmount(0n, 6)).toBe("0");
    expect(() => tokenAmount(-1n, 6)).toThrow();
  });
});
