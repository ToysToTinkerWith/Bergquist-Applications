import React, { useState } from "react"
import LogIn from "./LogIn"
import SignUp from "./SignUp"

import { Grid } from '@material-ui/core'

function Auth(props) {


      return (
      <div>
        <br />
        <br />

        <Grid container spacing={3}>
          <Grid item sm={12} md={6}>
            <LogIn setPage={props.setPage}/>
          </Grid>
          <Grid item sm={12} md={6}>
            <SignUp setPage={props.setPage}/>
          </Grid>
        </Grid>

        <br />
        <br />

          
        
      </div>
    )
    
  }

export default Auth