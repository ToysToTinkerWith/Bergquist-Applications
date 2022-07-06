import React from "react"
import firebase from "firebase/app"
import "firebase/firestore"

import { motion } from "framer-motion"



import { Typography, Button, Card, Avatar, IconButton, Input } from "@mui/material"


class Asset extends React.Component {
  constructor() {
    super()
    this.state = {
      assetUrl: null
    }
    this.getipfsdata - this.getipfsdata.bind(this)

  }


  async componentDidMount() {

    const response = await fetch('/api/handler', {
      method: "POST",
      body: JSON.stringify({
        assetId: this.props.assetId
      }),
      headers: {
        "Content-Type": "application/json",
      }
        
    });
  
    const session = await response.json()

    let asset = session.asset


    if (asset.url) {

      console.log(asset)

      
      if (asset.url.substring(0, 7) == "ipfs://") {
        asset.url = "https://ipfs.io/ipfs/" + asset.url.slice(7)
        if (asset["unit-name"] == "thegov2") {
          this.getipfsdata(asset.url)
          
        }
      }

      else if (asset.url.substring(0, 34) == "https://gateway.pinata.cloud/ipfs/") {
        asset.url = "https://ipfs.io/ipfs/" + asset.url.slice(34)
      }

      else if (asset.url.substring(0, 20) == "https://tinyurl.com/") {
        asset.url = null
      }

    }

    

    if (asset.total < 20000 && asset["unit-name"] != "NFD") {
      this.setState({
        asset: asset,
        assetUrl: asset.url
      })
    }


  }

  async getipfsdata(link) {
    await fetch(link)
    .then((response) => response.json()) //2
    .then((data) => {
      let url = data["image"]
      let newUrl = "https://ipfs.io/ipfs/" + url.slice(7)
      this.setState({assetUrl: newUrl})
    })

    
  }


  render() {

    if (this.state.assetUrl) {

      if (this.state.asset["unit-name"] == "tiny" || this.state.asset["unit-name"] == "SEAWILL") {
        console.log("here")
        try {
          return (
            <Button component={motion.div} animate={{rotate: 360}} transition={{duration: 10, delay: this.props.index, repeat: Infinity}} onClick={() => window.open(this.state.assetUrl)} style={{position: "absolute", left: "40%", originY: 3}}>
    
              <motion.video animate={{rotate: -360}} transition={{duration: 10, delay: this.props.index, repeat: Infinity}} src={this.state.assetUrl} style={{height: 50}} />
    
            </Button>
    
            )
        }

        catch {
          return (
            <div>
            </div>
    
            )
        }
        
      }

      else {
        try {
          return (
            <Button component={motion.div} animate={{rotate: 360}} transition={{duration: 10, delay: this.props.index, repeat: Infinity}} onClick={() => window.open(this.state.assetUrl)} style={{position: "absolute", left: "40%", originY: 3}}>
    
              <motion.img animate={{rotate: -360}} transition={{duration: 10, delay: this.props.index, repeat: Infinity}} src={this.state.assetUrl} style={{height: 50}} />
    
            </Button>
    
            )
        }

        catch {
          <div>
          </div>
        }
        
      }

      
    }

    else {
      return (
        <div>

        </div>

        )
    }
      
        
      
      
        
      }
      
}

export default Asset