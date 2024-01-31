// run "npm run build" to compile this file to helpers/poll.js
import satori from "satori";
import sharp from 'sharp';
import { join } from 'path';
import * as fs from "fs";
import React from "react";
import { get_poll_data } from "./dune.js";
import { parse_cast } from "./neynar.js";

//this should take a cast hash, then query Dune to get the poll results as a json array. Then displays them.
export async function create_image(show_results = false, cast_hash = null) {
  // cast_hash = '0x7065681cfd13c093706f77f34d32fe2c0e87d6c6' //test for parsing
  //get cast from neynar
  const results = await parse_cast(cast_hash);
  // console.log(results)
  let pollData = results.options.map((option, index) => ({
    text: option,
    percentOfTotal: 0,
    votes: 0,
    key: index
  }));
  const question = results.question;
  if (cast_hash !== null && show_results === 'true') {
    //get poll data from Dune 
    pollData = await get_poll_data(cast_hash, pollData);
  }

  // console.log(pollData)
  const fontPath = join(process.cwd(), 'helpers', 'Roboto-Regular.ttf');
  const fontData = fs.readFileSync(fontPath);
  const svg = await satori( /*#__PURE__*/React.createElement("div", {
    style: {
      justifyContent: 'flex-start',
      alignItems: 'center',
      display: 'flex',
      width: '100%',
      height: '100%',
      backgroundColor: 'f4f4f4',
      padding: 50,
      lineHeight: 1.2,
      fontSize: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      textAlign: 'center',
      color: 'lightgray'
    }
  }, question), pollData.map(opt => {
    return /*#__PURE__*/React.createElement("div", {
      key: opt.key,
      style: {
        // Add key prop
        display: 'flex',
        justifyContent: 'space-between',
        backgroundColor: '',
        color: '#fff',
        width: '100%'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: `${show_results === 'true' ? opt.percentOfTotal : 100}%`,
        backgroundColor: show_results === 'true' ? '#007bff' : '',
        padding: 10,
        marginBottom: 10,
        borderRadius: 4,
        whiteSpace: 'nowrap',
        overflow: 'visible'
      }
    }, opt.text), /*#__PURE__*/React.createElement("span", {
      style: {
        padding: 10,
        marginBottom: 10,
        borderRadius: 4,
        whiteSpace: 'nowrap',
        overflow: 'visible'
      }
    }, show_results === 'true' ? opt.votes + ' votes' : ''));
  }))), {
    width: 600,
    height: 400,
    fonts: [{
      data: fontData,
      name: 'Roboto',
      style: 'normal',
      weight: 400
    }]
  });

  // Convert SVG to PNG using Sharp
  const pngBuffer = await sharp(Buffer.from(svg)).toFormat('png').toBuffer();
  return pngBuffer;
}