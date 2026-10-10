//! These tests execute the compiled SBF program and the real SPL Token Program.
//! Deterministic seeds below are disposable, public TEST fixtures, not wallets.
use anchor_lang::{AccountDeserialize, InstructionData, ToAccountMetas};
use fuse_escrow::state::{Campaign, CampaignStatus, CampaignTerms, Contribution, SupplierRole};
use litesvm::LiteSVM;
use solana_sdk::{
    clock::Clock,
    instruction::Instruction,
    program_pack::Pack,
    pubkey::Pubkey,
    signature::{Keypair, SeedDerivable, Signer},
    transaction::Transaction,
};
use solana_system_interface::{instruction as system_instruction, program as system_program};
use spl_token::state::{Account as TokenAccount, AccountState, Mint};

const ORGANIZER: u8 = 1;
const VENUE: u8 = 2;
const INSTRUCTOR: u8 = 3;
const ATTENDEE: u8 = 4;
const OTHER: u8 = 5;
const MINT: u8 = 10;
const ATTENDEE_TOKEN: u8 = 20;
const OTHER_TOKEN: u8 = 21;
const VENUE_TOKEN: u8 = 22;
const INSTRUCTOR_TOKEN: u8 = 23;
const NOW: i64 = 1_800_000_000;
const DEADLINE: i64 = NOW + 3_600;

fn wallet(seed: u8) -> Keypair {
    Keypair::from_seed(&[seed; 32]).unwrap()
}

fn key(seed: u8) -> Pubkey {
    wallet(seed).pubkey()
}

struct Fixture {
    svm: LiteSVM,
    campaign: Pubkey,
    vault: Pubkey,
}

impl Fixture {
    fn blank() -> Self {
        let mut svm = LiteSVM::new();
        let program_path = std::env::var("FUSE_PROGRAM_SO").expect(
            "Run anchor/scripts/run-linux.sh build, then test; FUSE_PROGRAM_SO is required",
        );
        svm.add_program_from_file(fuse_escrow::ID, program_path)
            .expect("Cannot load compiled FUSE SBF program");
        for seed in ORGANIZER..=OTHER {
            svm.airdrop(&key(seed), 10_000_000_000).unwrap();
        }
        let campaign = Pubkey::find_program_address(
            &[b"campaign", key(ORGANIZER).as_ref(), &1_u64.to_le_bytes()],
            &fuse_escrow::ID,
        )
        .0;
        let vault =
            Pubkey::find_program_address(&[b"vault", campaign.as_ref()], &fuse_escrow::ID).0;
        let mut fixture = Self {
            svm,
            campaign,
            vault,
        };
        fixture.set_time(NOW);
        fixture.create_mint(MINT, false);
        for (account, owner) in [
            (ATTENDEE_TOKEN, ATTENDEE),
            (OTHER_TOKEN, OTHER),
            (VENUE_TOKEN, VENUE),
            (INSTRUCTOR_TOKEN, INSTRUCTOR),
        ] {
            fixture.create_token_account(account, MINT, owner);
        }
        for account in [ATTENDEE_TOKEN, OTHER_TOKEN] {
            fixture
                .send(
                    vec![spl_token::instruction::mint_to(
                        &spl_token::ID,
                        &key(MINT),
                        &key(account),
                        &key(ORGANIZER),
                        &[],
                        1_000,
                    )
                    .unwrap()],
                    &[],
                )
                .unwrap();
        }
        fixture
    }

    fn new() -> Self {
        let mut fixture = Self::blank();
        fixture.create(Self::terms()).unwrap();
        fixture
    }

    fn terms() -> CampaignTerms {
        CampaignTerms {
            identifier: 1,
            seat_price: 20,
            required_seats: 10,
            deadline: DEADLINE,
            venue: key(VENUE),
            instructor: key(INSTRUCTOR),
            venue_allocation: 80,
            instructor_allocation: 120,
        }
    }

    fn set_time(&mut self, timestamp: i64) {
        let mut clock = self.svm.get_sysvar::<Clock>();
        clock.unix_timestamp = timestamp;
        self.svm.set_sysvar(&clock);
    }

    fn send(&mut self, instructions: Vec<Instruction>, signer_seeds: &[u8]) -> Result<(), String> {
        self.send_with_payer(instructions, ORGANIZER, signer_seeds)
    }

    fn send_with_payer(
        &mut self,
        instructions: Vec<Instruction>,
        payer: u8,
        signer_seeds: &[u8],
    ) -> Result<(), String> {
        let mut seeds = vec![payer];
        for seed in signer_seeds {
            if !seeds.contains(seed) {
                seeds.push(*seed);
            }
        }
        let keys: Vec<Keypair> = seeds.into_iter().map(wallet).collect();
        let signers: Vec<&Keypair> = keys.iter().collect();
        let tx = Transaction::new_signed_with_payer(
            &instructions,
            Some(&key(payer)),
            &signers,
            self.svm.latest_blockhash(),
        );
        let result = self
            .svm
            .send_transaction(tx)
            .map(|_| ())
            .map_err(|failure| format!("{:?}\n{}", failure.err, failure.meta.logs.join("\n")));
        // A second identical instruction must reach the program, rather than be
        // rejected merely as the same transaction signature by the VM history.
        self.svm.expire_blockhash();
        result
    }

    fn create_mint(&mut self, seed: u8, freeze_authority: bool) {
        let rent = self.svm.minimum_balance_for_rent_exemption(Mint::LEN);
        let mint_authority = key(ORGANIZER);
        self.send(
            vec![
                system_instruction::create_account(
                    &key(ORGANIZER),
                    &key(seed),
                    rent,
                    Mint::LEN as u64,
                    &spl_token::ID,
                ),
                spl_token::instruction::initialize_mint2(
                    &spl_token::ID,
                    &key(seed),
                    &key(ORGANIZER),
                    if freeze_authority {
                        Some(&mint_authority)
                    } else {
                        None
                    },
                    0,
                )
                .unwrap(),
            ],
            &[seed],
        )
        .unwrap();
    }

    fn create_token_account(&mut self, seed: u8, mint: u8, owner: u8) {
        let rent = self
            .svm
            .minimum_balance_for_rent_exemption(TokenAccount::LEN);
        self.send(
            vec![
                system_instruction::create_account(
                    &key(ORGANIZER),
                    &key(seed),
                    rent,
                    TokenAccount::LEN as u64,
                    &spl_token::ID,
                ),
                spl_token::instruction::initialize_account3(
                    &spl_token::ID,
                    &key(seed),
                    &key(mint),
                    &key(owner),
                )
                .unwrap(),
            ],
            &[seed],
        )
        .unwrap();
    }

    fn create_ix(&self, terms: CampaignTerms) -> Instruction {
        Instruction {
            program_id: fuse_escrow::ID,
            accounts: fuse_escrow::accounts::CreateCampaign {
                organizer: key(ORGANIZER),
                mint: key(MINT),
                campaign: self.campaign,
                vault: self.vault,
                token_program: spl_token::ID,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
            data: fuse_escrow::instruction::CreateCampaign { terms }.data(),
        }
    }

    fn create(&mut self, terms: CampaignTerms) -> Result<(), String> {
        self.send(vec![self.create_ix(terms)], &[])
    }

    fn approve_ix(&self, signer: u8, role: SupplierRole) -> Instruction {
        Instruction {
            program_id: fuse_escrow::ID,
            accounts: fuse_escrow::accounts::ApproveSupplier {
                supplier: key(signer),
                campaign: self.campaign,
            }
            .to_account_metas(None),
            data: fuse_escrow::instruction::ApproveSupplier { role }.data(),
        }
    }

    fn approve(&mut self, signer: u8, role: SupplierRole) -> Result<(), String> {
        self.send(vec![self.approve_ix(signer, role)], &[signer])
    }

    fn approve_both(&mut self) {
        self.approve(VENUE, SupplierRole::Venue).unwrap();
        self.approve(INSTRUCTOR, SupplierRole::Instructor).unwrap();
    }

    fn contribution_address(&self, signer: u8) -> Pubkey {
        Pubkey::find_program_address(
            &[
                b"contribution",
                self.campaign.as_ref(),
                key(signer).as_ref(),
            ],
            &fuse_escrow::ID,
        )
        .0
    }

    fn deposit_ix(&self, signer: u8, source: u8, seats: u64) -> Instruction {
        Instruction {
            program_id: fuse_escrow::ID,
            accounts: fuse_escrow::accounts::Deposit {
                contributor: key(signer),
                campaign: self.campaign,
                mint: key(MINT),
                vault: self.vault,
                source: key(source),
                contribution: self.contribution_address(signer),
                token_program: spl_token::ID,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
            data: fuse_escrow::instruction::Deposit { seats }.data(),
        }
    }

    fn deposit(&mut self, signer: u8, source: u8, seats: u64) -> Result<(), String> {
        self.send(vec![self.deposit_ix(signer, source, seats)], &[signer])
    }

    fn activate_ix(&self) -> Instruction {
        Instruction {
            program_id: fuse_escrow::ID,
            accounts: fuse_escrow::accounts::Activate {
                caller: key(OTHER),
                campaign: self.campaign,
                mint: key(MINT),
                vault: self.vault,
                venue_token: key(VENUE_TOKEN),
                instructor_token: key(INSTRUCTOR_TOKEN),
                token_program: spl_token::ID,
            }
            .to_account_metas(None),
            data: fuse_escrow::instruction::Activate {}.data(),
        }
    }

    fn activate(&mut self) -> Result<(), String> {
        // Activation succeeds with the unrelated caller's signature alone;
        // no organizer, contributor, or supplier signature authorizes payouts.
        self.send_with_payer(vec![self.activate_ix()], OTHER, &[])
    }

    fn refund_ix(&self, signer: u8, destination: u8) -> Instruction {
        Instruction {
            program_id: fuse_escrow::ID,
            accounts: fuse_escrow::accounts::Refund {
                contributor: key(signer),
                campaign: self.campaign,
                mint: key(MINT),
                vault: self.vault,
                contribution: self.contribution_address(signer),
                destination: key(destination),
                token_program: spl_token::ID,
            }
            .to_account_metas(None),
            data: fuse_escrow::instruction::Refund {}.data(),
        }
    }

    fn refund(&mut self, signer: u8, destination: u8) -> Result<(), String> {
        self.send(vec![self.refund_ix(signer, destination)], &[signer])
    }

    fn campaign_state(&self) -> Campaign {
        Campaign::try_deserialize(
            &mut self
                .svm
                .get_account(&self.campaign)
                .unwrap()
                .data
                .as_slice(),
        )
        .unwrap()
    }

    fn contribution(&self, signer: u8) -> Contribution {
        Contribution::try_deserialize(
            &mut self
                .svm
                .get_account(&self.contribution_address(signer))
                .unwrap()
                .data
                .as_slice(),
        )
        .unwrap()
    }

    fn balance(&self, account: Pubkey) -> u64 {
        TokenAccount::unpack(&self.svm.get_account(&account).unwrap().data)
            .unwrap()
            .amount
    }

    fn ready(&mut self) {
        self.deposit(ATTENDEE, ATTENDEE_TOKEN, 10).unwrap();
        self.approve_both();
    }
}

fn rejected(result: Result<(), String>, reason: &str) {
    let error = result.expect_err("Transaction unexpectedly succeeded");
    assert!(error.contains(reason), "Expected {reason}; got {error}");
}

#[test]
fn valid_creation_has_immutable_terms_and_pda_vault_authority() {
    let f = Fixture::new();
    let state = f.campaign_state();
    assert_eq!(
        (state.seat_price, state.required_seats, state.target_amount),
        (20, 10, 200)
    );
    assert_eq!(
        (state.venue_allocation, state.instructor_allocation),
        (80, 120)
    );
    assert_eq!(state.deadline, DEADLINE);
    assert_eq!(state.status, CampaignStatus::Open);
    let vault = f.svm.get_account(&f.vault).unwrap();
    assert_eq!(vault.owner, spl_token::ID);
    let token = TokenAccount::unpack(&vault.data).unwrap();
    assert_eq!(token.owner, f.campaign);
    assert_eq!(token.mint, key(MINT));
    assert_eq!(token.amount, 0);
}

#[test]
fn invalid_terms_and_overflow_are_rejected_without_accounts() {
    let mut f = Fixture::blank();
    let mut terms = Fixture::terms();
    terms.seat_price = 0;
    rejected(f.create(terms), "InvalidAmount");
    let mut terms = Fixture::terms();
    terms.required_seats = 0;
    rejected(f.create(terms), "InvalidAmount");
    let mut terms = Fixture::terms();
    terms.deadline = NOW;
    rejected(f.create(terms), "InvalidDeadline");
    let mut terms = Fixture::terms();
    terms.venue_allocation = 79;
    rejected(f.create(terms), "InvalidAllocations");
    let mut terms = Fixture::terms();
    terms.required_seats = u64::MAX;
    rejected(f.create(terms), "ArithmeticOverflow");
    let mut terms = Fixture::terms();
    terms.venue_allocation = u64::MAX;
    rejected(f.create(terms), "ArithmeticOverflow");
    let mut terms = Fixture::terms();
    terms.venue = terms.instructor;
    rejected(f.create(terms), "InvalidSupplier");
    assert!(f.svm.get_account(&f.campaign).is_none());
    assert!(f.svm.get_account(&f.vault).is_none());
}

#[test]
fn published_terms_cannot_be_reinitialized() {
    let mut f = Fixture::new();
    let before = f.svm.get_account(&f.campaign).unwrap().data;
    let mut terms = Fixture::terms();
    terms.seat_price = 40;
    terms.venue_allocation = 160;
    terms.instructor_allocation = 240;
    assert!(f.create(terms).is_err());
    assert_eq!(f.svm.get_account(&f.campaign).unwrap().data, before);
}

#[test]
fn only_designated_supplier_can_approve_and_signature_is_required() {
    let mut f = Fixture::new();
    rejected(
        f.approve(OTHER, SupplierRole::Venue),
        "UnauthorizedSupplier",
    );
    rejected(
        f.approve(VENUE, SupplierRole::Instructor),
        "UnauthorizedSupplier",
    );
    let mut ix = f.approve_ix(VENUE, SupplierRole::Venue);
    ix.accounts[0].is_signer = false;
    rejected(f.send(vec![ix], &[]), "AccountNotSigner");
    assert!(!f.campaign_state().venue_approved);
    f.approve(VENUE, SupplierRole::Venue).unwrap();
    rejected(f.approve(VENUE, SupplierRole::Venue), "AlreadyApproved");
}

#[test]
fn both_approvals_without_full_funding_cannot_activate() {
    let mut f = Fixture::new();
    f.approve_both();
    f.deposit(ATTENDEE, ATTENDEE_TOKEN, 8).unwrap();
    rejected(f.activate(), "NotFullyFunded");
    assert_eq!(f.balance(f.vault), 160);
    assert_eq!(f.balance(key(VENUE_TOKEN)), 0);
}

#[test]
fn fully_funded_booking_still_needs_instructor_approval() {
    let mut f = Fixture::new();
    f.approve(VENUE, SupplierRole::Venue).unwrap();
    f.deposit(ATTENDEE, ATTENDEE_TOKEN, 8).unwrap();
    f.deposit(ATTENDEE, ATTENDEE_TOKEN, 2).unwrap();
    rejected(f.activate(), "MissingApproval");
    assert_eq!(f.campaign_state().status, CampaignStatus::Open);
    assert_eq!(f.balance(f.vault), 200);
    f.approve(INSTRUCTOR, SupplierRole::Instructor).unwrap();
    f.activate().unwrap();
    assert_eq!(f.campaign_state().status, CampaignStatus::Activated);
}

#[test]
fn activation_pays_exact_80_120_once_and_any_caller_may_trigger_it() {
    let mut f = Fixture::new();
    f.ready();
    f.activate().unwrap();
    assert_eq!(f.balance(key(ATTENDEE_TOKEN)), 800);
    assert_eq!(f.balance(key(VENUE_TOKEN)), 80);
    assert_eq!(f.balance(key(INSTRUCTOR_TOKEN)), 120);
    assert_eq!(f.balance(f.vault), 0);
    let state = f.campaign_state();
    assert_eq!(state.escrowed_amount, 0);
    assert_eq!(state.funded_seats, 10);
    assert_eq!(state.status, CampaignStatus::Activated);
    rejected(f.activate(), "CampaignTerminal");
    assert_eq!(f.balance(key(VENUE_TOKEN)), 80);
    assert_eq!(f.balance(key(INSTRUCTOR_TOKEN)), 120);
}

#[test]
fn deposits_aggregate_once_and_invalid_quantities_or_overfunding_fail() {
    let mut f = Fixture::new();
    rejected(f.deposit(ATTENDEE, ATTENDEE_TOKEN, 0), "InvalidAmount");
    assert!(f
        .svm
        .get_account(&f.contribution_address(ATTENDEE))
        .is_none());
    f.deposit(ATTENDEE, ATTENDEE_TOKEN, 8).unwrap();
    rejected(f.deposit(ATTENDEE, ATTENDEE_TOKEN, 3), "Overfunding");
    rejected(
        f.deposit(ATTENDEE, ATTENDEE_TOKEN, u64::MAX),
        "ArithmeticOverflow",
    );
    f.deposit(ATTENDEE, ATTENDEE_TOKEN, 2).unwrap();
    let contribution = f.contribution(ATTENDEE);
    assert_eq!((contribution.seats, contribution.amount), (10, 200));
    assert_eq!(
        (f.campaign_state().funded_seats, f.balance(f.vault)),
        (10, 200)
    );
}

#[test]
fn wrong_mint_and_another_owners_source_are_rejected() {
    let mut f = Fixture::new();
    f.create_mint(11, false);
    f.create_token_account(24, 11, ATTENDEE);
    rejected(f.deposit(ATTENDEE, 24, 1), "ConstraintTokenMint");
    rejected(f.deposit(ATTENDEE, OTHER_TOKEN, 1), "ConstraintTokenOwner");
    assert_eq!(f.campaign_state().funded_seats, 0);
    assert_eq!(f.balance(f.vault), 0);
}

#[test]
fn insufficient_token_balance_rolls_back_new_contributor_and_accounting() {
    let mut f = Fixture::new();
    f.send(
        vec![spl_token::instruction::transfer_checked(
            &spl_token::ID,
            &key(ATTENDEE_TOKEN),
            &key(MINT),
            &key(OTHER_TOKEN),
            &key(ATTENDEE),
            &[],
            980,
            0,
        )
        .unwrap()],
        &[ATTENDEE],
    )
    .unwrap();
    assert!(f.deposit(ATTENDEE, ATTENDEE_TOKEN, 2).is_err());
    assert_eq!(f.balance(key(ATTENDEE_TOKEN)), 20);
    assert_eq!(f.balance(f.vault), 0);
    assert!(f
        .svm
        .get_account(&f.contribution_address(ATTENDEE))
        .is_none());
    assert_eq!(f.campaign_state().escrowed_amount, 0);
}

#[test]
fn expiry_returns_each_contributors_own_tokens_and_blocks_double_refund() {
    let mut f = Fixture::new();
    f.deposit(ATTENDEE, ATTENDEE_TOKEN, 3).unwrap();
    f.deposit(OTHER, OTHER_TOKEN, 2).unwrap();
    rejected(f.refund(ATTENDEE, ATTENDEE_TOKEN), "RefundNotAvailable");
    f.set_time(DEADLINE);
    f.refund(ATTENDEE, ATTENDEE_TOKEN).unwrap();
    assert_eq!(f.balance(key(ATTENDEE_TOKEN)), 1_000);
    assert_eq!(f.balance(key(OTHER_TOKEN)), 960);
    assert_eq!(f.balance(f.vault), 40);
    assert!(f.contribution(ATTENDEE).refunded);
    assert_eq!(f.campaign_state().status, CampaignStatus::Refunding);
    rejected(f.refund(ATTENDEE, ATTENDEE_TOKEN), "AlreadyRefunded");
    f.refund(OTHER, OTHER_TOKEN).unwrap();
    assert_eq!(f.balance(key(OTHER_TOKEN)), 1_000);
    assert_eq!(f.balance(f.vault), 0);
    assert_eq!(f.campaign_state().status, CampaignStatus::FullyRefunded);
}

#[test]
fn someone_else_cannot_claim_or_redirect_an_attendees_refund() {
    let mut f = Fixture::new();
    f.deposit(ATTENDEE, ATTENDEE_TOKEN, 2).unwrap();
    f.set_time(DEADLINE + 1);
    let mut ix = f.refund_ix(OTHER, OTHER_TOKEN);
    ix.accounts[4].pubkey = f.contribution_address(ATTENDEE);
    assert!(f.send(vec![ix], &[OTHER]).is_err());
    rejected(f.refund(ATTENDEE, OTHER_TOKEN), "ConstraintTokenOwner");
    assert_eq!(f.balance(f.vault), 40);
    assert!(!f.contribution(ATTENDEE).refunded);
}

#[test]
fn activation_at_and_after_deadline_fails_even_when_previously_ready() {
    let mut f = Fixture::new();
    f.ready();
    f.set_time(DEADLINE);
    rejected(f.activate(), "DeadlinePassed");
    f.set_time(DEADLINE + 1);
    rejected(f.activate(), "DeadlinePassed");
    f.refund(ATTENDEE, ATTENDEE_TOKEN).unwrap();
    assert_eq!(f.balance(key(ATTENDEE_TOKEN)), 1_000);
    assert_eq!(f.balance(key(VENUE_TOKEN)), 0);
}

#[test]
fn no_deposits_or_approvals_after_expiry_and_no_reopening_after_refund() {
    let mut f = Fixture::new();
    f.deposit(ATTENDEE, ATTENDEE_TOKEN, 2).unwrap();
    f.set_time(DEADLINE);
    rejected(f.deposit(OTHER, OTHER_TOKEN, 1), "DeadlinePassed");
    rejected(f.approve(VENUE, SupplierRole::Venue), "DeadlinePassed");
    f.refund(ATTENDEE, ATTENDEE_TOKEN).unwrap();
    // Even an artificial VM clock reversal cannot reopen a refunded campaign.
    f.set_time(NOW);
    rejected(f.activate(), "CampaignTerminal");
    rejected(f.deposit(OTHER, OTHER_TOKEN, 1), "CampaignTerminal");
}

#[test]
fn activated_campaign_cannot_refund() {
    let mut f = Fixture::new();
    f.ready();
    f.activate().unwrap();
    f.set_time(DEADLINE + 1);
    rejected(f.refund(ATTENDEE, ATTENDEE_TOKEN), "CampaignTerminal");
    assert_eq!(f.balance(key(ATTENDEE_TOKEN)), 800);
}

#[test]
fn payout_recipient_and_vault_substitutions_are_rejected() {
    let mut f = Fixture::new();
    f.ready();
    let mut ix = f.activate_ix();
    ix.accounts[4].pubkey = key(OTHER_TOKEN);
    rejected(f.send(vec![ix], &[OTHER]), "ConstraintTokenOwner");
    let mut ix = f.activate_ix();
    ix.accounts[3].pubkey = key(OTHER_TOKEN);
    rejected(f.send(vec![ix], &[OTHER]), "ConstraintSeeds");
    assert_eq!(f.balance(f.vault), 200);
    assert_eq!(f.balance(key(VENUE_TOKEN)), 0);
}

#[test]
fn failed_second_payout_rolls_back_first_transfer_and_activation() {
    let mut f = Fixture::new();
    f.ready();
    // Fault injection only: a freeze authority is forbidden at creation. This
    // intentionally invalid VM fixture makes the SECOND real token CPI fail,
    // verifying Solana rollback after the first transfer has executed.
    let mut account = f.svm.get_account(&key(INSTRUCTOR_TOKEN)).unwrap();
    let mut token = TokenAccount::unpack(&account.data).unwrap();
    token.state = AccountState::Frozen;
    TokenAccount::pack(token, &mut account.data).unwrap();
    f.svm.set_account(key(INSTRUCTOR_TOKEN), account).unwrap();
    let error = f.activate().unwrap_err();
    assert!(error.contains("Account is frozen"), "{error}");
    assert_eq!(f.balance(key(VENUE_TOKEN)), 0);
    assert_eq!(f.balance(key(INSTRUCTOR_TOKEN)), 0);
    assert_eq!(f.balance(f.vault), 200);
    assert_eq!(f.campaign_state().status, CampaignStatus::Open);
    assert_eq!(f.campaign_state().escrowed_amount, 200);
}

#[test]
fn direct_vault_donations_do_not_count_as_funding_or_change_fixed_payouts() {
    let mut f = Fixture::new();
    f.approve_both();
    f.send(
        vec![spl_token::instruction::transfer_checked(
            &spl_token::ID,
            &key(OTHER_TOKEN),
            &key(MINT),
            &f.vault,
            &key(OTHER),
            &[],
            200,
            0,
        )
        .unwrap()],
        &[OTHER],
    )
    .unwrap();
    rejected(f.activate(), "NotFullyFunded");
    f.deposit(ATTENDEE, ATTENDEE_TOKEN, 10).unwrap();
    f.activate().unwrap();
    assert_eq!(f.balance(key(VENUE_TOKEN)), 80);
    assert_eq!(f.balance(key(INSTRUCTOR_TOKEN)), 120);
    // No admin rescue instruction exists; unsolicited surplus stays locked.
    assert_eq!(f.balance(f.vault), 200);
}

#[test]
fn a_mint_that_can_freeze_the_escrow_is_rejected() {
    let mut f = Fixture::blank();
    f.create_mint(11, true);
    let mut ix = f.create_ix(Fixture::terms());
    ix.accounts[1].pubkey = key(11);
    rejected(f.send(vec![ix], &[]), "FreezableMint");
    assert!(f.svm.get_account(&f.campaign).is_none());
}

#[test]
fn a_different_program_cannot_replace_the_classic_token_program() {
    let mut f = Fixture::new();
    let mut ix = f.deposit_ix(ATTENDEE, ATTENDEE_TOKEN, 1);
    // A real executable account, but not the immutable Program<Token> ID.
    ix.accounts[6].pubkey = system_program::ID;
    rejected(f.send(vec![ix], &[ATTENDEE]), "InvalidProgramId");
    assert_eq!(f.balance(f.vault), 0);
    assert_eq!(f.campaign_state().funded_seats, 0);
}
