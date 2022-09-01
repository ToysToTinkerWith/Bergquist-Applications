
import React from "react"

import { Typography, Button, Grid } from "@mui/material"

export default class Components extends React.Component {

  constructor(props) {
    super(props)
    this.state = {}
  }

 

  render() {

    return (
        
      <div>
        <Typography variant="h2" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}>  Services </Typography>
        <Grid container alignItems="center">
              <Grid item xs={12} sm={8} md={8}>
                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Web Application Development </Typography>
              </Grid>
              <Grid item xs={12} sm={4} md={4} >
                <img src="services/Developer.svg" alt="Firebase" style={{padding: 40, width: "100%"}} />
              </Grid>
          </Grid>
          <div style={{backgroundColor: "#3F3D56"}}>
            <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Including </Typography>
            <Grid container alignItems="center">
                <Grid item xs={12} sm={12} md={6}>
                  <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: 20}}> custom user interface </Typography>
                  <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: 20}}> animation with svg</Typography>
                  <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: 20}}> data visualization</Typography>
                </Grid>
                <Grid item xs={12} sm={12} md={6} >
                  <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#6C63FF", padding: 20}}> blockchain wallet authentication </Typography>
                  <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#6C63FF", padding: 20}}> asset creation and distribution</Typography>
                  <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#6C63FF", padding: 20}}> smart contract creation and deployment </Typography>
                </Grid>
            </Grid>
            <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Built using an incremental build model </Typography>
            <Button onClick={() => window.open("https://en.wikipedia.org/wiki/Incremental_build_model")} style={{display: "flex", margin: "auto", backgroundColor: "#FFFFFF", padding: 10, borderRadius: 15}}> 
              <Typography variant="h6" style={{fontFamily: "Chango", color: "#3F3D56"}}> Learn More </Typography>
            </Button>
            <br />
            <br />
          </div>
          <Grid container alignItems="center">
              <Grid item xs={12} sm={8} md={8}>
                <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Web Development Tutoring</Typography>
              </Grid>
              <Grid item xs={12} sm={4} md={4} >
                <img src="services/TutorPricing.svg" alt="Tutor" style={{padding: 40, width: "100%"}} />
              </Grid>
          </Grid>
          <div style={{backgroundColor: "#3F3D56"}}>
            <Typography variant="h3" align="center" style={{fontFamily: "Chango", color: "#E6E6E6", padding: 40}}> Learn About </Typography>
            <Grid container alignItems="center">
              <Grid item xs={12} sm={12} md={6}>
                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: 20}}> modern web frameworks </Typography>
                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: 20}}> design and marketing techniques</Typography>
                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#FF6584", padding: 20}}> data visualization packages</Typography>
              </Grid>
              <Grid item xs={12} sm={12} md={6} >
                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#6C63FF", padding: 20}}> blockchain fundamentals </Typography>
                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#6C63FF", padding: 20}}> decentralized finance </Typography>
                <Typography variant="h4" align="center" style={{fontFamily: "Chango", color: "#6C63FF", padding: 20}}> smart contracts </Typography>
              </Grid>
            </Grid>
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
