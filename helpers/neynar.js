import dotenv from 'dotenv';
dotenv.config();
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
const NEYNAR_API_KEY = process.env['NEYNAR_API_KEY'];

export async function parse_cast(cast_hash) {
    const client = new NeynarAPIClient(NEYNAR_API_KEY);
    const cast_data = await client.lookUpCastByHash(cast_hash, 1) 
    const text = cast_data?.result?.cast?.text

    let question;
    let options;
    try {
        question = text.split('?')[0]
        options = text.match(/\[(.*?)\]/)[1].split(',')
    } catch (error) {
        question = "error parsing cast, make sure to:"
        options = ["- write options in [a,b,c]", "- include a question mark '?'"]
    }

    console.log("question: " + question)
    console.log("options: " + options)
    return { 
        question: question, 
        options: options
    }; 
}

export async function get_user_wallet(fid) {
    const client = new NeynarAPIClient(NEYNAR_API_KEY);    
    const user_data = await client.lookupUserByFid(fid, 1) 
    const attest_wallet = user_data.result.user.custodyAddress //or you can get user_data.result.user.verifications
    return attest_wallet
}

export async function parse_action(body) {
    const client = new NeynarAPIClient(NEYNAR_API_KEY);
    let result;
    let trusted_data;
    console.log(body?.trustedData)
    if (1===2) { //QA test with hardcoded messageBytes from a real cast
      console.log('local testing is ON')
      trusted_data = '0a61080d108a810118aea0aa2e20018201510a3168747470733a2f2f6672616d652d6561732d6133343234333536303538362e6865726f6b756170702e636f6d2f6261736510031a1a088a8101121427f8122fa7e4fdf22beafce0ff38eead51c644f312143715aa0a65ba847689b82057ebc9ac1e4b7e57361801224016c5969ad511f65c17f2d7462ae3c412a34d8d0dc2fd01bab505704cdf04314f615bf8523558fd98f234d5701e5182c69cedcd9ffb81d75a937ad75da2c38b0b280132204e42acc1786aba2b49619f7edae329009f419128916f5f187f80d35411879bb4'
      result = await client.validateFrameAction(trusted_data);
    } else {
      trusted_data = body?.trustedData?.messageBytes
      result = await client.validateFrameAction(trusted_data);
    }

    console.log(result)
    if (result.valid) {
        const fid = result.action.interactor.fid
        const cast_hash = result.action.cast.hash.toString('hex');
        const attest_wallet = result.action.interactor.custody_address //or interactor.verifications[0]
        const button_index = result.action.tapped_button.index

        console.log('attested: ' + attest_wallet)
        console.log('cast: ' + cast_hash);
        console.log('button index: ' + button_index)
        console.log('trusted: ' + trusted_data)
        return { cast_hash, button_index, trusted_data, fid, attest_wallet }
    } else {
        console.log(`Failed to validate message: ${result.error}`);
        res.status(500).send(`Failed to validate message: ${result.error}`);
        return;
    }
}