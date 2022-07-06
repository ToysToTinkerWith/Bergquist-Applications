
import React, { useEffect } from "react"

import algosdk from "algosdk"

import Head from "next/head"

import dynamic from "next/dynamic"

const Algo = dynamic(() => import("../components/Algo/Algo"), {ssr: false})

import HomeAni from "../components/Animations/HomeAni"

import { Typography, Card, Grid, Button } from "@mui/material"

export default class Team extends React.Component{

    render() {
        return (
            <div >
                <Head>
                    <title>The Team</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="description" content="Meet the developer behind Bergquist Applications." />
                    <meta name="keywords" content="Developer, CEO, Owner" />
                    
                    
                    </Head>
                
                    <Typography variant="h2" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}>  The Team </Typography>

                    <Grid container alignItems="center">
                        <Grid item xs={12} sm={8} md={8}>

                        <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Meet the Developer </Typography>


                        </Grid>
                        <Grid item xs={12} sm={4} md={4} >
                        <img src="Developer.svg" alt="Developer" style={{padding: 40, width: "100%"}} />

                        </Grid>
                    </Grid>

                    
                    
                    <Grid container alignItems="center">
                        <Grid item xs={12} sm={6} md={6}>
                        
                        <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: "#3F3D56", padding: 20}}> CEO </Typography>

                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Anders Bergquist </Typography>

                        <img src="Anders.jpg" alt="Anders" style={{padding: "5%", width: "100%", borderRadius: 50}} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} >
                        <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Anders is responsible for the satisfaction of all Bergquist Applications, he also has a keen interest in creating new and insightful features as he continues to build on modern web frameworks. </Typography>
                        <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Through modern web development research, Anders has founded Bergquist Applications, a company that aims to revolutionize the way we interact with the web. </Typography>

                        </Grid>
                    </Grid>

                    <div style={{backgroundImage: "url('Space.svg')", backgroundSize: "100%", display: "flex"}}>
                        <Grid container>
                            <Grid item xs={12} sm={12} md={6}>
                                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> My Data </Typography>
                                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Presented by Algorand </Typography>
                                <img src="./AlgoWhite.svg" alt="Design" style={{display: "flex", margin: "auto", width: "20%", padding: 10}}/>
                                <br />
                                <Button onClick={() => window.open("https://www.algorand.com/")} style={{display: "flex", margin: "auto", backgroundColor: "#E6E6E6", padding: 10, borderRadius: 15}}> 
                                    <Typography variant="h6" style={{fontFamily: "Chango", color: "#3F3D56"}}> Learn More </Typography>
                                </Button>
                                <br />
                                <br />

                            </Grid>
                            <Grid item xs={12} sm={12} md={6} style={{position: "relative", height: 500}}>
                                <Algo />
                            </Grid>

                        </Grid>
                    </div>

                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: 40}}>  Get Started  </Typography>

                    <Grid alignItems="center" container style={{}}>
                        <Grid item xs={12} sm={12} md={6}>
                        <HomeAni />
                        </Grid>
                        <Grid item xs={12} sm={12} md={6}>
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}>  Contact Bergquist Applications today to explore options for business or personal success  </Typography>

                        <Button onClick={() => window.location.href="/contact"} style={{display: "flex", margin: "auto", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15}}> 
                        <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Contact </Typography>
                        </Button>
                        <br />
                        <br />


                        </Grid>
                    </Grid>



                
                
            </div>
            
        )
    }
    
}