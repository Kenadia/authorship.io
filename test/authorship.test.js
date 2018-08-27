/**
 * Tests for the Authorship smart contract.
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

contract('Authorship', function(accounts) {

    const owner = accounts[0];
    const user = accounts[1];

    it('should deploy', async () => {
        this.contract = await Authorship.deployed();
    });

    it('should initialize with no claims', async () => {
        const mockHash = 11111;

        const claimCount = await this.contract.claimCount.call();
        assert.equal(claimCount, 0, 'Claim count should initialize to zero.');

        const claim = await this.contract.claims.call(mockHash);
        assert.isFalse(claim[0], 'Looking up a non-existent claim should return a claim with exists=false.');
    });

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
