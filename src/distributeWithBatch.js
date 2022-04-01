const RPC = 'https://mainnet.meter.io';
const PK = process.env.DIST_ADMIN_PRIVKEY;
const TOKEN = '0xb8c2Eb8702e129c8feCfbFD6E55bB6b3330f30f1';
const CHAIN_TAG = 0x52;

const fs = require('fs');
const path = require('path');
const PLAN_PATH = path.join(__dirname, 'plan.csv');
const BigNumber = require('bignumber.js');
const axios = require('axios');

if (!PK) {
  console.log(`please set env var MAINNET_CONTRACT_ADMIN_PRIVKEY before calling ths`);
  process.exit(-1);
}
if (!fs.existsSync(PLAN_PATH)) {
  console.log('plan.csv does not exist, please create it first');
  process.exit(-1);
}

const { loadCSV } = require('./csv');
const meterify = require('meterify').meterify;
const Web3 = require('web3');
const web3 = meterify(new Web3(), RPC);
const { ERC20, Transaction, cry } = require('@meterio/devkit');

web3.eth.accounts.wallet.add(PK);
const tokenOwner = web3.eth.accounts.privateKeyToAccount(PK).address;

console.log(`Prepare to distribute token ${TOKEN} with admin ${tokenOwner}`);
let clauses = [];
const sendBatch = async (clauses) => {
  const best = await axios.get(RPC + '/blocks/best');

  // calc intrinsic gas
  let gas = Transaction.intrinsicGas(clauses);
  console.log('gas:', gas);

  const blockRef = best.data.id.substr(0, 18);
  console.log('block ref: ', blockRef);

  let body = {
    chainTag: CHAIN_TAG,
    blockRef: blockRef,
    expiration: 700,
    clauses: clauses,
    gasPriceCoef: 0,
    gas: 4000000,
    dependsOn: null,
    nonce: 12345678,
  };

  let tx = new Transaction(body);
  const signingHash = cry.blake2b256(tx.encode());
  const pkBuffer = Buffer.from(PK.replace('0x', ''), 'hex');
  tx.signature = cry.secp256k1.sign(signingHash, pkBuffer /* your private key */);

  const raw = tx.encode();
  const rawTx = '0x' + raw.toString('hex');
  const receipt = await web3.eth.sendSignedTransaction(rawTx);
  console.log(receipt);
};

(async () => {
  const dists = loadCSV(PLAN_PATH);
  let total = new BigNumber(0);
  for (const [i, d] of dists.entries()) {
    const addr = d.Address;
    const amount = new BigNumber(d.Amount).times(1e18).toFixed();
    total = total.plus(amount);
    console.log(`Prepare to mint ${amount} to ${addr}`);

    clauses.push({
      to: TOKEN,
      value: '0',
      data: ERC20.transfer.encode(addr, amount),
      token: 0,
    });
    if ((i + 1) % 20 == 0 || i + 1 == dists.length) {
      await sendBatch(clauses);
      clauses = [];
    }
  }
  console.log(`Total: ${total.dividedBy(1e18).toFixed(2)}`);
})();
