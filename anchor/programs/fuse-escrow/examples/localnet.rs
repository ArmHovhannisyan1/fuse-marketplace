//! Confirmed Localnet or Devnet transactions using Anchor's generated Rust interface.
//! Test identities are ephemeral; Devnet uses only the owner's dedicated fee wallet.
use anchor_lang::{AccountDeserialize, InstructionData, ToAccountMetas};
use base64::{engine::general_purpose::STANDARD, Engine};
use fuse_escrow::errors::EscrowError;
use fuse_escrow::state::{Campaign, CampaignStatus, CampaignTerms, Contribution, SupplierRole};
use serde_json::{json, Value};
use solana_sdk::{
    clock::Clock,
    compute_budget::ComputeBudgetInstruction,
    hash::Hash,
    instruction::Instruction,
    program_pack::Pack,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
};
use solana_system_interface::{instruction as system_instruction, program as system_program};
use spl_token::state::{Account as TokenAccount, Mint};
use std::{
    error::Error,
    fs,
    path::PathBuf,
    str::FromStr,
    thread,
    time::{Duration, Instant},
};

type Result<T> = std::result::Result<T, Box<dyn Error>>;
#[cfg(not(feature = "devnet"))]
const RPC: &str = "http://127.0.0.1:8899";
#[cfg(feature = "devnet")]
const RPC: &str = "https://api.devnet.solana.com";
const DECIMALS: u8 = 6;
const UNIT: u64 = 1_000_000;

struct LocalClient {
    http: reqwest::blocking::Client,
    nonce: u64,
    transactions: Vec<Value>,
}

impl LocalClient {
    fn rpc(&self, method: &str, params: Value) -> Result<Value> {
        let mut attempt = 0;
        let response: Value = loop {
            if cfg!(feature = "devnet") {
                thread::sleep(Duration::from_millis(400));
            }
            let response = self
                .http
                .post(RPC)
                .json(&json!({"jsonrpc":"2.0", "id":1, "method":method, "params":params}))
                .send();
            let response = match response {
                Ok(response) => response,
                Err(error) if cfg!(feature = "devnet") && attempt < 3 => {
                    attempt += 1;
                    println!("Transient Devnet RPC transport failure for {method}; retrying the same request ({attempt}/3).");
                    thread::sleep(Duration::from_secs(5));
                    let _ = error;
                    continue;
                }
                Err(error) => return Err(format!("{method}: {error}").into()),
            };
            if response.status().as_u16() == 429 && attempt < 3 {
                attempt += 1;
                let delay = response
                    .headers()
                    .get("retry-after")
                    .and_then(|h| h.to_str().ok())
                    .and_then(|h| h.parse::<u64>().ok())
                    .unwrap_or(10)
                    .clamp(1, 30);
                println!("Public Devnet RPC limited {method}; respecting {delay}s backoff ({attempt}/3).");
                thread::sleep(Duration::from_secs(delay));
                continue;
            }
            break response
                .error_for_status()
                .map_err(|e| format!("{method}: {e}"))?
                .json()?;
        };
        if let Some(error) = response.get("error") {
            return Err(format!("{method}: {error}").into());
        }
        response
            .get("result")
            .cloned()
            .ok_or_else(|| format!("{method}: missing result").into())
    }

    fn account(&self, address: &Pubkey) -> Result<Value> {
        let value = self.rpc(
            "getAccountInfo",
            json!([address.to_string(), {"encoding":"base64","commitment":"confirmed"}]),
        )?["value"]
            .clone();
        if value.is_null() {
            return Err(format!("Account does not exist: {address}").into());
        }
        Ok(value)
    }

    fn data(&self, address: &Pubkey, owner: Option<Pubkey>) -> Result<Vec<u8>> {
        let account = self.account(address)?;
        if let Some(owner) = owner {
            assert_eq!(account["owner"], owner.to_string(), "Wrong account owner");
        }
        Ok(STANDARD.decode(
            account["data"][0]
                .as_str()
                .ok_or("Invalid RPC account encoding")?,
        )?)
    }

    fn clock(&self) -> Result<Clock> {
        Ok(bincode::deserialize(
            &self.data(&solana_sdk::sysvar::clock::ID, None)?,
        )?)
    }

    fn campaign(&self, address: &Pubkey) -> Result<Campaign> {
        Ok(Campaign::try_deserialize(
            &mut self.data(address, Some(fuse_escrow::ID))?.as_slice(),
        )?)
    }

    fn balance(&self, address: &Pubkey) -> Result<u64> {
        Ok(TokenAccount::unpack(&self.data(address, Some(spl_token::ID))?)?.amount)
    }

    fn confirm(&self, signature: &str) -> Result<Value> {
        let start = Instant::now();
        loop {
            let status = self.rpc(
                "getSignatureStatuses",
                json!([[signature], {"searchTransactionHistory":true}]),
            )?["value"][0]
                .clone();
            if !status.is_null()
                && matches!(
                    status["confirmationStatus"].as_str(),
                    Some("confirmed" | "finalized")
                )
            {
                return Ok(status);
            }
            if start.elapsed() > Duration::from_secs(if cfg!(feature = "devnet") { 60 } else { 35 })
            {
                return Err(format!("Confirmation timed out: {signature}").into());
            }
            thread::sleep(Duration::from_millis(if cfg!(feature = "devnet") {
                700
            } else {
                200
            }));
        }
    }

    fn airdrop(&mut self, wallet: &Keypair) -> Result<()> {
        if cfg!(feature = "devnet") {
            return Err("No automatic public-network faucet requests are permitted".into());
        }
        let signature = self
            .rpc(
                "requestAirdrop",
                json!([wallet.pubkey().to_string(), 3_000_000_000_u64]),
            )?
            .as_str()
            .ok_or("Missing airdrop signature")?
            .to_owned();
        let status = self.confirm(&signature)?;
        assert!(status["err"].is_null(), "Local airdrop failed: {status}");
        println!("confirmed local SOL airdrop: {signature}");
        Ok(())
    }

    fn send(
        &mut self,
        label: &str,
        instructions: Vec<Instruction>,
        payer: &Keypair,
        extra: &[&Keypair],
        expected_error: Option<u32>,
    ) -> Result<String> {
        let latest = self.rpc("getLatestBlockhash", json!([{"commitment":"confirmed"}]))?;
        let blockhash = Hash::from_str(
            latest["value"]["blockhash"]
                .as_str()
                .ok_or("Missing blockhash")?,
        )?;
        self.nonce += 1;
        let mut unique = vec![ComputeBudgetInstruction::set_compute_unit_price(self.nonce)];
        unique.extend(instructions);
        let mut signers = vec![payer];
        for signer in extra {
            if signer.pubkey() != payer.pubkey() {
                signers.push(*signer);
            }
        }
        let tx =
            Transaction::new_signed_with_payer(&unique, Some(&payer.pubkey()), &signers, blockhash);
        let expected_signature = tx.signatures[0].to_string();
        // Skip preflight ONLY for intentionally rejected cases, so a real failed
        // transaction is submitted and its on-chain status/error can be inspected.
        let signature = self
            .rpc(
                "sendTransaction",
                json!([STANDARD.encode(bincode::serialize(&tx)?), {
                    "encoding":"base64", "skipPreflight":expected_error.is_some(),
                    "preflightCommitment":"confirmed", "maxRetries":3,
                }]),
            )?
            .as_str()
            .ok_or("Missing transaction signature")?
            .to_owned();
        assert_eq!(signature, expected_signature);
        let status = self.confirm(&signature)?;
        if let Some(code) = expected_error {
            assert_eq!(
                status["err"]["InstructionError"][1]["Custom"], code,
                "Unexpected error: {status}"
            );
        } else {
            assert!(
                status["err"].is_null(),
                "Transaction failed: {label}: {status}"
            );
        }
        let outcome = if expected_error.is_some() {
            "rejected on-chain as expected"
        } else {
            "confirmed"
        };
        println!("{label}: {outcome}\n  signature: {signature}");
        self.transactions.push(json!({"label":label,"signature":signature,"outcome":outcome,"error":status["err"],"slot":status["slot"]}));
        Ok(signature)
    }
}

fn instruction(accounts: impl ToAccountMetas, data: impl InstructionData) -> Instruction {
    Instruction {
        program_id: fuse_escrow::ID,
        accounts: accounts.to_account_metas(None),
        data: data.data(),
    }
}

struct Booking {
    address: Pubkey,
    vault: Pubkey,
}
impl Booking {
    fn new(organizer: Pubkey, identifier: u64) -> Self {
        let address = Pubkey::find_program_address(
            &[b"campaign", organizer.as_ref(), &identifier.to_le_bytes()],
            &fuse_escrow::ID,
        )
        .0;
        let vault = Pubkey::find_program_address(&[b"vault", address.as_ref()], &fuse_escrow::ID).0;
        Self { address, vault }
    }
    fn contribution(&self, contributor: Pubkey) -> Pubkey {
        Pubkey::find_program_address(
            &[b"contribution", self.address.as_ref(), contributor.as_ref()],
            &fuse_escrow::ID,
        )
        .0
    }
    fn create(&self, organizer: Pubkey, mint: Pubkey, terms: CampaignTerms) -> Instruction {
        instruction(
            fuse_escrow::accounts::CreateCampaign {
                organizer,
                mint,
                campaign: self.address,
                vault: self.vault,
                token_program: spl_token::ID,
                system_program: system_program::ID,
            },
            fuse_escrow::instruction::CreateCampaign { terms },
        )
    }
    fn approve(&self, supplier: Pubkey, role: SupplierRole) -> Instruction {
        instruction(
            fuse_escrow::accounts::ApproveSupplier {
                supplier,
                campaign: self.address,
            },
            fuse_escrow::instruction::ApproveSupplier { role },
        )
    }
    fn deposit(
        &self,
        contributor: Pubkey,
        source: Pubkey,
        mint: Pubkey,
        seats: u64,
    ) -> Instruction {
        instruction(
            fuse_escrow::accounts::Deposit {
                contributor,
                source,
                mint,
                campaign: self.address,
                vault: self.vault,
                contribution: self.contribution(contributor),
                token_program: spl_token::ID,
                system_program: system_program::ID,
            },
            fuse_escrow::instruction::Deposit { seats },
        )
    }
    fn activate(
        &self,
        caller: Pubkey,
        mint: Pubkey,
        venue_token: Pubkey,
        instructor_token: Pubkey,
    ) -> Instruction {
        instruction(
            fuse_escrow::accounts::Activate {
                caller,
                mint,
                venue_token,
                instructor_token,
                campaign: self.address,
                vault: self.vault,
                token_program: spl_token::ID,
            },
            fuse_escrow::instruction::Activate {},
        )
    }
    fn refund(&self, contributor: Pubkey, mint: Pubkey, destination: Pubkey) -> Instruction {
        instruction(
            fuse_escrow::accounts::Refund {
                contributor,
                mint,
                destination,
                campaign: self.address,
                vault: self.vault,
                contribution: self.contribution(contributor),
                token_program: spl_token::ID,
            },
            fuse_escrow::instruction::Refund {},
        )
    }
}

fn token_account(
    client: &mut LocalClient,
    payer: &Keypair,
    mint: Pubkey,
    owner: Pubkey,
    label: &str,
) -> Result<Pubkey> {
    let account = Keypair::new();
    let rent = client
        .rpc(
            "getMinimumBalanceForRentExemption",
            json!([TokenAccount::LEN]),
        )?
        .as_u64()
        .ok_or("Invalid rent")?;
    client.send(
        label,
        vec![
            system_instruction::create_account(
                &payer.pubkey(),
                &account.pubkey(),
                rent,
                TokenAccount::LEN as u64,
                &spl_token::ID,
            ),
            spl_token::instruction::initialize_account3(
                &spl_token::ID,
                &account.pubkey(),
                &mint,
                &owner,
            )?,
        ],
        payer,
        &[&account],
        None,
    )?;
    Ok(account.pubkey())
}

fn terms(identifier: u64, deadline: i64, venue: Pubkey, instructor: Pubkey) -> CampaignTerms {
    CampaignTerms {
        identifier,
        seat_price: 20 * UNIT,
        required_seats: 10,
        deadline,
        venue,
        instructor,
        venue_allocation: 80 * UNIT,
        instructor_allocation: 120 * UNIT,
    }
}

// The CLI uploads many writes concurrently, which can exhaust the free public
// RPC limit. Resume only differing chunks sequentially using the SDK's actual
// loader instruction; the normal CLI still performs the final deployment.
#[allow(deprecated)]
fn upload_devnet_buffer(client: &mut LocalClient) -> Result<()> {
    if !cfg!(feature = "devnet") {
        return Err("Buffer upload requires the Devnet build".into());
    }
    use solana_sdk::bpf_loader_upgradeable as loader;
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf();
    let payer = solana_sdk::signature::read_keypair_file(
        PathBuf::from(std::env::var("HOME")?).join(".config/solana/fuse-devnet.json"),
    )
    .map_err(|_| "Dedicated Devnet wallet unavailable")?;
    let buffer =
        solana_sdk::signature::read_keypair_file(root.join(".wallets/devnet/buffer-keypair.json"))
            .map_err(|_| "Existing deployment buffer key unavailable")?;
    let bytes = fs::read(root.join("target/devnet/fuse_escrow.so"))?;
    let exists = client.rpc(
        "getAccountInfo",
        json!([buffer.pubkey().to_string(), {"encoding":"base64", "commitment":"confirmed"}]),
    )?;
    if exists["value"].is_null() {
        let rent = client
            .rpc(
                "getMinimumBalanceForRentExemption",
                json!([loader::UpgradeableLoaderState::size_of_buffer(bytes.len())]),
            )?
            .as_u64()
            .ok_or("Invalid buffer rent")?;
        client.send(
            "Initialize dedicated deployment buffer",
            loader::create_buffer(
                &payer.pubkey(),
                &buffer.pubkey(),
                &payer.pubkey(),
                rent,
                bytes.len(),
            )?,
            &payer,
            &[&buffer],
            None,
        )?;
    }
    let current = client.data(&buffer.pubkey(), Some(loader::ID))?;
    let state: loader::UpgradeableLoaderState = bincode::deserialize(&current)?;
    match state {
        loader::UpgradeableLoaderState::Buffer {
            authority_address: Some(authority),
        } if authority == payer.pubkey() => (),
        _ => return Err("Wrong deployment-buffer authority".into()),
    }
    let offset = loader::UpgradeableLoaderState::size_of_buffer_metadata();
    assert_eq!(current.len(), bytes.len() + offset);
    let missing: Vec<_> = bytes
        .chunks(900)
        .enumerate()
        .filter(|(index, chunk)| {
            let start = index * 900;
            current[offset + start..offset + start + chunk.len()] != **chunk
        })
        .collect();
    for batch in missing.chunks(6) {
        let latest = client.rpc("getLatestBlockhash", json!([{"commitment":"confirmed"}]))?;
        let blockhash = Hash::from_str(
            latest["value"]["blockhash"]
                .as_str()
                .ok_or("Missing blockhash")?,
        )?;
        let mut signatures = vec![];
        for (index, chunk) in batch {
            let ix = loader::write(
                &buffer.pubkey(),
                &payer.pubkey(),
                (index * 900) as u32,
                chunk.to_vec(),
            );
            let tx = Transaction::new_signed_with_payer(
                &[ix],
                Some(&payer.pubkey()),
                &[&payer],
                blockhash,
            );
            let wire = bincode::serialize(&tx)?;
            assert!(wire.len() <= 1232, "Loader write exceeds packet size");
            let expected = tx.signatures[0].to_string();
            let submitted = client.rpc("sendTransaction", json!([STANDARD.encode(wire), {"encoding":"base64", "skipPreflight":false, "preflightCommitment":"confirmed", "maxRetries":3}]))?;
            assert_eq!(submitted.as_str(), Some(expected.as_str()));
            signatures.push(expected);
        }
        let started = Instant::now();
        loop {
            let statuses = client.rpc(
                "getSignatureStatuses",
                json!([signatures, {"searchTransactionHistory":true}]),
            )?;
            let values = statuses["value"]
                .as_array()
                .ok_or("Missing confirmation statuses")?;
            for status in values {
                assert!(status["err"].is_null(), "Buffer write failed: {status}");
            }
            if values.iter().all(|status| {
                !status.is_null()
                    && matches!(
                        status["confirmationStatus"].as_str(),
                        Some("confirmed" | "finalized")
                    )
            }) {
                break;
            }
            if started.elapsed() > Duration::from_secs(60) {
                return Err(
                    "Buffer batch confirmation timed out; resume after checking state".into(),
                );
            }
            thread::sleep(Duration::from_millis(900));
        }
        println!(
            "Confirmed paced buffer batch through chunk {}: {}",
            batch.last().unwrap().0,
            signatures.last().unwrap()
        );
    }
    let written = missing.len();
    assert_eq!(
        &client.data(&buffer.pubkey(), Some(loader::ID))?[offset..],
        bytes
    );
    println!("Verified complete buffer byte-for-byte; {written} missing chunks written.");
    Ok(())
}

fn prepare_browser_campaign(
    client: &mut LocalClient,
    organizer: &Keypair,
    venue: &Keypair,
    instructor: &Keypair,
    attendee: &Keypair,
    mint: Pubkey,
    attendee_token: Pubkey,
) -> Result<Booking> {
    let ready = Booking::new(organizer.pubkey(), 3);
    let deadline = client.clock()?.unix_timestamp
        + if cfg!(feature = "devnet") {
            604_800
        } else {
            86_400
        };
    client.send(
        "Prepare browser workshop",
        vec![ready.create(
            organizer.pubkey(),
            mint,
            terms(3, deadline, venue.pubkey(), instructor.pubkey()),
        )],
        organizer,
        &[],
        None,
    )?;
    client.send(
        "Fund browser workshop",
        vec![ready.deposit(attendee.pubkey(), attendee_token, mint, 10)],
        attendee,
        &[],
        None,
    )?;
    client.send(
        "Approve browser venue",
        vec![ready.approve(venue.pubkey(), SupplierRole::Venue)],
        venue,
        &[],
        None,
    )?;
    client.send(
        "Approve browser instructor",
        vec![ready.approve(instructor.pubkey(), SupplierRole::Instructor)],
        instructor,
        &[],
        None,
    )?;
    assert_eq!(
        client.campaign(&ready.address)?.status,
        CampaignStatus::Open
    );
    assert_eq!(client.balance(&ready.vault)?, 200 * UNIT);
    Ok(ready)
}

fn main() -> Result<()> {
    let mut client = LocalClient {
        http: reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(20))
            .build()?,
        nonce: 0,
        transactions: vec![],
    };
    let genesis = client.rpc("getGenesisHash", json!([]))?;
    if cfg!(feature = "devnet") {
        assert_eq!(
            genesis, "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG",
            "Wrong public cluster"
        );
    } else {
        assert!(
            !["EtWTR", "5eykt", "4uhc"]
                .iter()
                .any(|prefix| genesis.as_str().unwrap().starts_with(prefix)),
            "Localnet endpoint reports a public cluster"
        );
    }
    if std::env::args().nth(1).as_deref() == Some("upload-buffer") {
        return upload_devnet_buffer(&mut client);
    }
    let program = client.account(&fuse_escrow::ID)?;
    assert_eq!(program["executable"], true, "FUSE program is not deployed");
    println!(
        "Real test-network validator: {RPC}\nProgram: {}\nGenesis: {genesis}",
        fuse_escrow::ID
    );
    let organizer = Keypair::new();
    let venue = Keypair::new();
    let instructor = Keypair::new();
    let attendee = Keypair::new();
    let caller = Keypair::new();
    if cfg!(feature = "devnet") {
        let wallet_path =
            PathBuf::from(std::env::var("HOME")?).join(".config/solana/fuse-devnet.json");
        let deployer = solana_sdk::signature::read_keypair_file(wallet_path)
            .map_err(|_| "Cannot load the owner-created dedicated Devnet wallet")?;
        let balance = client.rpc(
            "getBalance",
            json!([deployer.pubkey().to_string(), {"commitment":"confirmed"}]),
        )?["value"]
            .as_u64()
            .ok_or("Invalid SOL balance")?;
        if balance < 150_000_000 {
            return Err(format!(
                "STOP: add {} lamports of Devnet SOL manually; no faucet requested",
                150_000_000 - balance
            )
            .into());
        }
        client.send(
            "Fund five disposable test signers with 0.02 Devnet SOL each",
            [&organizer, &venue, &instructor, &attendee, &caller]
                .iter()
                .map(|wallet| {
                    system_instruction::transfer(&deployer.pubkey(), &wallet.pubkey(), 20_000_000)
                })
                .collect(),
            &deployer,
            &[],
            None,
        )?;
    } else {
        for wallet in [&organizer, &venue, &instructor, &attendee, &caller] {
            client.airdrop(wallet)?;
        }
    }
    let mint = Keypair::new();
    let rent = client
        .rpc("getMinimumBalanceForRentExemption", json!([Mint::LEN]))?
        .as_u64()
        .ok_or("Invalid mint rent")?;
    client.send(
        "Create six-decimal valueless FUSE demonstration mint",
        vec![
            system_instruction::create_account(
                &organizer.pubkey(),
                &mint.pubkey(),
                rent,
                Mint::LEN as u64,
                &spl_token::ID,
            ),
            spl_token::instruction::initialize_mint2(
                &spl_token::ID,
                &mint.pubkey(),
                &organizer.pubkey(),
                None,
                DECIMALS,
            )?,
        ],
        &organizer,
        &[&mint],
        None,
    )?;
    let attendee_token = token_account(
        &mut client,
        &organizer,
        mint.pubkey(),
        attendee.pubkey(),
        "Create attendee token account",
    )?;
    let venue_token = token_account(
        &mut client,
        &organizer,
        mint.pubkey(),
        venue.pubkey(),
        "Create venue token account",
    )?;
    let instructor_token = token_account(
        &mut client,
        &organizer,
        mint.pubkey(),
        instructor.pubkey(),
        "Create instructor token account",
    )?;
    client.send(
        "Fund attendee with 1000 valueless test tokens",
        vec![spl_token::instruction::mint_to(
            &spl_token::ID,
            &mint.pubkey(),
            &attendee_token,
            &organizer.pubkey(),
            &[],
            1_000 * UNIT,
        )?],
        &organizer,
        &[],
        None,
    )?;

    if cfg!(feature = "devnet") && std::env::args().nth(1).as_deref() == Some("prepare-browser") {
        let ready = prepare_browser_campaign(
            &mut client,
            &organizer,
            &venue,
            &instructor,
            &attendee,
            mint.pubkey(),
            attendee_token,
        )?;
        let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .parent()
            .unwrap()
            .parent()
            .unwrap()
            .join("docs/devnet-recording-fixture.json");
        let receipt = json!({"rpc":RPC,"programId":fuse_escrow::ID.to_string(),"genesisHash":genesis,"campaign":ready.address.to_string(),"mint":mint.pubkey().to_string(),"vault":ready.vault.to_string(),"venueToken":venue_token.to_string(),"instructorToken":instructor_token.to_string(),"deadline":client.campaign(&ready.address)?.deadline,"vaultBaseUnits":200*UNIT,"decimals":DECIMALS,"statusAtPreparation":"Open; fully funded and both suppliers approved","transactions":client.transactions});
        fs::write(
            &path,
            format!("{}\n", serde_json::to_string_pretty(&receipt)?),
        )?;
        println!("Fresh real Devnet recording campaign: {}\nPublic receipt: {}\nPrivate test keys discarded on exit.", ready.address, path.display());
        return Ok(());
    }

    let success = Booking::new(organizer.pubkey(), 1);
    println!(
        "A campaign: {}; vault: {}; mint: {}",
        success.address,
        success.vault,
        mint.pubkey()
    );
    let deadline =
        client.clock()?.unix_timestamp + if cfg!(feature = "devnet") { 1800 } else { 600 };
    client.send(
        "A: Create successful workshop",
        vec![success.create(
            organizer.pubkey(),
            mint.pubkey(),
            terms(1, deadline, venue.pubkey(), instructor.pubkey()),
        )],
        &organizer,
        &[],
        None,
    )?;
    let created = client.campaign(&success.address)?;
    assert_eq!(
        (
            created.target_amount,
            created.venue_allocation,
            created.instructor_allocation
        ),
        (200 * UNIT, 80 * UNIT, 120 * UNIT)
    );
    client.send(
        "A: Deposit eight seats",
        vec![success.deposit(attendee.pubkey(), attendee_token, mint.pubkey(), 8)],
        &attendee,
        &[],
        None,
    )?;
    assert_eq!(client.balance(&success.vault)?, 160 * UNIT);
    client.send(
        "A: Deposit final two seats",
        vec![success.deposit(attendee.pubkey(), attendee_token, mint.pubkey(), 2)],
        &attendee,
        &[],
        None,
    )?;
    assert_eq!(client.balance(&success.vault)?, 200 * UNIT);
    assert_eq!(client.campaign(&success.address)?.funded_seats, 10);
    client.send(
        "A: Full funding alone cannot activate",
        vec![success.activate(
            caller.pubkey(),
            mint.pubkey(),
            venue_token,
            instructor_token,
        )],
        &caller,
        &[],
        Some(EscrowError::MissingApproval.into()),
    )?;
    client.send(
        "A: Unrelated signer cannot approve venue",
        vec![success.approve(caller.pubkey(), SupplierRole::Venue)],
        &caller,
        &[],
        Some(EscrowError::UnauthorizedSupplier.into()),
    )?;
    assert!(!client.campaign(&success.address)?.venue_approved);
    client.send(
        "A: Authentic venue approval",
        vec![success.approve(venue.pubkey(), SupplierRole::Venue)],
        &venue,
        &[],
        None,
    )?;
    client.send(
        "A: Instructor approval still required",
        vec![success.activate(
            caller.pubkey(),
            mint.pubkey(),
            venue_token,
            instructor_token,
        )],
        &caller,
        &[],
        Some(EscrowError::MissingApproval.into()),
    )?;
    client.send(
        "A: Authentic instructor approval",
        vec![success.approve(instructor.pubkey(), SupplierRole::Instructor)],
        &instructor,
        &[],
        None,
    )?;
    let activated = client.send(
        "A: Activate and pay suppliers",
        vec![success.activate(
            caller.pubkey(),
            mint.pubkey(),
            venue_token,
            instructor_token,
        )],
        &caller,
        &[],
        None,
    )?;
    let state = client.campaign(&success.address)?;
    assert_eq!(state.status, CampaignStatus::Activated);
    assert_eq!(state.escrowed_amount, 0);
    assert_eq!(client.balance(&success.vault)?, 0);
    assert_eq!(client.balance(&venue_token)?, 80 * UNIT);
    assert_eq!(client.balance(&instructor_token)?, 120 * UNIT);
    client.send(
        "A: Repeated activation rejected",
        vec![success.activate(
            caller.pubkey(),
            mint.pubkey(),
            venue_token,
            instructor_token,
        )],
        &caller,
        &[],
        Some(EscrowError::CampaignTerminal.into()),
    )?;
    assert_eq!(client.balance(&venue_token)?, 80 * UNIT);
    println!("A VERIFIED: venue=80, instructor=120, vault=0, status=Activated");

    let expiry = Booking::new(organizer.pubkey(), 2);
    println!("B campaign: {}; vault: {}", expiry.address, expiry.vault);
    let expiry_deadline =
        client.clock()?.unix_timestamp + if cfg!(feature = "devnet") { 90 } else { 15 };
    client.send(
        "B: Create short-deadline workshop",
        vec![expiry.create(
            organizer.pubkey(),
            mint.pubkey(),
            terms(2, expiry_deadline, venue.pubkey(), instructor.pubkey()),
        )],
        &organizer,
        &[],
        None,
    )?;
    let before = client.balance(&attendee_token)?;
    client.send(
        "B: Deposit two seats",
        vec![expiry.deposit(attendee.pubkey(), attendee_token, mint.pubkey(), 2)],
        &attendee,
        &[],
        None,
    )?;
    assert_eq!(client.balance(&expiry.vault)?, 40 * UNIT);
    assert_eq!(client.balance(&attendee_token)?, before - 40 * UNIT);
    let wait_limit = if cfg!(feature = "devnet") { 180 } else { 45 };
    println!("Waiting for actual validator Clock to reach {expiry_deadline} (bounded {wait_limit} seconds; no clock manipulation)");
    let wait = Instant::now();
    loop {
        if client.clock()?.unix_timestamp >= expiry_deadline {
            break;
        }
        if wait.elapsed() > Duration::from_secs(wait_limit) {
            return Err("Validator Clock did not advance to expiry".into());
        }
        thread::sleep(Duration::from_millis(if cfg!(feature = "devnet") {
            1500
        } else {
            250
        }));
    }
    let expired_at = client.clock()?.unix_timestamp;
    client.send(
        "B: Activation after deadline rejected",
        vec![expiry.activate(
            caller.pubkey(),
            mint.pubkey(),
            venue_token,
            instructor_token,
        )],
        &caller,
        &[],
        Some(EscrowError::DeadlinePassed.into()),
    )?;
    let refunded = client.send(
        "B: Contributor claims own refund",
        vec![expiry.refund(attendee.pubkey(), mint.pubkey(), attendee_token)],
        &attendee,
        &[],
        None,
    )?;
    assert_eq!(client.balance(&attendee_token)?, before);
    assert_eq!(client.balance(&expiry.vault)?, 0);
    let contribution_address = expiry.contribution(attendee.pubkey());
    let contribution = Contribution::try_deserialize(
        &mut client
            .data(&contribution_address, Some(fuse_escrow::ID))?
            .as_slice(),
    )?;
    assert!(contribution.refunded);
    assert_eq!(contribution.amount, 40 * UNIT);
    assert_eq!(
        client.campaign(&expiry.address)?.status,
        CampaignStatus::FullyRefunded
    );
    client.send(
        "B: Repeated refund rejected",
        vec![expiry.refund(attendee.pubkey(), mint.pubkey(), attendee_token)],
        &attendee,
        &[],
        Some(EscrowError::AlreadyRefunded.into()),
    )?;
    client.send(
        "B: Activation after refund rejected",
        vec![expiry.activate(
            caller.pubkey(),
            mint.pubkey(),
            venue_token,
            instructor_token,
        )],
        &caller,
        &[],
        Some(EscrowError::CampaignTerminal.into()),
    )?;
    println!("B VERIFIED: attendee restored to 800, vault=0, contribution.refunded=true");

    // A third open campaign supports browser activation by any authentic wallet.
    let ready = prepare_browser_campaign(
        &mut client,
        &organizer,
        &venue,
        &instructor,
        &attendee,
        mint.pubkey(),
        attendee_token,
    )?;

    let receipt = json!({"rpc":RPC,"programId":fuse_escrow::ID.to_string(),"genesisHash":genesis,
        "mint":mint.pubkey().to_string(),"decimals":DECIMALS,
        "organizer":organizer.pubkey().to_string(),"venue":venue.pubkey().to_string(),"instructor":instructor.pubkey().to_string(),
        "attendee":attendee.pubkey().to_string(),"attendeeToken":attendee_token.to_string(),"venueToken":venue_token.to_string(),"instructorToken":instructor_token.to_string(),
        "success":{"campaign":success.address.to_string(),"vault":success.vault.to_string(),"activationSignature":activated,
            "venueBaseUnits":80*UNIT,"instructorBaseUnits":120*UNIT,"vaultBaseUnits":0,"status":"Activated"},
        "expiry":{"campaign":expiry.address.to_string(),"vault":expiry.vault.to_string(),"refundSignature":refunded,
            "refundBaseUnits":40*UNIT,"contribution":contribution_address.to_string(),"contributorAfterRefundBaseUnits":before,"expiredAt":expired_at,"deadline":expiry_deadline,"status":"FullyRefunded"},
        "browserCampaign":ready.address.to_string(),"transactions":client.transactions});
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf();
    let path = if cfg!(feature = "devnet") {
        root.parent().unwrap().join("docs")
    } else {
        root.join("localnet")
    };
    fs::create_dir_all(&path)?;
    fs::write(
        path.join(if cfg!(feature = "devnet") {
            "devnet-proof.json"
        } else {
            "receipt.json"
        }),
        format!("{}\n", serde_json::to_string_pretty(&receipt)?),
    )?;
    println!(
        "ALL REAL TEST-NETWORK CHECKS PASSED\nPublic evidence: {}\nBrowser campaign: {}",
        path.display(),
        ready.address
    );
    println!("Private fixture keys were never written to disk. A browser wallet must sign its own actions.");
    Ok(())
}
