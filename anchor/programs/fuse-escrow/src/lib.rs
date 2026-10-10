use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

pub mod errors;
pub mod state;
use errors::EscrowError;
use state::*;

// Public local-VM identifier only. No deployment or private key is implied.
declare_id!("25GSneHPbwgwoUNjjcGQ4RoJzJsxETMtZUHNhXWYTf7G");

#[program]
pub mod fuse_escrow {
    use super::*;

    pub fn create_campaign(ctx: Context<CreateCampaign>, terms: CampaignTerms) -> Result<()> {
        require!(
            terms.seat_price > 0 && terms.required_seats > 0,
            EscrowError::InvalidAmount
        );
        require!(
            terms.venue_allocation > 0 && terms.instructor_allocation > 0,
            EscrowError::InvalidAmount
        );
        require!(
            terms.deadline > Clock::get()?.unix_timestamp,
            EscrowError::InvalidDeadline
        );
        require!(
            terms.venue != Pubkey::default()
                && terms.instructor != Pubkey::default()
                && terms.venue != terms.instructor,
            EscrowError::InvalidSupplier
        );
        let target_amount = terms
            .seat_price
            .checked_mul(terms.required_seats)
            .ok_or(EscrowError::ArithmeticOverflow)?;
        let allocations = terms
            .venue_allocation
            .checked_add(terms.instructor_allocation)
            .ok_or(EscrowError::ArithmeticOverflow)?;
        require!(
            allocations == target_amount,
            EscrowError::InvalidAllocations
        );
        require!(
            ctx.accounts.mint.freeze_authority.is_none(),
            EscrowError::FreezableMint
        );

        ctx.accounts.campaign.set_inner(Campaign {
            organizer: ctx.accounts.organizer.key(),
            identifier: terms.identifier,
            mint: ctx.accounts.mint.key(),
            seat_price: terms.seat_price,
            required_seats: terms.required_seats,
            target_amount,
            deadline: terms.deadline,
            venue: terms.venue,
            instructor: terms.instructor,
            venue_allocation: terms.venue_allocation,
            instructor_allocation: terms.instructor_allocation,
            bump: ctx.bumps.campaign,
            vault_bump: ctx.bumps.vault,
            venue_approved: false,
            instructor_approved: false,
            funded_seats: 0,
            escrowed_amount: 0,
            status: CampaignStatus::Open,
        });
        Ok(())
    }

    pub fn approve_supplier(ctx: Context<ApproveSupplier>, role: SupplierRole) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        require_open(campaign)?;
        match role {
            SupplierRole::Venue => {
                require_keys_eq!(
                    ctx.accounts.supplier.key(),
                    campaign.venue,
                    EscrowError::UnauthorizedSupplier
                );
                require!(!campaign.venue_approved, EscrowError::AlreadyApproved);
                campaign.venue_approved = true;
            }
            SupplierRole::Instructor => {
                require_keys_eq!(
                    ctx.accounts.supplier.key(),
                    campaign.instructor,
                    EscrowError::UnauthorizedSupplier
                );
                require!(!campaign.instructor_approved, EscrowError::AlreadyApproved);
                campaign.instructor_approved = true;
            }
        }
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, seats: u64) -> Result<()> {
        let campaign = &ctx.accounts.campaign;
        require_open(campaign)?;
        require!(seats > 0, EscrowError::InvalidAmount);
        let funded_seats = campaign
            .funded_seats
            .checked_add(seats)
            .ok_or(EscrowError::ArithmeticOverflow)?;
        require!(
            funded_seats <= campaign.required_seats,
            EscrowError::Overfunding
        );
        let amount = seats
            .checked_mul(campaign.seat_price)
            .ok_or(EscrowError::ArithmeticOverflow)?;
        let escrowed_amount = campaign
            .escrowed_amount
            .checked_add(amount)
            .ok_or(EscrowError::ArithmeticOverflow)?;
        let contribution = &ctx.accounts.contribution;
        require!(!contribution.refunded, EscrowError::AlreadyRefunded);
        if contribution.amount != 0 {
            require_keys_eq!(
                contribution.campaign,
                campaign.key(),
                EscrowError::InvalidContribution
            );
            require_keys_eq!(
                contribution.contributor,
                ctx.accounts.contributor.key(),
                EscrowError::InvalidContribution
            );
        }
        let own_seats = contribution
            .seats
            .checked_add(seats)
            .ok_or(EscrowError::ArithmeticOverflow)?;
        let own_amount = contribution
            .amount
            .checked_add(amount)
            .ok_or(EscrowError::ArithmeticOverflow)?;
        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.source.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.contributor.to_account_info(),
                },
            ),
            amount,
            ctx.accounts.mint.decimals,
        )?;

        ctx.accounts.contribution.set_inner(Contribution {
            campaign: campaign.key(),
            contributor: ctx.accounts.contributor.key(),
            seats: own_seats,
            amount: own_amount,
            refunded: false,
            bump: ctx.bumps.contribution,
        });
        ctx.accounts.campaign.funded_seats = funded_seats;
        ctx.accounts.campaign.escrowed_amount = escrowed_amount;
        Ok(())
    }

    pub fn activate(ctx: Context<Activate>) -> Result<()> {
        let campaign = &ctx.accounts.campaign;
        require_open(campaign)?;
        require!(
            campaign.funded_seats == campaign.required_seats
                && campaign.escrowed_amount == campaign.target_amount,
            EscrowError::NotFullyFunded
        );
        require!(
            campaign.venue_approved && campaign.instructor_approved,
            EscrowError::MissingApproval
        );
        require!(
            ctx.accounts.vault.amount >= campaign.target_amount,
            EscrowError::InsufficientEscrow
        );
        let identifier = campaign.identifier.to_le_bytes();
        let bump = [campaign.bump];
        let seeds: &[&[u8]] = &[
            CAMPAIGN_SEED,
            campaign.organizer.as_ref(),
            &identifier,
            &bump,
        ];
        let signer = &[seeds];

        // Both CPIs and the final state write are one Solana transaction. Any
        // failure rolls back ALL transfers; no partially paid activation persists.
        token::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.venue_token.to_account_info(),
                    authority: campaign.to_account_info(),
                },
                signer,
            ),
            campaign.venue_allocation,
            ctx.accounts.mint.decimals,
        )?;
        token::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.instructor_token.to_account_info(),
                    authority: campaign.to_account_info(),
                },
                signer,
            ),
            campaign.instructor_allocation,
            ctx.accounts.mint.decimals,
        )?;
        ctx.accounts.campaign.status = CampaignStatus::Activated;
        ctx.accounts.campaign.escrowed_amount = 0;
        Ok(())
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let campaign = &ctx.accounts.campaign;
        require!(
            campaign.status != CampaignStatus::Activated,
            EscrowError::CampaignTerminal
        );
        require!(
            Clock::get()?.unix_timestamp >= campaign.deadline,
            EscrowError::RefundNotAvailable
        );
        let contribution = &ctx.accounts.contribution;
        require!(
            !contribution.refunded && contribution.amount > 0,
            EscrowError::AlreadyRefunded
        );
        let amount = contribution.amount;
        let remaining_amount = campaign
            .escrowed_amount
            .checked_sub(amount)
            .ok_or(EscrowError::ArithmeticOverflow)?;
        let remaining_seats = campaign
            .funded_seats
            .checked_sub(contribution.seats)
            .ok_or(EscrowError::ArithmeticOverflow)?;
        require!(
            ctx.accounts.vault.amount >= amount,
            EscrowError::InsufficientEscrow
        );
        let identifier = campaign.identifier.to_le_bytes();
        let bump = [campaign.bump];
        let seeds: &[&[u8]] = &[
            CAMPAIGN_SEED,
            campaign.organizer.as_ref(),
            &identifier,
            &bump,
        ];
        token::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: campaign.to_account_info(),
                },
                &[seeds],
            ),
            amount,
            ctx.accounts.mint.decimals,
        )?;
        ctx.accounts.contribution.refunded = true;
        ctx.accounts.campaign.escrowed_amount = remaining_amount;
        ctx.accounts.campaign.funded_seats = remaining_seats;
        ctx.accounts.campaign.status = if remaining_amount == 0 {
            CampaignStatus::FullyRefunded
        } else {
            CampaignStatus::Refunding
        };
        Ok(())
    }
}

fn require_open(campaign: &Campaign) -> Result<()> {
    require!(
        campaign.status == CampaignStatus::Open,
        EscrowError::CampaignTerminal
    );
    require!(
        Clock::get()?.unix_timestamp < campaign.deadline,
        EscrowError::DeadlinePassed
    );
    Ok(())
}

#[derive(Accounts)]
#[instruction(terms: CampaignTerms)]
pub struct CreateCampaign<'info> {
    #[account(mut)]
    pub organizer: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(init, payer = organizer, space = 8 + Campaign::INIT_SPACE,
        seeds = [CAMPAIGN_SEED, organizer.key().as_ref(), &terms.identifier.to_le_bytes()], bump)]
    pub campaign: Account<'info, Campaign>,
    #[account(init, payer = organizer, seeds = [VAULT_SEED, campaign.key().as_ref()], bump,
        token::mint = mint, token::authority = campaign)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveSupplier<'info> {
    pub supplier: Signer<'info>,
    #[account(mut, seeds = [CAMPAIGN_SEED, campaign.organizer.as_ref(), &campaign.identifier.to_le_bytes()], bump = campaign.bump)]
    pub campaign: Account<'info, Campaign>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub contributor: Signer<'info>,
    #[account(mut, has_one = mint, seeds = [CAMPAIGN_SEED, campaign.organizer.as_ref(), &campaign.identifier.to_le_bytes()], bump = campaign.bump)]
    pub campaign: Account<'info, Campaign>,
    pub mint: Account<'info, Mint>,
    #[account(mut, seeds = [VAULT_SEED, campaign.key().as_ref()], bump = campaign.vault_bump,
        token::mint = mint, token::authority = campaign)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = contributor,
        constraint = source.key() != vault.key() @ EscrowError::InvalidRecipient)]
    pub source: Account<'info, TokenAccount>,
    // Safe reuse: one PDA per campaign + signer; no account-close/reset instruction.
    #[account(init_if_needed, payer = contributor, space = 8 + Contribution::INIT_SPACE,
        seeds = [CONTRIBUTION_SEED, campaign.key().as_ref(), contributor.key().as_ref()], bump)]
    pub contribution: Account<'info, Contribution>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Activate<'info> {
    pub caller: Signer<'info>,
    #[account(mut, has_one = mint, seeds = [CAMPAIGN_SEED, campaign.organizer.as_ref(), &campaign.identifier.to_le_bytes()], bump = campaign.bump)]
    pub campaign: Account<'info, Campaign>,
    pub mint: Account<'info, Mint>,
    #[account(mut, seeds = [VAULT_SEED, campaign.key().as_ref()], bump = campaign.vault_bump,
        token::mint = mint, token::authority = campaign)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = campaign.venue,
        constraint = venue_token.key() != vault.key() @ EscrowError::InvalidRecipient)]
    pub venue_token: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = campaign.instructor,
        constraint = instructor_token.key() != vault.key() && instructor_token.key() != venue_token.key() @ EscrowError::InvalidRecipient)]
    pub instructor_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    pub contributor: Signer<'info>,
    #[account(mut, has_one = mint, seeds = [CAMPAIGN_SEED, campaign.organizer.as_ref(), &campaign.identifier.to_le_bytes()], bump = campaign.bump)]
    pub campaign: Account<'info, Campaign>,
    pub mint: Account<'info, Mint>,
    #[account(mut, seeds = [VAULT_SEED, campaign.key().as_ref()], bump = campaign.vault_bump,
        token::mint = mint, token::authority = campaign)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, has_one = campaign, has_one = contributor,
        seeds = [CONTRIBUTION_SEED, campaign.key().as_ref(), contributor.key().as_ref()], bump = contribution.bump)]
    pub contribution: Account<'info, Contribution>,
    #[account(mut, token::mint = mint, token::authority = contributor,
        constraint = destination.key() != vault.key() @ EscrowError::InvalidRecipient)]
    pub destination: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
