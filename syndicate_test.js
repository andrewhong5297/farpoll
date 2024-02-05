import dotenv from 'dotenv';
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
dotenv.config();

//register EAS attest function
const SYNDICATE_API_KEY = process.env['SYNDICATE_API_KEY'];

const syndicateRegisterRes = await fetch('https://frame.syndicate.io/api/register', {
  method: "POST",
  headers: {
    "content-type": "application/json",
    Authorization: `Bearer ${SYNDICATE_API_KEY}`
  },
  body: JSON.stringify({
    contractAddress: "0x4200000000000000000000000000000000000021",
    functionSignature: "attest((bytes32 schema, (address recipient, uint64 expirationTime, bool revocable, bytes32 refUID,bytes data, uint256 value ) AttestationRequestData) request)", //https://basescan.org/tx/0x49d752180b119a3ada5ee078afeed2ff2fb10c124ba1472312af2675cab16d7a
  })
})

console.log(syndicateRegisterRes.status, await syndicateRegisterRes.json())

//prep EAS test tx
const schemaEncoder = new SchemaEncoder("bytes32 cast_hash, uint112 fid, uint8 button_index, bytes trusted_data");
const encodedData = schemaEncoder.encodeData([
    { name: "cast_hash", value: Buffer.from("0a785eeba0dd127b090b795a2aa2524d332c1183000000000000000000000000", 'hex'), type: "bytes32" },
    { name: "fid", value: 16552, type: "uint112" },
    { name: "button_index", value: 1, type: "uint8" },
    { name: "trusted_data", value: Buffer.from("0xFdB1636C17DBC312f5E48625981499a4a179d6f0", 'hex'), type: "bytes" }
]);

const options = {
    method: 'POST',
    headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${SYNDICATE_API_KEY}`
      },
    body: JSON.stringify({args:{
        request: {
            schema: "0x6e333418327e1082bc2c5366560c703b447901a4b8d4ca9c754e9a8460eedbde",
            AttestationRequestData: { 
                recipient: "0xFdB1636C17DBC312f5E48625981499a4a179d6f0",
                expirationTime: 0,
                revocable: true,
                refUID: "0x0000000000000000000000000000000000000000000000000000000000000000",
                data: encodedData,
                value: 0
            }
        }}
    ,"chainId":8453
    ,"contractAddress":"0x4200000000000000000000000000000000000021"
    ,"functionSignature":"attest((bytes32 schema, (address recipient, uint64 expirationTime, bool revocable, bytes32 refUID,bytes data, uint256 value ) AttestationRequestData) request)"
    })
  };

console.log(options)
  
const eas_response = await fetch('https://api.syndicate.io/transact/sendTransaction', options)
console.log(await eas_response.text())
