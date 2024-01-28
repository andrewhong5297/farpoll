// import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";
const express = require('express');
const app = express();

// const HUB_URL = process.env['HUB_URL'] || "nemes.farcaster.xyz:2283";
// const client = getSSLHubRpcClient(HUB_URL);

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
        <meta name="fc:frame" content="vSubmit">
        <meta name="fc:frame:post_url" content="${process.env['HOST']}/api/submit">
        <meta name="fc:frame:button:1" content="I attest">
      </head>
      <body>
        <p>Submit an attestation to prove on chain you saw this cast</p>
      </body>
    </html>
  `);
});

// app.post('/submit', async (req, res) => {
//   try {
//     const frameMessage = Message.decode(Buffer.from(req.body?.trustedData?.messageBytes || '', 'hex'));
//     const result = await client.validateMessage(frameMessage);
//     if (result.isOk() && result.value.valid) {
//       const validatedMessage = result.value.message;
//       // Process the validated message here
//       res.send('Message validated successfully');
//     } else {
//       res.status(400).send('Invalid message');
//     }
//   } catch (e) {
//     res.status(500).send(`Failed to validate message: ${e}`);
//   }

//   // Return an HTML response
//   res.setHeader('Content-Type', 'text/html');
//   res.status(200).send(`
//         <!DOCTYPE html>
//         <html>
//           <head>
//             <title>EAS Submitted!</title>
//             <meta property="og:title" content="EAS Submitted">
//             <meta name="fc:frame" content="vSubmitted">
//           </head>
//           <body>
//             <p>Attestation submitted: transaction hash</p>
//           </body>
//         </html>
//       `);
// });

app.listen(process.env.PORT || 5000, () => {
  console.log(`app listening on port ${process.env.PORT || 5000}`);
});
