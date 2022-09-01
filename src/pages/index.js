import React from "react"

import RocketSmoke from "../components/Animations/RocketSmoke"

import { Grid, Card, Typography, Button } from "@mui/material"

export default class Index extends React.Component { 

    constructor(props) {
        super(props);
        this.state = {
            width: 0,
            height: 0
        };
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this)   
    }

    updateWindowDimensions() {
        this.setState({ width: window.innerWidth, height: window.innerHeight });
      }

    componentDidMount() {
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);


    }
    
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWindowDimensions);
        
    }
     
    render() {

        return (
            <div>
                <div>
                    <Grid alignItems="center" container >
                        <Grid item xs={12} sm={12} md={6} style={{padding: "5%"}}>
                            <Typography variant={this.state.width > 340 ? "h2" : "h4"} align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}>  Bergquist Applications </Typography>
                            <Typography variant={this.state.width > 340 ? "h4" : "h5"} align="center" style={{fontFamily: "Chango", color: "#3F3D56", padding: "5%"}}>  Blockchain Development </Typography>
                        </Grid>
                        <Grid item xs={12} sm={12} md={6} >
                            <RocketSmoke  />
                        </Grid>
                    </Grid>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: 40}}>  Web applications built on Algorand </Typography>
                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: 40}}>  for decentralized business finance </Typography>
                    <br />
                    <div style={{backgroundColor: "#3F3D56", padding: "5%"}}>
                        <Button component={Card} onClick={() => window.open("https://www.algorand.com/")} style={{display: "block", margin: "auto", border: "1px solid #E6E6E6", borderRadius: 15, height: "100%", width: "90%", padding: "5%"}}>
                            <br />
                            <Typography variant={this.state.width > 400 ? "h2" : "h4"} align="center" style={{fontFamily: "Chango", color: "#E6E6E6"}}>  Algorand  </Typography>
                            <br />
                            <img src="AlgoWhite.svg" alt="Algo" style={{height: 50, display: "flex", margin: "auto"}} />
                            <br />
                            <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Hold and transact digital assets without the need of a central authority </Typography>
                            <br />
                            <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Participate in applications through a decentralized database   </Typography>
                            <br />
                            <Typography variant="h6" align="center" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Unlock the borderless economy on an environmentally sustainable blockchain </Typography>
                            <br />

                        </Button>
                        <br />
                    </div>

                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: 40}}>  Decentralized Data </Typography>

                    <Grid alignItems="center" container style={{padding: 40, paddingTop: 0, paddingBottom: 0}}>
                        <Grid item xs={12} sm={12} md={6}>
                            <img src="index/Assets.svg" alt="Assets" style={{display: "flex", margin: "auto", padding: "5%"}} />
                        </Grid>
                        <Grid item xs={12} sm={12} md={6}>
                            <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: 40, marginLeft: "5%", marginRight: "5%"}}>  Users keep valuable data in their wallets </Typography>
                            <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: 40, marginLeft: "5%", marginRight: "5%"}}>  with options to sell out at any moment </Typography>
                            <Button onClick={() => window.location.href="/how"} style={{display: "flex", margin: "auto", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15}}> 
                            <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> How it works </Typography>
                            </Button>
                            <br />
                            <br />
                        </Grid>
                    </Grid>
                    <div style={{backgroundColor: "#3F3D56", padding: 40}}>
                        <br />
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6"}}>  Building a business on a blockchain incentives early support for people who believe in the product  </Typography>
                        <br />
                        <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6"}}>  and creates transparency between the customer and the business  </Typography>
                        <br />
                    </div>
                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}>  Get Started  </Typography>
                    <Grid alignItems="center" container style={{}}>
                        <Grid item xs={12} sm={6} md={6}>
                            <img src="RocketAlgo.svg" alt="Assets" style={{display: "flex", margin: "auto", padding: "5%", maxHeight: 400}} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                            <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}>  Contact Bergquist Applications today to explore options for business or personal success  </Typography>
                            <Button onClick={() => window.location.href="/contact"} style={{display: "flex", margin: "auto", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15}}> 
                            <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Contact </Typography>
                            </Button>
                            <br />
                            <br />
                        </Grid>
                    </Grid>       
                </div>
            </div>
        )
    }
}