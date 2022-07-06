import React from "react"
import firebase from "firebase/app"
import "firebase/firestore"

import algosdk from "algosdk"

import dynamic from "next/dynamic"


const Asset = dynamic(() => import("./Asset"), {ssr: false})


import { Typography, Button, Card, Avatar, IconButton, Input } from "@mui/material"


class Algo extends React.Component {
  constructor() {
    super()
    this.state = {
      assetIds: [],
      imgUrl: null
    }

  }


  componentDidMount() {
    const indexerClient = new algosdk.Indexer('', 'https://algoindexer.algoexplorerapi.io', '');
    (async () => {
      let acct = "OMHDKCZHDVZWF5WDEUV3T5JVH6UXG2THD26GT62M2VZOWVYN24YAONWUAE";
      let accountInfo = await indexerClient.lookupAccountAssets(acct).do();
      accountInfo.assets.forEach(async (asset) => {
        console.log(asset)
        if (asset.amount < 1001 && asset.amount > 0) {
          this.setState(prevState => (({
            assetIds: [...prevState.assetIds, asset["asset-id"]]
          })))
        }
        
        
        })

      
      
  })().catch(e => {
      console.log(e);
      console.trace();
  });


  }


  render() {
console.log(this.state)
      return (
   
        <div style={{paddingTop: 40}}>
          <Button onClick={() => window.open("https://www.algogems.io/gallery/RJWIV.33NLQ/ownedNft")} style={{position: "absolute", width: "100%", top: "30%", left: "auto"}}>
          <img src="./Gem.svg" alt="Design" style={{width: "20%", paddingTop: 40}} />  
          </Button>
          {this.state.assetIds.length > 0 ? this.state.assetIds.map((assetId, index) => {
            return <Asset key={index} index={index} length={this.state.assetIds.length} assetId={assetId}/>
          })
          :
          null
          }
                  
              
          

          
        </div>

       
        )
    
  }
}

export default Algo