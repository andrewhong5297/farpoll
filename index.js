const { getSSLHubRpcClient, Message } = require("@farcaster/hub-nodejs");
const express = require('express');
const app = express();

const HUB_URL = process.env['HUB_URL'] || "nemes.farcaster.xyz:2283";
const client = getSSLHubRpcClient(HUB_URL);

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
  console.log(req.body.trustedData)
  console.log(req.body.untrustedData)
  const frameMessage = Message.decode(Buffer.from(req.body?.trustedData?.messageBytes || '', 'hex'));
  const result = await client.validateMessage(frameMessage);
  if (result.isOk() && result.value.valid) {
    const validatedMessage = result.value.message;
    console.log(validatedMessage)
  }
  else {
    console.log(`Failed to validate message: ${result.error}`);
    res.status(500).send(`Failed to validate message: ${e}`);
  }

  // // Return an HTML response
  // res.setHeader('Content-Type', 'text/html');
  // res.status(200).send(`
  //       <!DOCTYPE html>
  //       <html>
  //         <head>
  //           <title>EAS Submitted!</title>
  //           <meta property="og:title" content="EAS Submitted">
  //           <meta property="og:image" content="https://docs.attest.sh/img/eas-logo.png">
  //           <meta name="fc:frame" content="vNext">
  //           <meta name="fc:frame:image" content="https://docs.attest.sh/img/eas-logo.png">
  //           <meta name="fc:frame:button:1" content="Succesfully attested on Base">
  //         </head>
  //         <body>
  //           <p>Attestation submitted: transaction hash</p>
  //         </body>
  //       </html>
  //     `);
});

app.listen(process.env.PORT || 5001, () => {
  console.log(`app listening on port ${process.env.PORT || 5001}`);
});
