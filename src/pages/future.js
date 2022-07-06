
import React, { useEffect } from "react"

import Head from "next/head"

import algosdk from "algosdk"

import dynamic from "next/dynamic"

import Dashboard from "../components/Algo/Dashboard"


const AlgoConnect = dynamic(() => import("../components/Algo/AlgoConnect"), {ssr: false})


import { Typography, Card, Grid, Button, TextField, IconButton } from "@mui/material"

export default class Future extends React.Component{

    constructor(props) {
        super(props)
        this.state = {
            activeAddress: null,
            addresses: []
        }
        this.handleChange = this.handleChange.bind(this)
    }

    componentDidMount() {

        const indexerClient = new algosdk.Indexer('', 'https://algoindexer.algoexplorerapi.io', '');

        (async () => {
            let assetIndex = 789922101;
            let accountInfo = await indexerClient.searchAccounts()
                .assetID(assetIndex).do();

            accountInfo.accounts.forEach((account) => {
                account.assets.forEach((asset) => {
                    if (asset["asset-id"] == assetIndex) {
                        if (asset.amount > 0) {
                            this.setState(prevState => ({
                                addresses: [...prevState.addresses, account.address]
                            }))
                        }
                    }
                })
                
            })
            console.log(accountInfo);
        })().catch(e => {
            console.log(e);
            console.trace();
        });
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
        console.log(this.state)
        return (
            <div>
                <Head>
                    <title>Future</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="description" content="Help Bergquist Applications improve by purchasing a Moon NFT." />
                    <meta name="keywords" content="Algorand, Algo, NFT, Support, Future" />
                    
                    
                    </Head>

                    <Typography variant="h2" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}>  Future </Typography>    
                <div>
                  
                    <Grid container >
                        <Grid item xs={12} sm={12} md={6}>
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                            Purchase a Bergquist Applications Moon NFT
                        </Typography>
                        <Button onClick={() => window.open("https://www.algogems.io/nft/789922101/sale/789923520")} style={{display: "flex", margin: "auto", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15}}> 
                            <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Moon </Typography>
                        </Button>
                        <br />
                        </Grid>
                        <Grid item xs={12} sm={12} md={6}  >
                        <img src={"Moon.png"} alt="MoonNFT" style={{display: "flex", margin: "auto", width: "100%", borderRadius: 15, maxWidth: 300, padding: 10}}/>
                        <br />
                        
                        </Grid>
                        
                    </Grid>

                    <Grid container >
                        <Grid item xs={12} sm={12} md={6}>
                            <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                                Connect with an Algorand Wallet
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={12} md={6}  >
                            <AlgoConnect activeAddress={this.state.activeAddress} setActiveAddress={(account) => this.setState({activeAddress: account})} />
                        </Grid>
                        
                    </Grid>

                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                        Participate in the future of Bergquist Applications
                    </Typography>

                    {this.state.addresses.includes(this.state.activeAddress) ? 
                        <Dashboard walletId={this.state.activeAddress} addresses={this.state.addresses} />
                        :
                        <div>
                            <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#3F3D56", padding: 40}}> 
                            Moon Holders
                            </Typography>
                            <div style={{backgroundImage: "url('Space.svg')", backgroundSize: "100%"}}>

                            <Grid container>
                                <Grid item xs={12} sm={6} md={4}>
                                <Button onClick={() => this.setState({page: "news"})} style={{display: "grid", margin: "auto"}}>
                                    <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                                        News
                                    </Typography>
                                </Button>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                <Button onClick={() => this.setState({page: "governance"})} style={{display: "grid", margin: "auto"}}>
                                    <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                                        Governance
                                    </Typography>
                                </Button>
                                </Grid>
                                {this.props.walletId == "OMHDKCZHDVZWF5WDEUV3T5JVH6UXG2THD26GT62M2VZOWVYN24YAONWUAE" ?
                                <Grid item xs={12} sm={6} md={4}>
                                    <Button onClick={() => this.setState({page: "admin"})} style={{display: "grid", margin: "auto"}}>
                                    <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                                        Admin
                                    </Typography>
                                    </Button>
                                </Grid>
                                :
                                null
                                }
                            
                        </Grid>
                        </div>
                        <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: "#3F3D56", padding: 40}}> 
                        Must be connected to an Algorand Wallet and own a Moon NFT to participate
                        </Typography>
                        </div>
                    }
                    
                    
                </div>
            </div>
            
        )
    }
    
}