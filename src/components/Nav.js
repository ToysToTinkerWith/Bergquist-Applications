import React, { useState, useEffect } from 'react';

import Popper from "./Popper"

import { Button, Typography, Grid } from '@material-ui/core';



export default function Nav(props) {

  const [windowDimensions, setWindowDimensions] = useState({width: 600, height: 0})
  

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
      <Grid container>
        <Grid item xs={4} sm={4} md={4} style={{padding: "2%", display: "flex"}}>
          <Button style={{textTransform: "unset"}} onClick={() => {props.setPage("About")}} >
          <img variant="square" src="./Moon.svg" alt="Moon" style={{height: "5vw", paddingLeft: 20}} />
          <Typography 
            variant="h5" 
            align="left"
            style={{
                color: "#E6E6E6",
                paddingLeft: 20
            }}
            > 
            <b>Bergquist Applications</b>
          </Typography>
          </Button>
        </Grid>
        <Grid item xs={8} sm={8} md={8} style={{display: "flex", justifyContent: "flex-end", padding: "2%"}}>
          
          {windowDimensions.width < 500 ?
            <Popper setPage={props.setPage}/>
            :
            <>
              <Button 
              variant="text"
              style={{
                color: props.page == "About" ? "#6C63FF" : "#E6E6E6",
                paddingLeft: 20,
                paddingRight: 20
              }}
              onClick={() => {
                props.setPage("About")
              }} 
              > 
              <Typography variant="button">
              About
              </Typography>
              </Button>
              <Button 
              variant="text"
              style={{
                color: props.page == "Components" ? "#6C63FF" : "#E6E6E6",
                paddingLeft: 20,
                paddingRight: 20
              }}
              onClick={() => {
                props.setPage("Components")
              }} 
              > 
              <Typography variant="button">
              Components
              </Typography>
              </Button>
              <Button 
                variant="text"
                style={{
                  color: props.page == "Process" ? "#6C63FF" : "#E6E6E6",
                  paddingLeft: 20,
                  paddingRight: 20
                }}
                onClick={() => {
                  props.setPage("Process")
                }} 
                > 
                <Typography variant="button">
                Process
                </Typography>
              </Button>
            </>
            
            }

          
        </Grid>
      </Grid>
      
      
    </div>

  )

  
}
