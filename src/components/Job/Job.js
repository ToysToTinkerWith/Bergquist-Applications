import React from "react"

import firebase from "firebase/app"
import "firebase/firestore"

import { Typography, Button, IconButton, Avatar, Modal } from "@material-ui/core"

import Brightness1Icon from '@material-ui/icons/Brightness1';

import EditJob from "./editJob"


class Job extends React.Component {

  constructor() {
    super()
    this.state = {
      job: null,
      img: null,
      edit: false
    }

    this.AcceptJob = this.AcceptJob.bind(this)
    this.DeclineJob = this.DeclineJob.bind(this)

  }


  componentDidMount() {

    firebase.firestore().collection("clients").doc(this.props.clientId).collection("jobs").doc(this.props.jobId).onSnapshot(doc => {

    this.setState({
      job: doc.data()
    })

    })
    
  }

  AcceptJob() {
    firebase.firestore().collection("clients").doc(this.props.clientId).collection("jobs").doc(this.props.jobId)
    .update({
      status: "Accepted"
    })
      
  }

  DeclineJob() {
    firebase.firestore().collection("clients").doc(this.props.clientId).collection("jobs").doc(this.props.jobId)
    .update({
      status: "Declined"
    })
      
  }


  render() {

    if (this.state.job) {

        console.log(this.state.job)

      const jobstyle = {
        borderRadius: "15px",
        boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
        padding: "10px"
        }

      let color = ""
      const jobDateFrom = new Date(this.state.job.scheduledFrom)
      const jobDateTo = new Date(this.state.job.scheduledTo)

      if (this.state.job.status == "Job recieved, awaiting approval..." || 
      this.state.job.status == "Waiting for client approval...") {
        color = "#f5f5f5"
      }

      else if (this.props.date > jobDateTo) {
        color = "#c8e6c9" //green
        if (this.state.job.status !== "Paid") {
            this.state.job.status = "Completed"
        }
        
      }

      else if (this.state.job.status == "Declined") {
        
        color = "#ffcdd2" //red
    
      }

      else if (this.props.date > jobDateFrom.setHours(0)) {
        
        this.state.job.status = "Scheduled today"
        color = "#fff9c4" //yellow
    
      }
      
      else {
        color = "#bbdefb" //blue
      }

      jobstyle.backgroundColor = color

      return (
        <div style={jobstyle}>
          <Button style={{float: "right"}} variant="outlined" color="secondary" onClick={() => this.setState({edit: !this.state.edit})}>Edit</Button>
          <Typography variant="h5" color="secondary" style={{ display: "inline"}}> {this.state.job.job} </Typography>
          <Brightness1Icon style={{ color: color, display: "inline" }} />
          <Typography variant="subtitle1" color="secondary"> {this.state.job.details} </Typography>
          <Typography variant="h6" color="secondary"> ${this.state.job.estimate} </Typography>
          <Typography variant="h6" color="secondary"> <b>Start: </b>{new Date(this.state.job.scheduledFrom).toLocaleString()} </Typography>
          <Typography variant="h6" color="secondary"> <b>Finish: </b>{new Date(this.state.job.scheduledTo).toLocaleString()} </Typography>
        
          {this.state.job.imgs.length > 0 ? this.state.job.imgs.map(image => {
            
            return[
            <IconButton onClick={() => this.setState({img: image})} >
            <Avatar src={image} alt="" style={{ height: '100px', width: '100px' }} />
            </IconButton>
            ]
          })
          :
          null
          }
          <br />

          <Typography variant="h6" color="secondary"> Status: <b>{this.state.job.status}</b> </Typography>

          {this.state.job.status === "Job recieved, awaiting approval..." ? 
           [
            <Button variant="outlined" onClick={() => this.AcceptJob()}> Accept </Button>,
            <Button variant="outlined" onClick={() => this.DeclineJob()}> Decline </Button>
            ]
          :
          null
          }

         
          {this.state.edit ? 
          <Modal 
          open={true} 
          onClose={() => this.setState({edit: false})}
          style={{
            margin: 75,
            overflowY: "auto",
            overflowX: "hidden"
          }}>
          <EditJob setEdit={() => this.setState({edit: false})} setPage={this.props.setPage} clientId={this.props.clientId} job={this.state.job} jobId={this.props.jobId} />
          </Modal>
          :
          null
          }

          {this.state.img ?
          <Modal 
          open={true} 
          onClose={() => this.setState({img: null})}
          style={{
            margin: 100,
            overflowY: "auto",
            overflowX: "hidden"
          }}>
          <Avatar src={this.state.img} alt="" variant="square" style={{ width: "100%", height: "auto" }} />
          </Modal>
          
          :
          null
          }

        </div>
      )
    }

    else {
      return (
        <div>
        </div>
      )
    }

    
  }

      
  }
    

export default Job