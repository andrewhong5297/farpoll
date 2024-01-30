import dotenv from 'dotenv';
dotenv.config();

import { QueryParameter, DuneClient } from "@cowprotocol/ts-dune-client";
import { Headers } from 'node-fetch';
import fetch from 'node-fetch';

// //QA only
// let poll_data = [
//     {text: '3.14', percentOfTotal: 0, votes: 0},
//     {text: '42', percentOfTotal: 0, votes: 0},
//     {text: '69', percentOfTotal: 0, votes: 0},
//     {text: '1337', percentOfTotal: 0, votes: 0}
// ]
// const cast_hash = "0xdf95758ae0435328978871bf9960a5a8aba3010d"
// //QA only

const DUNE_API_KEY = process.env["DUNE_API_KEY"];

export async function get_poll_data(cast_hash, poll_data) {
    // try latest, and then refresh if latest doesn't work. TODO: add latest results endpoint to sdk
    // eas dune query: https://dune.com/queries/3389839
    let results = null
    try{
        const meta = {
            "x-dune-api-key": DUNE_API_KEY
        };
        const header = new Headers(meta);
        const latest_response = await fetch('https://api.dune.com/api/v1/query/3389839/results', { //TODO add in cast hash in param
            method: 'GET',
            headers: header,
        });

        const body = await latest_response.text();

        //if execution is stale, refresh it
        const executionEndedAt = JSON.parse(body).execution_ended_at;
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        if (executionEndedAt < fiveMinutesAgo) {
            throw new Error("Execution ended more than five minutes ago.");
        } else {
            results = JSON.parse(body).result.rows[0].results;
        }
    } catch (error) {
        console.log(error)
        const client = new DuneClient(DUNE_API_KEY ?? "");
        const queryID = 3389839;
        const parameters = [
            QueryParameter.text("cast_hash", cast_hash)
        ];

        const response = await client.refresh(queryID, parameters)
        results = response.result?.rows[0].results
    }

    // Iterate through poll_data and replace percentOfTotal values with the same index from results
    if (results.length == 0) {
        console.log("No results for this cast hash");
        return poll_data;
    } else {
        for (let i = 0; i < poll_data.length; i++) {
            poll_data[i].percentOfTotal = JSON.parse(results[i]).percentOfTotal;
            poll_data[i].votes = JSON.parse(results[i]).votes;
        }
    }
    // console.log(poll_data)
    return poll_data
}

