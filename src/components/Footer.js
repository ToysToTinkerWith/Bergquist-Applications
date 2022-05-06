import React, { useState, useEffect } from 'react';


import { Button, Typography, Grid } from '@mui/material';



export default function Footer(props) {

  const [windowDimensions, setWindowDimensions] = useState({width: 600, height: 0})
  const [scrollTop, setScrollTop] = useState(0);
  

  useEffect(() => {
    const onScroll = e => {
      setScrollTop(e.target.documentElement.scrollTop);
    };
    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollTop]);
  

  useEffect(() => {

    const { innerWidth: width, innerHeight: height } = window;
    setWindowDimensions({width: innerWidth, height: innerHeight});

    function handleResize() {
      const { innerWidth: width, innerHeight: height } = window;
        
      setWindowDimensions({width: innerWidth, height: innerHeight});
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

    let nextDis = ""
    let nextPage = ""
    let nextPageLink = ""

    
console.log(window.location.pathname)
    if (window.location.pathname == "/") {
        nextDis = "Learn about the developer"
        nextPage = "About"
        nextPageLink = "/about"
    }

    else if (window.location.pathname == "/about") {
        nextDis = "Data visualization and managment"
        nextPage = "Components"
        nextPageLink = "/components"
    }

    else if (window.location.pathname == "/components") {
        nextDis = "Current and completed Bergquist Applications"
        nextPage = "Applications"
        nextPageLink = "/applications"
    }

    else if (window.location.pathname == "/applications") {
        nextDis = "Get in touch with the developer"
        nextPage = "Pricing"
        nextPageLink = "/pricing"
    }

    else if (window.location.pathname == "/pricing") {
      nextDis = "Start your next web application"
      nextPage = "Contact"
      nextPageLink = "/contact"
    }

    else if (window.location.pathname == "/contact") {
        nextDis = "Visualize components for your application"
        nextPage = "Components"
        nextPageLink = "/components"
    }


    return (
    
      <div style={{ backgroundImage: "url('Space.svg')", backgroundSize: "80%", display: "flex", justifyContent: "space-evenly"}}>
        
        <Grid container>
          <Grid item xs={12} sm={5} md={5} style={{padding: "2%", display: "grid"}}>
              
            <Button style={{textTransform: "unset", margin: "auto", display: "grid"}} href="/" >
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
            <br />
            <img src="/Moon.svg" style={{display: "flex", width: "30%", height: "auto"}} />

            </Button>
            
          </Grid>
          <Grid item xs={12} sm={4} md={4} style={{padding: "2%", display: "flex"}}>
            <Button style={{display: "grid", margin: "auto", textTransform: "unset", marginLeft: 80}} href={nextPageLink} >
            <Typography 
              variant="h6" 
              align="left"
              style={{
                fontFamily: "MoonBold",
                  color: "#E6E6E6",
                  
              }}
              > 
              Up Next
            </Typography>
            <Typography 
              variant="h6" 
              align="left"
              style={{
                fontFamily: "MoonBold",
                  color: "#E6E6E6",
                  
              }}
              > 
              {nextPage}
            </Typography>
            <Typography 
              variant="subtitle2" 
              align="left"
              style={{
                fontFamily: "MoonBold",
                  color: "#E6E6E6",
                  
              }}
              > 
              {nextDis}
            </Typography>
            </Button>
          </Grid>
          <Grid item xs={12} sm={3} md={3} style={{display: "grid", margin: "auto", padding: "2%"}}>

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
                <b>Pricing </b>
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
            
          </Grid>
        </Grid>
        
        
      </div>
  
    )
  
    
  

  
}
