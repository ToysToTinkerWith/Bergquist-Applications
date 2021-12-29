import React, { useEffect, useState } from 'react';

import firebase from "firebase/app"
import "firebase/firestore"
import "firebase/storage"

import { ViewState } from '@devexpress/dx-react-scheduler';
import {
    Scheduler,
    DateNavigator,
    Appointments,
    Toolbar,
    ViewSwitcher,
    MonthView,
    WeekView,
    DayView,
} from '@devexpress/dx-react-scheduler-material-ui';

import { Button, TextField, Typography, Grid, CircularProgress } from '@material-ui/core'
import { Card, CardContent, CardMedia } from '@material-ui/core'



export default class ViewProduct extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
          events: [],
          scheduledFrom: null,
          scheduledTo: null,
          color: "",
          error: ""
          
        };
    
        this.handleChange = this.handleChange.bind(this);
        this.handleUpload = this.handleUpload.bind(this);
        this.handlePicture = this.handlePicture.bind(this);
      }

    


    componentDidMount() {
        firebase.firestore().collection("clients").onSnapshot(clients => {
          clients.forEach(client => {
            firebase.firestore().collection("clients").doc(client.id).collection("jobs")
            .get().then(jobs => {

              

              jobs.forEach(job => {

                const jobDateFrom = new Date(job.data().scheduledFrom)
                const jobDateTo = new Date(job.data().scheduledTo)
                let color

                  if (this.props.date > jobDateTo) {
                    color = "#4caf50"
                  }

                  else if (this.props.date > jobDateFrom.setHours(0)) {
                    color = "#fdd835"
                  }

                  else {
                    color = "#2196f3"
                  }

                this.setState(oldState => ({
                    events: [...oldState.events, 
                        { 
                            startDate: job.data().scheduledFrom,
                            endDate: job.data().scheduledTo,
                            title: job.data().job,
                            color: color
                        }]
                   
                  }))
              })
            })
          })
        })
    }

    handleUpload = (estimate, rate) => {

      const jobDateFrom = new Date(this.state.scheduledFrom)
      const jobDateTo = new Date(this.state.scheduledTo)

      let collisions = 0

      this.state.events.forEach(event => {
        let eventDateFrom = new Date(event.startDate)
        let eventDateTo = new Date(event.endDate)

        if (jobDateFrom > eventDateFrom && jobDateFrom < eventDateTo) {
          collisions += 1
        }
        else if (jobDateTo > eventDateFrom && jobDateTo < eventDateTo) {
          collisions += 1
        }
        else if (jobDateFrom < eventDateFrom && jobDateTo > eventDateTo) {
          collisions += 1
        }

      })

      if (!this.state.scheduledTo || !this.state.scheduledFrom) {
        this.setState({
          error: "Schedule a valid day and time for the job"
        })
      }

      else if (collisions > 0) {
        this.setState({
          error: "No overlapping jobs"
        })
      }

      else {
        firebase.firestore().collection("clients").doc(this.props.clientId).collection("jobs").add({
          job: this.props.product.product.name,
          details: this.props.product.product.description,
          scheduledFrom: this.state.scheduledFrom,
          scheduledTo: this.state.scheduledTo,
          estimate: estimate.toFixed(2),
          status: "Not Paid",
          created: firebase.firestore.FieldValue.serverTimestamp()
        }).then((doc) => {
          
          this.props.closeModal()
    
          })
      }
    
    }
      
      handlePicture = (e) => {
        for (let i = 0; i < e.target.files.length; i++) {
          const newImage = e.target.files[i];
          console.log(newImage)
          newImage["id"] = Math.random().toString(20);
          this.setState(prevState => (({pictures: [...prevState.pictures, newImage]})))
        }
      }

      handleChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({
        [name]: value
        });
      }

      render() {
        const uploadstyle = {
            backgroundColor: "#3F3D56",
            borderRadius: "15px",
            boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
            textAlign: "center",
            padding: 20,
         
          }
        
          const errorstyle = {
            color: "#d32f2f"
          }

          var cents = parseInt(this.props.product.unit_amount_decimal)
          var dollars = cents / 100
          var dollarString = dollars.toLocaleString("en-US", {style:"currency", currency:"USD"})

          var estimateString = "$0"

          if (this.state.scheduledFrom && this.state.scheduledTo) {
            

            var scheduledFrom = new Date(this.state.scheduledFrom)
            var scheduledTo = new Date(this.state.scheduledTo)
            var milDiff = scheduledTo.getTime() - scheduledFrom.getTime()
            var hourDiff = milDiff / 3600000
      
            var estimateCents = parseInt(this.props.product.unit_amount) * hourDiff
            var estimateDollars = estimateCents / 100
            estimateString = estimateDollars.toLocaleString("en-US", {style:"currency", currency:"USD"})
          }
    
          
            
          

          const Appointment = ({
            data, children, style, ...restProps
          }) => (

            <Appointments.Appointment
              {...restProps}
              style={{
                ...style,
                backgroundColor: data.color,
                borderRadius: '8px',
              }}
            >
              {children}
            </Appointments.Appointment>
          );

          
          console.log(this.state)

        return (
        <div style={uploadstyle}>
        <Card style={{padding: 20}}>
            <CardMedia
                component="img"
                alt={this.props.product.product.name}
                height="300"
                image={this.props.product.product.images[0]}
                title={this.props.product.product.name}
            />
            <CardContent>
                <Typography color="secondary" gutterBottom variant="h3" component="h2">
                {this.props.product.product.name} 
                </Typography>
                <Typography color="secondary" gutterBottom variant="subtitle">
                {this.props.product.product.description} 
                </Typography>
                <br />
                <br />
                <Typography color="secondary" gutterBottom variant="h6">
                {dollarString + "/hr"} 
                </Typography>
            </CardContent>
         
             
          <Grid container>
              <Grid item xs={12} sm={6}>
                <TextField 
                name="scheduledFrom"
                label="From"
                type="datetime-local"
                onChange={this.handleChange}
                InputLabelProps={{
                    shrink: true,
                  }}
                style={{
                  width: "50%",
                  marginBottom: 20
                }}
                
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                name="scheduledTo"
                label="To"
                type="datetime-local"
                onChange={this.handleChange}
                InputLabelProps={{
                    shrink: true,
                  }}
                style={{
                  width: "50%",
                }}
                
                />
              </Grid>
          </Grid>
    
    
          <Scheduler
              data={[...this.state.events, {startDate: this.state.scheduledFrom, endDate: this.state.scheduledTo, title: this.props.product.product.name + " for " + this.props.client.name}]}
            >
           
    
            <ViewState
                defaultCurrentDate={new Date()}
                currentViewName={"work-week"}
    
            />
    
    
            <WeekView
                name="work-week"
                displayName="Work Week"
                //excludedDays={[0, 6]}
                startDayHour={10}
                endDayHour={17}
            />
            
           
    
            
    
            <Toolbar />
    
            <DateNavigator />
            <Appointments 
            appointmentComponent={Appointment}/>
        </Scheduler>
        <hr />
        <br /> 
            
    
          <Typography color="secondary" gutterBottom variant="h6">
                Estimate: {estimateString} 
          </Typography>
    

          <Typography style={errorstyle} color="secondary" variant="body1">
                {this.state.error} 
          </Typography>
          <br />
    
    
          <Button color="secondary" variant="contained" onClick={() => this.handleUpload(estimateDollars, dollars)}> Add Job </Button>    
        
    
        </Card>
        </div>
        )
      }

      

}