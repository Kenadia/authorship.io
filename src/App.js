import React, { Component } from 'react'
import TruffleContract from 'truffle-contract'
import AuthorshipContract from '../build/contracts/Authorship.json'
import getWeb3 from './utils/getWeb3'

import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      storageValue: '<CONTRACT DID NOT LOAD>',
      web3: null
    }
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })

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
    var AuthorshipInstance

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      Authorship.deployed().then((instance) => {
        AuthorshipInstance = instance
      }).then((result) => {
        // Read from the contract.
        return AuthorshipInstance.claimCount.call(accounts[0])
      }).then((result) => {
        // Update state with the result.
        return this.setState({ storageValue: result.c[0] })
      })
    })
  }

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

              {this.state.web3 &&
                <p>The stored value is: {this.state.storageValue}</p>
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
