import dotenv from 'dotenv';
dotenv.config();

import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";
import express from 'express';
import { eas_mint, eas_check } from './helpers/eas.js';
import { get_user_wallet } from './helpers/neynar.js';
import { create_image } from './helpers/poll.js';

const app = express();
app.use(express.json()); 
const base_url = process.env["IS_HEROKU"] == 'true' ? 'https://frame-eas-a34243560586.herokuapp.com' : 'https://67a1-2603-7000-8807-4100-682c-7192-d33e-af81.ngrok-free.app' // 'http://localhost:5001';
console.log(base_url)

app.get('/', (req, res) => {
  res.send('Hello casters!')
});

app.get('/image', async (req, res) => {
  const showResults = req.query.show_results;
  console.log(`show result: ${showResults === 'true' ? 'show' : 'hide'}`) //i have no idea why the query param isn't parsing to boolean correctly

  //TODO: is there some way to pass cast hash in the image get url?
  const pngBuffer = await create_image(showResults);
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'max-age=10');
  res.send(pngBuffer);
});

app.get('/base', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
      <html>
      <head>
        <title>Submit an attestation</title>
        <meta property="og:title" content="Submit an attestation">
        <meta property="og:image" content="${base_url}/image?show_results=false">
        <meta name="fc:frame" content="vNext">
        <meta name="fc:frame:image" content="${base_url}/image?show_results=false">
        <meta name="fc:frame:post_url" content="${base_url}/submit">
        <meta name="fc:frame:button:1" content="3.14">
        <meta name="fc:frame:button:2" content="42">
        <meta name="fc:frame:button:3" content="69">
        <meta name="fc:frame:button:4" content="1337">
      </head>
      <body> 
        <p>Submit your prediction</p>
      </body>
    </html>
  `);
});

app.post('/submit', async (req, res) => {
  try {
    console.log(req.body);
    const HUB_URL = process.env['HUB_URL'] || "nemes.farcaster.xyz:2283";
    const client = getSSLHubRpcClient(HUB_URL);

    let fid = 1
    let cast_hash = null
    let button_index = 0
    let trusted_data = null
    if (req.body?.trustedData == undefined) { //separating out for local testing with embed developer
      console.log('local testing')
      fid = req.body.untrustedData.fid
      cast_hash = req.body.untrustedData.castId.hash.toString('hex')
      button_index = req.body.untrustedData.buttonIndex
      trusted_data = req.body.untrustedData.castId.hash.toString('hex')

      // //test with hardcoded messageBytes from a real cast
      // trusted_data = '0a77080d10986618dda1a72e20018201680a4868747470733a2f2f363761312d323630332d373030302d383830372d343130302d363832632d373139322d643333652d616638312e6e67726f6b2d667265652e6170702f6261736510041a1a088a8101121460a7676b609a5f646b1c7e3fe1b88af211671ebb1214ac2a1748ee47ef34b7ef22bbe4c65c4d37c1122c1801224077f9fa86fa7142e109263d6ce56842dd124f947b09108dc6d32bc8549c41f88a015d7878baa3801ce515ed929b029d8ebfae4296154621daaf17e0c2958d6306280132203d277929b382d8d3ce32d2a250f532a994baed8e591766b4c97a68893c7e3122'
      // const frameMessage = Message.decode(Buffer.from(trusted_data || '', 'hex'));
      // const result = await client.validateMessage(frameMessage);
      // const validatedMessage = result.value.message;
      // console.log(validatedMessage);
      // fid = validatedMessage.data.fid;
      // cast_hash = validatedMessage.data.frameActionBody.castId.hash.toString('hex');
      // button_index = validatedMessage.data.frameActionBody.buttonIndex;
    } else {
      trusted_data = req.body?.trustedData?.messageBytes
      const frameMessage = Message.decode(Buffer.from(trusted_data || '', 'hex'));
      const result = await client.validateMessage(frameMessage);

      if (result.isOk() && result.value.valid) {
        const validatedMessage = result.value.message;
        fid = validatedMessage.data.fid;
        cast_hash = validatedMessage.data.frameActionBody.castId.hash.toString('hex');
        button_index = validatedMessage.data.frameActionBody.buttonIndex;
      } else {
        console.log(`Failed to validate message: ${result.error}`);
        res.status(500).send(`Failed to validate message: ${result.error}`);
        return;
      }
    }
    
    const attest_wallet = await get_user_wallet(fid);
    console.log('attested: ' + attest_wallet)
    console.log('cast: ' + cast_hash);
    console.log('button index: ' + button_index)
    console.log('trusted: ' + trusted_data)

    //check if user has already voted or not
    let vote_status = false;
    const existing_attestation = await eas_check(cast_hash, attest_wallet)
    if (existing_attestation) {
      vote_status = true;
    } else {
      await eas_mint(cast_hash, fid, attest_wallet, button_index, trusted_data); //mint the attestation
    }

    // Return an HTML response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>EAS Submitted!</title>
            <meta property="og:title" content="EAS Submitted">
            <meta property="og:image" content="${base_url}/image?show_results=true">
            <meta name="fc:frame" content="vNext">
            <meta name="fc:frame:image" content="${base_url}/image?show_results=true">
            <meta name="fc:frame:post_url" content="https://google.com">
            <meta name="fc:frame:button:1" content="${vote_status ? 'Already voted' : 'Vote submitted as an attestation'}">
          </head>
          <body>
            <p>Attestation submitted</p>
          </body>
        </html>`);
  }
  catch (error) {
    console.error(error);
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Submit an attestation</title>
        <meta property="og:title" content="Submit an attestation">
        <meta property="og:image" content="${base_url}/image?show_results=false">
        <meta name="fc:frame" content="vNext">
        <meta name="fc:frame:image" content="${base_url}/image?show_results=false">
        <meta name="fc:frame:post_url" content="https://google.com">
        <meta name="fc:frame:button:1" content="Failed to vote, refresh and try again">
      </head>
      <body> 
        <p>Submit your prediction</p>
      </body>
    </html>
  `);
  }
});

app.listen(process.env.PORT || 5001, () => {
  console.log(`app listening on port ${process.env.PORT || 5001}`);
});
