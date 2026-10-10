import { expect, it } from "vitest";
import {
  SolanaError,
  SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
  type RpcTransport,
} from "@solana/kit";
import { pacedDevnetTransport } from "../lib/solana/transport";

it("retries a rate-limited submission with identical payload and preserves exact amounts", async () => {
  const payload = {
    method: "sendTransaction",
    params: ["the-same-signed-bytes"],
  };
  const seen: unknown[] = [];
  const delays: number[] = [];
  const base = (async (request) => {
    seen.push(request.payload);
    if (seen.length === 1)
      throw new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, {
        headers: new Headers({ "retry-after": "2" }),
        statusCode: 429,
        message: "Rate limited",
      });
    return { jsonrpc: "2.0", id: 1, result: 18_446_744_073_709_551_615n };
  }) as RpcTransport;
  const transport = pacedDevnetTransport(base, async (ms) => {
    delays.push(ms);
  });
  expect(await transport<bigint>({ payload })).toMatchObject({
    result: 18_446_744_073_709_551_615n,
  });
  expect(seen).toEqual([payload, payload]);
  expect(seen[0]).toBe(seen[1]);
  expect(delays).toEqual([400, 2000]);
});

it("does not retry a rejected program operation", async () => {
  let calls = 0;
  const base = (async () => {
    calls++;
    throw new Error("Instruction rejected");
  }) as RpcTransport;
  await expect(
    pacedDevnetTransport(base, async () => {})({ payload: {} }),
  ).rejects.toThrow("Instruction rejected");
  expect(calls).toBe(1);
});

it("does not submit an already-aborted queued request", async () => {
  let calls = 0;
  const base = (async () => {
    calls++;
    return {};
  }) as RpcTransport;
  await expect(
    pacedDevnetTransport(base)({ payload: {}, signal: AbortSignal.abort() }),
  ).rejects.toThrow();
  expect(calls).toBe(0);
});
