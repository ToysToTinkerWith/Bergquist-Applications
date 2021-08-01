import React, { useState } from "react"
import LogIn from "./LogIn"

import { Grid, Typography } from '@material-ui/core'

function Auth(props) {


      return (
      <div>
        <br />
        <br />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h2" color="secondary" align="center"> Business Name </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <LogIn setPage={props.setPage}/>
          </Grid>
        </Grid>

        <br />
        <br />

          
        
      </div>
    )
    
  }

export default Auth