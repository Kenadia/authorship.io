/**
 * Tests for the Authorship smart contract.
 *
 * Covers contract functionality such as making and verifying claims,
 * as well as failure modes.
 */

const Authorship = artifacts.require('Authorship')

const ALLOWED_MARGIN_EARLY_S = 60 * 5;
const ALLOWED_MARGIN_LATE_S = 30;
const VM_REVERT = 'VM Exception while processing transaction: revert';

/**
 * Helper function for checking whether an error was raised.
 */
async function assertReverts(asyncFunction) {
  let raised = null;
  try {
    await asyncFunction();
  } catch (e) {
    raised = e.message;
  }
  assert.notEqual(raised, null, 'Expected function to raise');
  assert.equal(raised, VM_REVERT, 'Expected VM to revert, got other error');
}

/**
 * The test cases.
 */
contract('Authorship', function(accounts) {

    const owner = accounts[0];
    const user = accounts[1];

    /**
     * Verify the initial state of the contract.
     *
     * The contract state consists of a mapping of claims, and a total claim
     * count. We'd like to check that looking up an arbitrary claim returns
     * a Claim struct with exists=false as expected, and that the total claim
     * count is equal to zero.
     */
    it('should initialize with no claims', async () => {
        this.contract = await Authorship.deployed();
        const mockHash = 11111;

        const claimCount = await this.contract.claimCount.call();
        assert.equal(claimCount, 0, 'Claim count should initialize to zero.');

        const claim = await this.contract.claims.call(mockHash);
        assert.isFalse(claim[0], 'Looking up a non-existent claim should return a claim with exists=false.');
    });

    /**
     * Test that a user can submit a claim to the smart contract.
     *
     * One of the main features of the contract is the ability to submit new
     * claims. A claim consists of an IPFS hash and a timestamp. The address of
     * the sender is included, and a name (arbitrary string) can be included as
     * well.
     */
    it('should make a claim', async () => {
        const mockHash = 11111;
        const unixTimeSeconds = Math.round((new Date()).getTime() / 1000);

        // Watch for an event to be emitted.
        var eventArgs = null;
        await this.contract.Claimed().watch((err, res) => {
            eventArgs = res.args;
        });

        await contract.makeClaim(
            mockHash, unixTimeSeconds, 'User name.', {from: user});

        // Check that an event was emitted.
        assert.notEqual(eventArgs, null, 'Making a claim should emit a Claimed event.');
        assert.equal(eventArgs.fileHash.toNumber(), mockHash, 'Emitted event should include the file hash.');
        assert.equal(eventArgs.timestamp, unixTimeSeconds, 'Emitted event should include the user-submitted timestamp.');
        assert.equal(eventArgs.submitter, user, 'Emitted event should include the submitter address.');
        assert.equal(eventArgs.name, 'User name.', 'Emitted event should include the user-submitted name.');

        // Check that the contract state is updated as expected.
        const claimCount = await this.contract.claimCount.call();
        assert.equal(claimCount, 1, 'Making a claim should increment the claim count in contract state.');
        const claim = await this.contract.claims.call(mockHash);
        assert.isTrue(claim[0], 'Making a claim should add a claim to the contract state.');

        // Save the timestamp for use in a later test case.
        this.timestamp1 = unixTimeSeconds;
    });

    /**
     * Test that no file can be claimed twice.
     *
     * The smart contract is designed so that at most one claim can exists for
     * any file. The first claim that is made will be the only one allowed.
     *
     * This design decision may be revisited later.
     */
    it('should reject claims on a file which is already claimed', async () => {
        const mockHash = 11111;
        const unixTimeSeconds = Math.round((new Date()).getTime() / 1000);

        await assertReverts(async () => {
            await contract.makeClaim(
                mockHash, unixTimeSeconds, 'New name.', {from: user});
        });

        const claimCount = await this.contract.claimCount.call();
        assert.equal(claimCount, 1, 'When a claim fails the claim count should remain unchanged.');
    });

    /**
     * Test that invalid timestamps are rejected.
     *
     * When creating a claim, the smart contract uses a timestamp supplied by
     * the user. This simplifies things a bit for the user and client web app
     * since the timestamp that will be used in the claim is known at the time
     * that the transaction is first created.
     *
     * We have to verify that the user-supplied timestamp is very close to the
     * miner's timestamp, to prevent the user from submitting entirely false
     * timestamps.
     *
     * In the future the smart contract may use the miner's timestamp, which
     * will help us to avoid any issues if a transaction takes a long time to be
     * accepted.
     */
    it('should reject claims with invalid timestamps', async () => {
        const mockHash = 22222;
        const unixTimeSeconds = Math.round((new Date()).getTime() / 1000);
        const tooEarlyTimestamp = unixTimeSeconds - ALLOWED_MARGIN_EARLY_S - 1;
        const tooLateTimestamp = unixTimeSeconds + ALLOWED_MARGIN_LATE_S + 10;

        await assertReverts(async () => {
            await contract.makeClaim(
                mockHash, tooEarlyTimestamp, 'User name.', {from: user});
        });

        await assertReverts(async () => {
            await contract.makeClaim(
                mockHash, tooLateTimestamp, 'User name.', {from: user});
        });

        const claimCount = await this.contract.claimCount.call();
        assert.equal(claimCount, 1, 'When a claim fails the claim count should remain unchanged.');

        // Check that this does not revert.
        await contract.makeClaim(
            mockHash, unixTimeSeconds, 'User name.', {from: user});

        // Save the timestamp for use in a later test case.
        this.timestamp2 = unixTimeSeconds;
    });

    /**
     * Test that a user can submit an existing claim for verification.
     *
     * Trusted digital timestamps are useful to more people if they can be
     * displayed publicly and easily verified. We provide a public function
     * which verifies an existing claim. All parameters must match exactly.
     */
    it('should verify claims', async () => {
        const mockHash1 = 11111;
        const mockHash2 = 22222;

        var isValid = await this.contract.verifyClaim.call(
            mockHash1, this.timestamp1, user, 'User name.');
        assert.isTrue(isValid, 'Valid claims should pass verification.');

        isValid = await this.contract.verifyClaim.call(
            mockHash2, this.timestamp2, user, 'User name.');
        assert.isTrue(isValid, 'Valid claims should pass verification.');

        isValid = await this.contract.verifyClaim.call(
            mockHash1 + 1, this.timestamp1, user, 'User name.');
        assert.isFalse(isValid, 'If the hash is different, a claim should fail verification.');

        isValid = await this.contract.verifyClaim.call(
            mockHash1, this.timestamp1 + 1, user, 'User name.');
        assert.isFalse(isValid, 'If the timestamp is different, a claim should fail verification.');

        isValid = await this.contract.verifyClaim.call(
            mockHash1, this.timestamp1, owner, 'User name.');
        assert.isFalse(isValid, 'If the address is different, a claim should fail verification.');

        isValid = await this.contract.verifyClaim.call(
            mockHash1, this.timestamp1, user, 'Other name.');
        assert.isFalse(isValid, 'If the name is different, a claim should fail verification.');
    });
});
