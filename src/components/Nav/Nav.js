import React from 'react';


import Popper from "./Popper"

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
    
    <div style={{ backgroundImage: "url('Space.svg')", backgroundSize: "80%", display: "flex", justifyContent: "space-evenly"}}>
      {this.state.scrollTop > 50 ?
      <div style={{position: "fixed", top: 20, right: 10}}>
      <Popper />
      </div>
      :
      null
      }
      <Grid container>
        <Grid item xs={4} sm={4} md={4} style={{padding: "2%", display: "flex"}}>
          <Button style={{textTransform: "unset", marginLeft: 80}} href="/" >
          <Typography 
            variant="h4" 
            align="left"
            style={{
              fontFamily: "MoonBold",
                color: "#E6E6E6",
                
            }}
            > 
            <b>Bergquist Applications</b>
          </Typography>
          </Button>
        </Grid>
        <Grid item xs={8} sm={8} md={8} style={{display: "flex", justifyContent: "flex-end", padding: "2%"}}>
          
          {this.state.windowDimensions.width < 1000 ?
            <Popper />
            :
            <>
              <Button 
              variant="text"
              style={{
                color: window.location.pathname == "/" ? "#6C63FF" : "#E6E6E6",
                paddingLeft: 20,
                paddingRight: 20,
                textTransform: "unset"
              }}
   
              href="/"
              
              > 
              <Typography variant="body1" style={{fontFamily: "MoonBold"}}>
              <b>Home </b>
              </Typography>
              </Button>
              <Button 
              variant="text"
              style={{
                color: window.location.pathname == "/about" ? "#6C63FF" : "#E6E6E6",
                paddingLeft: 20,
                paddingRight: 20,
                textTransform: "unset"
              }}
   
              href="/about"
              
              > 
              <Typography variant="body1" style={{fontFamily: "MoonBold"}}>
              <b>About </b>
              </Typography>
              </Button>
              <Button 
              variant="text"
              style={{
                color: window.location.pathname == "/components" ? "#6C63FF" : "#E6E6E6",
                paddingLeft: 20,
                paddingRight: 20,
                textTransform: "unset"

              }}
        
              href="/components"
    
              > 
              <Typography variant="body1" style={{fontFamily: "MoonBold"}}>
              <b>Components</b>
              </Typography>
              </Button>
              <Button 
              variant="text"
              style={{
                color: window.location.pathname == "/applications" ? "#6C63FF" : "#E6E6E6",
                paddingLeft: 20,
                paddingRight: 20,
                textTransform: "unset"

              }}

                href="/applications"

              > 
              <Typography variant="body1" style={{fontFamily: "MoonBold"}}>
              <b>Applications</b>
              </Typography>
              </Button>
              <Button 
              variant="text"
              style={{
                color: window.location.pathname == "/pricing" ? "#6C63FF" : "#E6E6E6",
                paddingLeft: 20,
                paddingRight: 20,
                textTransform: "unset"

              }}

                href="/pricing"

              > 
              <Typography variant="body1" style={{fontFamily: "MoonBold"}}>
              <b>Pricing</b>
              </Typography>
              </Button>
              <Button 
                variant="text"
                style={{
                  color: window.location.pathname == "/contact" ? "#6C63FF" : "#E6E6E6",
                  paddingLeft: 20,
                  paddingRight: 20,
                  textTransform: "unset"
                }}
                href="/contact"
                > 
                <Typography variant="body1" style={{fontFamily: "MoonBold"}}>
                <b>Contact</b>
                </Typography>
              </Button>
            </>
            
            }

          
        </Grid>
      </Grid>
      
      
    </div>

  )
}
  
}
