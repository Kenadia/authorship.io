pragma solidity ^0.4.21;

/**
 * A simple implementation of digital timestamping.
 */
contract Authorship {

    struct Claim {
        bool exists;
        uint timestamp;
        string name;
    }

    mapping (uint => Claim) public claims;
    uint public claimCount;

    // Allow the user-submitted timestamp to be up to 5 minutes in the past.
    // This makes things easier for now. In the future, we should create claims
    // using the miner-submitted timestamp.
    uint ALLOWED_MARGIN_EARLY_S = 60 * 5;

    // Allow the user-submitted timestamp to be up to 30 seconds in the future.
    // This roughly corresponds to Consensys' guidelines.
    // https://consensys.github.io/smart-contract-best-practices/recommendations/#timestamp-dependence
    uint ALLOWED_MARGIN_LATE_S = 30;

    event Claimed(
        uint indexed fileHash, uint indexed timestamp, string indexed name);

    /**
     * Submit a claim for a new file.
     */
    function makeClaim(uint _fileHash, uint _timestamp, string _name) external {
        // Require the timestamp to be accurate (within some threshold).
        require(validTimestamp(_timestamp));

        // Design decision: Allow a file to be claimed only once.
        Claim storage previousClaim = claims[_fileHash];
        require(!previousClaim.exists);

        // Save the claim and emit an event.
        //
        // Design decision: Use the user-submitted timestamp. This simplifies
        // things for now.
        claims[_fileHash] = Claim(true, _timestamp, _name);
        claimCount++;
        emit Claimed(_fileHash, _timestamp, _name);
    }

    function makeClaim(uint _fileHash, uint _timestamp) external {
        this.makeClaim(_fileHash, _timestamp, "");
    }

    /**
     * Check that a claim exists. Must be an exact match.
     */
    function verifyClaim(uint _fileHash, uint _timestamp, string _name)
    public view
    returns(bool) {
        Claim storage claim = claims[_fileHash];
        return (
            claim.exists && claim.timestamp == _timestamp &&
            stringsEqual(claim.name, _name));
    }

    function validTimestamp(uint _userTimestamp) private view returns(bool) {
        // Calculate the offset relative to the miner's timestamp.
        uint minerTimestamp = block.timestamp;

        // Check that the offset is within the allowed margins.
        // Be wary of integer overflow.
        if (_userTimestamp > minerTimestamp) {
            return _userTimestamp - minerTimestamp <= ALLOWED_MARGIN_LATE_S;
        } else {
            return minerTimestamp - _userTimestamp <= ALLOWED_MARGIN_EARLY_S;
        }
    }

    /**
     * Compare a string in storage with a string in memory.
     *
     * Thanks to dave123124, https://forum.ethereum.org/discussion/3238/string-compare-in-solidity
     **/
    function stringsEqual(string storage _a, string memory _b)
    internal view
    returns (bool) {
        bytes storage a = bytes(_a);
        bytes memory b = bytes(_b);
        if (a.length != b.length) {
            return false;
        }
        for (uint i = 0; i < a.length; i++) {
            if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
    }
}
