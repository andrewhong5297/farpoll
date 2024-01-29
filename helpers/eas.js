import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from "ethers";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";

export async function eas_mint(cast_hash, fid, attest_wallet) {
    try {
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
    const schemaEncoder = new SchemaEncoder("bytes cast_hash, uint112 fid");
    const encodedData = schemaEncoder.encodeData([
        { name: "cast_hash", value: Buffer.from(cast_hash, 'hex'), type: "bytes" },
        { name: "fid", value: fid, type: "uint112" }
    ]);

    const schemaUID = "0x9008c7f681e3035347c65d01a7bb3383a85e9d121f5a797e59077cfea964b87c";

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

    } catch (error) {
        console.error(error);
        return false
    }
}

export async function eas_check(cast_hash, attest_wallet) {
    try {
        const client = new ApolloClient({
            uri: "YOUR_GRAPHQL_ENDPOINT",
            cache: new InMemoryCache(),
        });

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

        const response = await client.query({
            query,
        });

        const attestation = response.data.attestation;
        console.log(attestation);

        //if attestation is not null, return true. else return false
        return attestation;
    } catch (error) {
        console.error(error);
        return null;
    }
}