# Avoiding Common Attacks

## Timestamp Vulnerability

Smart contract code does not have access to accurate timestamps. Timestamps can
be influenced by miners, and the only thing that is guaranteed by the protocol
about the timestamp of a given block is that it will be greater than the
timestamp of the previous block.

On the other hand, miners need to keep fairly accurate time, or else their
blocks will not be accepted by other peers in the network. See
[here](https://ethereum.stackexchange.com/questions/5924/how-do-ethereum-mining-nodes-maintain-a-time-consistent-with-the-network/5931#5931)
for some discussion.

For our timestamping implementation, a small amount of inaccuracy is expected
and tolerated. It is important to communicate the limitations of the service and
extend of the guarantees to users. In the future we will keep the timestamps
more accurate by using the miner's timestamp rather than user-submitted
timestamps.

## Integer Arithmetic Overflow

There are around [20 different cases](https://github.com/ethereum/solidity/issues/796#issuecomment-253578925)
of overflow and underflow that can occur in integer arithmetic in smart
contracts. In some cases these can be exploited by a malicious user to cause
unintended behavior or state changes.

In the Authorship smart contract I have carefully evaluated all instances of
arithmetic operations to ensure that overflow does not occur, or does not cause
any unintended effects when it does occur.

## Poison Data

“Poison data” refers to the risks associated with accepting and acting on user
input. In the case of the Authorship contract, the user may make up and submit
any file hash, timestamp, and name string that they want.

Since hash collisions are exceedingly rare, we're not concerned with users
submitting fake hashes. They can do so at their own expense.

In the current implementation, the timestamp submitted by the user is validated
to ensure it does not differ from the miner's timestamp by more than five
minutes. This leeway is provided since transactions can take a few minutes to be
mined. In a future implementation, the miner's timestamp will be used instead.

The string submitted by the user can have arbitrary length. However, all the
functions that view that string are marked as `view` functions, meaning they do
not cost gas. The costs of longs strings are therefore borne only when creating
them.

## Recursive and External Calls

Recursive calls with a contract and external function calls to other contracts
can be a source of vulnerabilities such as reentrancy attacks, if a smart
contract developer is not careful.

In the Authorship smart contract we have minimized the complexity of the
on-chain code and don't have a need for recursive or external function calls.

## Unit Tests

Truffle provides a unit testing framework to help catch logic bugs and
regressions. I've written tests for the Authorship smart contract as a way to
help prevent subtle bugs or edge case errors as the smart contract continues
to be developed.
