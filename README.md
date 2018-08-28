# authorship.io

*Blockchain-backed timestamping for everyone.*

The contract is currently deployed on the Rinkeby test network at address
[0x384EFB3277b51b3453d0172D0dCb9128a55DDd43](https://rinkeby.etherscan.io/address/0x384efb3277b51b3453d0172d0dcb9128a55ddd43).

You can interact with the contract using the web app at [authorship.io](https://authorship.io).

This project was created as part of the ConsenSys Academy 2018 Developer
Program.

## Introduction

This project aims to provide a simple and accessible implementation of
decentralized
[trusted timestamping](https://en.wikipedia.org/wiki/Trusted_timestamping)
using an Ethereum smart contract.

The main features of the contract are:
* Submit a new claim. A claim consists of an IPFS hash and a timestamp.
The address of the sender is included, and a name (arbitrary string) can be
included as well.
* Verify an existing claim. All parameters of the claim must be submitted and
must match exactly in order to pass verification.

This allows content owners to easily post claims to the existence of digital
content at a certain point in time. If these claims can be easily verified, then
it lends credibility to the content owners' claims.

## Development

Initial setup:

```bash
PATH=$PATH:node_modules/.bin
npm install
```

Start a local blockchain instance by running `ganache-cli` in a tab.
With Ganache running, compile and deploy the Authorship contract with
`trufle compile && truffle migrate`.
Run tests using `truffle test`.

With the contract deployed, you can run the development server for the web app
using `npm start` and visit the app at [http://localhost:3000](http://localhost:3000).

## See Also

* OpenTimestamps: [opentimestamps.org](https://opentimestamps.org/)
* Proof of Existence: [poex.io](https://poex.io/)
