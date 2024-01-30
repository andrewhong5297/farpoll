# Farcaster Frames with EAS attestations and Dune queries

Frame actions are not captured in the hub right now, so I wanted to enable ethereum "log" like behavior for frames that need them.

This frame repo allows you to store button actions in an EAS schema onchain, and then pull that data using Dune to render the poll image.

Useful for:
- generally storing past frames data for historical access
- pushing action data onchain for stuff like "reserving" a mint
- get be stored offchain or onchain, as needed

## Setup

Put in the relevant keys in the `.env` file. If you want to post to your own EAS schema with more variables, go create a schema and edit the encoder and schemaUID. You also have the option to change the code to post offchain if you want to, docs are linked in the script.

For testing, I recommend you localhost into an ngrok and then just test with a live cast (developer embed doesn't work because trustedData only gets sent from warpcast client). 

I'm a javascript noob so ignore all my spaghetti code. Feel free to make PRs with improvements and thoughts.

If you make edits to the poll.jsx file, remember to run `npm run build` to update the js file that gets actually run.