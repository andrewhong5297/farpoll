import dotenv from 'dotenv';
dotenv.config();

import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { getAddress } from 'viem' //ethers is broken
import { gql, GraphQLClient } from 'graphql-request';
import axios from "axios";

// function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

//@todo: make this offchain EAS and then upload in bulk to dune
export async function eas_mint(cast_hash, fid, attest_wallet, button_index, trusted_data, verifiable=false) {
    // Initialize SchemaEncoder with the schema string
    const SYNDICATE_API_KEY = process.env['SYNDICATE_API_KEY'];

    cast_hash = cast_hash.startsWith('0x') ? cast_hash.substring(2) : cast_hash; //depending on source, sometimes hash has 0x in it.
    const padded_cast = Buffer.from(cast_hash + '0'.repeat(64 - cast_hash.length), 'hex')
    const schemaEncoder = new SchemaEncoder("bytes32 cast_hash, uint112 fid, uint8 button_index, bytes trusted_data");
    
    if (verifiable === false) {
        console.log("posting attestation with verifiable: false");
    }
    const encodedData = schemaEncoder.encodeData([
        { name: "cast_hash", value: padded_cast, type: "bytes32" },
        { name: "fid", value: fid, type: "uint112" },
        { name: "button_index", value: button_index, type: "uint8" },
        { name: "trusted_data", value: Buffer.from(verifiable === false ? trusted_data.substring(1, 4) : trusted_data, 'hex'), type: "bytes" }
    ]);
    // console.log(encodedData)

    const schemaUID = "0x6e333418327e1082bc2c5366560c703b447901a4b8d4ca9c754e9a8460eedbde";
    const response = axios.post( //don't await because of slow delays
        "https://frame.syndicate.io/api/mint",
        {
        frameTrustedData: trusted_data,
        args: [
            [
                schemaUID,
            [ 
                attest_wallet, //recipient
                0, //expirationTime
                true, //revocable
                "0x0000000000000000000000000000000000000000000000000000000000000000", //refUID
                encodedData,
                0
            ],
            ],
        ],
        },
        { 
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${SYNDICATE_API_KEY}`,
        },
        }
    );
    // console.log(response.status)
    return true

    // //push to EAS either onchain or offchain. docs: https://docs.attest.sh/docs/tutorials/make-an-attestation
    // const provider = ethers.getDefaultProvider(
    //     "base", {
    //         alchemy: process.env['ALCHEMY_KEY']
    //     }
    // );
    // const signer = new ethers.Wallet(process.env['PRIVATE_KEY'], provider);
    // const eas = new EAS("0x4200000000000000000000000000000000000021"); //https://docs.attest.sh/docs/quick--start/contracts#base
    // eas.connect(signer);
    // .....
    // const tx = await eas.attest({
    //     schema: schemaUID,
    //     data: {
    //         recipient: attest_wallet,
    //         expirationTime: 0,
    //         revocable: true,
    //         data: encodedData,
    //     },
    // });
    // const newAttestationUID = await tx.wait();
    // console.log("New attestation UID:", newAttestationUID);
    // console.log("attestation sent: ", tx.tx.hash) //try to not await
    // await delay(200); // Wait for 200 milliseconds, to give onceupon some time
    // return tx.tx.hash;
}

export async function eas_check(cast_hash, attest_wallet) {
    // const provider = ethers.getDefaultProvider(
    //     "base", {
    //         alchemy: process.env['ALCHEMY_KEY']
    //     }
    // );
    // const signer = new ethers.Wallet(process.env['PRIVATE_KEY'], provider);
    // const attesting = signer.address
    const attesting = "0x98407Cb54D8dc219d8BF04C9018B512dDbB96caB"
    const schema_id = '0x6e333418327e1082bc2c5366560c703b447901a4b8d4ca9c754e9a8460eedbde' //https://base.easscan.org/schema/view/0x6e333418327e1082bc2c5366560c703b447901a4b8d4ca9c754e9a8460eedbde
    const checksummed_wallet = getAddress(attest_wallet); //viem
    
    const endpoint = "https://base.easscan.org/graphql";
    const graphQLClient = new GraphQLClient(endpoint);
    const query = gql`
        query Query {
            findFirstAttestation(where: {
            schemaId: {
                equals: "${schema_id}"
            },
            recipient: {
                equals: "${checksummed_wallet}"
            },
            attester: {
                equals: "${attesting}"
            },
            decodedDataJson: {
                contains: "${cast_hash}"
            }
            }) {
            id
            recipient
            attester
            data
            decodedDataJson
            time
            txid
            }
        }
    `;

    const response = await graphQLClient.request(query);
    if (response.findFirstAttestation == null) {
        return { exists: false, hash: null };
    } else {
        console.log("already attested: " + response.findFirstAttestation?.id);
        console.log("tx hash: " + response.findFirstAttestation?.txid);
        return { exists: true, hash: response.findFirstAttestation?.txid };
    }
}