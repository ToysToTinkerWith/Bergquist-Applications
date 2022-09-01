
import React, { useEffect } from "react"

import Head from "next/head"

import { Typography, Grid, Button } from "@mui/material"

export default class Home extends React.Component{

    constructor(props) {
        super(props)
        this.state = {
            activeAddress: null,
            walletType: null,
            addresses: [],
            algousdc: 0,
            dersalgo: 0

        }
        this.handleChange = this.handleChange.bind(this)
    }

    async componentDidMount() {

        const response = await fetch('/api/prices', {
            method: "POST",
            body: JSON.stringify({
              assetId: this.props.assetId
            }),
            headers: {
              "Content-Type": "application/json",
            }
              
          });

          const session = await response.json()

        let algoUsdc = session.usdcInfo.account.amount
        let usdc
        session.usdcInfo.account.assets.forEach((asset) => {
            if (asset["asset-id"] == "31566704") {
                usdc = asset.amount
            }
        })
        
        let algoPrice = usdc/algoUsdc

        let algoDers = session.dersInfo.account.amount
        let ders
        session.dersInfo.account.assets.forEach((asset) => {
            if (asset["asset-id"] == "846652486") {
                ders = asset.amount
            }
        })

        let dersPrice = ders/algoDers

        this.setState({
            algousdc: algoPrice,
            dersalgo: dersPrice
        })

        
    }

   

    handleChange(event) {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    if (value < 0) {
        value = 0
    }

    this.setState({
    [name]: value
    });
    }

    render() {

        return (
            <div>

                    <br />
                    <div style={{backgroundColor: "#3F3D56"}}>
                        <Typography variant="h2" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> {this.state.algousdc.toFixed(2)} USDC = 1 ALGO = {String(parseInt(this.state.dersalgo))} DERS</Typography> 
                    </div>
                    <br />

                    <Grid container align="center" alignItems="center" >
                        <Grid item xs={12} sm={12} md={6}>
                            <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                                Swap for Ders Coin
                            </Typography>
                            <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                                Ders Coin is accepted at a 20% discount for any Bergquist Application product
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={12} md={6}  >
                            <img src="DersCoin.svg" alt="Ders" style={{height: 200}} />
                            <br />
                            <br />
                            <Button onClick={() => window.open("https://app.tinyman.org/#/swap?asset_in=0&asset_out=846652486")} style={{display: "flex", margin: "auto", backgroundColor: "#F2FE67", padding: 20, borderRadius: 15}}> 
                            <img src="algorand/Tinyman.svg" alt="Tinyman" style={{height: 50}} />

                            </Button>
                        </Grid>
                        
                    </Grid>
                    <br />
                    <div style={{backgroundColor: "#3F3D56"}}>
                        <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Bergquist Applications charges 50 USDC / hr</Typography> 
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> that is {(50 * (1 / this.state.algousdc)).toFixed(2)} ALGO / hr </Typography> 
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> or {parseInt(40 * (this.state.dersalgo))} DERS / hr </Typography> 
                    </div>
                    <br />

                    <Grid container align="center" alignItems="center">
                        <Grid item xs={12} sm={12} md={6}>
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                            Swap for a Bergquist Applications Moon NFT
                        </Typography>
                       
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                            Moon NFT holders recieve a 20% discount on Bergquist Applications products
                        </Typography>
                        <br />
                        </Grid>
                        <Grid item xs={12} sm={12} md={6}  >
                        <img src="algorand/Moon.png" alt="MoonNFT" style={{display: "flex", margin: "auto", width: "100%", borderRadius: 15, maxWidth: 300, padding: 10}}/>
                        <br />
                        <Button onClick={() => window.open("https://www.algogems.io/nft/789922101/sale/789923520")} style={{display: "flex", margin: "auto", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15}}> 
                            <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Moon </Typography>
                        </Button>
                        <br />
                        
                        </Grid>
                        
                    </Grid>
                    <br />
                    <div style={{backgroundColor: "#3F3D56"}}>
                        <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Moon Holders are charged 40 USDC / hr</Typography> 
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> that is {(40 * (1 / this.state.algousdc)).toFixed(2)} ALGO / hr </Typography> 
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> or {parseInt(30 * (this.state.dersalgo))} DERS / hr </Typography> 
                    </div>
                    <br />

            </div>
            
        )
    }
    
}