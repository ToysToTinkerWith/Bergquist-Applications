import NextCors from 'nextjs-cors';

import algosdk from "algosdk"


async function prices(req, res) {
   // Run the cors middleware
   // nextjs-cors uses the cors package, so we invite you to check the documentation https://github.com/expressjs/cors

   await NextCors(req, res, {
      // Options
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      origin: '*',
      optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
   });

   // Rest of the API logic
   const indexerClient = new algosdk.Indexer('', 'https://algoindexer.algoexplorerapi.io', '');
    let usdc = "FPOU46NBKTWUZCNMNQNXRWNW3SMPOOK4ZJIN5WSILCWP662ANJLTXVRUKA";
    let usdcInfo = await indexerClient.lookupAccountByID(usdc).do();

    let ders = "V7CBWLTHP6B5H34TVPWNUZW6XDRPP6J3GM725QUWKLMXPP2DFC3JXYEIVM";
    let dersInfo = await indexerClient.lookupAccountByID(ders).do();
    res.json({ usdcInfo: usdcInfo, dersInfo: dersInfo });
   
}

export default prices