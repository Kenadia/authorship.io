pragma solidity ^0.4.21;

/**
 * @title Simple implementation of decentralized trusted timestamping.
 * @author Ken Schiller
 */
contract Authorship {

    struct Claim {
        bool exists;
        uint timestamp;
        address submitter;
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

    /**
     * @dev Emitted when a new claim is made.
     */
    event Claimed(
        uint indexed fileHash, uint indexed timestamp,
        address indexed submitter, string name);

    /**
     * @dev Submit a claim for a new file.
     * @param _fileHash IPFS hash of the file.
     * @param _timestamp Unix Epoch time in seconds.
     * @param _name An optional name associated with the claim.
     *
     * A claim consists of an IPFS hash and a timestamp. The address of the
     * sender is included, and a name (arbitrary string) can be included as
     * well.
     *
     * The smart contract is designed so that at most one claim can exists for
     * any file. The first claim that is made will be the only one allowed.
     * This design decision may be revisited later.
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
        claims[_fileHash] = Claim(true, _timestamp, msg.sender, _name);
        claimCount++;
        emit Claimed(_fileHash, _timestamp, msg.sender, _name);
    }

    /**
     * @dev Submit information about an existing claim for verification.
     * @param _fileHash IPFS hash of the file.
     * @param _timestamp Unix Epoch time in seconds.
     * @param _address Address of the claim creator.
     * @param _name Name associated with the claim.
     * @return isValid Boolean indicating whether the claim is valid.
     *
     * Trusted digital timestamps are useful to more people if they can be
     * displayed publicly and easily verified. We provide a public function
     * which verifies an existing claim. All parameters must match exactly.
     */
    function verifyClaim(
        uint _fileHash, uint _timestamp, address _address, string _name)
    public view
    returns(bool) {
        Claim storage claim = claims[_fileHash];
        return (
            claim.exists && claim.timestamp == _timestamp &&
            claim.submitter == _address && stringsEqual(claim.name, _name));
    }

    /**
     * @dev Determine whether a user-submitted timestamp is within the
     *   accepted bounds.
     * @param _userTimestamp Unix Epoch time in seconds.
     * @return isValid Boolean indicating whether the timestamp is valid.
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
     * @dev Compare a string in storage with a string in memory.
     * @param _a A string in storage.
     * @param _b A string in memory.
     * @return areEqual Boolean indicating whether the two strings are equal.
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
