import React from "react"

import Head from "next/head"

import Contact from "./contact"
import HomeAni from "../components/Animations/HomeAni"
import Explain from "../components/Animations/Explain"
import RocketSmoke from "../components/Animations/RocketSmoke"




import { Grid, Card, Modal, Typography, Button } from "@mui/material"

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
                <Head>
                <title>Bergquist Applications</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content="Web applications have expanded throughout the development of the internet. Users expect their experience to be fast, reliable, and easy. Bergquist Applications is a suite of libraries, built on the cloud, to deliver on these expectations." />
                <meta name="keywords" content="Progressive Web Development, Modern Development Tools, Database, Styled Components, Authentication, Payment Processing" />

                
                </Head>
                <div style={{}}>

                    <Grid alignItems="center" container >
                        <Grid item xs={12} sm={8} md={8} style={{padding: "2%", marginTop: 100, marginBottom: 100}}>
                        
                        <Typography variant={this.state.width > 340 ? "h2" : "h4"} align="center" style={{fontFamily: "Chango", color: "#E6E6E6"}}>  Bergquist Applications </Typography>
                        <Typography variant={this.state.width > 340 ? "h3" : "h5"} align="center" style={{fontFamily: "Chango", color: "#3F3D56"}}>  Web Development </Typography>

                        </Grid>
                        <Grid item xs={12} sm={4} md={4} style={{paddingRight: "2%"}}>

                        <RocketSmoke />



                        </Grid>
                    </Grid>

                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: 40}}>  Web applications built on the cloud </Typography>
                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: 40}}>  for business or personal needs </Typography>


                    <br />

                    <div style={{backgroundColor: "#3F3D56", padding: 40}}>

                  
                        <Typography variant="h5" align="center" style={{fontFamily: "Chango", color: "#6C63FF", margin: 40, marginLeft: "5%", marginRight: "5%"}}>  A modern approach to web applications </Typography>
                     
                        <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#FF6584", margin: 40, marginLeft: "5%", marginRight: "5%"}}>  with a simple interface that highlights the business </Typography>
                        
                   
                     
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#6C63FF", margin: 40, marginLeft: "5%", marginRight: "5%"}}>  and an intuitive backend to store and manage all your data </Typography>
                       

                     

                    </div>

                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: 40}}>  Dynamic Data </Typography>

                    <Grid alignItems="center" container style={{padding: 40, paddingTop: 0, paddingBottom: 0}}>
                        <Grid item xs={12} sm={12} md={6}>
                        <Explain />
                        </Grid>
                        <Grid item xs={12} sm={12} md={6}>
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: 40, marginLeft: "5%", marginRight: "5%"}}>  The application stores it's data in the cloud   </Typography>
                        <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: 40, marginLeft: "5%", marginRight: "5%"}}>  and listens for changes in the database    </Typography>
                        <Button onClick={() => window.location.href="/how"} style={{display: "flex", margin: "auto", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15}}> 
                        <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> How it works </Typography>
                        </Button>
                        <br />
                        <br />


                        </Grid>
                    </Grid>

                    <div style={{backgroundColor: "#3F3D56", padding: 40}}>
   
                        <br />
                        <Typography variant={this.state.width > 400 ? "h3" : "h5"} align="center" style={{fontFamily: "Chango", color: "#6C63FF"}}> Animation - SVG - Charts - Data Grids - Maps - User Authentication - Data Storage - File Storage - Payment Processing - Analytics  </Typography>
                        <br />

                    </div>
                    

                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}>  Get Started  </Typography>

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

                
                    
                

                
            </div>
        )
    }
    
}