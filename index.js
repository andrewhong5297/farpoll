import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { eas_mint, eas_check } from './helpers/eas.js';
import { parse_cast, parse_action } from './helpers/neynar.js';
import { create_image } from './helpers/poll.js';

const app = express();
app.use(express.json()); 
const base_url = process.env["IS_PROD"] == 'true' ? 'https://ask.farpoll.com' : 'https://6cc1-2603-7000-8807-4100-39b4-aa62-5737-e5c5.ngrok-free.app';
console.log(base_url+ '/start')

app.get('/', (req, res) => {
  const myurl = `https://linktr.ee/cryptodatabytes`
  res.redirect(myurl)
});

app.get('/image', async (req, res) => {
  console.log('image') 
  const showResults = req.query.show_results;
  const cast_hash = req.query.cast_hash;
  const pngBuffer = await create_image(showResults, cast_hash);
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'max-age=10');
  res.send(pngBuffer);
});

app.get('/start', (req, res) => {
  console.log('start')
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
      <html>
      <head>
        <title>Start the poll</title>
        <meta property="og:title" content="Start the poll">
        <meta property="og:image" content="https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F497f2650-6a20-4a36-8008-57aa5a90f74d_916x476.png">
        <meta name="fc:frame" content="vNext">
        <meta name="fc:frame:image" content="https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F497f2650-6a20-4a36-8008-57aa5a90f74d_916x476.png">
        <meta name="fc:frame:post_url" content="${base_url}/poll">
        <meta name="fc:frame:button:1" content="Load Poll">
      </head>
      <body> 
        <p>Create your own poll by copy and pasting "https://ask.farpoll.com/start" into a cast, and typing out a question with a '?' and options like [a,b,c].</p>
      </body>
    </html>
  `);
});

app.post('/poll', async (req, res) => {
  console.log('poll')
  const cast_hash = "0x27f8122fa7e4fdf22beafce0ff38eead51c644f3" //QA testing hardcode
  const attest_wallet = "0xFdB1636C17DBC312f5E48625981499a4a179d6f0" //QA testing hardcode

  // const { cast_hash, button_index, trusted_data, fid, attest_wallet } = await parse_action(req.body);
  // const exists = await eas_check(cast_hash, attest_wallet)
  let display_html;
  if (false) { //QA hardcode, this will make the attestation fire off again.
  // if (exists.exists) {
    // user already has an attestation, show results
    display_html = `
    <meta property="og:image" content="https://og.onceupon.gg/card/${exists.hash}">
    <meta name="fc:frame" content="vNext">
    <meta name="fc:frame:image" content="https://og.onceupon.gg/card/${exists.hash}">
    <meta name="fc:frame:post_url" content="${base_url}/results">
    <meta name="fc:frame:button:1" content="you voted, click here show results">
    `
  } else {
    // user has not voted yet, show poll options
    const results = await parse_cast(cast_hash)
    // console.log(results) 
    const buttons = results.options.map((option, index) => ({
      [`fc:frame:button:${index + 1}`]: option
    }))
    display_html = `
    <meta property="og:image" content="${base_url}/image?show_results=false&cast_hash=${cast_hash}">
    <meta name="fc:frame" content="vNext"> 
    <meta name="fc:frame:image" content="${base_url}/image?show_results=false&cast_hash=${cast_hash}">
    <meta name="fc:frame:post_url" content="${base_url}/submit">
    ${buttons.map(button => Object.entries(button).map(([key, value]) => `<meta name="${key}" content="${value}">`).join('\n')).join('\n')}
    `
  }

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
      <html>
      <head>
        <title>Submit a vote</title>
        <meta property="og:title" content="Submit a vote">
        ${display_html}
      </head>
      <body>
        <p>Submit a vote</p>
      </body>
    </html>
  `);
});

app.post('/submit', async (req, res) => {
  console.log('submit')
  const { cast_hash, button_index, trusted_data, fid, attest_wallet } = await parse_action(req.body);

  try {
    const tx_id = await eas_mint(cast_hash, fid, attest_wallet, button_index, trusted_data); //add "verifiable=true" if you want to include trustedData in the mint. It's just expensive.
    // const tx_id = '0x5c06b77273988a2ad5177307dded64dddf41be2173178e47b45893dc334e985f' //QA testing hardcode for onceupon, if you don't want to fire off an attestation

    // Hit Once Upon API with txHash and the original POST body from the Frame
    const uri = encodeURIComponent(`${base_url}/results`);
    const button_text = encodeURIComponent("See Poll Results");
    const onceUponResponse = await fetch(`https://api.onceupon.gg/v1/transactions/${tx_id}/farcaster-frame?callback=${uri}&buttonText=${button_text}&delay=0`, {
      method: 'POST',
      body: JSON.stringify(req.body)
      });

    // Assuming the second API returns HTML response
    console.log("call onceupon")
    const htmlResponse = await onceUponResponse.text();
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlResponse);
  } catch (error) {
      // Error handling
      console.error('Error in postHandler:', error);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>vote failed</title>
          <meta property="og:title" content="vote failed">
          <meta property="og:image" content="${base_url}/image?show_results=true&cast_hash=${cast_hash}">
          <meta name="fc:frame" content="vNext">
          <meta name="fc:frame:image" content="${base_url}/image?show_results=true&cast_hash=${cast_hash}">
          <meta name="fc:frame:post_url" content="${base_url}/poll">
          <meta name="fc:frame:button:1" content="failed, click to try again">
        </head>
        <body> 
          <p>vote failed</p>
        </body>
      </html>
      `)
  }``
});

app.post('/results', async (req, res) => { 
    console.log('results')
    // const { cast_hash, button_index, trusted_data, fid, attest_wallet } = await parse_action(req.body);
    const cast_hash = "0x27f8122fa7e4fdf22beafce0ff38eead51c644f3" //QA testing hardcode for redirects

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>see results</title>
            <meta property="og:title" content="see results">
            <meta property="og:image" content="${base_url}/image?show_results=true&cast_hash=${cast_hash}">
            <meta name="fc:frame" content="vNext">
            <meta name="fc:frame:image" content="${base_url}/image?show_results=true&cast_hash=${cast_hash}">
            <meta name="fc:frame:button:1" content="see data on voter wallets 👉">
            <meta name="fc:frame:button:1:action" content="post_redirect">
            <meta name="fc:frame:post_url" content="${base_url}/redirect">
          </head>
          <body>
            <p>see results</p>
          </body> 
        </html>`);
});

app.post('/redirect', async (req, res) => {
  //need to first redirect to a url with the same host name, then I can redirect out to another domain
  const cast_hash = req.body?.untrustedData?.castId?.hash
  console.log('redirect: ' + cast_hash)
  res.redirect(`${base_url}/dune?cast_hash=${cast_hash}`);
});

app.get('/dune', async (req, res) => {
  const cast_hash = req.query.cast_hash;
  const dune_url = `https://dune.com/ilemi/farpoll?cast_hash_t76384=${cast_hash}`
  res.redirect(dune_url)
})

app.listen(process.env.PORT || 5001, () => {
  console.log(`app listening on port ${process.env.PORT || 5001}`);
});