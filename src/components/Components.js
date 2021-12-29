
import React, { useEffect } from "react"

import Clients from "./Client/Clients"
import Map from "./Map/Map"
import Schedule from "./Schedule"
import BarGraph from "./Charts/BarGraph"

import { Typography, Card } from "@material-ui/core"

export default function Components(props) {
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })
      }, [])

    return (
        <div style={{padding: 20}}>
            <Card style={{
                backgroundColor: "#3F3D56",
                borderRadius: "15px",
                boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
                padding: 10,
                marginBottom: 40
            }}
                >
                    <br />
                    <Typography variant="h4" align="left" color="secondary" style={{color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> Charts </Typography>
                <Typography variant="body1" style={{color: "#E6E6E6", padding: 20}}> 
                Understand what is happening in the business at a moment's glance. Visualize important success factors to steer decision making in the right direction.
                Listen for real time updates in the database, and update the display when necessary.
                </Typography>
                <br />
            <BarGraph />
            </Card>

            
            <Clients checkout={props.checkout} products={props.products} user={props.user} date={props.date} />

            <Card style={{
                backgroundColor: "#3F3D56",
                borderRadius: "15px",
                boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
                padding: 10,
                marginBottom: 40
            }}
                >
                <br />
                <Typography variant="h4" align="left" color="secondary" style={{color: "#E6E6E6", paddingLeft: 40, paddingRight: 40}}> Maps </Typography>
                <Typography variant="body1" style={{color: "#E6E6E6", padding: 20}}> 
                View client addresses and highlight customers that need service for the day. Display different business locations, and inform the community on what is happening at each site. 
                </Typography>
                <Map checkout={props.checkout} products={props.products} date={props.date} />
            </Card>

                
            <Schedule checkout={props.checkout} products={props.products} date={props.date} />

           


            

            
        </div>
        
    )
}