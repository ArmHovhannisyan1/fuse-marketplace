use anchor_lang::prelude::*;

pub const CAMPAIGN_SEED: &[u8] = b"campaign";
pub const VAULT_SEED: &[u8] = b"vault";
pub const CONTRIBUTION_SEED: &[u8] = b"contribution";

#[account]
#[derive(InitSpace, Debug)]
pub struct Campaign {
    // Immutable after creation. There is deliberately no update-terms instruction.
    pub organizer: Pubkey,
    pub identifier: u64,
    pub mint: Pubkey,
    pub seat_price: u64,
    pub required_seats: u64,
    pub target_amount: u64,
    pub deadline: i64,
    pub venue: Pubkey,
    pub instructor: Pubkey,
    pub venue_allocation: u64,
    pub instructor_allocation: u64,
    pub bump: u8,
    pub vault_bump: u8,
    // Mutable commitments and accounting, never independent display labels.
    pub venue_approved: bool,
    pub instructor_approved: bool,
    pub funded_seats: u64,
    pub escrowed_amount: u64,
    pub status: CampaignStatus,
}

#[account]
#[derive(InitSpace, Debug)]
pub struct Contribution {
    pub campaign: Pubkey,
    pub contributor: Pubkey,
    pub seats: u64,
    pub amount: u64,
    pub refunded: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Clone, Copy, PartialEq, Eq, Debug)]
pub enum CampaignStatus {
    Open,
    Activated,
    Refunding,
    FullyRefunded,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum SupplierRole {
    Venue,
    Instructor,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct CampaignTerms {
    pub identifier: u64,
    // Raw SPL base units, not floating-point UI amounts.
    pub seat_price: u64,
    pub required_seats: u64,
    pub deadline: i64,
    pub venue: Pubkey,
    pub instructor: Pubkey,
    pub venue_allocation: u64,
    pub instructor_allocation: u64,
}
