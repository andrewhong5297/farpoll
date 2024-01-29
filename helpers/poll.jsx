import satori from "satori";
import sharp from 'sharp';

//this should take a cast hash, then query Dune to get the poll results as a json array. Then displays them.
export async function create_image(show_results = false, cast_hash=null) {
    const fontPath = join(process.cwd(), 'Roboto-Regular.ttf')
    let fontData = fs.readFileSync(fontPath)
    let pollData = []
    if (cast_hash !== null) {
        //make dune query
        pollData = []
    } else {
        //hardcoded poll options
        pollData = [
            {text: '1 year', percentOfTotal: 0},
            {text: '2 year', percentOfTotal: 0},
            {text: '4 year', percentOfTotal: 0},
            {text: '8 year', percentOfTotal: 0}
        ]
    }

    //get cast from neynar, split on first question mark and take from the first part only
    const title = "How long until we have 1B users onchain every month?"

    const svg = await satori(
        <div style={{
            justifyContent: 'flex-start',
            alignItems: 'center',
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: 'f4f4f4',
            padding: 50,
            lineHeight: 1.2,
            fontSize: 24,
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 20,
            }}>
                <h2 style={{textAlign: 'center', color: 'lightgray'}}>{title}</h2>
                {
                    pollData.map((opt, index) => {
                        return (
                            <div style={{
                                backgroundColor: show_results ? '#007bff' : '',
                                color: '#fff',
                                padding: 10,
                                marginBottom: 10,
                                borderRadius: 4,
                                width: `${show_results ? opt.percentOfTotal : 100}%`,
                                whiteSpace: 'nowrap',
                                overflow: 'visible',
                            }}>{opt.text}</div> //opt.text is the option text
                        )
                    })
                }
            </div>
        </div>
        ,
        {
            width: 600, height: 400, fonts: [{
                data: fontData,
                name: 'Roboto',
                style: 'normal',
                weight: 400
            }]
        }
        )

    // Convert SVG to PNG using Sharp
    const pngBuffer = await sharp(Buffer.from(svg))
        .toFormat('png')
        .toBuffer();

    return pngBuffer;
}