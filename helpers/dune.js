import dotenv from 'dotenv';
dotenv.config();

import { QueryParameter, DuneClient } from "@cowprotocol/ts-dune-client";
import { Headers } from 'node-fetch';
import fetch from 'node-fetch';

const DUNE_API_KEY = process.env["DUNE_API_KEY"];

export async function get_poll_data(cast_hash, poll_data) {
    //try latest, and then refresh if latest doesn't work. TODO: add latest results endpoint to sdk
    let results = null
    try{
        const meta = {
            "x-dune-api-key": DUNE_API_KEY
        };
        const header = new Headers(meta);
        const latest_response = await fetch('https://api.dune.com/api/v1/query/3389839/results', {
            method: 'GET',
            headers: header,
        });
        //TODO add in cast hash in param

        const body = await latest_response.text();
        results = JSON.parse(body).result.rows[0].results;
    } catch (error) {
        const client = new DuneClient(DUNE_API_KEY ?? "");
        const queryID = 3389839;
        const parameters = [
            QueryParameter.text("cast_hash", cast_hash)
        ];

        const response = await client.refresh(queryID, parameters)
        results = response.result?.rows[0].results
    }

    // Iterate through poll_data and replace percentOfTotal values with the same index from results
    for (let i = 0; i < poll_data.length; i++) {
        poll_data[i].percentOfTotal = JSON.parse(results[i]).percentOfTotal;
        poll_data[i].votes = JSON.parse(results[i]).votes;
    }
    return poll_data
}

