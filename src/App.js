import React, { Component } from 'react'
import TruffleContract from 'truffle-contract'
import AuthorshipContract from '../build/contracts/Authorship.json'
import getWeb3 from './utils/getWeb3'
import { ipfsHash, ipfsHashToUint } from './utils/ipfsHash'
import { Clock, getUnixTimestamp, timestampToString } from './Clock'

import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      claimCount: null,
      contract: null,
      localWeb3: null,
      userAddress: null,
      web3: null,
      wrongNetwork: false,

      // Form fields.
      verifyFormFileHash: '',
      verifyFormTimestamp: '',
      verifyFormAddress: '',
      verifyFormName: '',
      submitFormFileHash: '',
      submitFormName: '',

      // Tasks.
      submitInProgress: false,
      submitError: false,
      submitResult: null,
      verifyInProgress: false,
      verifyHasError: false,
      verifyResult: null,
      lookUpInProgress: false,
      lookUpHasError: false,
      lookUpResult: null,
    }

    this.updateVerifyFileHash = this.updateVerifyFileHash.bind(this)
    this.updateVerifyTimestamp = this.updateVerifyTimestamp.bind(this)
    this.updateVerifyAddress = this.updateVerifyAddress.bind(this)
    this.updateVerifyName = this.updateVerifyName.bind(this)
    this.updateSubmitFileHash = this.updateSubmitFileHash.bind(this)
    this.updateSubmitName = this.updateSubmitName.bind(this)
    this.calculateSubmitFormFileHash =
        this.calculateSubmitFormFileHash.bind(this)
    this.calculateVerifyFormFileHash =
        this.calculateVerifyFormFileHash.bind(this)
    this.submit = this.submit.bind(this)
    this.verify = this.verify.bind(this)
    this.lookUp = this.lookUp.bind(this)
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      this.setState({ web3: results.web3, localWeb3: results.local })

      // In production, display an error if the selected network is not Rinkeby.
      if (process.env.NODE_ENV === 'production') {
        results.web3.version.getNetwork((err, res) => {
          if (res !== 4) {
            this.setState({
              wrongNetwork: true,
            })
          }
        })
      }

      // Instantiate contract once web3 provided.
      this.instantiateContract()
    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  instantiateContract() {
    // Note: Normally these functions should be called in the context of a
    // state management library.

    const Authorship = TruffleContract(AuthorshipContract)
    Authorship.setProvider(this.state.web3.currentProvider)

    // Declaring this for later so we can chain functions on Authorship.
    let AuthorshipInstance

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      Authorship.deployed().then((instance) => {
        AuthorshipInstance = instance
      })
      .then((result) => {
        // Set first account as the default account for sending transactions.
        this.state.web3.eth.defaultAccount = accounts[0]

        // Read from the contract.
        return AuthorshipInstance.claimCount.call(accounts[0])
      })
      .then((result) => {
        // Update state with the result.
        return this.setState({
          claimCount: result.c[0],
          contract: AuthorshipInstance,
          userAddress: accounts[0],
        })
      })
    })
  }

  submit() {
    const {submitFormFileHash, submitFormName} = this.state

    // Form validation.
    if (submitFormFileHash.length !== 46) {
      this.setState({
        submitError: 'Invalid file hash.',
      })
      return
    }
    console.log('submitFormName', submitFormName)

    this.setState({
      submitInProgress: true,
      submitError: false,
      submitResult: null,
    })
    this.state.contract.makeClaim(
        ipfsHashToUint(submitFormFileHash), getUnixTimestamp(), submitFormName)
    .then((result) => {
      this.setState({
        claimCount: this.state.claimCount + 1,
        submitInProgress: false,
        submitError: false,
        submitResult: result.tx,
      })
    })
    .catch((error) => {
      this.setState({
        submitInProgress: false,
        submitError: `Web3 raised error: ${error.message}`,
      })
    })
  }

  verify() {
    const {
      verifyFormFileHash, verifyFormTimestamp, verifyFormAddress,
      verifyFormName
    } = this.state
    this.setState({
      verifyInProgress: true,
      verifyHasError: false,
      verifyResult: null,
    })
    this.state.contract.verifyClaim.call(
        ipfsHashToUint(verifyFormFileHash), verifyFormTimestamp,
        verifyFormAddress, verifyFormName)
    .then((claimExists) => {
      this.setState({
        verifyInProgress: false,
        verifyHasError: false,
        verifyResult: claimExists,
      })
    })
    .catch((error) => {
      console.error(error)
      this.setState({ verifyInProgress: false, verifyHasError: true })
    })
  }

  lookUp() {
    const { verifyFormFileHash } = this.state
    this.setState({
      lookUpInProgress: true,
      lookUpHasError: false,
      lookUpResult: null,
    })
    this.state.contract.claims.call(ipfsHashToUint(verifyFormFileHash))
    .then((result) => {
      this.setState({
        lookUpInProgress: false,
        lookUpHasError: false,
        lookUpResult: {
          exists: result[0],
          timestamp: result[1].toNumber(),
          address: result[2],
          name: result[3],
        },
      })
    })
    .catch((error) => {
      console.error(error)
      this.setState({ lookUpInProgress: false, lookUpHasError: true })
    })
  }

  /**
   * Forms.
   */

  updateVerifyFileHash(e) {
    this.setState({
      verifyFormFileHash: e.target.value,
    })
  }

  updateVerifyTimestamp(e) {
    this.setState({
      verifyFormTimestamp: e.target.value,
    })
  }

  updateVerifyAddress(e) {
    this.setState({
      verifyFormAddress: e.target.value,
    })
  }

  updateVerifyName(e) {
    this.setState({
      verifyFormName: e.target.value,
    })
  }

  updateSubmitFileHash(e) {
    this.setState({
      submitFormFileHash: e.target.value,
    })
  }

  updateSubmitName(e) {
    this.setState({
      submitFormName: e.target.value,
    })
  }

  calculateSubmitFormFileHash(e) {
    this.calculateHash(e, (hash) => {
      this.setState({
        submitFormFileHash: hash,
      })
    })
  }

  calculateVerifyFormFileHash(e) {
    this.calculateHash(e, (hash) => {
      this.setState({
        verifyFormFileHash: hash,
        lookUpResult: null,
      })
    })
  }

  calculateHash(e, callback) {
    const file = e.target.files[0]
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = function (e) {
      callback(ipfsHash(e.target.result))
    }
    reader.readAsBinaryString(file)
  }

  /**
   * Rendering.
   */

  render() {
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
          <a href="/" className="pure-menu-heading pure-menu-link">Authorship.io</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">

              <h2>Welcome</h2>
              <p>This is a simple app for interacting with the Authorship.io
              smart contract.</p>

              {this.state.web3 && !this.state.wrongNetwork &&
                <div>
                  <p>The number of existing claims is:&nbsp;
                    {this.state.claimCount === null &&
                      <span>&lt;CONTRACT NOT DEPLOYED&gt;</span>
                    }
                    {this.state.claimCount !== null &&
                      <span>{this.state.claimCount}</span>
                    }
                  </p>
                  {this.state.localWeb3 &&
                    <p className="status-fail">
                      Warning: Could not find injected web3, so falling back to
                      local web3 in read-only mode.
                    </p>
                  }

                  {this.state.userAddress &&
                    <p>
                      You are logged in with address {this.state.userAddress}.
                    </p>
                  }

                  <h2>Submit Authorship Claim</h2>
                  <div className="form-row">
                    <label htmlFor="submit-file-hash">File hash:</label>
                    <input
                      type="text"
                      id="submit-file-hash"
                      value={this.state.submitFormFileHash}
                      onChange={this.updateSubmitFileHash}
                    />
                    <input
                      type="file"
                      onChange={this.calculateSubmitFormFileHash}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="submit-timestamp">Unix timestamp:</label>
                    <Clock></Clock>
                  </div>
                  <div className="form-row">
                    <label htmlFor="submit-address-1">Address:</label>
                    {this.state.userAddress}
                  </div>
                  <div className="form-row">
                    <label htmlFor="submit-name-1">Name (optional):</label>
                    <input
                      type="text"
                      id="submit-name-1"
                      value={this.state.submitFormName}
                      onChange={this.updateSubmitName}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={this.submit}>
                    Submit
                  </button>
                  {this.state.submitResult !== null &&
                    <span>Submitted as {this.state.submitResult}</span>
                  }
                  {this.state.submitInProgress &&
                    <span>Querying...</span>
                  }
                  {this.state.submitError &&
                    <span className="status-error">{this.state.submitError}</span>
                  }

                  <h2>Verify Authorship Claim</h2>
                  <p>You can verify a claim by submitting the parameters
                  (file hash, Unix timestamp, claimant address, claimant name)
                  in order to check for an exact match.</p>
                  <div className="form-row">
                    <label htmlFor="verify-file-hash-1">File hash:</label>
                    <input
                      type="text"
                      id="verify-file-hash-1"
                      value={this.state.verifyFormFileHash}
                      onChange={this.updateVerifyFileHash}
                    />
                    <input
                      type="file"
                      onChange={this.calculateVerifyFormFileHash}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="verify-timestamp">Unix timestamp:</label>
                    <input
                      type="text"
                      id="verify-timestamp"
                      value={this.state.verifyFormTimestamp}
                      onChange={this.updateVerifyTimestamp}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="verify-address-1">Address:</label>
                    <input
                      type="text"
                      id="verify-address-1"
                      value={this.state.verifyFormAddress}
                      onChange={this.updateVerifyAddress}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="verify-name-1">Name:</label>
                    <input
                      type="text"
                      id="verify-name-1"
                      value={this.state.verifyFormName}
                      onChange={this.updateVerifyName}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={this.verify}
                    disabled={this.verifyInProgress}>
                    Verify
                  </button>
                  {this.state.verifyResult !== null &&
                    <span>
                      {this.state.verifyResult &&
                        <span className="status-pass">Pass</span>
                      }
                      {!this.state.verifyResult &&
                        <span className="status-fail">Fail</span>
                      }
                    </span>
                  }
                  {this.state.verifyInProgress &&
                    <span>Querying...</span>
                  }
                  {this.state.verifyHasError &&
                    <span className="status-error">An error occurred.</span>
                  }

                  <p>Alternatively, you can submit a file hash to look up the
                  existing claim details.</p>
                  <div className="form-row">
                    <label htmlFor="verify-file-hash-2">File hash:</label>
                    <input
                      type="text"
                      id="verify-file-hash-2"
                      value={this.state.verifyFormFileHash}
                      onChange={this.updateVerifyFileHash}
                    />
                    <input
                      type="file"
                      onChange={this.calculateVerifyFormFileHash}
                    />
                  </div>
                  {this.state.lookUpResult !== null && this.state.lookUpResult.exists &&
                    <div>
                      <div className="form-row">
                        <label>Unix timestamp:</label>
                        {this.state.lookUpResult.timestamp}
                        &nbsp;
                        <span className="small-text">
                          ({timestampToString(this.state.lookUpResult.timestamp)})
                        </span>
                      </div>
                      <div className="form-row">
                        <label>Address:</label>
                        {this.state.lookUpResult.address}
                      </div>
                      <div className="form-row">
                        <label>Name:</label>
                        {this.state.lookUpResult.name}
                      </div>
                    </div>
                  }
                  <button
                    type="button"
                    onClick={this.lookUp}
                    disabled={this.lookUpInProgress}>
                    Look Up
                  </button>
                  {this.state.lookUpResult !== null && !this.state.lookUpResult.exists &&
                    <span className="status-fail">No matching claim found</span>
                  }
                  {this.state.lookUpInProgress &&
                    <span>Querying...</span>
                  }
                  {this.state.lookUpHasError &&
                    <span className="status-error">An error occurred.</span>
                  }

                </div>
              }

              {this.state.web3 && this.state.wrongNetwork &&
                <p>Please connect to the Rinkeby test network in order to use
                this app.</p>
              }

              {!this.state.web3 &&
                <p>We were not able to connect to web3. Please install
                MetaMask or another web3 provider in order to use the app.</p>
              }

            </div>
          </div>
        </main>
      </div>
    )
  }
}

export default App
