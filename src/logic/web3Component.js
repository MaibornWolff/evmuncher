'use strict'
import { store } from '../store'

let Web3 = require('web3')
let web3
let listener = false

let networks = {
  '1': 'Mainnet',
  '2': 'Morden Classic',
  '3': 'Ropsten',
  '4': 'Rinkeby',
  '5': 'Goerli',
  '42': 'Kovan',
  '77': 'Sokol'
}

function isLocked () {
  return window.ethereum.selectedAddress === undefined
}

/**
 * Checks wheater metamask is installed and unlocked.
 */
function initW3 () {
  if (typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')) {
    // Web3 browser user detected. You can now use the provider.
    window.ethereum.enable()
    const provider = window['ethereum'] || window.web3.currentProvider
    web3 = new Web3(provider)
    if (isLocked()) {
      return { status: false, msg: 'Metamask needs to be unlocked!' }
    }
    return {
      status: true,
      msg: '',
      address: window.ethereum.selectedAddress,
      network: networks[window.ethereum.networkVersion]
    }
  } else {
    web3 = new Web3('https://rinkeby.infura.io/v3/73b1a4e591154a63a7537c086a31f23d:8545')
    return {
      status: true,
      msg: '',
      address: 'Install MetaMask',
      network: 'None'
    }
  }
}
/**
 * Starts a listener on metamask updates and fires the initW3 function whenever
 * there is a new update.
 */
function observer () {
  if (!listener && 'publicConfigStore' in web3.currentProvider) {
    web3.currentProvider.publicConfigStore
      .on('update', function () {
        store.commit('changeWeb3Connection', initW3())
      })
    listener = true
  }
}

/*
getCodeByAddress returns the opcodes of a contract, which resides behind the
given address.

\param: Ethereum address where the contract resides
\return: Returns a Promise which should contain the opcodes of the contract. In
case there is no opcode, 0x is returned
 */
function getCodeByAddress (address) {
  return web3.eth.getCode(address)
}

export const w3Component = {
  initW3: initW3,
  getCodeByAddress: getCodeByAddress,
  observer: observer
}
