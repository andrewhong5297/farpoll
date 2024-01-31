# Farpoll: Turn any cast into an onchain poll

### Put your question and options into a cast with the link `https://ask.farpoll.com/start`, and automagically turn it into an onchain poll.

This repo is the code behind [ask.farpoll.com/start](https://ask.farpoll.com/start), which is a [frame on Farcaster](https://warpcast.notion.site/Farcaster-Frames-4bd47fe97dc74a42a48d3a234636d8c5) that will parse the question and button options from within a cast, and then store the vote results onchain using [this EAS schema](https://base.easscan.org/schema/view/0x6e333418327e1082bc2c5366560c703b447901a4b8d4ca9c754e9a8460eedbde). 

Additionally, the frame displays transaction confirmations with [onceupon.gg](https://og.onceupon.gg/card/0x65f9e4ee88874cd57bd905f09c984637b4c524be42f372f28740fc17e4b2c7bb) and then redirects out to [dune.com](https://dune.com/ilemi/frames-users) to showcase analytics behind the voters.

Having the vote data onchain through EAS allows for frames to essentially act as smart contracts that emit "logs". This is useful for more than just analytics, you could tie it to "reserving" a mint as well. I'm still exploring offchain options for cheaper storage. 

## Setup

Put in the relevant keys in the `.env` file. If you want to post to your own EAS schema with more variables, go create a schema and edit the encoder and schemaUID. You also have the option to change the code to post offchain if you want to, docs are linked in the script.

For testing, I recommend you localhost into an ngrok and then test with [this developer frames frontend](https://warpcast.com/~/developers/frames).

I'm a javascript noob so ignore all my spaghetti code. Feel free to make PRs with improvements and thoughts 😁

To start, install all the packages.

```
npm install
```

If you make edits to the `poll.jsx` file, remember to run `npm run build` to update the js file that gets actually run. Bonus points if someone figures out webpacks and how to get this to build on the fly.

To run the app locally, use:

```
npm run dev
```

To run the app in production, use:

```
npm start
```

## Frame Logically Flow

1. start on `/start` page, ask users to click "load poll".
2. go to `/poll`, and check if user has already made an attestation. If so, show them the confirmation of their attestation and push them to `/results` screen
3. if not, give them the `/poll` screen that pulls questions/options from the cast (parses first question mark, and options out of a [a,b,c])
4. return onceupon frame after confirmation. let them click "see results" to push them to `/results` screen
5. shows them poll results screen, which has a redirect to the dune dashboard to see voter distribution data.