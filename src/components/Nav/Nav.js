import React from 'react';

import { motion } from "framer-motion"


import Popper from "./Popper"
import Wallet from "./Wallet"

import { Button, Typography, Grid } from '@mui/material';



export default class Nav extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      windowDimensions: {width: 600, height: 0},
      scrollTop: 0

    }
    this.onScroll = this.onScroll.bind(this)
    this.handleResize = this.handleResize.bind(this)
}

onScroll = (e) => {
  this.setState({
    scrollTop: e.target.documentElement.scrollTop
  })
}

handleResize = () => {
  const { innerWidth: width, innerHeight: height } = window;
    
  this.setState({
    windowDimensions: {width: innerWidth, height: innerHeight}
  })
}

  componentDidMount() {
    
    window.addEventListener("scroll", this.onScroll);

    const { innerWidth: width, innerHeight: height } = window;
    this.setState({
      windowDimensions: {width: innerWidth, height: innerHeight}
    })

    

    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.onScroll)
    window.removeEventListener('resize', this.handleResize)
  }


render() {
  return (
    
    <div style={{ backgroundImage: "url('nav/Space.svg')", backgroundSize: "100%", display: "flex", justifyContent: "space-evenly"}}>
      {this.state.scrollTop > 200 ?
      <motion.div animate={{opacity: [0, 1]}} style={{position: "fixed", top: 20, right: 10, zIndex: 10}}>
      <Popper />
      </motion.div>
      :
      null
      }
      <Grid container>
        <Grid item xs={12} sm={4} md={4} style={{padding: "2%", display: "flex"}}>
          <Button style={{textTransform: "unset"}} href="/" >
          <img src="nav/NavLogo.svg" style={{ width: "100%"}}/>

          

          </Button>
        </Grid>
        
        <Grid item xs={12} sm={8} md={8} style={{display: "flex", justifyContent: "flex-end", padding: "2%"}}>
            <Grid container>
              <Grid item>
              <Button 
              variant="text"
              style={{
                color: "#E6E6E6",
                paddingLeft: 20,
                paddingRight: 20,
                margin: 10,
              }}
   
              href="/"
              
              > 
              <Typography variant="body1" align="center" style={{fontFamily: "Chango"}}>
              Home
              </Typography>
              </Button>
              </Grid>
              <Grid item>
              <Button 
              variant="text"
              style={{
                color: "#E6E6E6",
                paddingLeft: 20,
                paddingRight: 20,
                margin: 10,
              }}
   
              href="/how"
              
              > 
              <Typography variant="body1" align="center" style={{fontFamily: "Chango"}}>
              How it Works
              </Typography>
              </Button>
              </Grid>
              <Grid item>
              <Button 
              variant="text"
              style={{
                color: "#E6E6E6",
                paddingLeft: 20,
                paddingRight: 20,
                margin: 10,

              }}
        
              href="/services"
    
              > 
              <Typography variant="body1" align="center" style={{fontFamily: "Chango"}}>
              Services
              </Typography>
              </Button>
              </Grid>
              <Grid item>
              <Button 
              variant="text"
              style={{
                color: "#E6E6E6",
                paddingLeft: 20,
                paddingRight: 20,
                margin: 10,

              }}

                href="/applications"

              > 
              <Typography variant="body1" align="center" style={{fontFamily: "Chango"}}>
              Applications
              </Typography>
              </Button>
              </Grid>
              <Grid item>
              <Button 
              variant="text"
              style={{
                color: "#E6E6E6",
                paddingLeft: 20,
                paddingRight: 20,
                margin: 10,
           

              }}

                href="/team"

              > 
              <Typography variant="body1" align="center" style={{fontFamily: "Chango"}}>
              The Team
              </Typography>
              </Button>
              </Grid>
              <Grid item>
              <Button 
                variant="text"
                style={{
                  color: "#E6E6E6",
                  paddingLeft: 20,
                  paddingRight: 20,
                  margin: 10,
                }}
                href="/contact"
                > 
                <Typography variant="body1" align="center" style={{fontFamily: "Chango"}}>
                Contact
                </Typography>
              </Button>
              </Grid>
              <Grid item>
              <Button 
                variant="contained"
                style={{
                  color: "#E6E6E6",
                  backgroundColor: "#FF6584",
                  paddingLeft: 20,
                  paddingRight: 20,
                  margin: 10,
                }}
                href="/algorand"
                > 
                <Typography variant="body1" align="center" style={{fontFamily: "Chango"}}>
                Algorand
                </Typography>
              </Button>
              </Grid>
            </Grid>
            
            

          
        </Grid>
      </Grid>
      
      
    </div>

  )
}
  
}
