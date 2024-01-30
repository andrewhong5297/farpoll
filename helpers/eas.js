import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { getAddress } from 'viem' //ethers is broken
import { gql, GraphQLClient } from 'graphql-request';

export async function eas_mint(cast_hash, fid, attest_wallet, button_index, trusted_data) {
    //push to EAS either onchain or offchain. docs: https://docs.attest.sh/docs/tutorials/make-an-attestation
    const provider = ethers.getDefaultProvider(
        "base", {
            alchemy: process.env['ALCHEMY_KEY']
        }
    );
    const signer = new ethers.Wallet(process.env['PRIVATE_KEY'], provider);
    const eas = new EAS("0x4200000000000000000000000000000000000021"); //https://docs.attest.sh/docs/quick--start/contracts#base
    eas.connect(signer);

    // Initialize SchemaEncoder with the schema string
    const padded_cast = Buffer.from(cast_hash + '0'.repeat(64 - cast_hash.length), 'hex')
    const schemaEncoder = new SchemaEncoder("bytes32 cast_hash, uint112 fid, uint8 button_index, bytes trusted_data");
    const encodedData = schemaEncoder.encodeData([
        { name: "cast_hash", value: padded_cast, type: "bytes32" },
        { name: "fid", value: fid, type: "uint112" },
        { name: "button_index", value: button_index, type: "uint8" },
        { name: "trusted_data", value: Buffer.from(trusted_data, 'hex'), type: "bytes" }
    ]);

    const schemaUID = "0x6e333418327e1082bc2c5366560c703b447901a4b8d4ca9c754e9a8460eedbde";

    const tx = await eas.attest({
        schema: schemaUID,
        data: {
            recipient: attest_wallet,
            expirationTime: 0,
            revocable: true, // Be aware that if your schema is not revocable, this MUST be false
            data: encodedData,
        },
    });

    const newAttestationUID = await tx.wait();
    console.log("New attestation UID:", newAttestationUID);
    return true;
}

export async function eas_check(cast_hash, attest_wallet) {
    const schema_id = '0x6e333418327e1082bc2c5366560c703b447901a4b8d4ca9c754e9a8460eedbde' //https://base.easscan.org/schema/view/0x6e333418327e1082bc2c5366560c703b447901a4b8d4ca9c754e9a8460eedbde
    const attesting = '0xE0fd3Db98D494597b7577377D5b08aB8e0875C2b'
    const checksummed_wallet = getAddress(attest_wallet); //viem
   
    // console.log('graphql check...')
    // console.log(attest_wallet)
    // console.log(checksummed_wallet)
    
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
            }
        }
    `;

    const response = await graphQLClient.request(query);
    if (response.findFirstAttestation == null) {
        return false;
    } else {
        console.log("already attested: " + response.findFirstAttestation?.id);
        return true
    }
}