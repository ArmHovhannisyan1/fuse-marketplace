import { describe, expect, it } from "vitest";
import { address } from "@solana/kit";
import {
  ACTIVATION,
  CAMPAIGN_SIZE,
  decodeCampaign,
  localnetConfig,
  PROGRAM_ID,
  tokenAmount,
  networkConfig,
  verifyGenesis,
  DEVNET_PROGRAM_ID,
  DEVNET_GENESIS,
} from "../lib/solana/interface";
import localIdl from "../anchor/idl/fuse_escrow.json";
import devnetIdl from "../anchor/idl/devnet/fuse_escrow.json";

describe("real network interface boundaries", () => {
  it("accepts only the verified Devnet program and canonical public RPC", () => {
    expect(networkConfig().programId).toBe(DEVNET_PROGRAM_ID);
    for (const rpc of [
      "https://api.mainnet-beta.solana.com",
      "https://api.testnet.solana.com",
      "https://user:secret@api.devnet.solana.com",
      "https://api.devnet.solana.com?key=test",
      "http://api.devnet.solana.com",
    ])
      expect(() => networkConfig(rpc)).toThrow("Network mismatch");
    expect(() =>
      networkConfig("https://api.devnet.solana.com", PROGRAM_ID),
    ).toThrow("Program ID mismatch");
    expect(() =>
      networkConfig(
        "https://api.devnet.solana.com",
        DEVNET_PROGRAM_ID,
        "mainnet-beta",
      ),
    ).toThrow("Network mismatch");
  });
  it("checks actual genesis hashes before reading program state", () => {
    expect(() => verifyGenesis(networkConfig(), DEVNET_GENESIS)).not.toThrow();
    expect(() =>
      verifyGenesis(networkConfig(), "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"),
    ).toThrow("Network mismatch");
    expect(() => verifyGenesis(localnetConfig(), DEVNET_GENESIS)).toThrow(
      "Network mismatch",
    );
  });
  it("keeps both Rust-generated network interfaces binary compatible", () => {
    expect(devnetIdl.address).not.toBe(localIdl.address);
    expect(devnetIdl.instructions).toEqual(localIdl.instructions);
    expect(devnetIdl.accounts).toEqual(localIdl.accounts);
    expect(devnetIdl.types).toEqual(localIdl.types);
  });
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
