import {
  isSolanaError,
  SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
  type RpcTransport,
} from "@solana/kit";

const pause = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    signal?.throwIfAborted();
    const abort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", abort, { once: true });
  });

// Pace free public RPC requests and retry only HTTP rate limits. A submitted
// transaction keeps identical signed bytes; no new signature or transaction is
// created by retries. Program failures are never retried here.
export function pacedDevnetTransport(
  base: RpcTransport,
  wait = pause,
): RpcTransport {
  let previous: Promise<void> = Promise.resolve();
  return async (request) => {
    const pending = previous;
    let release!: () => void;
    previous = new Promise<void>((resolve) => {
      release = resolve;
    });
    await pending;
    try {
      request.signal?.throwIfAborted();
      await wait(400, request.signal);
      for (let attempt = 0; ; attempt++) {
        try {
          return await base(request);
        } catch (error) {
          if (
            !isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR) ||
            error.context.statusCode !== 429
          )
            throw error;
          if (attempt >= 2)
            throw new Error(
              "The free Devnet RPC is busy. Wait briefly and refresh. Check any submitted signature before retrying.",
            );
          const retrySeconds =
            Number(error.context.headers.get("retry-after")) || 5;
          await wait(
            Math.min(12_000, Math.max(1_000, retrySeconds * 1000)),
            request.signal,
          );
        }
      }
    } finally {
      release();
    }
  };
}
