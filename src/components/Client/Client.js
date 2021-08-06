import React from "react"

import firebase from "firebase/app"
import "firebase/firestore"

import Job from "../Job/Job"
import EditClient from "./EditClient"
import NewJob from "../Job/NewJob"

import { Button, Typography, Modal } from "@material-ui/core"


export default class Client extends React.Component {

    constructor() {
        super()
        this.state = {
            client: null,
            page: null,
            jobIds: []

        }
    }


  componentDidMount() {
    firebase.firestore().collection("clients").doc(this.props.clientId).onSnapshot(doc => {
        let client = doc.data()

        this.setState({
          client: client
        })

      })

        firebase.firestore().collection("clients").doc(this.props.clientId).collection("jobs")
        .onSnapshot((querySnapshot) => {

        let jobIds = []

        querySnapshot.forEach(function(doc) {
            jobIds.push(doc.id)
        })

        this.setState({
            jobIds: jobIds
        })

        })
      
  }

  
    

  render() {

    if (this.state.client) {

        const clientStyle = {
            backgroundColor: "#FFFFF0",
            borderRadius: "15px",
            boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
            padding: "10px",
            margin: "10px"
        }

        return (
          <div style={clientStyle}>
            <Button style={{float: "right"}} variant="outlined" color="secondary" onClick={() => 
            this.setState({page: "edit"})}>
              Edit
            </Button>
            <Button style={{float: "right"}} variant="outlined" color="secondary" onClick={() => 
            this.setState({page: "newJob"})}>+ Job </Button>
            <Typography variant="h4" color="secondary"> {this.state.client.name} </Typography>
            <Typography variant="h5" color="secondary"> {this.state.client.address} </Typography>
            <Typography variant="h5" color="secondary"> {this.state.client.email} </Typography>
            <Typography variant="h5" color="secondary"> {this.state.client.phone} </Typography>
            <br />
    
            {this.state.page === "edit" ? 
            <Modal 
            open={true} 
            onClose={() => this.setState({page: null})}
            style={{
              marginTop: 75,
              overflowY: "auto",
              overflowX: "hidden"
            }}>
            <EditClient clientId={this.props.clientId} client={this.state.client} goBack={() => this.setState({page: null})} />
            </Modal>
            :
            null
            }
            
            {this.state.page === "newJob" ? 
            <Modal 
            open={true} 
            onClose={() => this.setState({page: null})}
            style={{
              marginTop: 75,
              overflowY: "auto",
              overflowX: "hidden"
            }}>
            <NewJob clientId={this.props.clientId} goBack={() => this.setState({page: null})} />
            </Modal>
            :
            null
            }
            
    
    
            {this.state.jobIds.length > 0 ? this.state.jobIds.map((jobId, index) => {
              return [<Job key={index} date={this.props.date} clientId={this.props.clientId} jobId={jobId} />,
              <br />]
              
            })
            :
            null}
    
            <br />
    
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
    
