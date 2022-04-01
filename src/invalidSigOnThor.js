const PK = process.env.DIST_ADMIN_PRIVKEY;

if (!PK) {
  console.log(`please set env var MAINNET_CONTRACT_ADMIN_PRIVKEY before calling ths`);
  process.exit(-1);
}
const { Transaction, blake2b256, secp256k1 } = require('thor-devkit');

let body = {
  chainTag: 0x65,
  blockRef: '0x00c8981b79da0902',
  expiration: 700,
  clauses: [
    {
      to: '0xdc51b40140d0768e94003f05e6919790a1b0536a',
      value: 86,
      data: '0x',
      token: 0,
    },
  ],
  gasPriceCoef: 0,
  gas: 21000,
  dependsOn: null,
  nonce: 6,
};

let tx = new Transaction(body);
const signingHash = blake2b256(tx.encode());
const pkBuffer = Buffer.from(PK.replace('0x', ''), 'hex');
const signature = secp256k1.sign(signingHash, pkBuffer /* your private key */);
const hexSig = signature.toString('hex');
console.log(hexSig.length / 2);
