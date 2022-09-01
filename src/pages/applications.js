
import React from "react"

import { Typography, Grid, Button } from "@mui/material"

export default class Applications extends React.Component {
   
    render() {
        return (
            <div>
                <Typography variant="h2" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", paddingTop: 40, paddingBottom: 40}}>  Applications </Typography>
                <Grid container alignItems="center">
                    <Grid item xs={12} sm={8} md={8}>
                        <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}>  Built by Bergquist Applications </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4} md={4} >
                        <img src="applications/Applications.svg" alt="Applications" style={{padding: 40, width: "100%", maxHeight: 200}} />
                    </Grid>
                </Grid>
                <br />
                <Typography variant="h3" align="center" color="secondary" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Dark Coin </Typography>
                <Grid container align="center">
                <Grid item xs={12} sm={12} md={6}>
                    <Button style={{display: "grid"}} onClick={() => window.open("https://dark-coin.com/")}>
                    <img src="applications/DarkCoinLogo.svg" alt="DarkCoin" style={{display: "flex", margin: "auto", width: "80%"}}/>
                    <Typography variant="h6" align="center" color="secondary" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> dark-coin.com </Typography>

                    </Button>

                    </Grid>
                    <Grid item xs={12} sm={12} md={6} >
                        
                        <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                        Dark Coin is a community driven crypto project built on the Algorand Blockchain. The project uses DAO NFTs to vote on measures regarding the future of the Dark Coin.
                        
                        </Typography>
                        
                    </Grid>
                    
                </Grid>
                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: "5%"}}>  Get Started  </Typography>

                <Grid alignItems="center" container style={{}}>
                    <Grid item xs={12} sm={12} md={6}>
                    <img src="RocketAlgo.svg" alt="Assets" style={{display: "flex", margin: "auto", padding: "5%", maxHeight: 400}} />

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