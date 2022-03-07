import React, { useState, useEffect, useContext } from 'react';


import Popper from "./Popper"

import { Button, Typography, Grid } from '@material-ui/core';



export default function Nav(props) {

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
    
      <div style={{ backgroundImage: "url('Space.svg')", backgroundSize: "80%", display: "flex", justifyContent: "space-evenly"}}>
        {scrollTop > 50 ?
        <div style={{position: "fixed", top: 20, right: 10}}>
        <Popper />
        </div>
        :
        null
        }
        <Grid container>
          <Grid item xs={4} sm={4} md={4} style={{padding: "2%", display: "flex"}}>
            <Button style={{textTransform: "unset"}} href="/" >
            <Typography 
              variant="h4" 
              align="left"
              style={{
                  color: "#E6E6E6",
                  marginLeft: 80
              }}
              > 
              <b>Bergquist Applications</b>
            </Typography>
            </Button>
          </Grid>
          <Grid item xs={8} sm={8} md={8} style={{display: "flex", justifyContent: "flex-end", padding: "2%"}}>
            
            {windowDimensions.width < 700 ?
              <Popper setPage={props.setPage} page={props.page} />
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
                <Typography variant="body1">
                <b>About</b>
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
                <Typography variant="body1">
                <b>Components</b>
                </Typography>
                </Button>
                <Button 
                variant="text"
                style={{
                  color: window.location.pathname == "/projects" ? "#6C63FF" : "#E6E6E6",
                  paddingLeft: 20,
                  paddingRight: 20,
                  textTransform: "unset"
  
                }}
  
                  href="/projects"
  
                > 
                <Typography variant="body1">
                <b>Projects</b>
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
                  <Typography variant="body1">
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
