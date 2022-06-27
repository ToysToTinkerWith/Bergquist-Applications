
import React from "react"

import Head from "next/head"
import { Typography, Button, Grid } from "@mui/material"

import HomeAni from "../components/Animations/HomeAni"



export default class Components extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
        
    }
}

 

  render() {

    const date = new Date()

    return (
        
      <div>
          <Head>
              <title>Services</title>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <meta name="description" content="Services offered by Bergquist Applications, including Web Development and web tutoring." />
              <meta name="keywords" content="Custom Data Collection, Custom User Interface, Data Visualization." />
              
              
              </Head>

              

          
         
              <Typography variant="h2" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}>  Services </Typography>

              <Grid container>
                    <Grid item xs={12} sm={8} md={8}>

                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}> Web Application Development </Typography>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#3F3D56", padding: "5%"}}> starting at $300 </Typography>


                    </Grid>
                    <Grid item xs={12} sm={4} md={4} >
                    <img src="SpaceSwizzle.svg" alt="Firebase" style={{padding: "5%", width: "100%"}} />

                    </Grid>
                </Grid>
          
                <div style={{backgroundColor: "#3F3D56", padding: "5%"}}>
                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "2%"}}> Including </Typography>

                <Grid container alignItems="center">
                    <Grid item xs={12} sm={12} md={6}>

                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: "5%"}}> custom user interface </Typography>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: "5%"}}> animation with svg</Typography>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: "5%"}}> data visualization</Typography>




                    </Grid>
                    <Grid item xs={12} sm={12} md={6} >
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#6C63FF", padding: "5%"}}> user authentication </Typography>

                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#6C63FF", padding: "5%"}}> data storage and management </Typography>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#6C63FF", padding: "5%"}}> payment processing </Typography>


                    </Grid>
                </Grid>
                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "2%"}}> Built using an incremental build model </Typography>
                <Button onClick={() => window.open("https://en.wikipedia.org/wiki/Incremental_build_model")} style={{display: "flex", margin: "auto", backgroundColor: "#FFFFFF", padding: 10, borderRadius: 15}}> 
                        <Typography variant="h6" style={{fontFamily: "Chango", color: "#3F3D56"}}> Learn More </Typography>
                        </Button>

                </div>

              <Grid container>
                    <Grid item xs={12} sm={8} md={8}>

                    <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%", paddingTop: "10%"}}> Web Development Tutoring</Typography>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#3F3D56", padding: "5%"}}> $40/hour </Typography>


                    </Grid>
                    <Grid item xs={12} sm={4} md={4} >
                    <img src="TutorPricing.svg" alt="Firebase" style={{padding: "5%", width: "100%"}} />

                    </Grid>
                </Grid>
          
                <div style={{backgroundColor: "#3F3D56", padding: "5%"}}>
                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "2%"}}> Learn About </Typography>

                <Grid container alignItems="center">
                    <Grid item xs={12} sm={12} md={6}>

                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: "5%"}}> modern web applications </Typography>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: "5%"}}> design and marketing techniques</Typography>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: "5%"}}> data visualization packages</Typography>




                    </Grid>
                    <Grid item xs={12} sm={12} md={6} >
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#6C63FF", padding: "5%"}}> connecting backend services </Typography>

                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#6C63FF", padding: "5%"}}> cloud data storage and management </Typography>
                    <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#6C63FF", padding: "5%"}}> payment processing integration </Typography>


                    </Grid>
                </Grid>

                </div>

                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", margin: "5%"}}>  Get Started  </Typography>

                    <Grid alignItems="center" container style={{padding: "5%"}}>
                        <Grid item xs={12} sm={12} md={6}>
                        <HomeAni />
                        </Grid>
                        <Grid item xs={12} sm={12} md={6}>
                        <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: "5%"}}>  Contact Bergquist Applications today to explore options for business or personal success  </Typography>

                        <Button onClick={() => window.location.href="/contact"} style={{display: "flex", margin: "auto", backgroundColor: "#6C63FF", padding: 10, borderRadius: 15}}> 
                        <Typography variant="h6" style={{fontFamily: "Chango", color: "#E6E6E6"}}> Contact </Typography>
                        </Button>


                        </Grid>
                    </Grid>



          
      </div>
      
  )
  }

    
}
