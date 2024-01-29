import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
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
    const schemaEncoder = new SchemaEncoder("bytes cast_hash, uint112 fid, uint8 button_index, bytes trusted_data");
    const encodedData = schemaEncoder.encodeData([
        { name: "cast_hash", value: Buffer.from(cast_hash, 'hex'), type: "bytes" },
        { name: "fid", value: fid, type: "uint112" },
        { name: "button_index", value: button_index, type: "uint8" },
        { name: "trusted_data", value: Buffer.from(trusted_data, 'hex'), type: "bytes" }
    ]);

    const schemaUID = "0xd3bfd90a9eb4c81ee18c376f5f35432e6af9ab17853ff0a077d515dc74cf062e";

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
    const endpoint = "YOUR_GRAPHQL_ENDPOINT";
    const graphQLClient = new GraphQLClient(endpoint);

    const query = gql`
        query Attestation {
            attestation(
                where: { id: "0xa4fb0ad1e13efbb38e466af0cb59822cae7f9ea26f26dd34ddb09c76ee9dbb12" }
            ) {
                id
                attester
                recipient
                refUID
                revocable
                revocationTime
                expirationTime
                data
            }
        }
    `;

    const response = await graphQLClient.request(query);

    const attestation = response.attestation;
    console.log(attestation);

    //if attestation is not null, return true. else return false
    return attestation;
}