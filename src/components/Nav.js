import React from 'react';

import { Button, Typography } from '@material-ui/core';



export default function Nav(props) {
    
  return (
    <div style={{ display: "flex", justifyContent: "space-evenly"}}>
      <Button 
      variant="contained"
      color={props.page == "Components" ? "primary" : "secondary"}
      onClick={() => {
        props.setPage("Components")
      }} 
      > 
      <Typography variant="button">
      Components
      </Typography>
      </Button>
      <Button 
      variant="contained"
      color={props.page == "About" ? "primary" : "secondary"}
      onClick={() => {
        props.setPage("About")
      }} 
      > 
      <Typography variant="button">
      About
      </Typography>
      </Button>
    </div>

  )

  
}
