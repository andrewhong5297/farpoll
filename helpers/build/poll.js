import satori from "satori";
import sharp from 'sharp';
import { join } from 'path';
import * as fs from "fs";
import React from "react";

//this should take a cast hash, then query Dune to get the poll results as a json array. Then displays them.
export async function create_image(show_results = false, cast_hash = null) {
  const fontPath = join(process.cwd(), 'helpers', 'Roboto-Regular.ttf');
  let fontData = fs.readFileSync(fontPath);
  let pollData = [];
  if (cast_hash !== null) {
    //make dune query
    pollData = [];
  } else {
    //hardcoded poll options
    pollData = [{
      text: '3.14',
      percentOfTotal: 0
    }, {
      text: '42',
      percentOfTotal: 0
    }, {
      text: '69',
      percentOfTotal: 0
    }, {
      text: '1337',
      percentOfTotal: 0
    }];
  }

  //get cast from neynar, split on first question mark and take from the first part only
  const title = "Pick your favorite number, it shall forever be onchain"; //"How long until we have 1B users onchain every month?"

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
  }, title), pollData.map((opt, index) => {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        backgroundColor: show_results === 'true' ? '#007bff' : '',
        color: '#fff',
        padding: 10,
        marginBottom: 10,
        borderRadius: 4,
        width: `${show_results === 'true' ? opt.percentOfTotal : 100}%`,
        whiteSpace: 'nowrap',
        overflow: 'visible'
      }
    }, opt.text) //opt.text is the option text
    ;
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