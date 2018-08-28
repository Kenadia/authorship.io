# Design Pattern Decisions

## Used Patterns

### Fail Early, Fail Loud

A basic design pattern in Solidity smart contracts is to fail out of function
calls as soon as any required condition is violated. This helps us to limit the
ways in which the state of a smart contract can change.

I've applied this pattern through the use of `require` calls, near the beginning
of functions where appropriate.

## Unused Patterns

### Circuit Breakers / Emergency Stop

Smart contract code is immutable and upgrades are not generally possible,
except when upgrade mechanism are carefully implemented. For more complex smart
contracts it is very difficult to anticipate all possible vulnerabilities
beforehand.

The circuit breaker design pattern can be an important tool for limiting loss
in a worse case scenario. This could be used to prevent actions from being
taken after a bug is discovered, or to wind down a contract and return funds to
users.

For the Authorship contract, I decided not to implement the circuit breaker
design pattern. One reason is that the operation of the contract is very simple,
and it does not handle user funds, so the potential for damage is limited.
Furthermore, implementing an emergency stop would entail a centralization of
control, potentially giving the contract owner to nullify claims. This would
make the service much less valuable to users, who expect that submitted claims
will be valid for all time.

### Restricting Access

Visibility keywords and custom modifiers can be used to restrict access to
functions to certain addresses.

I did not implement this functionality since all features of the Authorship
contract are intended to be available to all users. There are no owner-specific
features.

### Auto Deprecation / Mortal

The auto deprecation and “mortal” design patterns can be used to create smart
contracts with a limited lifetime.

As discussed above, if the claims stored in the Authorship contract are at risk
of being nullified, it makes the contract much less useful. Therefore, the
auto deprecation and mortal design patterns were not implemented.

### Pull Over Push Payments

Requiring users to trigger payouts themselves (“pulling”) can help to avoid
certain [known attacks](https://consensys.github.io/smart-contract-best-practices/known_attacks/).

The Authorship contract does not take payments, so this design pattern was not
relevant.
