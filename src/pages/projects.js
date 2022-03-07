
import React, { useEffect } from "react"

import Head from "next/head"

import * as gtag from "../../lib/gtag"



import { Typography, Card, Grid, Button } from "@material-ui/core"

export default function Projects(props) {
    useEffect(() => {
        gtag.event({
            action: "Projects Page",
            category: "Page",
            label: "Projects",
            value: "Projects"
        })
      }, [])

    return (
        <div style={{padding: 20}}>
            <Head>
                <title>Projects</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content="Projects ongoing or completed, being built and maintained by Bergquist Applications." />
                <meta name="keywords" content="Websites, Clients, Real World Businesses, Examples" />

                
                </Head>
            
            <Card style={{
                backgroundColor: "#3F3D56",
                borderRadius: "15px",
                boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
                padding: 10,
                marginBottom: 40
            }}
            >
                                    <br />

                <Typography variant="h4" align="left" color="secondary" style={{color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> <b>Datagnome</b> </Typography>

                <Grid container alignItems="center">
                <Grid item xs={12} sm={12} md={6}>
                    <Button style={{margin: 40}} onClick={() => window.open("https://data-gnome.com/")}>
                    <img src="/DataGnome.png" style={{display: "flex", margin: "auto", width: "80%"}}/>

                    </Button>

                    
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} >
                        
                        <Typography variant="body1" style={{color: "#E6E6E6", padding: 20}}> 
                        DataGnome is the next generation of plant monitoring. The business produces smart plant sensors, that not only monitors plant health, but also helps the grower understand the cause of any problems the plants might be having. The sensors use data from the plant itself, and data from its environment, to help you diagnose whatever is wrong, and give the most effective tips for improving the plants’ health. DataGnome is a great fit for any gardeners, growers, and farmers, who want to create a better enviornment for their plants, and improve their yields cycle after cycle.
                        
                        </Typography>
                        
                        


                    </Grid>
                    
                </Grid>
                <Typography variant="body1" style={{color: "#E6E6E6", padding: 20}}> 
                The web application serves to inform the client about the Datagnome product, and ultimately lead the customer to a point of sale. Bergquist Applications had the privillage or working with the CEO of Datagnome, Kaylin Hartley, and a professional content creator, Terra Johnson. Together, we produced a beautiful application, that is still evolving to better suit the needs of Datagnome.
                </Typography>

                <Button variant="contained" color="secondary" href="mailto:terra@joycodigital.com" style={{marginLeft: 40}}>
                <Typography  align="left"  style={{fontSize: "14px", fontWeight: 600, color: "#FFFFFF"}}> 
                Designer : terra@joycodigital.com
                </Typography>
                </Button>
                <br />
                <br />

                

            </Card>
            <Card style={{
                backgroundColor: "#3F3D56",
                borderRadius: "15px",
                boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
                padding: 10,
                marginBottom: 40
            }}
            >
                <br />

                <Typography variant="h4" align="left" color="secondary" style={{color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> <b>Bluebird Enterprises</b> </Typography>

                <Grid container alignItems="center">
                <Grid item xs={12} sm={12} md={6}>
                    <Button style={{margin: 40}} onClick={() => window.open("https://bluebirdyoutube.com/")}>
                    <img src="/Bluebird.png" style={{display: "flex", margin: "auto", width: "80%"}}/>

                    </Button>

                    
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} >
                        
                        <Typography variant="body1" style={{color: "#E6E6E6", padding: 20}}> 
                        Bluebird Enterprises is custom automobile fabrication and engineering. The company designs, manufactures, and installs automotive technology, systems, and builds. The Bluebird Enterprises YouTube Channel is home to a wide variety of how to videos, restoration guides, and product testing. With such strong showcasing of the company's work, Bluebird Enterprises establishes technical credibilty amongst its base, and furthers it's reach to new audiences. 
                        
                        </Typography>
                        
                        


                    </Grid>
                    
                </Grid>
                <Typography variant="body1" style={{color: "#E6E6E6", padding: 20}}> 
                The web application serves to reinforce the brand of Bluebird Enterprises, and to highlight the work done in the company. Bergquist Applications pulls data from the Bluebird Enterprises YouTube Channel, to display in an exciting fashion that fits the language of Bluebird Enterprises. The CEO, and long time friend, Anthony Kovic, is very much aware of the power of video in the current digital age.
                </Typography>

                <Button variant="contained" color="secondary" style={{marginLeft: 40}} onClick={() => window.open("https://www.youtube.com/channel/UCBHgoZGid_dlZ48bZy9VNsQ")}>
                <Typography  align="left"  style={{fontSize: "14px", fontWeight: 600, color: "#FFFFFF"}}> 
                Bluebird Enterprises YouTube
                </Typography>
                </Button>
                <br />
                <br />

                

            </Card>
            
        </div>
        
    )
}