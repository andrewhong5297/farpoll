import dotenv from 'dotenv';
dotenv.config();
import { NeynarAPIClient, isApiErrorResponse } from "@neynar/nodejs-sdk";

export async function get_user_wallet(fid) {
    try {
    console.log('get custody wallet from neynar for ' + fid)
    const NEYNAR_API_KEY = process.env['NEYNAR_API_KEY'];
    const client = new NeynarAPIClient(NEYNAR_API_KEY);
    
    const user_data = await client.lookupUserByFid(fid, 1)
    const attest_wallet = user_data.result.user.custodyAddress //or you can get user_data.result.user.verifications
    console.log(attest_wallet)
    return attest_wallet
    
    } catch (err) {
        if (isApiErrorResponse(err)) {
            console.log("API Error", err.response.data);
        } else {
            console.log("Generic Error", err);
        }
        return null
    };
}