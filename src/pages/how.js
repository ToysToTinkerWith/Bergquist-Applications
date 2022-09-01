
import React from "react"

import DevFrameworks from "../components/Animations/DevFrameworks"

import { Typography, Card, Grid, TextField, Button, Avatar } from "@mui/material"

export default class How extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {}
    }
    
    render() {
        return (
            <div>
                <Typography variant="h2" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}>  How it Works </Typography>
                <Grid container>
                    <Grid item xs={12} sm={12} md={6}>
                        <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: "#3F3D56", padding: "5%"}}>  In Short </Typography>
                        <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}>  Modern Development Frameworks </Typography>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} >
                        <DevFrameworks />
                    </Grid>
                </Grid>
                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}> Bergquist Applications uses a <b style={{color: "#24CCFF"}}>React</b> Framework called <b style={{color: "#3F3D56"}}>Next.js</b> to build the application</Typography>
                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}> with cutting edge blockchain technology as a database and payment infrastructure </Typography>
                <div style={{backgroundColor: "#3F3D56"}}>
                    <Typography variant="h2" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}>  Why Algorand? </Typography>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}>  Bergquist Applications chooses to build on Algorand because of its proof in performance </Typography>
                    <Button component={Card} onClick={() => window.open("https://algoexplorer.io/")} style={{display: "block", margin: "auto", border: "1px solid #E6E6E6", borderRadius: 15, height: "100%", width: "90%"}}>
                        <br />
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6"}}>  Blockchain Statistics  </Typography>
                        <br />
                    </Button>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: 40, paddingBottom: 0}}> With transaction finality in less than 5 seconds  </Typography>
                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: 40, paddingBottom: 0}}> Algorand positions itself to be the backbone of the worlds economy  </Typography>

                    <br />
                    <br />
                </div>
                <br />
                <br />
                <Grid container align="center">
                    <Grid item xs={12} sm={12} md={8}>
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Create digital assets for wallets to transact for </Typography>
                        <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}>  and offer benefits to those who support the business  </Typography>
                    </Grid>
                    <Grid item xs={12} sm={12} md={4} >
                        <img src="how/DataHands.svg" alt="DataHands" style={{padding: 40, maxHeight: 400}} />
                    </Grid>
                </Grid>
                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> The value of the digital assets appreciate with the value of the business </Typography>
                <Typography variant="h2" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> rewarding supporters and early adopters </Typography>

                <br />
                <br />
                <div style={{backgroundColor: "#3F3D56"}}>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: 40, paddingBottom: 0}}> With the best of blockchain technology </Typography>
                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> build scalable decentralized applications for business marketing and management </Typography>
                    <br />
                    <Button onClick={() => window.location.href="/services"} style={{display: "flex", margin: "auto", backgroundColor: "#FF6584", padding: 10, borderRadius: 15}}> 
                        <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Services </Typography>
                    </Button>
                    <br />
                    <br />
                </div>
                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: 40}}>  Get Started  </Typography>
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