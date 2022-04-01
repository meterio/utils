const RPC = 'https://testnet.meter.io';
const PK = process.env.DIST_ADMIN_PRIVKEY;
const TOKEN = '0xdc51b40140d0768e94003f05e6919790a1b0536a';

const fs = require('fs');
const path = require('path');
const PLAN_PATH = path.join(__dirname, 'plan.csv');
const BigNumber = require('bignumber.js');
const axios = require('axios');

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

if (!PK) {
  console.log(`please set env var MAINNET_CONTRACT_ADMIN_PRIVKEY before calling ths`);
  process.exit(-1);
}
if (!fs.existsSync(PLAN_PATH)) {
  console.log('plan.csv does not exist, please create it first');
  process.exit(-1);
}

const meterify = require('meterify').meterify;
const Web3 = require('web3');
const web3 = meterify(new Web3(), RPC);
const { ERC20, Transaction, cry } = require('@meterio/devkit');

web3.eth.accounts.wallet.add(PK);
const tokenOwner = web3.eth.accounts.privateKeyToAccount(PK).address;
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
console.log(`Prepare to distribute token ${TOKEN} with admin ${tokenOwner}`);
let clauses = [];
(async () => {
  const best = await axios.get(RPC + '/blocks/best');

  const blockRef = best.data.id.substr(0, 18);
  console.log('block ref: ', blockRef);

  for (let i = 0; i < 10000; i++) {
    clauses = [
      // {
      //   to: TOKEN,
      //   value: getRandomInt(100),
      //   data: '0x',
      //   token: 0,
      // },
      {
        to: '0xdc51b40140d0768e94003f05e6919790a1b0536a',
        value: 86,
        data: '0x',
        token: 0,
      },
    ];

    // calc intrinsic gas
    let gas = Transaction.intrinsicGas(clauses);

    let body = {
      chainTag: 0x65,
      blockRef: '0x00c8981b79da0902',
      expiration: 700,
      clauses: clauses,
      gasPriceCoef: 0,
      gas: 21000,
      dependsOn: null,
      nonce: 6,
    };

    let tx = new Transaction(body);
    const signingHash = cry.blake2b256(tx.encode());
    const pkBuffer = Buffer.from(PK.replace('0x', ''), 'hex');
    const signature = cry.secp256k1.sign(signingHash, pkBuffer /* your private key */);
    const hexSig = signature.toString('hex');
    console.log(hexSig.length / 2);
    if (hexSig.length / 2 != 65) {
      console.log(tx);
      console.log(clauses);
    }
  }
})();
