require('dotenv').config()
const sdk = require('api')('@neynar/v2.0#r1pf443blrx2cym4');

export async function get_user_wallet(fid) {
    const NEYNAR_API_KEY = process.env['NEYNAR_API_KEY'];
    const user_data = await sdk.userBulk({fids: fid, api_key: NEYNAR_API_KEY})
    .then(({ data }) => data)
    .catch(err => console.error(err));

    // console.log(user_data)
    const attest_wallet = user_data.users[0].verifications[0] ?? user_data.users[0].custody_address //attest to the first connected verification wallet
    return attest_wallet
}