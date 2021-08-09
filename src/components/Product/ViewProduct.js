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

import { Formik, Form } from 'formik';

import { Button, Typography, TextField, Grid, CircularProgress, makeStyles } from '@material-ui/core'
import { Card, CardActionArea, CardActions, CardContent, CardMedia } from '@material-ui/core'


export default class ViewProduct extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
          progress: 0,
          estimate: 0,
          pictures: [],
          events: [],
          scheduledFrom: null,
          scheduledTo: null
          
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
                  console.log(job.data())
                this.setState(oldState => ({
                    events: [...oldState.events, 
                        { 
                            startDate: job.data().scheduledFrom,
                            endDate: job.data().scheduledTo,
                            title: job.data().job
                        }]
                   
                  }))
              })
            })
          })
        })
    }

    handleUpload = () => {

      console.log("hey")

        firebase.firestore().collection("clients").doc(this.props.clientId).collection("jobs").add({
          job: this.props.product.product.name,
          details: this.props.product.product.description,
          scheduledFrom: this.state.scheduledFrom,
          scheduledTo: this.state.scheduledTo,
          estimate: this.state.estimate,
          imgs: [],
          created: firebase.firestore.FieldValue.serverTimestamp()
        }).then((doc) => {
        
            for (let y = 0; y < this.state.pictures.length; y++) {
    
            const uploadTask = firebase.storage().ref("images/" + this.props.clientId + "/" + this.state.pictures[y].id).put(this.state.pictures[y])
    
            uploadTask.on("state_changed", (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
              this.setState({progress: progress})
            },
            (error) => {
              alert(error.message)
            },
            () => {
    
              firebase.storage().ref("images/" + this.props.clientId).child(this.state.pictures[y].id).getDownloadURL()
          .then(url => {
            console.log(url)
                firebase.firestore().collection("clients").doc(this.props.clientId).collection("jobs").doc(doc.id).update({
                  imgs: firebase.firestore.FieldValue.arrayUnion(url)
                })
            })
    
            })
    
          }
          
          this.props.closeModal()
          console.log("hi")
    
          })
    
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
            backgroundColor: "#FFFFF0",
            borderRadius: "15px",
            boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
            textAlign: "center",
            padding: 20,
            margin: 20
         
          }
    
          var cents = parseInt(this.props.product.unit_amount_decimal)
          var dollars = cents / 100
          var dollarString = dollars.toLocaleString("en-US", {style:"currency", currency:"USD"})

          if (this.state.scheduledFrom && this.state.scheduledTo) {
            var scheduledFrom = new Date(this.state.scheduledFrom)
            var scheduledTo = new Date(this.state.scheduledTo)
            var milDiff = scheduledTo.getTime() - scheduledFrom.getTime()
            var hourDiff = milDiff / 3600000
      
            var estimateCents = parseInt(this.props.product.unit_amount) * hourDiff
            var estimateDollars = estimateCents / 100
            var estimateString = estimateDollars.toLocaleString("en-US", {style:"currency", currency:"USD"})
          }

          
          console.log(this.state)

        return (
        <div style={uploadstyle}>
        <Card style={{padding: 20}}>
            <CardActionArea>
            <CardMedia
                component="img"
                alt={this.props.product.product.name}
                height="140"
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
            </CardActionArea>
            <CardActions>
            </CardActions>
         
    
    
          <br/>
    
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
                
                />
              </Grid>
          </Grid>
    
    
          <Scheduler
              data={[...this.state.events, {startDate: this.state.scheduledFrom, endDate: this.state.scheduledTo, title: "New Job"}]}
            >
           
    
            <ViewState
                defaultCurrentDate={new Date()}
                currentViewName={"work-week"}
    
            />
    
    
            <WeekView
                name="work-week"
                displayName="Work Week"
                excludedDays={[0, 6]}
                startDayHour={8}
                endDayHour={17}
            />
            
           
    
            
    
            <Toolbar />
    
            <DateNavigator />
            <Appointments />
        </Scheduler>
        <hr />
        <br />
    


          <Typography color="secondary" variant="subtitle" > Upload pictures that help identify the job:</Typography>
 
            
          <Button variant="contained" component="label">
          <input type="file" multiple onChange={this.handlePicture} style={{display: "block"}}/>
    
          </Button>

          <Typography color="secondary" gutterBottom variant="h6">
                {estimateString} 
          </Typography>
    
          <CircularProgress variant="determinate" value={this.state.progress} />
    
    
          <Button color="secondary" variant="contained" onClick={() => this.handleUpload()}> Add Job </Button>    
        
    
        </Card>
        </div>
        )
      }

      

}