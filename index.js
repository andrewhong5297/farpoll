require('dotenv').config()
const { getSSLHubRpcClient, Message } = require("@farcaster/hub-nodejs");
const { EAS, SchemaEncoder } = require("@ethereum-attestation-service/eas-sdk");
const { ethers } = require("ethers");
const express = require('express');
const sdk = require('api')('@neynar/v2.0#r1pf443blrx2cym4');

const app = express();
const HUB_URL = process.env['HUB_URL'] || "nemes.farcaster.xyz:2283";
const client = getSSLHubRpcClient(HUB_URL);
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/base', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
      <html>
      <head>
        <title>Submit an attestation</title>
        <meta property="og:title" content="Submit an attestation">
        <meta property="og:image" content="https://docs.attest.sh/img/eas-logo.png">
        <meta name="fc:frame" content="vNext">
        <meta name="fc:frame:image" content="https://docs.attest.sh/img/eas-logo.png">
        <meta name="fc:frame:post_url" content="https://frame-eas-a34243560586.herokuapp.com/submit">
        <meta name="fc:frame:button:1" content="I attest I saw this cast">
      </head>
      <body>
        <p>Submit an attestation to prove on chain you saw this cast</p>
      </body>
    </html>
  `);
});

app.post('/submit', async (req, res) => {
  // console.log(req.body);
  const frameMessage = Message.decode(Buffer.from(req.body?.trustedData?.messageBytes || '', 'hex'));
  const result = await client.validateMessage(frameMessage);
  if (result.isOk() && result.value.valid) {
    const validatedMessage = result.value.message;
    console.log(validatedMessage)

    //get caster data from neynar api
    const fid = validatedMessage.data.fid;
    const cast_hash = validatedMessage.data.frameActionBody.castId.hash.toString('hex');

    const NEYNAR_API_KEY = process.env['NEYNAR_API_KEY'];
    
    const user_data = await sdk.userBulk({fids: fid, api_key: NEYNAR_API_KEY})
      .then(({ data }) => data)
      .catch(err => console.error(err));

    // console.log(user_data)
    const attest_wallet = user_data.users[0].verifications[0]; //attest to the first connected verification wallet
    console.log(attest_wallet)
    console.log(fid);
    console.log('0x' + cast_hash);

    //push to EAS either onchain or offchain. docs: https://docs.attest.sh/docs/tutorials/make-an-attestation
    const provider = ethers.getDefaultProvider(
      "base", {
        alchemy: process.env['ALCHEMY_KEY']
      }
    );
   
    const signer = new ethers.Wallet(process.env['PRIVATE_KEY'], provider);

    const eas = new EAS("0x4200000000000000000000000000000000000021"); //https://docs.attest.sh/docs/quick--start/contracts#base
    eas.connect(signer);

    // Initialize SchemaEncoder with the schema string
    const schemaEncoder = new SchemaEncoder("bytes cast_hash, uint112 fid");
    const encodedData = schemaEncoder.encodeData([
      { name: "cast_hash", value: Buffer.from(cast_hash, 'hex'), type: "bytes" },
      { name: "fid", value: fid, type: "uint112" }
    ]);

    const schemaUID = "0x9008c7f681e3035347c65d01a7bb3383a85e9d121f5a797e59077cfea964b87c";

    const tx = await eas.attest({
      schema: schemaUID,
      data: {
        recipient: attest_wallet,
        expirationTime: 0,
        revocable: true, // Be aware that if your schema is not revocable, this MUST be false
        data: encodedData,
      },
    });

    const newAttestationUID = await tx.wait();
    console.log("New attestation UID:", newAttestationUID);

    // Return an HTML response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>EAS Submitted!</title>
            <meta property="og:title" content="EAS Submitted">
            <meta property="og:image" content="https://docs.attest.sh/img/eas-logo.png">
            <meta name="fc:frame" content="vNext">
            <meta name="fc:frame:image" content="https://docs.attest.sh/img/eas-logo.png">
            <meta name="fc:frame:post_url" content="https://google.com">
            <meta name="fc:frame:button:1" content="Succesfully attested on Base">
          </head>
          <body>
            <p>Attestation submitted</p>
          </body>
        </html>`);
  }
  else {
    console.log(`Failed to validate message: ${result.error}`);
    res.status(500).send(`Failed to validate message: ${result.error}`);
    return;
  }
});

app.listen(process.env.PORT || 5001, () => {
  console.log(`app listening on port ${process.env.PORT || 5001}`);
});
