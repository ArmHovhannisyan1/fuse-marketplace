use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Seat price, seat target, quantity, and both allocations must be positive")]
    InvalidAmount,
    #[msg("The deadline must be strictly in the future")]
    InvalidDeadline,
    #[msg("Checked arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Supplier allocations must equal the exact funding target")]
    InvalidAllocations,
    #[msg("Suppliers must be distinct, nonzero signing public keys")]
    InvalidSupplier,
    #[msg("Only the designated supplier may approve this role")]
    UnauthorizedSupplier,
    #[msg("This supplier has already approved")]
    AlreadyApproved,
    #[msg("The campaign is terminal and cannot accept this action")]
    CampaignTerminal,
    #[msg("The activation deadline has passed")]
    DeadlinePassed,
    #[msg("The campaign is not fully funded")]
    NotFullyFunded,
    #[msg("Both designated suppliers must approve")]
    MissingApproval,
    #[msg("The requested seats exceed the remaining capacity")]
    Overfunding,
    #[msg("The token vault does not cover the recorded deposits")]
    InsufficientEscrow,
    #[msg("Deposits cannot be refunded before expiry")]
    RefundNotAvailable,
    #[msg("This contribution has already been refunded or has no deposit")]
    AlreadyRefunded,
    #[msg("This contribution belongs to another campaign or signer")]
    InvalidContribution,
    #[msg("The recipient must be a separate supplier-owned token account")]
    InvalidRecipient,
    #[msg("Freeze-authority mints are excluded from this proof of concept")]
    FreezableMint,
}
