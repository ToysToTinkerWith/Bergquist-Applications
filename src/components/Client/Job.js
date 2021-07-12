import React from "react"

import firebase from "firebase/app"
import "firebase/firestore"

import { Typography, Button, IconButton, Avatar } from "@material-ui/core"

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

  }


  componentDidMount() {

    firebase.firestore().collection("clients").doc(this.props.clientId).collection("jobs").doc(this.props.jobId).onSnapshot(doc => {

    this.setState({
      job: doc.data()
    })

    })
    
  }


  render() {

    const jobstyle = {
    backgroundColor: "#FFFFF0",
    borderRadius: "15px",
    boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
    padding: "10px"
    }

    if (this.state.job) {

      let color = ""
      const jobDate = new Date(this.state.job.scheduled + "T16:00")
      

      if (this.props.date > jobDate) {
        color = "green"
      }

      else if (this.props.date > jobDate.setHours(0)) {
        color = "red"
      }
      
      else {
        color = "black"
      }

      console.log(this.state.job)
      return (
        <div style={jobstyle}>
          <Button style={{float: "right"}} variant="outlined" color="secondary" onClick={() => this.setState({edit: !this.state.edit})}>Edit</Button>
          <Typography variant="h5" color="secondary" style={{ display: "inline"}}> {this.state.job.job} </Typography>
          <Brightness1Icon style={{ color: color, display: "inline" }} />
          <Typography variant="subtitle1" color="secondary"> {this.state.job.details} </Typography>
          <Typography variant="h6" color="secondary"> ${this.state.job.estimate} </Typography>
          <Typography variant="h6" color="secondary"> {new Date(this.state.job.scheduled + "T16:00").toLocaleDateString()} </Typography>

          {this.state.edit ? 
          <EditJob setEdit={() => this.setState({edit: !this.state.edit})} setPage={this.props.setPage} clientId={this.props.clientId} job={this.state.job} jobId={this.props.jobId} /> 
          :
          null
          }


          {this.state.job.imgs.length > 0 ? this.state.job.imgs.map(image => {
            
            return[
            <IconButton onClick={() => this.state.img === image ? 
            this.setState({img: null})
            :
            this.setState({img: image})} >
            <Avatar src={image} alt="" style={{ height: '100px', width: '100px' }} />
            </IconButton>
            ]
          })
          :
          null
          }

          {this.state.img ?
          <Avatar src={this.state.img} alt="" variant="square" style={{ padding: "20", width: "100%", height: "100%", borderRadius: "15px" }} />
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