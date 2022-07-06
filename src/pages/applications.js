
import React from "react"

import Head from "next/head"

import { Typography, Card, Grid, Button } from "@mui/material"

import HomeAni from "../components/Animations/HomeAni"


export default class Applications extends React.Component {
   
    render() {
        return (
            <div>
                <Head>
                    <title>Applications</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="description" content="Applications ongoing or completed, being built and maintained by Bergquist Applications." />
                    <meta name="keywords" content="Websites, Clients, Real World Businesses, Examples" />
    
                    
                    </Head>

                    <Typography variant="h2" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", paddingTop: 40, paddingBottom: 40}}>  Applications </Typography>


                <Grid container >
                    <Grid item xs={12} sm={8} md={8}>

                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}>  Built by Bergquist Applications </Typography>

                    </Grid>
                    <Grid item xs={12} sm={4} md={4} >
                    <img src="Applications.svg" alt="Firebase" style={{padding: 40, width: "100%"}} />

                    </Grid>
                </Grid>
               
                                        <br />
    
                    <Typography variant="h3" align="center" color="secondary" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Datagnome </Typography>
    
                    <Grid container alignItems="center">
                    <Grid item xs={12} sm={12} md={6}>
                        <Button style={{display: "grid"}} onClick={() => window.open("https://data-gnome.com/")}>
                        <img src="/DataGnome.png" style={{display: "flex", margin: "auto", width: "80%"}}/>
                        <Typography variant="h6" align="center" color="secondary" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> data-gnome.com </Typography>

                        </Button>

                        </Grid>
                        <Grid item xs={12} sm={12} md={6} >
                            
                            <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                            DataGnome is the next generation of plant monitoring. The business produces smart plant sensors, that not only monitors plant health, but also helps the grower understand the cause of any problems the plants might be having.
                            
                            </Typography>
                            
                            
    
    
                        </Grid>
                        
                    </Grid>

                    <div style={{backgroundColor: "#3F3D56"}}>

                    <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                    The web application serves to inform the client about the Datagnome product, and ultimately lead the customer to a point of sale. Bergquist Applications had the privillage or working with the CEO of Datagnome, Kaylin Hartley, and a professional content creator, Terra Johnson. Together, we produced a beautiful application, that is still evolving to better suit the needs of Datagnome.
                    </Typography>

                    <br />
    
                    <Button variant="contained" color="secondary" href="mailto:terra@joycodigital.com" style={{margin: 40, marginTop: 0}} >
                    <Typography  variant="h6" align="center"  style={{fontFamily: "Chango", color: "#E6E6E6"}}> 
                    terra johnston
                    </Typography>
                    </Button>
                    <br />
                    <br />
    
                    </div>
                    <br />
    
                    <Typography variant="h3" align="center" color="secondary" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Bluebird Enterprises </Typography>
    
                    <Grid container alignItems="center">
                    <Grid item xs={12} sm={12} md={6}>
                        <Button style={{display: "grid", width: "100%"}} onClick={() => window.open("https://bluebirdyoutube.com/")}>
                        <img src="/Bluebird.png" style={{display: "flex", margin: "auto", width: "80%"}}/>
                        <Typography variant="h6" align="center" color="secondary" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> bluebirdyoutube.com </Typography>

                        </Button>
    
                        
                        </Grid>
                        <Grid item xs={12} sm={12} md={6} >
                            
                            <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                            Bluebird Enterprises is custom automobile fabrication and engineering. The Youtuber, Anthony Kovic, designs, manufactures, and installs automotive technology, systems, and builds. 
                            
                            </Typography>
                            
                            
    
    
                        </Grid>
                        
                    </Grid>

                    <div style={{backgroundColor: "#3F3D56"}}>

                    <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> 
                    The web application serves to reinforce the brand of Bluebird Enterprises, and to highlight the work done in the company. Bergquist Applications pulls data from the Bluebird Enterprises YouTube Channel, to display in an exciting fashion that fits the language of Bluebird Enterprises. The CEO, and long time friend, Anthony Kovic, is very much aware of the power of video in the current digital age.
                    </Typography>
                    <br />
    
                    <Button variant="contained" color="secondary" style={{margin: 40, marginTop: 0}} onClick={() => window.open("https://www.youtube.com/channel/UCBHgoZGid_dlZ48bZy9VNsQ")}>
                    <Typography variant="h6" align="center"  style={{fontFamily: "Chango", color: "#E6E6E6"}}> 
                    Bluebird Enterprises YouTube
                    </Typography>
                    </Button>

                    </div>
                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: "5%"}}>  Get Started  </Typography>

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