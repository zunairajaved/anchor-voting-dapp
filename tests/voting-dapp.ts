import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {PublicKey, SendTransactionError, LAMPORTS_PER_SOL} from '@solana/web3.js';
import { VotingDapp } from "../target/types/voting_dapp";
import * as assert from "assert";
import {expect, use} from "chai";
const idl =require( '../target/idl/voting_dapp.json');
const {SystemProgram} = anchor.web3;
const VOTING_FEE = 2016120;
describe("voting-dapp", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.VotingDapp as Program<VotingDapp>;
  const {user: base_user, program: base_program, provider: base_provider} = getNewProgramInteraction();
    let votes_counter_initial_balance = null;
    function getNewProgramInteraction(): { user: anchor.web3.Keypair, program: Program<VotingDapp>, provider: anchor.Provider } {
      /**
       * Creates a new user and instantiates the program on behalf of the user.
       * Returns the needed variables to interact with the solana program.
       * */
      const user = anchor.web3.Keypair.generate();
      // Configure the client to use the local cluster and our newly created user
      const provider = new anchor.AnchorProvider(anchor.AnchorProvider.local().connection, new anchor.Wallet(user), {});
      const program = new anchor.Program(idl as anchor.Idl, anchor.web3.SystemProgram.programId, provider) as Program<VotingDapp>
      return {user: user, program: program, provider: provider};
  }

  async function addFunds(user: anchor.web3.Keypair, amount: number) {
      /**
       * Adds funds to the given user's account.
       * */
      const airdrop_tx = await base_provider.connection.requestAirdrop(user.publicKey, amount)
      await base_provider.connection.confirmTransaction(airdrop_tx);
  }
  it("Base user: Initialize OK - counter with 0 votes for team A and team B", async () => {
    // Need to add funds to the user to pay for transaction fees.
    // Added more SOL than needed to make sure base_user never runs out of funds.
    await addFunds(base_user, LAMPORTS_PER_SOL * 100);
    const [votesCounterPDA, _bumpVotesCounter] = await PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode("votes_counter"),
            ],
            base_program.programId
        );
    const tx =await program.rpc.initialize({
      accounts : {
        user: base_user.publicKey,
        votesCounter: 0,
        systemProgram: SystemProgram.programId,
    },
    signers : [base_user],
    });
    console.log("some",tx);
    // const keys = await tx.pubkeys();
    // console.log("keys",keys);
    // await tx.rpc();
    // const votesCounterAccount = await base_program.account.votesCounter.fetch(keys.votesCounter)
    // assert.equal(votesCounterAccount.teamA.toString(), '0')
    // assert.equal(votesCounterAccount.teamB.toString(), '0')
    // votes_counter_initial_balance = await base_provider.connection.getBalance(keys.votesCounter)
});
// it("Base user: Vote OK - votes for teamB and pays voting service fee", async () => {
//   const [votesCounterPDA, _bumpVotesCounter] = await PublicKey.findProgramAddress(
//       [
//           anchor.utils.bytes.utf8.encode("votes_counter"),
//       ],
//       base_program.programId
//   );
//   let votesCounterAccount = await base_program.account.votesCounter.fetch(votesCounterPDA)
//   assert.equal(votesCounterAccount.teamA.toString(), '0')
//   assert.equal(votesCounterAccount.teamB.toString(), '0')
//   const tx = base_program.methods.vote({teamB: {}}).accounts({
//       user: base_user.publicKey,
//       systemProgram: SystemProgram.programId,
//       votesCounter: votesCounterPDA
//   })
//   const keys = await tx.pubkeys()
//   await tx.rpc();
//   votesCounterAccount = await base_program.account.votesCounter.fetch(votesCounterPDA)
//   assert.equal(votesCounterAccount.teamA.toString(), '0')
//   assert.equal(votesCounterAccount.teamB.toString(), '1')
//   const userVoteAccount = await base_program.account.userVote.fetch(keys.userVote)
//   assert.deepEqual(userVoteAccount.vote, {teamB: {}})
//   const updated_balance = await base_provider.connection.getBalance(keys.votesCounter)
//   // First valid vote, paid voting service fee to the votes counter account
//   const expected_balance = votes_counter_initial_balance + VOTING_FEE
//   assert.equal(updated_balance, expected_balance)
// });
// it("New user: Vote OK - votes for doors and pays voting service fee", async () => {
//   const {user, program, provider} = getNewProgramInteraction();
//   await addFunds(user, 2 * VOTING_FEE);
//   const [votesCounterPDA, _bumpVotesCounter] = await PublicKey.findProgramAddress(
//       [
//           anchor.utils.bytes.utf8.encode("votes_counter"),
//       ],
//       program.programId
//   );
//   let votesCounterAccount = await program.account.votesCounter.fetch(votesCounterPDA)
//   assert.equal(votesCounterAccount.teamA.toString(), '0')
//   assert.equal(votesCounterAccount.teamB.toString(), '1')
//   const tx = program.methods.vote({doors: {}}).accounts({
//       user: user.publicKey,
//       systemProgram: SystemProgram.programId,
//       votesCounter: votesCounterPDA
//   })
//   const keys = await tx.pubkeys()
//   await tx.rpc();
//   votesCounterAccount = await program.account.votesCounter.fetch(votesCounterPDA)
//   assert.equal(votesCounterAccount.teamA.toString(), '1')
//   assert.equal(votesCounterAccount.teamB.toString(), '1')
//   const userVoteAccount = await program.account.userVote.fetch(keys.userVote)
//   assert.deepEqual(userVoteAccount.vote, {doors: {}})
//   const updated_balance = await provider.connection.getBalance(keys.votesCounter)
//   // Second valid vote, paid voting service fee to the votes counter account
//   const expected_balance = votes_counter_initial_balance + 2 * VOTING_FEE
//   assert.equal(updated_balance, expected_balance)
// });
// it("Base user: Vote ERROR - Fails to vote again", async () => {
//   const [votesCounterPDA, _bumpVotesCounter] = await PublicKey.findProgramAddress(
//       [
//           anchor.utils.bytes.utf8.encode("votes_counter"),
//       ],
//       base_program.programId
//   );
//   try {
//       const tx = await base_program.methods.vote({wheels: {}}).accounts({
//           user: base_user.publicKey,
//           votesCounter: votesCounterPDA,
//           systemProgram: SystemProgram.programId,
//       }).rpc();
//       assert.ok(false, "This code should have failed");
//   } catch (err) {
//       expect(err).to.be.instanceof(SendTransactionError)
//   }

// });

});
