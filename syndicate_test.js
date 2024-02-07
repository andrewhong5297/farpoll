import dotenv from 'dotenv';
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { gql, GraphQLClient } from 'graphql-request';
import axios from "axios";
dotenv.config();

//register EAS attest function
const SYNDICATE_API_KEY = process.env['SYNDICATE_API_KEY'];

// const syndicateRegisterRes = await fetch('https://frame.syndicate.io/api/register', {
//   method: "POST",
//   headers: {
//     "content-type": "application/json",
//     Authorization: `Bearer ${SYNDICATE_API_KEY}`
//   },
//   body: JSON.stringify({
//     contractAddress: "0x4200000000000000000000000000000000000021",
//     functionSignature : "attest((bytes32,(address,uint64,bool,bytes32,bytes,uint256)))"
//     // functionSignature: "attest((bytes32 schema, (address recipient, uint64 expirationTime, bool revocable, bytes32 refUID,bytes data, uint256 value ) AttestationRequestData) request)", //https://basescan.org/tx/0x49d752180b119a3ada5ee078afeed2ff2fb10c124ba1472312af2675cab16d7a
//   })
// })

//prep EAS test tx
function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

const schemaEncoder = new SchemaEncoder("bytes32 cast_hash, uint112 fid, uint8 button_index, bytes trusted_data");
const encodedData = schemaEncoder.encodeData([
    { name: "cast_hash", value: Buffer.from("0a785eeba0dd127b090b795a2aa2524d332c1183000000000000000000000000", 'hex'), type: "bytes32" },
    { name: "fid", value: 16552, type: "uint112" },
    { name: "button_index", value: 1, type: "uint8" },
    { name: "trusted_data", value: Buffer.from("FdB1636C17DBC312f5E48625981499a4a179d6f0", 'hex'), type: "bytes" }
]);

console.log(encodedData)

const cast_hash = '0a785eeba0dd127b090b795a2aa2524d332c1183000000000000000000000000'
const trustDataSample = '0a61080d108a810118aea0aa2e20018201510a3168747470733a2f2f6672616d652d6561732d6133343234333536303538362e6865726f6b756170702e636f6d2f6261736510031a1a088a8101121427f8122fa7e4fdf22beafce0ff38eead51c644f312143715aa0a65ba847689b82057ebc9ac1e4b7e57361801224016c5969ad511f65c17f2d7462ae3c412a34d8d0dc2fd01bab505704cdf04314f615bf8523558fd98f234d5701e5182c69cedcd9ffb81d75a937ad75da2c38b0b280132204e42acc1786aba2b49619f7edae329009f419128916f5f187f80d35411879bb4'
const schema_id = "0x6e333418327e1082bc2c5366560c703b447901a4b8d4ca9c754e9a8460eedbde"
const attester = "0x98407Cb54D8dc219d8BF04C9018B512dDbB96caB"
const recipient = '0xdAC17F958D2ee523a2206206994597C13D831ec7'

const response = await axios.post(
  "https://frame.syndicate.io/api/mint",
  {
    frameTrustedData: trustDataSample,
    args: [
      [
        schema_id,
        [ 
            recipient, //recipient
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
console.log(response.status, response.data)

// let tx_hash;

// while (tx_hash === undefined) {
//   await delay(1000); // Wait for 1000 milliseconds, to give EAS some time
//   const endpoint = "https://base.easscan.org/graphql";
//   const graphQLClient = new GraphQLClient(endpoint);
//   const query = gql`
//   query Query {
//       findFirstAttestation(where: {
//       schemaId: {
//           equals: "${schema_id}"
//       },
//       recipient: {
//           equals: "${recipient}"
//       },
//       attester: {
//           equals: "${attester}"
//       },
//       decodedDataJson: {
//           contains: "${cast_hash}"
//       }
//       }) {
//       id
//       recipient
//       attester
//       data
//       decodedDataJson
//       time
//       txid
//       }
//   }
//   `;
//   const ql_response = await graphQLClient.request(query);
//   console.log("already attested: " + ql_response.findFirstAttestation?.id);
//   console.log("tx hash: " + ql_response.findFirstAttestation?.txid)
// }