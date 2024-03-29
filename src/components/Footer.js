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


    return (
    
      <div style={{ backgroundImage: "url('nav/World.svg')", backgroundSize: "150%", justifyContent: "space-evenly"}}>
        
        <Grid container>
          <Grid item xs={12} sm={6} md={6} style={{padding: "2%"}}>
              
            <Button style={{}} href="/" >
            
            <img src="nav/NavLogo.svg" style={{display: "flex", width: "100%", height: "auto"}} />

            </Button>
            
          </Grid>
          
          <Grid item xs={12} sm={6} md={6} style={{display: "grid", margin: "auto", padding: "2%"}}>

              <>
                <Button 
                variant="text"
                style={{
                  color: "#E6E6E6",
                  paddingLeft: 20,
                  paddingRight: 20,
                  textTransform: "unset"
                }}
     
                href="/"
                
                > 
                <Typography variant="body1" style={{fontFamily: "Chango"}}>
                Home
                </Typography>
                </Button>
                <Button 
                variant="text"
                style={{
                  color: "#E6E6E6",
                  paddingLeft: 20,
                  paddingRight: 20,
                  textTransform: "unset"
                }}
     
                href="/how"
                
                > 
                <Typography variant="body1" style={{fontFamily: "Chango"}}>
                How it Works
                </Typography>
                </Button>
                <Button 
                variant="text"
                style={{
                  color: "#E6E6E6",
                  paddingLeft: 20,
                  paddingRight: 20,
                  textTransform: "unset"
  
                }}
          
                href="/services"
      
                > 
                <Typography variant="body1" style={{fontFamily: "Chango"}}>
                Services
                </Typography>
                </Button>
                <Button 
                variant="text"
                style={{
                  color: "#E6E6E6",
                  paddingLeft: 20,
                  paddingRight: 20,
                  textTransform: "unset"
  
                }}
  
                  href="/applications"
  
                > 
                <Typography variant="body1" style={{fontFamily: "Chango"}}>
                Applications
                </Typography>
                </Button>
                <Button 
                variant="text"
                style={{
                  color: "#E6E6E6",
                  paddingLeft: 20,
                  paddingRight: 20,
                  textTransform: "unset"
                }}
     
                href="/team"
                
                > 
                <Typography variant="body1" style={{fontFamily: "Chango"}}>
                The Team
                </Typography>
                </Button>
                <Button 
                  variant="text"
                  style={{
                    color: "#E6E6E6",
                    paddingLeft: 20,
                    paddingRight: 20,
                    textTransform: "unset"
                  }}
                  href="/contact"
                  > 
                  <Typography variant="body1" style={{fontFamily: "Chango"}}>
                  Contact
                  </Typography>
                </Button>
                <Button 
                  variant="text"
                  style={{
                    color: "#E6E6E6",
                    paddingLeft: 20,
                    paddingRight: 20,
                    textTransform: "unset"
                  }}
                  href="/algorand"
                  > 
                  <Typography variant="body1" style={{fontFamily: "Chango"}}>
                  Algorand
                  </Typography>
                </Button>
              </>
            
          </Grid>
        </Grid>

        <Typography variant="body1" style={{fontFamily: "Chango", color: "#FFFFFF", padding: "2%"}}>
                Copyright &copy; 2022 Bergquist Applications. All Rights Reserved.
                </Typography>
        
        
      </div>
  
    )
  
    
  

  
}
