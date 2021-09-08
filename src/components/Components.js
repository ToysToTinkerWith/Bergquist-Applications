
import React, {useState} from "react"

import Clients from "./Client/Clients"
import Map from "./Map/Map"
import Schedule from "./Schedule"

import { Typography, Grid } from "@material-ui/core"

export default function Components(props) {

    return (
        <div>
            <Grid container>
                <Grid item xs={12} sm={12} md={12} lg={6} style={{padding: "2%"}}>
                    <Typography variant="h4" align="center" color="secondary" style={{padding: "2%"}}> Data Grid </Typography>
                    <Clients checkout={props.checkout} products={props.products} user={props.user} date={props.date} />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={6} style={{padding: "2%"}}>
                    <Typography variant="h4" align="center" color="secondary" style={{padding: "2%"}}> Map </Typography>
                    <Map checkout={props.checkout} products={props.products} date={props.date} />

                </Grid>
            </Grid>

            <Typography variant="h4" align="center" color="secondary" style={{padding: "2%"}}> Schedule </Typography>
            <Schedule checkout={props.checkout} products={props.products} date={props.date} />

            
        </div>
        
    )
}