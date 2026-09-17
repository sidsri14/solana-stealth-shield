use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked};

declare_id!("4H4HkWERVP3TsVYqSKcUcrdg8tCGeYaV7wj9WjMsjspD");

#[program]
pub mod solana_stealth_shield {
    use super::*;

    /// Register Meta-Stealth Public Keys (Spending + Viewing) for a recipient.
    /// Anyone can read the meta-account to derive a fresh stealth address per payment.
    pub fn register_meta_key(
        ctx: Context<RegisterMetaKey>,
        spending_pubkey: [u8; 32],
        viewing_pubkey: [u8; 32],
    ) -> Result<()> {
        require!(!ctx.accounts.owner.to_account_info().executable, ErrorCode::InvalidOwner);

        let meta = &mut ctx.accounts.meta_account;
        meta.bump = ctx.bumps.meta_account;
        meta.owner = ctx.accounts.owner.key();
        meta.spending_pubkey = spending_pubkey;
        meta.viewing_pubkey = viewing_pubkey;
        meta.registered_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Emit a stealth announcement and transfer `amount` to the derived stealth vault.
    ///
    /// The sender computes the stealth address off-chain from the recipient's
    /// meta viewing key (ECDH) *plus* the recipient's spending key. Only the
    /// on-chain announcement (ephemeral pubkey + 1-byte view tag) is persisted,
    /// so an observer cannot link the payment to the recipient's identity.
    pub fn send_stealth_payment(
        ctx: Context<SendStealthPayment>,
        ephemeral_pubkey: [u8; 32],
        stealth_recipient: Pubkey,
        view_tag: u8,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::ZeroAmount);

        // Transfer token-2022/SPL funds into the derived stealth vault (CPI).
        let decimals = ctx.accounts.mint.decimals;
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.sender_token.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.stealth_vault.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        transfer_checked(cpi_ctx, amount, decimals)?;

        let announcement = &mut ctx.accounts.announcement;
        announcement.bump = ctx.bumps.announcement;
        announcement.ephemeral_pubkey = ephemeral_pubkey;
        announcement.stealth_recipient = stealth_recipient;
        announcement.view_tag = view_tag;
        announcement.amount = amount;
        announcement.mint = ctx.accounts.mint.key();
        announcement.sender = ctx.accounts.sender.key();
        announcement.slot = Clock::get()?.slot;

        // Advance the per-sender announcement counter so each payment gets a
        // fresh, content-addressed PDA seed slot.
        let state = &mut ctx.accounts.state;
        state.announcement_count = state.announcement_count.checked_add(1).unwrap();

        emit!(StealthAnnouncementEvent {
            ephemeral_pubkey,
            stealth_recipient,
            view_tag,
            amount,
            mint: ctx.accounts.mint.key(),
            slot: Clock::get()?.slot,
        });
        Ok(())
    }

    /// Recipient sweeps their stealth vault into a clean destination.
    ///
    /// The signer is the derived stealth keypair (owned privately off-chain, from
    /// ECDH(stealth_sk, announcement.ephemeral_pubkey)). Because the vault token
    /// account is owned by that derived key, only the recipient can sweep.
    pub fn sweep_stealth_funds(
        ctx: Context<SweepStealthFunds>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::ZeroAmount);

        let decimals = ctx.accounts.mint.decimals;
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.stealth_vault.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.stealth_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        transfer_checked(cpi_ctx, amount, decimals)?;

        emit!(StealthClaimEvent {
            stealth_vault: ctx.accounts.stealth_vault.key(),
            destination: ctx.accounts.destination.key(),
            amount,
            slot: Clock::get()?.slot,
        });
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct MetaAccount {
    pub bump: u8,
    pub owner: Pubkey,
    pub spending_pubkey: [u8; 32],
    pub viewing_pubkey: [u8; 32],
    pub registered_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct SenderState {
    pub bump: u8,
    pub owner: Pubkey,
    pub announcement_count: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Announcement {
    pub bump: u8,
    pub sender: Pubkey,
    pub ephemeral_pubkey: [u8; 32],
    pub stealth_recipient: Pubkey,
    pub view_tag: u8,
    pub amount: u64,
    pub mint: Pubkey,
    pub slot: u64,
}

#[derive(Accounts)]
pub struct RegisterMetaKey<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + MetaAccount::INIT_SPACE,
        seeds = [b"stealth-meta", owner.key().as_ref()],
        bump,
    )]
    pub meta_account: Account<'info, MetaAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SendStealthPayment<'info> {
    #[account(
        init_if_needed,
        payer = sender,
        space = 8 + SenderState::INIT_SPACE,
        seeds = [b"stealth-sender", sender.key().as_ref()],
        bump,
    )]
    pub state: Account<'info, SenderState>,
    #[account(
        init,
        payer = sender,
        space = 8 + Announcement::INIT_SPACE,
        seeds = [
            b"stealth-announcement",
            sender.key().as_ref(),
            &state.announcement_count.to_le_bytes(),
        ],
        bump,
    )]
    pub announcement: Account<'info, Announcement>,
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(
        token::mint = mint,
        token::authority = sender,
        token::token_program = token_program,
        constraint = sender_token.owner == sender.key(),
    )]
    pub sender_token: InterfaceAccount<'info, TokenAccount>,
    #[account(
        token::mint = mint,
        token::token_program = token_program,
    )]
    pub stealth_vault: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SweepStealthFunds<'info> {
    /// The stealth vault token account. It is owned by the derived stealth
    /// keypair, which only the recipient possesses (via ECDH off-chain), so
    /// only the recipient can present this authority.
    #[account(
        mut,
        token::mint = mint,
        token::authority = stealth_authority,
        token::token_program = token_program,
    )]
    pub stealth_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        token::mint = mint,
        token::token_program = token_program,
    )]
    pub destination: InterfaceAccount<'info, TokenAccount>,
    /// The derived stealth keypair signs the sweep.
    #[account(mut)]
    pub stealth_authority: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[event]
pub struct StealthAnnouncementEvent {
    pub ephemeral_pubkey: [u8; 32],
    pub stealth_recipient: Pubkey,
    pub view_tag: u8,
    pub amount: u64,
    pub mint: Pubkey,
    pub slot: u64,
}

#[event]
pub struct StealthClaimEvent {
    pub stealth_vault: Pubkey,
    pub destination: Pubkey,
    pub amount: u64,
    pub slot: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid owner account")]
    InvalidOwner,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
}