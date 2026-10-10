import {
  AccountRole,
  address,
  appendTransactionMessageInstruction,
  compileTransaction,
  lamports,
  createDefaultRpcTransport,
  createSolanaRpcFromTransport,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  getI64Decoder,
  getProgramDerivedAddress,
  getSignatureFromTransaction,
  getStructDecoder,
  getTransactionDecoder,
  getTransactionEncoder,
  getU64Decoder,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type Address,
  type Instruction,
  type Signature,
} from "@solana/kit";
import {
  ACTIVATION,
  addressBytes,
  CAMPAIGN_SIZE,
  decodeBase64,
  decodeCampaign,
  localnetConfig,
  networkConfig,
  verifyGenesis,
  type NetworkConfig,
  TOKEN_PROGRAM,
  activationReason,
  type CampaignData,
} from "./interface";
import { pacedDevnetTransport } from "./transport";

export interface ChainCampaign extends CampaignData {
  address: Address;
  vault: Address;
  balance: bigint;
  decimals: number;
}
export interface Snapshot {
  genesis: string;
  slot: bigint;
  clock: bigint;
  campaigns: ChainCampaign[];
}
export interface ChainSignature {
  signature: Signature;
  err: unknown;
  slot: bigint;
}
const clockDecoder = getStructDecoder([
  ["slot", getU64Decoder()],
  ["epochStart", getI64Decoder()],
  ["epoch", getU64Decoder()],
  ["leaderEpoch", getU64Decoder()],
  ["unixTimestamp", getI64Decoder()],
]);
const CLOCK = address("SysvarC1ock11111111111111111111111111111111");
const vaultSeed = ACTIVATION.accounts.find(
  (account) => account.name === "vault",
)!.pda.seeds[0].value;
export class EscrowClient {
  readonly rpc;
  constructor(readonly config: NetworkConfig = networkConfig()) {
    // Validate even explicitly supplied configurations before creating transport.
    this.config = networkConfig(
      config.rpcUrl,
      config.programId,
      config.network,
    );
    const transport = createDefaultRpcTransport({ url: this.config.rpcUrl });
    this.rpc = createSolanaRpcFromTransport(
      this.config.network === "devnet"
        ? pacedDevnetTransport(transport)
        : transport,
    );
  }
  private sendOptions() {
    return {
      abortSignal: AbortSignal.timeout(
        this.config.network === "devnet" ? 30_000 : 10_000,
      ),
    };
  }
  private async read<T>(label: string, request: Promise<T>): Promise<T> {
    try {
      return await request;
    } catch (error) {
      throw new Error(
        `${label}: ${error instanceof Error ? error.message : "RPC request failed"}`,
      );
    }
  }

  async snapshot(): Promise<Snapshot> {
    const genesis = await this.rpc.getGenesisHash().send(this.sendOptions());
    verifyGenesis(this.config, genesis);
    const [program, clock, accounts] = await Promise.all([
      this.read(
        "Read deployed program",
        this.rpc
          .getAccountInfo(this.config.programId, {
            encoding: "base64",
            commitment: "confirmed",
          })
          .send(this.sendOptions()),
      ),
      this.read(
        "Read validator Clock",
        this.rpc
          .getAccountInfo(CLOCK, {
            encoding: "base64",
            commitment: "confirmed",
          })
          .send(this.sendOptions()),
      ),
      this.read(
        "Read campaign accounts",
        this.rpc
          .getProgramAccounts(this.config.programId, {
            encoding: "base64",
            commitment: "confirmed",
            filters: [{ dataSize: BigInt(CAMPAIGN_SIZE) }],
          })
          .send(this.sendOptions()),
      ),
    ]);
    if (!program.value?.executable)
      throw new Error(
        "FUSE is not deployed at this program ID. Check the selected test network and generated program configuration.",
      );
    if (!clock.value) throw new Error("Validator Clock is unavailable.");
    const chainClock = clockDecoder.decode(decodeBase64(clock.value.data[0]));
    const campaigns = await Promise.all(
      accounts.map(async ({ pubkey, account }) => {
        if (account.owner !== this.config.programId)
          throw new Error("Campaign owner mismatch.");
        const data = decodeCampaign(decodeBase64(account.data[0]));
        const [vault] = await getProgramDerivedAddress({
          programAddress: this.config.programId,
          seeds: [Uint8Array.from(vaultSeed), addressBytes(pubkey)],
        });
        const balance = await this.rpc
          .getTokenAccountBalance(vault, { commitment: "confirmed" })
          .send(this.sendOptions());
        return {
          ...data,
          address: pubkey,
          vault,
          balance: BigInt(balance.value.amount),
          decimals: balance.value.decimals,
        };
      }),
    );
    return {
      genesis,
      slot: clock.context.slot,
      clock: chainClock.unixTimestamp,
      campaigns,
    };
  }

  async history(campaign: Address): Promise<readonly ChainSignature[]> {
    return this.rpc
      .getSignaturesForAddress(campaign, { commitment: "confirmed", limit: 10 })
      .send(this.sendOptions());
  }
  async solBalance(wallet: Address): Promise<bigint> {
    return (
      await this.rpc
        .getBalance(wallet, { commitment: "confirmed" })
        .send(this.sendOptions())
    ).value;
  }
  async confirm(signature: Signature): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < 35_000) {
      const status = (
        await this.rpc
          .getSignatureStatuses([signature], { searchTransactionHistory: true })
          .send(this.sendOptions())
      ).value[0];
      if (status?.err)
        throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
      if (
        status &&
        ["confirmed", "finalized"].includes(status.confirmationStatus || "")
      )
        return;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    throw new Error(
      `Confirmation timed out. Outcome is unknown; refresh and inspect signature ${signature} before retrying.`,
    );
  }
  async airdrop(
    wallet: Address,
    submitted: (signature: Signature) => void,
  ): Promise<Signature> {
    if (this.config.network !== "localnet")
      throw new Error(
        "Public-network airdrops are disabled. Fund a disposable Devnet wallet manually.",
      );
    await this.snapshot(); // Explicitly validate local network/program before requesting funds.
    const signature = await this.rpc
      .requestAirdrop(wallet, lamports(1_000_000_000n))
      .send(this.sendOptions());
    submitted(signature);
    await this.confirm(signature);
    return signature;
  }
  private async supplierToken(owner: Address, mint: Address): Promise<Address> {
    const result = await this.rpc
      .getTokenAccountsByOwner(
        owner,
        { mint },
        { encoding: "base64", commitment: "confirmed" },
      )
      .send(this.sendOptions());
    const token = result.value.find(
      ({ account }) => account.owner === TOKEN_PROGRAM,
    );
    if (!token)
      throw new Error(
        "The supplier needs a classic SPL token account for this campaign's mint. Run the corresponding test-network fixture script.",
      );
    return token.pubkey;
  }
  async activationBytes(
    campaignAddress: Address,
    caller: Address,
  ): Promise<Uint8Array> {
    const state = await this.snapshot();
    const campaign = state.campaigns.find(
      (item) => item.address === campaignAddress,
    );
    if (!campaign)
      throw new Error(
        "Campaign is missing from this validator. Refresh after resetting the ledger.",
      );
    const reason = activationReason(campaign, state.clock);
    if (reason) throw new Error(reason);
    const [venueToken, instructorToken, blockhash] = await Promise.all([
      this.supplierToken(campaign.venue, campaign.mint),
      this.supplierToken(campaign.instructor, campaign.mint),
      this.rpc
        .getLatestBlockhash({ commitment: "confirmed" })
        .send(this.sendOptions()),
    ]);
    const addresses: Record<string, Address> = {
      caller,
      campaign: campaign.address,
      mint: campaign.mint,
      vault: campaign.vault,
      venue_token: venueToken,
      instructor_token: instructorToken,
      token_program: TOKEN_PROGRAM,
    };
    const instruction: Instruction = {
      programAddress: this.config.programId,
      data: Uint8Array.from(ACTIVATION.discriminator),
      accounts: ACTIVATION.accounts.map((account) => ({
        address: addresses[account.name],
        role:
          "signer" in account && account.signer
            ? AccountRole.READONLY_SIGNER
            : "writable" in account && account.writable
              ? AccountRole.WRITABLE
              : AccountRole.READONLY,
      })),
    };
    const message = appendTransactionMessageInstruction(
      instruction,
      setTransactionMessageLifetimeUsingBlockhash(
        blockhash.value,
        setTransactionMessageFeePayer(
          caller,
          createTransactionMessage({ version: "legacy" }),
        ),
      ),
    );
    return Uint8Array.from(
      getTransactionEncoder().encode(compileTransaction(message)),
    );
  }
  async broadcast(
    signedBytes: Uint8Array,
    submitted: (signature: Signature) => void,
  ): Promise<Signature> {
    const transaction = getTransactionDecoder().decode(signedBytes);
    const expected = getSignatureFromTransaction(transaction);
    const signature = await this.rpc
      .sendTransaction(getBase64EncodedWireTransaction(transaction), {
        encoding: "base64",
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3n,
      })
      .send(this.sendOptions());
    if (signature !== expected)
      throw new Error("RPC returned an unexpected transaction signature.");
    submitted(signature);
    await this.confirm(signature);
    return signature;
  }
}
// Preserve the original integration/tests with an explicit loopback-only client.
export class LocalnetClient extends EscrowClient {
  constructor() {
    super(localnetConfig());
  }
}
