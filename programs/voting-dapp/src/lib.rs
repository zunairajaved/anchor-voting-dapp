use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::{invoke};
use anchor_lang::solana_program::system_instruction::{transfer};

declare_id!("2MPX34tvksVP1x9QvNDAw7Z6tupYpzZ4mdG28tZ8aXeC");

#[program]
pub mod voting_dapp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let votes_counter = &mut ctx.accounts.votes_counter;
        votes_counter.team_a = 0;
        votes_counter.team_b = 0;
        msg!("Votes Counter Initialized");
        Ok(())
    }
    pub fn vote(ctx: Context<Vote>, vote: VoteOptions) -> Result<()> {
        let votes_counter = &mut ctx.accounts.votes_counter;
        match vote {
            VoteOptions::TeamA => votes_counter.team_a += 1,
            VoteOptions::TeamB => votes_counter.team_b += 1,
        }
        let user_vote = &mut ctx.accounts.user_vote;
        user_vote.bump = *ctx.bumps.get("user_vote").unwrap();
        user_vote.vote = vote;

        let voting_fee = 2016120; // Fee in lamports
    
    let voting_fee_transfer = transfer(
        &ctx.accounts.user.key(), // From account
        &votes_counter.key(), // To account
        voting_fee, 
    );
    
    // Need to call the system program 
    // to transfer funds from accounts not owned by the program
    invoke(
        &voting_fee_transfer, 
        &[
            ctx.accounts.user.to_account_info(),
            votes_counter.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 32+32+32, // 8 internal + 2 * space(u64)
        seeds = [b"votes_counter".as_ref()],
        bump
    )]
    votes_counter: Account<'info, VotesCounter>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(vote: VoteOptions)]
pub struct Vote<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + 1 + 2, // 8 internal + space(u8) + space(VoteOptions)
        seeds = [b"user_vote".as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_vote: Account<'info, UserVote>,
    #[account(mut)]
    pub votes_counter: Account<'info, VotesCounter>,
    pub system_program: Program <'info, System>,
}


#[account]
pub struct VotesCounter {
    pub team_a: u64,
    pub team_b: u64,
}

#[account]
pub struct UserVote {
    bump: u8,
    vote: VoteOptions
}

// Custom types
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VoteOptions {
    TeamA,
    TeamB,
}
