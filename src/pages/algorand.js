
import React, { useEffect } from "react"

import Head from "next/head"

import Home from "../components/Algorand/Home"
import Contracts from "../components/Algorand/Contracts"


import { Typography, Grid, Button } from "@mui/material"

export default class Algorand extends React.Component{

    constructor(props) {
        super(props)
        this.state = {
            page: "home"

        }
    }

    render() {

        return (
            <div>
                <Head>
                    <title>Algorand</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="description" content="Bergquist Applications builds web applications on the Algorand Blockchain. See how you can get a piece of the business and support Algorand development. Help Bergquist Applications improve by purchasing a Moon NFT." />
                    <meta name="keywords" content="Algorand, Algo, NFT, Support, Web3" />
                </Head>

                <Typography variant="h2" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40, paddingBottom: 20}}> Algorand </Typography> 
                <br />
                <Grid container align="center">
                    <Grid item xs={12} sm={6} md={6}>
                        <Button onClick={() => this.setState({page: "home"})}>
                            <Typography 
                            variant="h5" 
                            align="center" 
                            style={{
                                fontFamily: "Chango", 
                                color: "#E6E6E6", 
                                borderBottom: this.state.page == "home" ? "3px solid #FF6584" : null, 
                                padding: 10,
                                
                            }}
                            > 
                                Home 
                            </Typography>
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={6}>
                        <Button onClick={() => this.setState({page: "contracts"})}>
                            <Typography 
                            variant="h5" 
                            align="center" 
                            style={{
                                fontFamily: "Chango", 
                                color: "#E6E6E6", 
                                borderBottom: this.state.page == "contracts" ? "3px solid #FF6584" : null, 
                                padding: 10,
                                
                            }}
                            > 
                                Contracts 
                            </Typography>
                        </Button>
                    </Grid>
                </Grid>
                <br />

                {this.state.page == "home" ?
                    <Home />
                    :
                    null
                }

                {this.state.page == "contracts" ?
                    <Contracts />
                    :
                    null
                }
                
                <br />
                <Grid container align="center">
                    <Grid item xs={12} sm={6} md={6}>
                        <Button onClick={() => this.setState({page: "home"})}>
                            <Typography 
                            variant="h5" 
                            align="center" 
                            style={{
                                fontFamily: "Chango", 
                                color: "#E6E6E6", 
                                borderBottom: this.state.page == "home" ? "3px solid #6C63FF" : null, 
                                padding: 10,
                                
                            }}
                            > 
                                Home 
                            </Typography>
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={6}>
                        <Button onClick={() => this.setState({page: "contracts"})}>
                            <Typography 
                            variant="h5" 
                            align="center" 
                            style={{
                                fontFamily: "Chango", 
                                color: "#E6E6E6", 
                                borderBottom: this.state.page == "contracts" ? "3px solid #6C63FF" : null, 
                                padding: 10,
                                
                            }}
                            > 
                                Contracts 
                            </Typography>
                        </Button>
                    </Grid>
                </Grid>
                <br />
                <br />

                    

                    
            </div>
            
        )
    }
    
}