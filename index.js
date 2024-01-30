import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { eas_mint, eas_check } from './helpers/eas.js';
import { get_user_wallet, get_cast } from './helpers/neynar.js';
import { create_image } from './helpers/poll.js';

const app = express();
app.use(express.json()); 
const base_url = process.env["IS_HEROKU"] == 'true' ? 'https://frame-eas-a34243560586.herokuapp.com' : 'https://cf70-67-244-102-135.ngrok-free.app';
console.log(base_url)

app.get('/', (req, res) => {
  res.send('Hello casters!')
});

app.get('/image', async (req, res) => {
  const showResults = req.query.show_results;
  const cast_hash = req.query.cast_hash;
  console.log(cast_hash)
  const pngBuffer = await create_image(showResults, cast_hash);
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'max-age=10');
  res.send(pngBuffer);
});

app.get('/start', (req, res) => {
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
        <meta name="fc:frame:button:1" content="Click here to start">
      </head>
      <body> 
        <p>Submit your prediction</p>
      </body>
    </html>
  `);
});

app.post('/poll', async (req, res) => {
  const { cast_hash, button_index, trusted_data, fid, attest_wallet } = await get_cast(req.body);
  //check if user has already voted or not. depending on vote state display different buttons
  const existing_attestation = await eas_check(cast_hash, attest_wallet)
  let display_html;
  // if (existing_attestation) {
  if (1===2) {
    display_html = `
    <meta name="fc:frame:post_url" content="${base_url}/results">
    <meta name="fc:frame:button:1" content="already voted, show results">
    `
  } else {
    display_html = `
    <meta name="fc:frame:post_url" content="${base_url}/submit">
    <meta name="fc:frame:button:1" content="test input">
    `
    //make the buttons and text a mapping from the cast_hash later.
  }
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
      <html>
      <head>
        <title>Submit a vote</title>
        <meta property="og:title" content="Submit a vote">
        <meta property="og:image" content="${base_url}/image?show_results=false&cast_hash=${cast_hash}">
        <meta name="fc:frame" content="vNext">
        <meta name="fc:frame:image" content="${base_url}/image?show_results=false&cast_hash=${cast_hash}">
        ${display_html}
      </head>
      <body> 
        <p>Submit a vote</p>
      </body>
    </html>
  `);
});

app.post('/submit', async (req, res) => {
  try {
    //get required EAS data. If they get to this screen, they have already been checked for vote status
    console.log(req.body);
    // const { cast_hash, button_index, trusted_data, fid, attest_wallet } = await get_cast(req.body);
    // const tx_id = await eas_mint(cast_hash, fid, attest_wallet, button_index, trusted_data); //mint the attestation
    const tx_id = '0x5c06b77273988a2ad5177307dded64dddf41be2173178e47b45893dc334e985f' //QA testing

    //Successful, pull image from onceupon.
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>vote submitted</title>
            <meta property="og:title" content="vote submitted">
            <meta property="og:image" content="https://og.onceupon.gg/card/${tx_id}">
            <meta name="fc:frame" content="vNext">
            <meta name="fc:frame:image" content="https://og.onceupon.gg/card/${tx_id}">
            <meta name="fc:frame:post_url" content="${base_url}/results">
            <meta name="fc:frame:button:1" content="show poll results">
          </head>
          <body>
            <p>vote submitted</p>
          </body>
        </html>`);
  }
  catch (error) {
    //Failed, take them back to poll screen again
    console.error(error);
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
  `);
  }
});

app.post('/results', async (req, res) => {
    console.log(req.body);
    const { cast_hash, button_index, trusted_data, fid, attest_wallet } = await get_cast(req.body);
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
            <meta name="fc:frame:post_url" content="https://dune.com/ilemi/frames-users">
            <meta name="fc:frame:button:1" content="voter distribution stats ->">
          </head>
          <body>
            <p>see results</p>
          </body>
        </html>`);
});

app.listen(process.env.PORT || 5001, () => {
  console.log(`app listening on port ${process.env.PORT || 5001}`);
});
