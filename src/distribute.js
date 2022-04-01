const RPC = 'https://testnet.meter.io';
const PK = process.env.DIST_ADMIN_PRIVKEY;
const TOKEN = '0xdc51b40140d0768e94003f05e6919790a1b0536a';

const fs = require('fs');
const BigNumber = require('bignumber.js');
const path = require('path');
const PLAN_PATH = path.join(__dirname, 'plan.csv');

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
const { abi } = require('./erc20Mintable.json');

web3.eth.accounts.wallet.add(PK);
const tokenOwner = web3.eth.accounts.privateKeyToAccount(PK).address;

console.log(`Prepare to distribute token ${TOKEN} with admin ${tokenOwner}`);

(async () => {
  const dists = loadCSV(PLAN_PATH);
  const tokenInst = new web3.eth.Contract(abi, TOKEN);

  for (const d of dists) {
    const addr = d.Address;
    const amount = new BigNumber(d.Amount).times(1e18).toFixed();
    console.log(`Prepare to transfer ${amount} to ${addr}`);
    const receipt = await tokenInst.methods.transfer(addr, amount).send({ from: tokenOwner });
    if (receipt && receipt.status) {
      console.log(`Transfer ${amount} to ${addr} in tx ${receipt.transactionHash}`);
    }
  }
})();
