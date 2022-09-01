
import React, { useEffect } from "react"

import Head from "next/head"

import dynamic from "next/dynamic"

const AlgoConnect = dynamic(() => import("../Algo/AlgoConnect"), {ssr: false})

import { Typography, Grid, Button } from "@mui/material"

export default class Contract extends React.Component{

    constructor(props) {
        super(props)
        this.state = {
            activeAddress: null,
            walletType: null,
            addresses: []
           

        }
    }

    render() {

        return (
            <div>
                <br />
                <br />
                <Grid container alignItems="center">
                    <Grid item xs={12} sm={12} md={6}>
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40, paddingTop: 0}}> 
                            Connect with an Algorand Wallet
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6}  >
                        <AlgoConnect activeAddress={this.state.activeAddress} setActiveAddress={(account) => this.setState({activeAddress: account})} setWalletType={(walletType) => this.setState({walletType: walletType})}/>
                    </Grid>
                    
                </Grid>
                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#3F3D56", padding: 40, paddingBottom: 20}}> Contracts coming soon! </Typography> 


            </div>
            
        )
    }
    
}