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
// const cast_hash = "0x27f8122fa7e4fdf22beafce0ff38eead51c644f3"
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
        const latest_response = await fetch(`https://api.dune.com/api/v1/query/3389839/results?params.cast_hash=${cast_hash}`, {
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
            results = JSON.parse(body)?.result?.rows[0].results;
        }
    } catch (error) {
        // console.log(error)
        const client = new DuneClient(DUNE_API_KEY ?? "");
        const queryID = 3389839;
        const parameters = [
            QueryParameter.text("cast_hash", cast_hash)
        ];

        const response = await client.refresh(queryID, parameters)
        results = response?.result?.rows[0].results
    }

    // Iterate through poll_data and replace percentOfTotal values with the same index from results
    if (results == null) {
        // console.log("No results for this cast hash");
    } else {
        results.sort((a, b) => {
            const buttonA = JSON.parse(a).button;
            const buttonB = JSON.parse(b).button;
            return buttonA - buttonB;
        });
        for (let i = 0; i < results.length && i < poll_data.length; i++) {
            poll_data[i].percentOfTotal = JSON.parse(results[i]).percentOfTotal;
            poll_data[i].votes = JSON.parse(results[i]).votes;
        }
    }
    // console.log(poll_data)
    return poll_data
}

